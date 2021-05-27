module.exports = {
    name: 'permsv',
    aliases: ['permserver', 'setsvstatus', 'setss'],
    category: 'none',
    description: 'Permite um servidor a executar comandos ou bane',
	async execute(API, msg) {

        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        let args = API.args(msg)

        if (!args) {
            API.sendError(msg, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            return;
        }
        
        if (!API.isInt(args[1])) {
            API.sendError(msg, `Digite um status para aplicar no servidor!\n \n**Informações de server status:**\n\`0\` Liberado o uso de comandos\n\`1\` Não permitido o uso de comandos\n\`2\` Banido`, "permsv <id> 2 <motivo>")
            return;
        }

        let sl = parseInt(args[1])
        let m = ""
        if (sl == 2) {
            if (args.length == 2) {
                API.sendError(msg, `Você precisa especificar um motivo para o banimento!`, "permsv <id> 2 <motivo>")
                return;
            }
            m = API.getMultipleArgs(msg, 3)
        }

        let ob = {
            0: "Liberado o uso de comandos",
            1: "Proibido o uso de comandos",
            2: "Servidor banido"
        }

        msg.quote(`O status do servidor foi modificado para: \`${sl}\` ${ob[sl]}`)

        API.serverdb.setServerInfo(args[0], 'status', sl)
        API.serverdb.setServerInfo(args[0], 'banreason', m)


	}
};