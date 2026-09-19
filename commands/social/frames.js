const Database = require('../../_classes/manager/DatabaseManager');
const { reportError } = require('../../_classes/debug');
const DatabaseManager = new Database();

module.exports = {
    name: 'molduras',
    aliases: ["frames"],
    category: 'Social',
    description: 'Faça a escolha da moldura que será apresentada em seu perfil',
    mastery: 2,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        const obj = await DatabaseManager.get(interaction.user.id, "players")

        let frames = obj.frames

        if (frames == null || frames.length == 0) {
            const embedtemp = await API.sendError(interaction, 'Você não possui molduras disponíveis para serem apresentadas.')
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        frames = frames.filter((i) => i != '0')

        const total = frames.length
        let current = 1

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "molduras");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'molduras', 'visualizar suas molduras')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "molduras", 30);

        let btn1 = API.createButton('sBtn', 'SECONDARY', 'Equipar', '✅')
        let btn2 = API.createButton('nBtn', 'SECONDARY', 'Desequipar', '❌')
        let btn3 = API.createButton('b1Btn', 'PRIMARY', '', '⏪')
        let btn4 = API.createButton('b0Btn', 'SECONDARY', '', '852241487064596540')
        let btn5 = API.createButton('f0Btn', 'SECONDARY', '', '737370913204600853')
        let btn6 = API.createButton('f1Btn', 'PRIMARY', '', '⏩')

        if (total < 2) {
            btn3.setDisabled()
            btn4.setDisabled()
            btn5.setDisabled()
            btn6.setDisabled()
        }

        if (current == 1 && total > 1) {
            btn3.setDisabled()
            btn4.setDisabled()
            btn5.setDisabled(false)
            btn6.setDisabled(false)
        }

        btnRow0 = API.rowComponents([btn1, btn2])
        btnRow1 = API.rowComponents([btn3, btn4, btn5, btn6])
        
		const embed = new Discord.MessageEmbed()
        .setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + API.frames.get(frames[0]).name)
        .setImage(API.frames.get(frames[0]).url)
        .setColor('#60ced6')
        
        const embedinteraction = await interaction.reply({ embeds: [embed], components: [ btnRow0, btnRow1 ], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.molduras.defer_update'); });
            collector.resetTimer();

            API.playerUtils.cooldown.set(interaction.user.id, "molduras", 30);

            if (b.customId == 'f0Btn'){
                if (current < total) current += 1;
            } if (b.customId == 'b0Btn'){
                if (current > 1) current -= 1;
            }

            if (b.customId == 'f1Btn'){
                current = total;
            } if (b.customId == 'b1Btn'){
                current = 1;
            }

            if (current == 1) {
                btn3.setDisabled()
                btn4.setDisabled()
                btn5.setDisabled(false)
                btn6.setDisabled(false)
            } else if (current == total) {
                btn3.setDisabled(false)
                btn4.setDisabled(false)
                btn5.setDisabled()
                btn6.setDisabled()
            } else {
                btn3.setDisabled(false)
                btn4.setDisabled(false)
                btn5.setDisabled(false)
                btn6.setDisabled(false)
            }

            btnRow0 = API.rowComponents([btn1, btn2])
            btnRow1 = API.rowComponents([btn3, btn4, btn5, btn6])

            const frame = API.frames.get(frames[current-1])

            embed.setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + frame.name)

            if (b.customId == 'nBtn') {
                
                API.frames.reforge(interaction.user.id, 0)

                embed.setColor('#a60000');
                embed.setDescription('❌ Moldura desequipada')
                embed.setImage(API.frames.get(frames[0]).url)
                await interaction.editReply({ embeds: [embed], components: [] });

                return collector.stop();

            } else if (b.customId == 'sBtn'){

                API.frames.reforge(interaction.user.id, frame.id)

                embed.setColor('#5bff45');
                embed.setDescription('✅ Moldura equipada')
                embed.setImage(frame.url)
                await interaction.editReply({ embeds: [embed], components: [] });
                
                return collector.stop();

            } else {
                
                embed.setImage(frame.url)
                await interaction.editReply({ embeds: [embed], components: [ btnRow0, btnRow1] });

            }
            
        });
        
        collector.on('end', b => {

            API.playerUtils.cooldown.set(interaction.user.id, "molduras", 0);

        });

	}
};
