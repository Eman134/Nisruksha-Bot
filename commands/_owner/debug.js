module.exports = {
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        msg.reply(`Debug foi setado para ${!API.debug}`)
        API.debug = !API.debug

	}
};