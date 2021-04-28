const { Client } = require('discord.js-light');
const Discord = require('discord.js-light');
const fs = require('fs');
const API = require("./api.js");


module.exports = class MenuClient extends Client {

    constructor(options = {}) {
        super({
            cacheGuilds: true,
            cacheChannels: true,
            cacheOverwrites: true,
            cacheRoles: true,
            cacheEmojis: true,
            cachePresences: true,
        
            allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, 

            disabledEvents: [],

            ws: { 
                    properties: { $browser: 'Discord Android' }, 
                    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'] 
                }
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
        require('discord-buttons')(this)

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

        console.log(`[MÓDULOS] Carregados`.green )

    }

    loadEvents() {
        fs.readdir("./events/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(file => {
                let eventFunction = require(`../events/${file}`);
                this.on(eventFunction.name, (...args) => eventFunction.execute(API, ...args));
            });
        });
        console.log(`[EVENTOS] Carregados`.green )
    }

    loadCommands() {
        const x = new Discord.Collection(undefined, undefined);
        
        const glob = require('glob');

        glob(__dirname+'/../commands/*/*.js', function (er, files) {
            
            if(er) {
            console.log(er)
            API.client.emit('error', er)
            }
            files.forEach(file=>{

                try {

                    let command = require(`${file.replace('.js', '')}`)
                    
                    if (!file.includes('!')) {
                    
                    x.set(command.name, command)
                    if (command.aliases == undefined) command.aliases = [] 
                    for (const r of command.aliases){
                        x.set(r, command)
                    }
                    
                    API.helpExtension.addCommand(command, command.name);

                    };

                } catch (err) {
                    console.log('Houve um erro ao carregar o comando ' + file)
                    console.log(err.stack)
                }

                
            })

        })

        this.commands = x

        console.log(`[COMANDOS] Carregados`.green )
    }

    loadExpressServer(options) {

        const port = options.port

        const http = require("http");

        try {
            let app = require('express')
            const server = http.createServer(app)

            if (options.ip != 'localhost') dblCheck(server)

            server.listen(port, () => {});
        } catch {
        }
        
        // Upvotes
        function dblCheck(server) {
            try {
                const AutoPoster = require('topgg-autoposter')
                const ap = AutoPoster(options.dbl.token, API.client)
                const DBL = require('dblapi.js');
                const dbl = new DBL(options.dbl.token, { webhookAuth: options.dbl.webhookAuthPass, webhookServer: server, statsInterval: options.dbl.statsInterval }, this);
                dbl.webhook.on('ready', hook => {
                    console.log(`[UPVOTE] Rodando em http://${hook.hostname}:${hook.port}${hook.path}`.green);
                });
                dbl.webhook.on('vote', vote => {

                    API.client.users.fetch(vote.user).then((user) => {

                    let size = 1

                    const embed = new Discord.MessageEmbed()
                    .setColor('RANDOM')
                    .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${API.money2} ${API.money2emoji} como recompensa!\nVote você também usando \`${API.prefix}votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
                    .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://top.gg/bot/763815343507505183')

                    API.client.channels.cache.get(options.dbl.voteLogs_channel).send(embed)
                    API.eco.addToHistory(user, `Vote | + ${API.format(size)} ${API.money2emoji}`)
                    API.eco.points.add(user, size)

                    })

                });
                API.dbl = dbl
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