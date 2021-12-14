const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('id').setDescription('Selecione um id de usuário').setRequired(true))
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))
.addStringOption(option => option.setName('coluna').setDescription('Selecione uma coluna').setRequired(true))
.addStringOption(option => option.setName('valor').setDescription('Coloque o valor a ser setado').setRequired(true))

module.exports = {
    name: 'addvar',
    aliases: [],
    category: 'none',
    description: 'Adicione um valor á uma variável no banco de dados',
    data,
    perm: 5,
	async execute(API, interaction) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');
        const coluna = interaction.options.getString('coluna');
        const valor = interaction.options.getString('valor');

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
		const embed = new Discord.MessageEmbed()
        try {
            await DatabaseManager.setIfNotExists(v, tabela);

            let res = await DatabaseManager.query(`SELECT * FROM ${tabela} WHERE ${va} = $1;`, [v.id]);
            await DatabaseManager.increment(v.id, tabela, coluna, eval(valor), va)
            let res3 = await DatabaseManager.query(`SELECT * FROM ${tabela} WHERE ${va} = $1;`, [v.id]);

            embed.setDescription(`✅ Dados de ${v} atualizados! ${res.rows[0][coluna]} -> ${res3.rows[0][coluna]}`)

            .setColor('#32a893')
        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao atualizar dados de ${v} em \`${tabela}:${coluna}\``)
            .addField('Erro:', `\`\`\`js\n${e.stack}\`\`\``)
            .setColor('#eb4034')
        } finally {
            await interaction.reply({ embeds: [embed] });
        }

	}
};