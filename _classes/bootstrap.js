const Discord = require('./discordCompat');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const DatabaseManager = require('./manager/DatabaseManager');
const RuntimeState = require('./services/runtimeState');
const UtilityService = require('./services/utilityService');
const PermissionService = require('./services/permissionService');
const ServerService = require('./services/serverService');
const createBadges = require('./services/badges');
const createCache = require('./services/cacheLists');
const createCompany = require('./services/company');
const createCrates = require('./services/crateExtension');
const createEconomy = require('./services/economy');
const createEvents = require('./services/events');
const createFrames = require('./services/frames');
const createHelp = require('./services/help');
const createImages = require('./services/images');
const createItems = require('./services/items');
const createMachines = require('./services/machines');
const createPlayers = require('./services/players');
const createShop = require('./services/shop');
const createSite = require('./services/site');
const createTowns = require('./services/towns');

function createBot(config) {
    const client = new Discord.Client({
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
        intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildMessages]
    });
    if (!config.app.token) throw new Error('Token not found in environment');

    const database = new DatabaseManager();
    const permissionService = new PermissionService(database);
    const serverService = new ServerService(database);
    const state = new RuntimeState();
    const utility = new UtilityService();
    const id = config.app.id;
    const version = `${require('../package.json').version} (Rework)`;
    const setCompanyInfo = async (userId, companyId, field, value) => {
        await database.setIfNotExists(userId, 'companies');
        await database.set(userId, 'companies', 'company_id', companyId);
        await database.set(userId, 'companies', field, value);
    };

    const itemExtension = {};
    const shopExtension = {};
    const maqExtension = {};
    const playerUtils = {};
    const cacheLists = {};
    const img = {};
    const crateExtension = {};
    const economy = createEconomy({ client, db: database, getFormatedDate: utility.getFormatedDate.bind(utility), id });
    const frames = createFrames({ db: database });
    const badges = createBadges({ db: database });
    const towns = createTowns({ db: database, random: utility.random.bind(utility) });

    Object.assign(itemExtension, createItems({ client, db: database, random: utility.random.bind(utility), shopExtension }));
    Object.assign(shopExtension, createShop({ Discord, cacheLists, client, clone: utility.clone.bind(utility), createButton: utility.createButton.bind(utility), db: database, debug: state.debug, eco: economy, format: utility.format.bind(utility), frames, itemExtension, maqExtension, money: utility.money, money2: utility.money2, money2emoji: utility.money2emoji, moneyemoji: utility.moneyemoji, random: utility.random.bind(utility), rowComponents: utility.rowComponents.bind(utility), sendError: utility.sendError.bind(utility), tp: utility.tp }));
    Object.assign(maqExtension, createMachines({ db: database, getFormatedDate: utility.getFormatedDate.bind(utility), itemExtension, random: utility.random.bind(utility), shopExtension }));
    Object.assign(crateExtension, createCrates({ client, db: database, itemExtension, random: utility.random.bind(utility) }));
    Object.assign(img, createImages({ Discord, cacheLists, client, db: database }));
    Object.assign(playerUtils, createPlayers({ Discord, crateExtension, db: database, img, ms: utility.ms.bind(utility), shopExtension }));
    Object.assign(cacheLists, createCache({ client, db: database, id, maqExtension, playerUtils }));
    const company = createCompany({ Discord, cacheLists, client, db: database, debug: state.debug, getFormatedDate: utility.getFormatedDate.bind(utility), id, itemExtension, ms: utility.ms.bind(utility), random: utility.random.bind(utility), setCompanieInfo: setCompanyInfo, shopExtension, townExtension: towns });
    const events = createEvents({ Discord, client, db: database, eco: economy, format: utility.format.bind(utility), id, maqExtension, money: utility.money, moneyemoji: utility.moneyemoji, ms: utility.ms.bind(utility), random: utility.random.bind(utility), shopExtension, townExtension: towns });
    const site = createSite({ Discord, client, db: database });
    const help = createHelp({ db: database });
    const getBotInfoProperties = async () => createBotInfo({ client, database, id, state, utility, version, cacheLists, Discord });

    function dependency(name) {
        switch (name) {
            case 'client': return client;
            case 'config': return config;
            case 'Discord': return Discord;
            case 'db': return database;
            case 'eco': return economy;
            case 'company': return company;
            case 'crateExtension': return crateExtension;
            case 'events': return events;
            case 'frames': return frames;
            case 'badges': return badges;
            case 'img': return img;
            case 'itemExtension': return itemExtension;
            case 'maqExtension': return maqExtension;
            case 'playerUtils': return playerUtils;
            case 'shopExtension': return shopExtension;
            case 'townExtension': return towns;
            case 'cacheLists': return cacheLists;
            case 'serverdb': return serverService;
            case 'getBotInfoProperties': return getBotInfoProperties;
            case 'setCompanieInfo': return setCompanyInfo;
            case 'setPerm': return permissionService.set.bind(permissionService);
            case 'state': return state;
            case 'logs': return state.logs;
            case 'debug': return state.debug;
            case 'cmdsexec': return state.commandsExecuted;
            case 'playerscmds': return [...state.playersSeen];
            case 'id': return id;
            case 'ip': return config.ip;
            case 'owner': return config.owner;
            case 'prefix': return config.prefix;
            case 'token': return config.app.token;
            case 'version': return version;
            case 'money': return utility.money;
            case 'money2': return utility.money2;
            case 'money2emoji': return utility.money2emoji;
            case 'money3': return utility.money3;
            case 'money3emoji': return utility.money3emoji;
            case 'moneyemoji': return utility.moneyemoji;
            case 'mastery': return utility.mastery;
            case 'tp': return utility.tp;
            case 'clone': return utility.clone.bind(utility);
            case 'createButton': return utility.createButton.bind(utility);
            case 'createMenu': return utility.createMenu.bind(utility);
            case 'format': return utility.format.bind(utility);
            case 'getFormatedDate': return utility.getFormatedDate.bind(utility);
            case 'getMultipleArgs': return utility.getMultipleArgs.bind(utility);
            case 'getProgress': return utility.getProgress.bind(utility);
            case 'isInt': return utility.isInt.bind(utility);
            case 'isOdd': return utility.isOdd.bind(utility);
            case 'ms': return utility.ms.bind(utility);
            case 'random': return utility.random.bind(utility);
            case 'rowComponents': return utility.rowComponents.bind(utility);
            case 'sendError': return utility.sendError.bind(utility);
            case 'toNumber': return utility.toNumber.bind(utility);
            case 'uptime': return utility.uptime.bind(utility);
            default: throw new Error(`Dependência não registrada: ${name}`);
        }
    }

    const resolve = (names = []) => createDependencies(dependency, names, state);
    registerEvents(client, resolve);
    registerCommands(client, resolve, help);
    client.loadSlashCommands = ({ force = false } = {}) => deployCommands(client, config, force);
    client.assetsReady = img.preloadAssets();
    return client;
}

