const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'resetscore',
    aliases: ['resetarscore'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    options: [],
    perm: 5,
	async execute(API, interaction) {

        const scoremin = 80

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reset de temporada')

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
                Você cancelou o reset de ` + args[0])
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let text0 = `SELECT * FROM players WHERE mastery > 0;`;
            let text1 = `UPDATE companies SET score = ${scoremin} WHERE score > ${scoremin};`;
            let text2 = `UPDATE players SET mastery = 0 WHERE mastery > 0;`;
    
            try {
    
                const res0 = await DatabaseManager.query(text0);

                async function addTp(user_id, mastery) {

                    try {
                        if (mastery <= 1000) return;
                        const finalmastery = mastery > 10000 ? mastery/10000 : 1
                        await API.eco.tp.add(user_id, finalmastery)
                        if (API.debug) console.log('add tp ' + finalmastery + ' to ' + user_id)
                    } catch (error) {
                        console.log(error)
                    }
                }
                
                res0.rows.forEach(async (row) => {
                    addTp(row.user_id, parseInt(row.mastery))
                });

                await DatabaseManager.query(text1);
                await DatabaseManager.query(text2);
    
                embed.setDescription(`✅ Temporada foi resetada!`)
                embed.setColor('#32a893');
    
            } catch (e) {
                embed.setDescription(`❌ Houve um erro ao tentar resetar os scores`)
                embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
                embed.setColor('#eb4034')
            } finally {
                await interaction.editReply({ embeds: [embed], components: []  });
            }
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar a temporada, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: []  });
            return;
        });

	}
};