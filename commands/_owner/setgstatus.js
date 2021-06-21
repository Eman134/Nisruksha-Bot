module.exports = {
    name: 'setgstatus',
    aliases: ['setargstatus', 'gstatus', 'setgs'],
    category: 'none',
    description: 'Modifica o status global do bot',
    options: [],
    perm: 5,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        let args = API.args(msg)

        if (!args) {
            const embedtemp = await API.sendError(msg, `Digite um status global para aplicar no bot!\n \n**Informações de global status:**\n\`0\` Comandos somente se o membro tiver no servidor oficial\n\`1\` Uso liberado para qualquer membro\n\`2\` Manutenção ligada`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        
        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Digite um status global para aplicar no bot!\n \n**Informações de global status:**\n\`0\` Comandos somente se o membro tiver no servidor oficial\n\`1\` Uso liberado para qualquer membro\n\`2\` Manutenção ligada`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let sl = parseInt(args[0])
        let m = ""
        if (sl == 2) {
            if (args.length == 1) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar um motivo para a manutenção!`, "setgs 2 <motivo>")
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            m = API.getMultipleArgs(msg, 2)
        }

        let ob = {
            0: "Comandos somente se o membro tiver no servidor oficial",
            1: "Uso liberado para qualquer membro",
            2: "Manutenção ligada"
        }

        msg.quote({ content: `O status global do bot foi modificado para: \`${sl}\` ${ob[sl]}` })

        API.setGlobalInfo('status', sl)
        API.setGlobalInfo('man', m)

	}
};