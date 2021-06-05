module.exports = {
    name: 'sairsv',
    aliases: ['leaveserver'],
    category: 'none',
    description: 'Faz com que o bot saia de algum servidor',
    options: [],
    perm: 5,
	async execute(API, msg) {

        let args = API.args(msg);

        if (args.length == 0) {
            await msg.quote(`${API.prefix}sairsv <id>`)
            return;
        }

        if (API.client.guilds.cache.get(args[0]) == undefined) return await msg.quote('invalid server')

        API.client.guilds.cache.get(args[0]).leave();

        await msg.quote('success')
    }
}