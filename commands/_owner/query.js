module.exports = {
    name: 'query',
    aliases: ['run', 'runquery'],
    category: 'none',
    description: 'Executa uma query no banco de dados',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        var args = API.args(msg);

        if (args.length < 1) {
            API.sendError(msg, "Você precisa digitar um parâmetro.", `query <m parameters>\n${API.prefix}query DELETE FROM players WHERE user_id=422002630106152970`);
            return;
        }

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        let text =  API.getMultipleArgs(msg, 1);
        if (!(text.endsWith(';'))) text += ';'
        try {

            const res = await API.db.pool.query(text);

            embed.setDescription(`✅ Query \`${text}\` foi executada com sucesso!`)
            embed.addField(`Resultado`,`\`\`\`js\n${(JSON.stringify(res.rows[0], null, '\t')+'').slice(0, 1000)}\`\`\``)
            embed.setColor('#32a893');

        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao rodar a query \`${text}\``)
            embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
            embed.setColor('#eb4034')
        } finally {
            await msg.quote(embed);
        }

	}
};