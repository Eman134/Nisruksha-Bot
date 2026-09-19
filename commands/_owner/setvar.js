const Discord = require('../../_classes/discordCompat');
const clientService = require('../../_classes/services/clientService');
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
    name: 'setvar',
    aliases: ['svar'],
    category: 'none',
    description: 'Seta uma variável e um valor no banco de dados',
    data,
    perm: 5,
	async execute(interaction) {

        const id = interaction.options.getString('id');
        const tabela = interaction.options.getString('tabela');
        const coluna = interaction.options.getString('coluna');
        const valor = interaction.options.getString('valor');

		                const embed = new Discord.MessageEmbed()
        let v;
        let va = '';
        try {
            v = await client.users.fetch(id);
            va = 'user_id'
        } catch (error) {
            reportError(error, 'command.setvar.user_lookup', { id });
            v = client.guilds.cache.get(id);
            va = 'server_id'
        }

        if (!v) {
            interaction.reply({ content: `id undefined` })
            return;
        }

        try {

            const evaluatedValue = eval(valor);
            await DatabaseManager.setIfNotExists(v.id, tabela, va);
            await DatabaseManager.set(v.id, tabela, coluna, evaluatedValue, va);

            embed.setDescription(`✅ Você setou o valor \`${evaluatedValue}\` para ${v} em \`${tabela}:${coluna}\``)
            embed.setColor('#32a893');

        } catch (e) {
            embed.setDescription(`❌ Houve um erro ao setar \`${valor}\` para ${v} em \`${tabela}:${coluna}\``)
            embed.addField('Erro:', `\`\`\`js\n${e}\`\`\``);
            embed.setColor('#eb4034')
        } finally {
            await interaction.reply({ embeds: [embed] });
        }

	}
};
