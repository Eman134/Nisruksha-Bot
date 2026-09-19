const { createClient } = require('redis');
const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const { reportError } = require('../debug');
const clientService = require('./clientService');
const Discord = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');

function parse(value) {
    try { return JSON.parse(value); } catch (_) { return null; }
}

class CacheListsService {
    constructor() {
        const redisConfig = config.redis || {};
        this.prefix = redisConfig.prefix || `nisruksha:${config.app.id}`;
        this.redisClient = createClient({
            url: redisConfig.url || process.env.REDIS_URL || 'redis://127.0.0.1:6379',
            socket: { reconnectStrategy: false }
        });
        this.connection = null;
        this.rememberenergy = [];
        this.rememberstamina = [];
        this.redisClient.on('error', (error) => {
            if (this.redisClient.isReady) reportError(error, 'redis.client');
        });
        this.waiting = this.createWaitingApi();
        this.remember = this.createRememberApi();
        this.images = {
            get: (filePath, version) => this.getImage(filePath, version),
            set: (filePath, version, data) => this.setImage(filePath, version, data)
        };
        this.json = {
            load: (filePath, name) => this.loadJson(filePath, name),
            composite: (name, files, combine) => this.loadComposite(name, files, combine),
            version: (files) => this.getCompositeVersion(files),
            save: (filePath, name, value, version) => this.saveJson(filePath, name, value, version)
        };
    }

    async connect() {
        if (this.redisClient.isReady) return this.redisClient;
        if (!this.connection) {
            this.connection = this.redisClient.connect().catch((error) => {
                this.connection = null;
                throw error;
            });
        }
        await this.connection;
        return this.redisClient;
    }

    async disconnect() {
        this.connection = null;
        if (this.redisClient.isOpen) await this.redisClient.disconnect();
    }

    keys(list) {
        return {
            members: `${this.prefix}:waiting:${list}:members`,
            links: `${this.prefix}:waiting:${list}:links`
        };
    }

    rememberKey() {
        return `${this.prefix}:remember`;
    }

    imageKey(filePath, version) {
        return `${this.prefix}:images:${filePath}:${version}`;
    }

    jsonKey(name) {
        return `${this.prefix}:json:${String(name).replace(/[^a-zA-Z0-9:_-]/g, '_')}`;
    }

    async loadJson(filePath, name = filePath) {
        const absolutePath = path.resolve(filePath);
        const stats = await fs.stat(absolutePath);
        const version = `${stats.mtimeMs}:${stats.size}`;
        const redis = await this.connect();
        const key = this.jsonKey(name);
        const cached = parse(await redis.get(key));
        if (cached?.version === version) return cached.data;

        const data = JSON.parse(await fs.readFile(absolutePath, 'utf8'));
        await this.saveJson(null, name, data, version);
        return data;
    }

    async loadComposite(name, files, combine) {
        const version = await this.getCompositeVersion(files);
        const redis = await this.connect();
        const cached = parse(await redis.get(this.jsonKey(name)));
        if (cached?.version === version) return cached.data;

        const values = await Promise.all(files.map(async ({ path: filePath }) => {
            return JSON.parse(await fs.readFile(path.resolve(filePath), 'utf8'));
        }));
        const data = combine(values);
        await this.saveJson(null, name, data, version);
        return data;
    }

    async getCompositeVersion(files) {
        const versions = await Promise.all(files.map(async ({ path: filePath }) => {
            const stats = await fs.stat(path.resolve(filePath));
            return `${filePath}:${stats.mtimeMs}:${stats.size}`;
        }));
        return versions.join('|');
    }

    async saveJson(filePath, name, value, version) {
        if (!version && filePath) {
            const stats = await fs.stat(path.resolve(filePath));
            version = `${stats.mtimeMs}:${stats.size}`;
        }
        await (await this.connect()).set(this.jsonKey(name), JSON.stringify({ version: version || 'runtime', data: value }));
    }

