module.exports = {
    requiredServices: ["client","getMultipleArgs","isInt","sendError","setPerm"],
    name: 'permm',
    aliases: ['permmember', 'setmperm', 'setmp'],
    category: 'none',
    description: 'Seta a permissão de algum membro',
    perm: 5,
	async execute(interaction, svcClient, svcGetMultipleArgs, svcIsInt, svcSendError, svcSetPerm) {

        const pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const perm = pobj.perm
        
        if (!args) {
            const embedtemp = await svcSendError(interaction, `Digite um membro e uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (!svcIsInt(args[1])) {
            const embedtemp = await svcSendError(interaction, `Digite uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let selected = parseInt(args[1])

        if (perm == 4 && selected > 1) {
            const embedtemp = await svcSendError(interaction, `Você só possui permissão para banir/desbanir membros!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let member = await svcClient.users.fetch(args[0])
        if (!member) {
            const embedtemp = await svcSendError(interaction, `Este membro não existe!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let m = ""
        if (selected == 0) {
            if (args.length == 2) {
                const embedtemp = svcSendError(interaction, `Você precisa especificar um motivo para o banimento!`, "setmp <id> 0 <motivo>")
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            m = svcGetMultipleArgs(interaction, 3)
        }

        let ob = {
            0: "<:banido:756525777981276331> Banido",
            1: "Membro comum",
            2: "Beta",
            3: "Mvp",
            4: "Mod"
        }

        interaction.reply({ content: `A permissão do membro foi alterada para: \`${selected}\` ${ob[selected]}` })

        await svcSetPerm(member.id, selected)
        await DatabaseManager.set(member.id, 'players', 'banreason', m)


	}
};