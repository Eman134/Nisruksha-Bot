const Database = require('../../_classes/manager/DatabaseManager');
const { reportError } = require('../../_classes/debug');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["Discord","client","createButton","frames","playerUtils","rowComponents","sendError"],
    name: 'molduras',
    aliases: ["frames"],
    category: 'Social',
    description: 'Faça a escolha da moldura que será apresentada em seu perfil',
    mastery: 2,
	async execute(interaction, svcDiscord, svcClient, svcCreateButton, svcFrames, svcPlayerUtils, svcRowComponents, svcSendError) {
        const obj = await DatabaseManager.get(interaction.user.id, "players")

        let frames = obj.frames

        if (frames == null || frames.length == 0) {
            const embedtemp = await svcSendError(interaction, 'Você não possui molduras disponíveis para serem apresentadas.')
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        frames = frames.filter((i) => i != '0')

        const total = frames.length
        let current = 1

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "molduras");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'molduras', 'visualizar suas molduras')

            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "molduras", 30);

        let btn1 = svcCreateButton('sBtn', 'SECONDARY', 'Equipar', '✅')
        let btn2 = svcCreateButton('nBtn', 'SECONDARY', 'Desequipar', '❌')
        let btn3 = svcCreateButton('b1Btn', 'PRIMARY', '', '⏪')
        let btn4 = svcCreateButton('b0Btn', 'SECONDARY', '', '852241487064596540')
        let btn5 = svcCreateButton('f0Btn', 'SECONDARY', '', '737370913204600853')
        let btn6 = svcCreateButton('f1Btn', 'PRIMARY', '', '⏩')

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

        btnRow0 = svcRowComponents([btn1, btn2])
        btnRow1 = svcRowComponents([btn3, btn4, btn5, btn6])
        
		const embed = new svcDiscord.MessageEmbed()
        .setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + svcFrames.get(frames[0]).name)
        .setImage(svcFrames.get(frames[0]).url)
        .setColor('#60ced6')
        
        const embedinteraction = await interaction.reply({ embeds: [embed], components: [ btnRow0, btnRow1 ], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.molduras.defer_update'); });
            collector.resetTimer();

            svcPlayerUtils.cooldown.set(interaction.user.id, "molduras", 30);

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

            btnRow0 = svcRowComponents([btn1, btn2])
            btnRow1 = svcRowComponents([btn3, btn4, btn5, btn6])

            const frame = svcFrames.get(frames[current-1])

            embed.setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + frame.name)

            if (b.customId == 'nBtn') {
                
                svcFrames.reforge(interaction.user.id, 0)

                embed.setColor('#a60000');
                embed.setDescription('❌ Moldura desequipada')
                embed.setImage(svcFrames.get(frames[0]).url)
                await interaction.editReply({ embeds: [embed], components: [] });

                return collector.stop();

            } else if (b.customId == 'sBtn'){

                svcFrames.reforge(interaction.user.id, frame.id)

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

            svcPlayerUtils.cooldown.set(interaction.user.id, "molduras", 0);

        });

	}
};
