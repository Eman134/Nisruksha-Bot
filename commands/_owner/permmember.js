const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const PermissionService = require('../../_classes/services/permissionService');
const DatabaseManager = require('../../_classes/manager/DatabaseManager');
const permission = new PermissionService(new DatabaseManager());
module.exports = {
    name: 'permm',
    aliases: ['permmember', 'setmperm', 'setmp'],
    category: 'none',
    description: 'Seta a permissão de algum membro',
    perm: 5,
	async execute(interaction) {

        const pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const perm = pobj.perm
        
        if (!args) {
            const embedtemp = await utility.sendError(interaction, `Digite um membro e uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (!utility.isInt(args[1])) {
            const embedtemp = await utility.sendError(interaction, `Digite uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let selected = parseInt(args[1])

        if (perm == 4 && selected > 1) {
            const embedtemp = await utility.sendError(interaction, `Você só possui permissão para banir/desbanir membros!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro`, "setmp <id> 0 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let member = await clientService.current.users.fetch(args[0])
        if (!member) {
            const embedtemp = await utility.sendError(interaction, `Este membro não existe!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        let m = ""
        if (selected == 0) {
            if (args.length == 2) {
                const embedtemp = utility.sendError(interaction, `Você precisa especificar um motivo para o banimento!`, "setmp <id> 0 <motivo>")
                await interaction.reply({ embeds: [embedtemp]})
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

        interaction.reply({ content: `A permissão do membro foi alterada para: \`${selected}\` ${ob[selected]}` })

        await permission.set(member.id, selected)
        await DatabaseManager.set(member.id, 'players', 'banreason', m)


	}
};
