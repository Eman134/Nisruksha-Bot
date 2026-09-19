const { createClient } = require('redis');
const { redis: redisConfig = {} } = require('../config');
const API = require('../api');
const { reportError } = require('../debug');

const prefix = redisConfig.prefix || `nisruksha:${API.id}`;
const client = createClient({ url: redisConfig.url || process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
let connection;

client.on('error', (error) => reportError(error, 'redis.client'));

async function getClient() {
    if (client.isReady) return client;

    if (!connection) {
        connection = client.connect().catch((error) => {
            connection = null;
            throw reportError(error, 'redis.connect');
        });
    }

    await connection;
    return client;
}

function waitingKeys(list) {
    return {
        members: `${prefix}:waiting:${list}:members`,
        links: `${prefix}:waiting:${list}:links`
    };
}

function rememberKey() {
    return `${prefix}:remember`;
}

function imageKey(filePath, modifiedAt) {
    return `${prefix}:images:${filePath}:${modifiedAt}`;
}

function parse(value) {
    try {
        return JSON.parse(value);
    } catch (_) {
        return null;
    }
}

const waiting = {
    async length(list) {
        return (await getClient()).sCard(waitingKeys(list).members);
    },

    async includes(userId, list) {
        return (await getClient()).sIsMember(waitingKeys(list).members, String(userId));
    },

    async getLink(userId, list) {
        return (await getClient()).hGet(waitingKeys(list).links, String(userId));
    },

    async remove(userId, list) {
        const redis = await getClient();
        const keys = waitingKeys(list);
        await redis.multi()
            .sRem(keys.members, String(userId))
            .hDel(keys.links, String(userId))
            .exec();
    },

    async add(userId, interaction, list) {
        const redis = await getClient();
        const keys = waitingKeys(list);
        const id = String(userId);
        const added = await redis.sAdd(keys.members, id);

        if (added) {
            await redis.hSet(keys.links, id, interaction?.url || '');
        }
    }
};

const remember = {
    async get() {
        const values = await (await getClient()).hGetAll(rememberKey());
        return new Map(Object.entries(values).map(([userId, value]) => [userId, parse(value)]));
    },

    async loadold(type, userId, channel) {
        let from;
        let to;
        let time = 0;

        switch (type) {
            case 'energia': {
                const energy = await API.maqExtension.getEnergy(userId);
                from = energy.energia;
                to = energy.energiamax;
                time = energy.time;
                if (time > 0) time += 1000;
                break;
            }
            case 'estamina':
                from = await API.playerUtils.stamina.get(userId);
                to = 1000;
                time = (await API.playerUtils.stamina.time(userId)) + 1000;
                break;
            default:
                return;
        }

        if (from >= to) {
            if (await remember.includes(userId, type)) {
                await channel.send({ content: `🔁 | <@${userId}> Relatório de ${type}: ${from}/${to}` });
                await remember.remove(userId, type);
            }
            return;
        }

        setTimeout(() => remember.loadold(type, userId, channel), time);
    },

    async load() {
        const redis = await getClient();
        const values = await redis.hGetAll(rememberKey());

        for (const [userId, value] of Object.entries(values)) {
            const entry = parse(value);
            if (!entry) continue;

            for (const type of ['energia', 'estamina']) {
                if (!entry[type]?.active) continue;

                try {
                    const channel = await API.client.channels.fetch(entry[type].channelid);
                    if (channel) this.loadold(type, userId, channel);
                } catch (error) {
                    reportError(error, `cacheLists.${type}_restore`, { memberId: userId });
                }
            }

            if (!entry.energia?.active && !entry.estamina?.active) {
                await redis.hDel(rememberKey(), userId);
            }
        }
    },

    async save() {
        // Redis persists the current state on every add/remove operation.
    },

    async includes(userId, type) {
        const redis = await getClient();
        const value = await redis.hGet(rememberKey(), String(userId));
        const entry = value && parse(value);
        return Boolean(entry?.[type]?.active);
    },

    async add(userId, channelId, type) {
        const redis = await getClient();
        const id = String(userId);
        const current = await redis.hGet(rememberKey(), id);
        const entry = (current && parse(current)) || { memberid: userId };

        if (entry[type]?.active) return;

        entry[type] = { channelid: channelId, active: true };
        await redis.hSet(rememberKey(), id, JSON.stringify(entry));
    },

    async remove(userId, type) {
        const redis = await getClient();
        const id = String(userId);
        const current = await redis.hGet(rememberKey(), id);
        const entry = current && parse(current);
        if (!entry) return;

        if (entry[type]) entry[type].active = false;

        if (!entry.energia?.active && !entry.estamina?.active) {
            await redis.hDel(rememberKey(), id);
        } else {
            await redis.hSet(rememberKey(), id, JSON.stringify(entry));
        }
    }
};

const images = {
    async get(filePath, modifiedAt) {
        return (await getClient()).get(imageKey(filePath, modifiedAt));
    },

    async set(filePath, modifiedAt, data) {
        await (await getClient()).set(imageKey(filePath, modifiedAt), data);
    }
};

module.exports = {
    connect: getClient,
    waiting,
    remember,
    images,
    rememberenergy: [],
    rememberstamina: []
};
