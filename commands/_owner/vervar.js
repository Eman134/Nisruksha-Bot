const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('id').setDescription('Selecione um id de usuário').setRequired(true))
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))

module.exports = {
    name: 'vervar',
    aliases: ['seevar', 'verobj', 'seeobj', 'getobj'],
    category: 'none',
    description: 'Veja uma variável e um valor do banco de dados',
    data,
    perm: 5,
	async execute(API, interaction) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');

		const Discord = API.Discord;
        const client = API.client;
        let v;
        let va = '';
        try {
            v = await client.users.fetch(id);
            va = 'user_id'
        } catch {
            v = client.guilds.cache.get(id);
            va = 'server_id'
        }

        if (!v)  {
            return interaction.reply({ content: 'id undefined' })
        }

		const embed = new Discord.MessageEmbed()
        try {

            const text =  `SELECT * FROM ${tabela} WHERE ${va} = $1;`, values = [v.id]
            let res = await DatabaseManager.query(text, values);
            embed.setDescription(`✅ Dados de ${v} em \`${tabela}\`\n\`\`\`js\n${JSON.stringify(res.rows[0], null, '\t').slice(0, 1500)}\`\`\``)
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
            embed.setDescription(`❌ Houve um erro ao ver dados de ${v} em \`${tabela}\``)
            .addField('Erro:', `\`\`\`js\n${e.stack}\`\`\``)
            .setColor('#eb4034')
        } finally {
            await interaction.reply({ embeds: [embed] });
        }

	}
};