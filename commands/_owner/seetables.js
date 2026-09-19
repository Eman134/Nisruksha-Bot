const prisma = require('../../_classes/prisma');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela para ver as colunas').setRequired(false))

module.exports = {
    name: 'seetables',
    aliases: ['vertables', 'seetabelas', 'seecolumns', 'vercolunas'],
    category: 'none',
    description: 'Liste as tabelas e colunas do banco de dados',
    data,
    perm: 5,
	async execute(interaction) {

        let istring = "```js\n"
        let middle = ""
        let fstring = "```"

        const selectedtable = interaction.options.getString('tabela')

        if (selectedtable != null) {
            const tables = ['players', 'servers', 'globals', 'storage', 'players_utils', 'machines', 'cooldowns', 'companies', 'towns', 'site'];
            if (!tables.includes(selectedtable.toLowerCase())) {
                return interaction.reply({ content: 'Essa tabela não existe! Utilize `/seetables`'})
            }

            const columns = prisma._runtimeDataModel.models[selectedtable.toLowerCase()].fields.map((field) => field.name);
            for (const column of columns) {
                middle += "|--" + column + "\n"

            }
            await interaction.reply(istring + middle.slice(0, 1980) + fstring)
            return
        }

        const tables = ['players', 'servers', 'globals', 'storage', 'players_utils', 'machines', 'cooldowns', 'companies', 'towns', 'site'];
        for (const table of tables) {
            middle += "|-" + table + "\n"
        }

        await interaction.reply(istring + middle.slice(0, 1980) + fstring)

	}
};
