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
                this.on(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
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

        const port = options.port

        let express = require('express')

        const app = express()

        if (options.ip != 'localhost') {
            dblCheck(app)
            app.listen(port);
        }

        function dblCheck(app) {
            try {

                const Topgg = require("@top-gg/sdk")

                const webhook = new Topgg.Webhook(options.dbl.webhookAuthPass)

                app.post("/dblwebhook", webhook.listener(vote => {

                    API.client.users.fetch(vote.user).then((user) => {

                        let size = 1

                        const embed = new Discord.MessageEmbed()
                            .setColor('RANDOM')
                            .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${API.money2} ${API.money2emoji} como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
                            .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://top.gg/bot/763815343507505183')

                        API.client.channels.cache.get(options.dbl.voteLogs_channel).send({ embeds: [embed]});
                        API.eco.addToHistory(user, `Vote | + ${API.format(size)} ${API.money2emoji}`)
                        API.eco.points.add(user, size)
                        API.playerUtils.cooldown.set(user, "votetopgg", 43200);

                    })

                }))

                API.dbl = new Topgg.Api(options.dbl.token)

                const { AutoPoster } = require('topgg-autoposter')
                
                AutoPoster(options.dbl.token, API.client)

            } catch {
            }
        }
    }

    async login(token = this.token) {
        super.login(token)
        API.client = this

        process.on("uncaughtException", (err) => {
            API.client.emit('error', err)
        })
        process.on("unhandledRejection", (err) => {
            API.client.emit('error', err)
        })

    }

}