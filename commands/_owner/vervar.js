const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

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
        } catch (error) {
            reportError(error, 'command.vervar.user_lookup', { id });
            v = client.guilds.cache.get(id);
            va = 'server_id'
        }

        if (!v)  {
            return interaction.reply({ content: 'id undefined' })
        }

		const embed = new Discord.MessageEmbed()
        try {

            const row = (await DatabaseManager.findMany(tabela, { [va]: v.id }))[0];
            const serialized = JSON.stringify(row, null, '\t');
            embed.setDescription(`✅ Dados de ${v} em \`${tabela}\`\n\`\`\`js\n${serialized.slice(0, 1500)}\`\`\``)
            .setColor('#32a893')

            if (serialized.length > 1500) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(1500, 2300)}\`\`\``)
            }
            if (serialized.length > 2300) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(2300, 3000)}\`\`\``)
            }
            if (serialized.length > 3000) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(3000, 3800)}\`\`\``)
            }
            if (serialized.length > 3800) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(3800, 4500)}\`\`\``)
            }
            if (serialized.length > 4500) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(4500, 5300)}\`\`\``)
            }
            if (serialized.length > 5300) {
                embed.addField('.', `\n\`\`\`js\n${serialized.slice(5300, 6100)}\`\`\``)
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
