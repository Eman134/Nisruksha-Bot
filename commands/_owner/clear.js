module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    category: 'none',
    description: 'none',
    options: [],
    perm: 5,
	async execute(API, msg) {

        let args = API.args(msg)
		if (!args){
            const embedtemp = await API.sendError(msg, "Digite um número de mensagens para dar purge", `limpar 10`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um NÚMERO!", `limpar 10`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        let arg = parseInt(args[0])
        if (arg < 1 || arg > 100) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um número maior do que 0 e menor ou igual á 100!", `limpar 10`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        try {
            await msg.channel.bulkDelete(arg).catch()
            await msg.quote({ content: `Você limpou **${arg}** mensagens deste canal!`}).then(ms => setTimeout(() => ms.delete().catch()), 5000).catch()
        } catch{
        }

	}
};