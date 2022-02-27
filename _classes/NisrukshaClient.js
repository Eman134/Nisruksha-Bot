const Discord = require('discord.js');
const fs = require('fs');
const API = require("./api.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const glob = require('glob');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = class NisrukshaClient extends Discord.Client {

    constructor(options = {}) {
        super({
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
            intents: ['GUILDS', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGES'] 
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

        const files = glob.sync(__dirname + '/modules/*.js')

        for (const file of files) {
            let eventFunction = require(file.replace('.js', ''));
            const eventName = file.replace('.js', '').replace(__dirname.replace(/\\/g, '/') + '/modules/', "")
            API[eventName] = eventFunction
        }

        API.db = require('./db.js');
        
        API.client = this;

        console.log(`[MÓDULOS] Carregados`.green)

    }

    loadEvents() {
        fs.readdir("./events/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(file => {
                let eventFunction = require(`../events/${file}`);
                if (eventFunction.name != 'ready' ) this.on(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
                else this.once(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
            });
        });
        console.log(`[EVENTOS] Carregados`.green)
    }

    loadCommands(options) {

        (async () => {
            try {
        
                if (!this.application?.owner) await this.application?.fetch();

                const commandsObject = await this.getCommandsJson()
                this.commands = commandsObject.commandsCollection

                await this.loadSlashCommands({ id: options.app.id })

                console.log(`[COMANDOS] Carregados`.green)

            } catch (error) {
                console.error(error);
            }
        })();
        
    }

    getCommandsJson() {
        const files = glob.sync(__dirname + '/../commands/*/*.js')
        const commandsCollection = new Discord.Collection();
        const globalCommandsJson = []
        const serverCommandsJson = []
        for (const file of files) {

            try {

                if (!file.includes('!')) {
                    
                    let command = require(file.replace('.js', ''))
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

            } catch (err) {
                console.log('Houve um erro ao carregar o comando ' + file)
                console.log(err.stack)
            }
        }

        return { globalCommandsJson, serverCommandsJson, commandsCollection }
    }

    async loadSlashCommands({ force = false, id }) {
        const rest = new REST({ version: '9' }).setToken(this.token);
        const { globalCommandsJson, serverCommandsJson } = await this.getCommandsJson()

        console.log(force ? 'Forçando atualização de comandos' : 'Carregando comandos')
        rest.get(Routes.applicationCommands(id)).then(async (cmds) => {

            if ((globalCommandsJson.length != cmds.length) || force) {

                console.log('Atualizando comandos')

                try {
                    await rest.put(
                        Routes.applicationGuildCommands(id, '693150851396796446'),
                        { body: serverCommandsJson },
                    );
    
                    await rest.put(
                        Routes.applicationCommands(id),
                        { body: globalCommandsJson },
                    )
                } catch (error) {
                    console.log(error)
                }


                console.log(globalCommandsJson.length + ' Slash reiniciados' + (force ? ' (FORCE)' : ''))

            }

        })
    }

    loadExpressServer(options) {

        if (options.ip != 'localhost') {
            const { AutoPoster } = require('topgg-autoposter')
                    
            AutoPoster(options.dbl.token, API.client)
        }

        
    }

    async login(token = this.token) {
        try {
            super.login(token)
            API.client = this
        } catch {
            
        }

        process.on("uncaughtException", (err) => {
            API.client.emit('error', err)
        })
        process.on("unhandledRejection", (err) => {
            API.client.emit('error', err)
        })

    }

}