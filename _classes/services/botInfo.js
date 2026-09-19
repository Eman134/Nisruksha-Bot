const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const prisma = require('../prisma');
const clientService = require('./clientService');
const runtime = require('./runtime');
const UtilityService = require('./utilityService');

class BotInfoService {
    constructor() {
        this.utility = new UtilityService();
    }

    async get() {
        const client = clientService.current;
        const user_id = BigInt(require('../config').app.id);
        const globals = await prisma.globals.upsert({
            where: { user_id },
            update: { user_id },
            create: { user_id, keys: [], remember: [], processing: [] }
        });
        const version = `${require('../../package.json').version} (Rework)`;
        return new ContainerBuilder()
            .setAccentColor(0x36393f)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## (/) ${client.user.username}`),
                new TextDisplayBuilder().setContent(`**🕐 Tempo online**\n\`${this.utility.uptime()}\``),
                new TextDisplayBuilder().setContent(`**📓 Comandos executados**\nApós iniciar: \`${runtime.commandsExecuted}\`\nTotal: \`${globals.totalcmd}\`\nPlayers após iniciar: \`${runtime.playersSeen.size}\``),
                new TextDisplayBuilder().setContent(`**📎 Versões**\nNode.js \`${process.versions.node}\`\nDiscord.js \`${Discord.version}\`\nNisruksha \`${version}\``)
            );
    }
}

module.exports = new BotInfoService();
