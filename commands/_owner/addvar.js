module.exports = {
    name: 'addvar',
    aliases: [],
    category: 'none',
    description: 'Adicione um valor á uma variável no banco de dados',
    options: [],
    perm: 5,
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 4) {
            const embedtemp = await API.sendError(msg, "Você precisa preencher todos os parâmetros.", "addvar <id> <tabela> <coluna> <valor>");
            await msg.quote({ embeds: [embedtemp]})
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
		const embed = new Discord.MessageEmbed()
        try {
            await API.setPlayer(v, args[1]);

            let res = await API.db.pool.query(`SELECT * FROM ${args[1]} WHERE ${va} = $1;`, [v.id]);
            await API.db.pool.query(`UPDATE ${args[1]} SET ${args[2]} = $2 WHERE ${va} = $1;`, [v.id, eval(res.rows[0][args[2]]) + eval(args[3])])
            let res3 = await API.db.pool.query(`SELECT * FROM ${args[1]} WHERE ${va} = $1;`, [v.id]);

            embed.setDescription(`✅ Dados de ${v} atualizados! ${res.rows[0][args[2]]} -> ${res3.rows[0][args[2]]}`)

            .setColor('#32a893')
        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao atualizar dados de ${v} em \`${args[1]}:${args[2]}\``)
            .addField('Erro:', `\`\`\`js\n${e.stack}\`\`\``)
            .setColor('#eb4034')
        } finally {
            await msg.quote({ embeds: [embed] });
        }

	}
};