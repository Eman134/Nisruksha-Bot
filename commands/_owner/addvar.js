const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('id').setDescription('Selecione um id de usuário').setRequired(true))
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))
.addStringOption(option => option.setName('coluna').setDescription('Selecione uma coluna').setRequired(true))
.addStringOption(option => option.setName('valor').setDescription('Coloque o valor a ser setado').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client"],
    name: 'addvar',
    aliases: [],
    category: 'none',
    description: 'Adicione um valor á uma variável no banco de dados',
    data,
    perm: 5,
	async execute(interaction, svcDiscord, svcClient) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');
        const coluna = interaction.options.getString('coluna');
        const valor = interaction.options.getString('valor');        let v;
        let va = '';
        try {
            v = await svcClient.users.fetch(id);
            va = 'user_id'
        } catch (error) {
            reportError(error, 'command.addvar.user_lookup', { id });
            v = svcClient.guilds.cache.get(id);
            va = 'server_id'
        }
		const embed = new svcDiscord.MessageEmbed()
        try {
            await DatabaseManager.setIfNotExists(v.id, tabela, va);

            const before = (await DatabaseManager.findMany(tabela, { [va]: v.id }))[0];
            await DatabaseManager.increment(v.id, tabela, coluna, eval(valor), va)
            const after = (await DatabaseManager.findMany(tabela, { [va]: v.id }))[0];

            embed.setDescription(`✅ Dados de ${v} atualizados! ${before[coluna]} -> ${after[coluna]}`)

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
