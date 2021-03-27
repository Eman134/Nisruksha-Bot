module.exports = {
    name: 'permm',
    aliases: ['permmember', 'setmperm', 'setmp'],
    category: 'Mod',
    description: 'Seta a permissão de algum membro',
	async execute(API, msg) {

        const boolean = await API.checkAll(msg, 4);
        if (boolean) return;

        let perm = await API.getPerm(msg.author)
        
        
        let args = API.args(msg)
        
        if (!args) {
            API.sendError(msg, `Digite um membro e uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            return;
        }
        
        if (!API.isInt(args[1])) {
            API.sendError(msg, `Digite uma permissão para aplicar no membro!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro${perm == 4?'':'\n\`2\` Beta\n\`3\` Mvp\n\`4\` Mod'}`, "setmp <id> 0 <motivo>")
            return;
        }

        let selected = parseInt(args[1])

        if (perm == 4 && selected > 1) {
            API.sendError(msg, `Você só possui permissão para banir/desbanir membros!\n \n**Informações de permissões:**\n\`0\` Banido\n\`1\` Membro`, "setmp <id> 0 <motivo>")
            return
        }

        let member = await API.client.users.fetch(args[0])
        if (!member) {
            API.sendError(msg, `Este membro não existe!`)
            return
        }

        let m = ""
        if (selected == 0) {
            if (args.length == 2) {
                API.sendError(msg, `Você precisa especificar um motivo para o banimento!`, "setmp <id> 0 <motivo>")
                return;
            }
            m = API.getMultipleArgs(msg, 3)
        }

        let ob = {
            0: "<:banido:756525777981276331> Banido",
            1: "Membro comum",
            2: "Beta",
            3: "Mvp",
            4: "Mod"
        }

        msg.reply(`A permissão do membro foi alterada para: \`${selected}\` ${ob[selected]}`)

        await API.setPerm(member, selected)
        await API.setInfo(member, 'players', 'banreason', m)


	}
};