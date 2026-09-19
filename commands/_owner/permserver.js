const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const prisma = require('../../_classes/prisma');
module.exports = {
    name: 'permsv',
    aliases: ['permserver', 'setsvstatus', 'setss'],
    category: 'none',
    description: 'Permite um servidor a executar comandos ou bane',
    perm: 5,
	async execute(interaction) {

        if (!args) {
            const embedtemp = await utility.sendError(interaction, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (!utility.isInt(args[1])) {
            const embedtemp = await utility.sendError(interaction, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let sl = parseInt(args[1])
        let m = ""
        if (sl == 2) {
            if (args.length == 2) {
                const embedtemp = await utility.sendError(interaction, `Você precisa especificar um motivo para o banimento!`, "permsv <id> 2 <motivo>")
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            m = utility.getMultipleArgs(interaction, 3)
        }

        let ob = {
            0: "Liberado o uso de comandos",
            1: "Proibido o uso de comandos",
            2: "Servidor banido"
        }

        interaction.reply({ content: `O status do servidor foi modificado para: \`${sl}\` ${ob[sl]}` })

        const server_id = BigInt(args[0])
        await prisma.servers.upsert({ where: { server_id }, update: { status: sl, banreason: m }, create: { server_id, status: sl, banreason: m } })


	}
};
