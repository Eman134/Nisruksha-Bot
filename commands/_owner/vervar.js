module.exports = {
    name: 'vervar',
    aliases: ['seevar', 'verobj', 'seeobj', 'getobj'],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        var args = API.args(msg);

        if (args.length < 2) {
            API.sendError(msg, "Você precisa preencher todos os parâmetros.", "setvar <id> <tabela>");
            return;
        }

		const Discord = API.Discord;
        const client = API.client;
        let v;
        let va = '';
        try {
            v = await client.users.fetch(args[0]);
            va = 'user_id'
        } catch {
            v = client.guilds.cache.get(args[0]);
            va = 'server_id'
        }

        if (!v)  {
            return msg.reply('id undefined')
        }

		const embed = new Discord.MessageEmbed()
        try {

            const text =  `SELECT * FROM ${args[1]} WHERE ${va} = $1;`, values = [v.id]
            let res = await API.db.pool.query(text, values);
            embed.setDescription(`✅ Dados de ${v} em \`${args[1]}\`\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(0, 1500)}\`\`\``)
            .setColor('#32a893')

            if (JSON.stringify(res.rows[0], null, '\t').length > 1500) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(1500, 2300)}\`\`\``)
            }
            if (JSON.stringify(res.rows[0], null, '\t').length > 2300) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(2300, 3000)}\`\`\``)
            }
            if (JSON.stringify(res.rows[0], null, '\t').length > 3000) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(3000, 3800)}\`\`\``)
            }
            if (JSON.stringify(res.rows[0], null, '\t').length > 3800) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(3800, 4500)}\`\`\``)
            }
            if (JSON.stringify(res.rows[0], null, '\t').length > 4500) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(4500, 5300)}\`\`\``)
            }
			if (JSON.stringify(res.rows[0], null, '\t').length > 5300) {
                embed.addField('.', `\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(5300, 6100)}\`\`\``)
            }

        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao ver dados de ${v} em \`${args[1]}\``)
            .addField('Erro:', `\`\`\`js\n${e.stack}\`\`\``)
            .setColor('#eb4034')
        } finally {
            await msg.quote(embed);
        }

	}
};