function createDependencies(resolve, names, state) {
    const dependencies = {};
    for (const name of names) {
        Object.defineProperty(dependencies, name, {
            enumerable: true,
            get: () => name === 'cmdsexec' ? state.commandsExecuted : name === 'playerscmds' ? [...state.playersSeen] : name === 'debug' ? state.debug : resolve(name),
            set: (value) => {
                if (name === 'cmdsexec') state.commandsExecuted = Number(value);
                if (name === 'debug') state.debug = Boolean(value);
            }
        });
    }
    return dependencies;
}

function registerEvents(client, resolve) {
    for (const file of fs.readdirSync(path.resolve(__dirname, '../events'))) {
        const event = require(path.resolve(__dirname, '../events', file));
        const dependencies = resolve(event.dependencies || []);
        dependencies.resolve = resolve;
        const handler = (...args) => event.execute(dependencies, ...args);
        if (event.name === 'clientReady') client.once(event.name, handler);
        else client.on(event.name, handler);
    }
}

function registerCommands(client, resolve, help) {
    const files = globSync(__dirname + '/../commands/*/*.js');
    const commands = new Discord.Collection();
    const globalCommands = [];
    const serverCommands = [];
    for (const file of files) {
        if (file.includes('!')) continue;
        const command = require(path.resolve(file));
        commands.set(command.name, command);
        if (command.disabled) continue;
        help.addCommand(command);
        if (!command.data) command.data = new SlashCommandBuilder();
        command.data.setName(command.name);
        const category = command.category === 'none' && !command.companytype ? 'STAFF' : command.category;
        command.data.setDescription(category + (command.description === 'none' ? '' : ' | ' + command.description));
        (category === 'STAFF' ? serverCommands : globalCommands).push(command.data.toJSON());
    }
    client.commands = commands;
    client.registeredCommands = { globalCommands, serverCommands };
}

async function deployCommands(client, config, force) {
    const rest = new REST({ version: '10' }).setToken(config.app.token);
    const { globalCommands, serverCommands } = client.registeredCommands;
    const current = await rest.get(Routes.applicationCommands(config.app.id));
    if (current.length === globalCommands.length && !force) return;
    await rest.put(Routes.applicationGuildCommands(config.app.id, '693150851396796446'), { body: serverCommands });
    await rest.put(Routes.applicationCommands(config.app.id), { body: globalCommands });
}

async function createBotInfo({ client, database, id, state, utility, version }) {
    const globals = await database.get(id, 'globals');
    return new Discord.MessageEmbed().setTitle(`(/) ${client.user.username}`)
        .addField('🕐 Tempo online', `\`${utility.uptime()}\``, true)
        .addField('📓 Comandos executados', `Após iniciar: \`${state.commandsExecuted}\`\nTotal: \`${globals.totalcmd}\`\nPlayers após iniciar: \`${state.playersSeen.size}\``, true)
        .addField('📎 Versões', `Node.js \`${process.versions.node}\`\nDiscord.js \`${Discord.version}\`\nNisruksha \`${version}\``)
        .setTimestamp();
}

module.exports = { createBot, deployCommands };