    createWaitingApi() {
        return {
            length: async (list) => (await this.connect()).sCard(this.keys(list).members),
            includes: async (userId, list) => (await this.connect()).sIsMember(this.keys(list).members, String(userId)),
            getLink: async (userId, list) => (await this.connect()).hGet(this.keys(list).links, String(userId)),
            remove: async (userId, list) => {
                const redis = await this.connect();
                const keys = this.keys(list);
                await redis.multi().sRem(keys.members, String(userId)).hDel(keys.links, String(userId)).exec();
            },
            add: async (userId, interaction, list) => {
                const redis = await this.connect();
                const keys = this.keys(list);
                const id = String(userId);
                if (await redis.sAdd(keys.members, id)) await redis.hSet(keys.links, id, interaction?.url || '');
            }
        };
    }

    createRememberApi() {
        return {
            get: async () => {
                const values = await (await this.connect()).hGetAll(this.rememberKey());
                return new Map(Object.entries(values).map(([userId, value]) => [userId, parse(value)]));
            },
            load: async () => {
                const redis = await this.connect();
                const values = await redis.hGetAll(this.rememberKey());
                for (const [userId, value] of Object.entries(values)) {
                    const entry = parse(value);
                    if (!entry) continue;
                    for (const type of ['energia', 'estamina']) {
                        if (!entry[type]?.active) continue;
                        try {
                            const channel = await clientService.current?.channels.fetch(entry[type].channelid);
                            if (channel) await this.loadOld(type, userId, channel);
                        } catch (error) {
                            reportError(error, `cacheLists.${type}_restore`, { memberId: userId });
                        }
                    }
                    if (!entry.energia?.active && !entry.estamina?.active) await redis.hDel(this.rememberKey(), userId);
                }
            },
            loadold: (type, userId, channel) => this.loadOld(type, userId, channel),
            save: async () => undefined,
            includes: async (userId, type) => {
                const value = await (await this.connect()).hGet(this.rememberKey(), String(userId));
                return Boolean(parse(value)?.[type]?.active);
            },
            add: async (userId, channelId, type) => this.addRemember(userId, channelId, type),
            remove: async (userId, type) => this.removeRemember(userId, type)
        };
    }

    async loadOld(type, userId, channel) {
        const machines = require('./machines');
        const players = require('./players');
        let from;
        let to;
        let time = 0;
        if (type === 'energia') {
            const energy = await machines.getEnergy(userId);
            from = energy.energia; to = energy.energiamax; time = energy.time + (energy.time > 0 ? 1000 : 0);
        } else if (type === 'estamina') {
            from = await players.stamina.get(userId); to = 1000; time = (await players.stamina.time(userId)) + 1000;
        } else return;
        if (from >= to) {
            if (await this.remember.includes(userId, type)) {
                await channel.send({
                    components: [new TextDisplayBuilder().setContent(`🔁 | <@${userId}> Relatório de ${type}: ${from}/${to}`)],
                    flags: Discord.MessageFlags.IsComponentsV2
                });
                await this.remember.remove(userId, type);
            }
            return;
        }
        setTimeout(() => this.loadOld(type, userId, channel), time);
    }

    async addRemember(userId, channelId, type) {
        const redis = await this.connect();
        const id = String(userId);
        const current = await redis.hGet(this.rememberKey(), id);
        const entry = (current && parse(current)) || { memberid: userId };
        if (entry[type]?.active) return;
        entry[type] = { channelid: channelId, active: true };
        await redis.hSet(this.rememberKey(), id, JSON.stringify(entry));
    }

    async removeRemember(userId, type) {
        const redis = await this.connect();
        const id = String(userId);
        const entry = parse(await redis.hGet(this.rememberKey(), id));
        if (!entry) return;
        if (entry[type]) entry[type].active = false;
        if (!entry.energia?.active && !entry.estamina?.active) await redis.hDel(this.rememberKey(), id);
        else await redis.hSet(this.rememberKey(), id, JSON.stringify(entry));
    }

    async getImage(filePath, version) {
        return (await this.connect()).get(this.imageKey(filePath, version));
    }

    async setImage(filePath, version, data) {
        await (await this.connect()).set(this.imageKey(filePath, version), data, { EX: 86_400 });
    }
}

module.exports = new CacheListsService();
