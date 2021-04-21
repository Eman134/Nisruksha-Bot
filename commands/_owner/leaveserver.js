module.exports = {
    name: 'sairsv',
    aliases: ['leaveserver'],
    category: 'none',
    description: 'Faz com que o bot saia de algum servidor',
	async execute(API, msg) {

        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;
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