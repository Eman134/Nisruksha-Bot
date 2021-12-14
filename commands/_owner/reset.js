const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('tabela').setDescription('Selecione uma tabela').setRequired(true))

module.exports = {
    name: 'reset',
    aliases: ['resetar'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    data,
    perm: 5,
	async execute(API, interaction) {

        const tabela = interaction.options.getString('tabela');
		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reset de ' + tabela)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            embed.fields = [];
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reset cancelado', `
                Você cancelou o reset de ` + tabela)
                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (tabela.toLowerCase() == 'all') {
            
                let text1 = `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
    
                try {
    
                    const res = await DatabaseManager.query(text1);
    
                    for (const r of res.rows) {
                        let text = `DELETE FROM ${r.table_name};`;
                        await DatabaseManager.query(text);
                    }
    
                    embed.setDescription(`✅ Todos os dados foram resetados!`)
                    embed.setColor('#32a893');
    
                } catch (e) {
                    embed.setDescription(`❌ Houve um erro ao tentar resetar todos os dados`)
                    embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
                    embed.setColor('#eb4034')
                } finally {
                    await interaction.editReply({ embeds: [embed] });
                }
    
            } else {
                let text1 = `DELETE FROM ${tabela.toLowerCase()};`;
    
                try {
    
                    await DatabaseManager.query(text1);
    
                    embed.setDescription(`✅ Dados da tabela \`${tabela.toLowerCase()}\` foram resetados!`)
                    embed.setColor('#32a893');
    
                } catch (e) {
                    embed.setDescription(`❌ Houve um erro ao tentar resetar os dados de \`${tabela.toLowerCase()}\``)
                    embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
                    embed.setColor('#eb4034')
                } finally {
                    await interaction.editReply({ embeds: [embed] });
                }
            }

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar ${tabela}, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed] });
            return;
        });

	}
};