const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
require('./discordCompat');
const API = require("./api.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { globSync } = require('glob');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('./debug');

module.exports = class NisrukshaClient extends Discord.Client {

    constructor(options = {}) {
        super({
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
            intents: [
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.GuildMessageReactions,
                Discord.GatewayIntentBits.GuildMessages
            ]
        })

        this.options

        console.log(' ');
        this.validate(options)
        this.loadEvents()
        this.loadModules()
        this.loadCommands(options)
        this.loadExpressServer(options)

        API.client = this;

    }

    validate(options) {

        if (!options.app.token) {
            console.log('Token not found in config.js')
            process.exit()
        }

        this.token = options.app.token

    }

    loadModules() {

        API.client = this;
        API.Discord = Discord;

        const files = globSync(__dirname + '/modules/*.js')

        for (const file of files) {
            let eventFunction = require(path.resolve(file));
            const eventName = path.basename(file, '.js')
            API[eventName] = eventFunction
        }

        API.db = require('./db.js');
        
        API.client = this;
        this.assetsReady = API.img.preloadAssets();

        console.log(`[MÓDULOS] Carregados`.green)

    }

    loadEvents() {
        const files = fs.readdirSync(path.resolve(__dirname, '../events'));
        files.forEach(file => {
            const eventPath = path.resolve(__dirname, '../events', file);
            try {
                const eventFunction = require(eventPath);
                if (eventFunction.name !== 'clientReady') this.on(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
                else this.once(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
            } catch (error) {
                throw reportError(error, 'events.load', { file: eventPath });
            }
        });
        console.log(`[EVENTOS] Carregados`.green)
    }

    loadCommands(options) {
        this.loadCommandsAsync(options).catch((error) => {
            reportError(error, 'commands.bootstrap');
            process.exitCode = 1;
        });
    }

    async loadCommandsAsync(options) {
        if (!this.application?.owner) await this.application?.fetch();
        const commandsObject = this.getCommandsJson();
        this.commands = commandsObject.commandsCollection;
        await this.loadSlashCommands({ id: options.app.id });
        console.log(`[COMANDOS] Carregados`.green)
    }

    getCommandsJson() {
        const files = globSync(__dirname + '/../commands/*/*.js')
        const commandsCollection = new Discord.Collection();
        const globalCommandsJson = []
        const serverCommandsJson = []
        for (const file of files) {

            try {

                if (!file.includes('!')) {
                    
                    let command = require(path.resolve(file))
                    commandsCollection.set(command.name, command)

                    if (!command.disabled) {

                        API.helpExtension.addCommand(command);
                        if (!command.data){
                            command.data = new SlashCommandBuilder()
                        }
                        command.data.setName(command.name)
                        let categorystring 
                        if (command.category == 'none' && !command.companytype) categorystring = 'STAFF'
                        else if (command.category == 'none' && command.companytype > 0) categorystring = 'TRABALHO'
                        else if (command.category == 'none' && command.companytype == -1) categorystring = 'EVENTO'
                        else categorystring = command.category
                        command.data.setDescription(categorystring + (command.description == 'none' ? '' : ' | ' + command.description))
                        if (categorystring == 'STAFF') serverCommandsJson.push(command.data.toJSON());
                        else globalCommandsJson.push(command.data.toJSON());

                    }

                };

            } catch (error) {
                throw reportError(error, 'commands.load', { file });
            }
        }

        return { globalCommandsJson, serverCommandsJson, commandsCollection }
    }

    async loadSlashCommands({ force = false, id }) {
        const rest = new REST({ version: '10' }).setToken(this.token);
        const { globalCommandsJson, serverCommandsJson } = await this.getCommandsJson()

        console.log(force ? 'Forçando atualização de comandos' : 'Carregando comandos')
        const cmds = await rest.get(Routes.applicationCommands(id));
        if ((globalCommandsJson.length != cmds.length) || force) {
            console.log('Atualizando comandos')
            await rest.put(
                Routes.applicationGuildCommands(id, '693150851396796446'),
                { body: serverCommandsJson },
            );
            await rest.put(
                Routes.applicationCommands(id),
                { body: globalCommandsJson },
            )
            console.log(globalCommandsJson.length + ' Slash reiniciados' + (force ? ' (FORCE)' : ''))
        }
    }

    loadExpressServer(options) {

        if (options.ip != 'localhost') {
            const { AutoPoster } = require('topgg-autoposter')
                    
            AutoPoster(options.dbl.token, API.client)
        }

        
    }

    async login(token = this.token) {
        API.client = this
        if (!process.__nisrukshaErrorHandlers) {
            process.__nisrukshaErrorHandlers = true;
            process.on("uncaughtException", (error) => {
                reportError(error, 'process.uncaught_exception');
                process.exitCode = 1;
            });
            process.on("unhandledRejection", (error) => {
                reportError(error, 'process.unhandled_rejection');
                process.exitCode = 1;
            });
        }
        await this.assetsReady;
        return super.login(token)
    }

}
