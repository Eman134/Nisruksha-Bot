module.exports = {
    name: 'query',
    aliases: ['run', 'runquery'],
    category: 'none',
    description: 'Executa uma query no banco de dados',
    options: [],
    perm: 5,
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 1) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um parâmetro.", `query <m parameters>\n${API.prefix}query DELETE FROM players WHERE user_id=422002630106152970`);
            await msg.quote({ embeds: [embedtemp]})
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
            await msg.quote({ embeds: [embed] });
        }

	}
};