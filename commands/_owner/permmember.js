const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'permm',
    aliases: ['permmember', 'setmperm', 'setmp'],
    category: 'none',
    description: 'Seta a permissão de algum membro',
    perm: 5,
	async execute(interaction) {
        const errorContainer = (message, usage) => new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\n${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));

        const user_id = BigInt(interaction.user.id)
        const pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        const perm = pobj.perm
        
        if (!args) {
            await interaction.reply({ components: [errorContainer(`Digite um membro e uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        if (!utility.isInt(args[1])) {
            await interaction.reply({ components: [errorContainer(`Digite uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let selected = parseInt(args[1])

        if (perm == 4 && selected > 1) {
            await interaction.reply({ components: [errorContainer(`Você só possui permissão para banir/desbanir membros!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro`, "setmp <id> 0 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        let member = await clientService.current.users.fetch(args[0])
        if (!member) {
            await interaction.reply({ components: [errorContainer(`Este membro não existe!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        let m = ""
        if (selected == 0) {
            if (args.length == 2) {
                await interaction.reply({ components: [errorContainer(`Você precisa especificar um motivo para o banimento!`, "setmp <id> 0 <motivo>")], flags: Discord.MessageFlags.IsComponentsV2 })
                return;
            }
            m = utility.getMultipleArgs(interaction, 3)
        }

        let ob = {
            0: "<:banido:756525777981276331> Banido",
            1: "Membro comum",
            2: "Beta",
            3: "Mvp",
            4: "Mod"
        }

        interaction.reply({ components: [new TextDisplayBuilder().setContent(`A permissão do membro foi alterada para: \`${selected}\` ${ob[selected]}`)], flags: Discord.MessageFlags.IsComponentsV2 })

        const member_id = BigInt(member.id)
        await prisma.players.upsert({ where: { user_id: member_id }, update: { perm: selected, banreason: m }, create: { user_id: member_id, perm: selected, banreason: m, frames: [], badges: [] } })


	}
};
