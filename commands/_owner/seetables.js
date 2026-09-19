const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

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
            const tables = await DatabaseManager.tableNames();
            if (!tables.includes(selectedtable.toLowerCase())) {
                return interaction.reply({ content: 'Essa tabela não existe! Utilize `/seetables`'})
            }

            const columns = await DatabaseManager.columns(selectedtable.toLowerCase());
            for (const column of columns) {
                middle += "|--" + column + "\n"

            }
            await interaction.reply(istring + middle.slice(0, 1980) + fstring)
            return
        }

        const tables = await DatabaseManager.tableNames();
        for (const table of tables) {
            middle += "|-" + table + "\n"
        }

        await interaction.reply(istring + middle.slice(0, 1980) + fstring)

	}
};
