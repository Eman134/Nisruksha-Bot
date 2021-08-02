const Discord = require('discord.js');
const fs = require('fs');
const API = require("./api.js");

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
        this.loadCommands()
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
        require('./packages/quote.js')

        fs.readdir("./_classes/modules/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(file => {
                let eventFunction = require(`./modules/${file}`);
                API[file.replace('.js', '')] = eventFunction
            });
        });

        API.db = require('./db.js');
        API.Discord = Discord;
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

    loadCommands() {
        const x = new Discord.Collection(undefined, undefined);
        const x2 = new Discord.Collection(undefined, undefined);

        const glob = require('glob');

        glob(__dirname + '/../commands/*/*.js', async function (er, files) {

            if (!this.application?.owner) await this.application?.fetch();

            if (er) {
                console.log(er)
                API.client.emit('error', er)
            }
            files.forEach(file => {

                try {

                    let command = require(file.replace('.js', ''))

                    if (!file.includes('!')) {

                        x.set(command.name, command)
                        if (!command.aliases) command.aliases = []
                        for (const r of command.aliases) {
                            x2.set(r, command)
                        }

                        API.helpExtension.addCommand(command);

                    };

                } catch (err) {
                    console.log('Houve um erro ao carregar o comando ' + file)
                    console.log(err.stack)
                }

            })

        })

        this.commandsaliases = x2

        this.commands = x

        console.log(`[COMANDOS] Carregados`.green)
    }

    async loadSlash(log) {
        const x = new Discord.Collection(undefined, undefined);

        const glob = require('glob');

        let slashc = 0

        glob(__dirname + '/../commands/*/*.js', async function (er, files) {

            if (!this.application?.owner) await this.application?.fetch();

            if (er) {
                console.log(er)
                API.client.emit('error', er)
            }
           files.forEach(async file => {

                try {

                    let commandfile = require(file.replace('.js', ''))

                    if (!file.includes('!')) {

                        if (commandfile.category != 'none' || commandfile.companytype) {
                            slashc++
                            let options = []
                            if (commandfile.options) options = commandfile.options
                            let log = true
                            try {
                                await API.client.application?.commands.create({ name: commandfile.name, description: commandfile.category + ' | ' + commandfile.description, options }).then((cmd) => { if (log) console.log('reloaded slash ' + cmd.name)})
                            } catch (error) {
                                console.log(error)
                                console.log('Um erro ocorreu ao carregar o comando ' + commandfile.name)
                            }
                        }

                    };

                } catch (err) {
                    console.log('Houve um erro ao carregar o comando slash ' + file)
                    console.log(err.stack)
                }

            })

        })

        this.commands = x

    }

    loadExpressServer(options) {

        const port = options.db.port

        let express = require('express')

        const app = express()

        if (options.db.ip != 'localhost') {
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
            console.log(err)
        })
        process.on("unhandledRejection", (err) => {
            API.client.emit('error', err)
            console.log(err)
        })

    }

}