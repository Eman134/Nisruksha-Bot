module.exports = {
    name: 'permsv',
    aliases: ['permserver', 'setsvstatus', 'setss'],
    category: 'none',
    description: 'Permite um servidor a executar comandos ou bane',
    perm: 5,
	async execute(API, interaction) {

        if (!args) {
            const embedtemp = await API.sendError(interaction, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        if (!API.isInt(args[1])) {
            const embedtemp = await API.sendError(interaction, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let sl = parseInt(args[1])
        let m = ""
        if (sl == 2) {
            if (args.length == 2) {
                const embedtemp = await API.sendError(interaction, `Você precisa especificar um motivo para o banimento!`, "permsv <id> 2 <motivo>")
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            m = API.getMultipleArgs(interaction, 3)
        }

        let ob = {
            0: "Liberado o uso de comandos",
            1: "Proibido o uso de comandos",
            2: "Servidor banido"
        }

        interaction.reply({ content: `O status do servidor foi modificado para: \`${sl}\` ${ob[sl]}` })

        API.serverdb.setServerInfo(args[0], 'status', sl)
        API.serverdb.setServerInfo(args[0], 'banreason', m)


	}
};