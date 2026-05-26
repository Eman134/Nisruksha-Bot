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
	async execute(API, interaction) {

        let istring = "```js\n"
        let middle = ""
        let fstring = "```"

        const selectedtable = interaction.options.getString('tabela')

        if (selectedtable != null) {
            
            // Code Review - Vulnerabilidade/CodeSmell: SQL Injection direto. Interpolar a variável `selectedtable` diretamente na string de consulta permite injeção de comandos SQL arbitrários. Recomenda-se o uso de queries parametrizadas.
            let res = await DatabaseManager.query(`SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '${selectedtable}');`);

            if (!res.rows[0].exists) {
                return interaction.reply({ content: 'Essa tabela não existe! Utilize `/seetables`'})
            }

            // Code Review - Vulnerabilidade/CodeSmell: SQL Injection direto na busca de colunas. Recomenda-se o uso de queries parametrizadas.
            let res2 = await DatabaseManager.query(`SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name   = '${selectedtable}';`);
        
            // Code Review - CodeSmell: A variável de loop 'xi' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
            for (xi = 0; xi < res2.rows.length; xi++) {

                middle += "|--" + res2.rows[xi].column_name + "\n"

            }
            await interaction.reply(istring + middle.slice(0, 1980) + fstring)
            return
        }

        let res = await DatabaseManager.query(`SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`);
        
        let tables = res.rows
        
        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
        for (i = 0; i < tables.length; i++) {
            middle += "|-" + tables[i].tablename + "\n"
        }

        await interaction.reply(istring + middle.slice(0, 1980) + fstring)

	}
};