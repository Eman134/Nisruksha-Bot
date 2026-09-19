const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const prisma = require('../../_classes/prisma');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'permsv',
    aliases: ['permserver', 'setsvstatus', 'setss'],
    category: 'none',
    description: 'Permite um servidor a executar comandos ou bane',
    perm: 5,
	async execute(interaction) {
        const errorContainer = (message, usage) => new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));

        if (!args) {
            await interaction.reply({ components: [errorContainer(`Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        if (!utility.isInt(args[1])) {
            await interaction.reply({ components: [errorContainer(`Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let sl = parseInt(args[1])
        let m = ""
        if (sl == 2) {
            if (args.length == 2) {
                await interaction.reply({ components: [errorContainer(`Você precisa especificar um motivo para o banimento!`, "permsv <id> 2 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            m = utility.getMultipleArgs(interaction, 3)
        }

        let ob = {
            0: "Liberado o uso de comandos",
            1: "Proibido o uso de comandos",
            2: "Servidor banido"
        }

        interaction.reply({ components: [new TextDisplayBuilder().setContent(`O status do servidor foi modificado para: \`${sl}\` ${ob[sl]}`)], flags: Discord.MessageFlags.IsComponentsV2 })

        const server_id = BigInt(args[0])
        await prisma.servers.upsert({ where: { server_id }, update: { status: sl, banreason: m }, create: { server_id, status: sl, banreason: m } })


	}
};
