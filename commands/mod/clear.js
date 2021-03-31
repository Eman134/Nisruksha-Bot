module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    category: 'Mod',
    description: 'Limpa um número de mensagens do canal',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg, 4);
        if (boolean) return;

        let args = API.args(msg)
		if (!args){
            API.sendError(msg, "Digite um número de mensagens para dar purge", `limpar 10`)
            return;
        }

        if (!API.isInt(args[0])) {
            API.sendError(msg, "Você precisa digitar um NÚMERO!", `limpar 10`)
            return;
        }
        let arg = parseInt(args[0])
        if (arg < 1 || arg > 100) {
            API.sendError(msg, "Você precisa digitar um número maior do que 0 e menor ou igual á 100!", `limpar 10`)
            return;
        }

        try {
            await msg.channel.bulkDelete(arg).catch()
            msg.quote(`Você limpou **${arg}** mensagens deste canal!`).then(ms => ms.delete({ timeout: 5000, reason: 'Limpo por um moderador.' })).catch()
        } catch{
        }

	}
};