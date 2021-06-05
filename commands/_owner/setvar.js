module.exports = {
    name: 'setvar',
    aliases: ['svar'],
    category: 'none',
    description: 'Seta uma variável e um valor no banco de dados',
    options: [],
    perm: 5,
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 4) {
            const embedtemp = await API.sendError(msg, "Você precisa preencher todos os parâmetros.", "setvar <id> <tabela> <coluna> <valor>");
            await msg.quote(embedtemp)
            return;
        }

		const Discord = API.Discord;
        const client = API.client;
        const embed = new Discord.MessageEmbed()
        let args3 = API.getMultipleArgs(msg, 4)
        let v;
        let va = '';
        try {
            v = await client.users.fetch(args[0]);
            va = 'user_id'
        } catch {
            v = client.guilds.cache.get(args[0]);
            va = 'server_id'
        }

        if (!v) {
            msg.quote(`id undefined`)
            return;
        }


        try {

            await API.setPlayer(v, args[1]);
            const text =  `UPDATE ${args[1]} SET ${args[2]} = $2 WHERE ${va} = $1;`, values = [v.id, eval(args3)]
            await API.db.pool.query(text, values);

            embed.setDescription(`✅ Você setou o valor \`${eval(args3)}\` para ${v} em \`${args[1]}:${args[2]}\``)
            embed.setColor('#32a893');

        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao setar \`${eval(args3)}\` para ${v} em \`${args[1]}:${args[2]}\``)
            embed.addField('Erro:', `\`\`\`js\n${e}\`\`\``);
            embed.setColor('#eb4034')
        } finally {
            await msg.quote(embed);
        }

	}
};