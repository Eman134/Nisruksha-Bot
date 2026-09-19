const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const clientService = require('./services/clientService');
const helpService = require('./services/help');
const imageService = require('./services/images');

function createBot(config) {
    const client = new Discord.Client({
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
        intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessageReactions, Discord.GatewayIntentBits.GuildMessages]
    });
    if (!config.app.token) throw new Error('Token not found in environment');

    clientService.setClient(client);
    registerEvents(client);
    registerCommands(client, helpService);
    client.loadSlashCommands = ({ force = false } = {}) => deployCommands(client, config, force);
    client.assetsReady = imageService.preloadAssets();
    return client;
}

function registerEvents(client) {
    for (const file of fs.readdirSync(path.resolve(__dirname, '../events'))) {
        const event = require(path.resolve(__dirname, '../events', file));
        const handler = (...args) => event.execute(...args);
        if (event.name === 'clientReady') client.once(event.name, handler);
        else client.on(event.name, handler);
    }
}

function registerCommands(client, help) {
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

module.exports = { createBot, deployCommands };
