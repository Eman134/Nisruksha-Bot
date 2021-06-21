module.exports = {
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
    options: [],
    perm: 5,
	async execute(API, msg) {

        await msg.quote({ content: `Debug foi setado para ${!API.debug}` })
        
        API.debug = !API.debug

	}
};