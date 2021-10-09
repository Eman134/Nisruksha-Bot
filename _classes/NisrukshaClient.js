const Discord = require('discord.js');
const fs = require('fs');
const API = require("./api.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const glob = require('glob');

module.exports = class NisrukshaClient extends Discord.Client {

    constructor(options = {}) {
        super({
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
            intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'] 
        })

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
        require('./packages/quote.js')

        const files = glob.sync(__dirname + '/modules/*.js')
        
        files.forEach(file => {
            let eventFunction = require(file.replace('.js', ''));
            const eventName = file.replace('.js', '').replace(__dirname.replace(/\\/g, '/') + '/modules/', "")
            API[eventName] = eventFunction
        });

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
        const x = new Discord.Collection(undefined, undefined);
        const x2 = new Discord.Collection(undefined, undefined);

        const rest = new REST({ version: '9' }).setToken(this.token);

        (async () => {
            try {
        
                if (!this.application?.owner) await this.application?.fetch();

                const commandsJson = []

                const files = glob.sync(__dirname + '/../commands/*/*.js')

                files.forEach(file => {

                    try {

                        if (!file.includes('!')) {
                            
                            let command = require(file.replace('.js', ''))
                            x.set(command.name, command)
                            if (!command.aliases) command.aliases = []
                            for (const r of command.aliases) {
                                x2.set(r, command)
                            }

                            API.helpExtension.addCommand(command);
                            if (command.data && command.category != "none") {
                                command.data.setName(command.name)
                                command.data.setDescription(command.category + ' | ' + command.description)
                                commandsJson.push(command.data.toJSON());
                            }

                        };

                    } catch (err) {
                        console.log('Houve um erro ao carregar o comando ' + file)
                        console.log(err.stack)
                    }

                })

                await rest.put(
                    Routes.applicationCommands(options.app.id),
                    { body: commandsJson },
                );

                this.commandsaliases = x2

                this.commands = x

                console.log(`[COMANDOS] Carregados`.green)

            } catch (error) {
                console.error(error);
            }
        })();

        
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
                            .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${API.money2} ${API.money2emoji} como recompensa!\nVote você também usando \`${API.prefix}votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
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