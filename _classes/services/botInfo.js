const Discord = require('discord.js');
const DatabaseManager = require('../manager/DatabaseManager');
const clientService = require('./clientService');
const runtime = require('./runtime');
const UtilityService = require('./utilityService');

class BotInfoService {
    constructor() {
        this.database = new DatabaseManager();
        this.utility = new UtilityService();
    }

    async get() {
        const client = clientService.current;
        const globals = await this.database.get(require('../config').app.id, 'globals');
        const version = `${require('../../package.json').version} (Rework)`;
        return new Discord.EmbedBuilder().setTitle(`(/) ${client.user.username}`)
            .addFields({ name: '🕐 Tempo online', value: `\`${this.utility.uptime()}\``, inline: true })
            .addFields({ name: '📓 Comandos executados', value: `Após iniciar: \`${runtime.commandsExecuted}\`\nTotal: \`${globals.totalcmd}\`\nPlayers após iniciar: \`${runtime.playersSeen.size}\``, inline: true })
            .addFields({ name: '📎 Versões', value: `Node.js \`${process.versions.node}\`\nDiscord.js \`${Discord.version}\`\nNisruksha \`${version}\`` })
            .setTimestamp();
    }
}

module.exports = new BotInfoService();
