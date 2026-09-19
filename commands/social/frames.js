const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const framesService = require('../../_classes/services/frames');
const { reportError } = require('../../_classes/debug');
const prisma = require('../../_classes/prisma');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder } = require('@discordjs/builders');
const errorContainer = (interaction, message) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`));

module.exports = {
    name: 'molduras',
    aliases: ["frames"],
    category: 'Social',
    description: 'Faça a escolha da moldura que será apresentada em seu perfil',
    mastery: 2,
	async execute(interaction) {

                
        const user_id = BigInt(interaction.user.id)
        const obj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        let frames = obj.frames

        if (frames == null || frames.length == 0) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você não possui molduras disponíveis para serem apresentadas.')], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        frames = frames.filter((i) => i != '0')

        const total = frames.length
        let current = 1

        const check = await playersService.cooldown.check(interaction.user.id, "molduras");
        if (check) {

            playersService.cooldown.message(interaction, 'molduras', 'visualizar suas molduras')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "molduras", 30);

        let btn1 = utility.createButton('sBtn', 'SECONDARY', 'Equipar', '✅')
        let btn2 = utility.createButton('nBtn', 'SECONDARY', 'Desequipar', '❌')
        let btn3 = utility.createButton('b1Btn', 'PRIMARY', '', '⏪')
        let btn4 = utility.createButton('b0Btn', 'SECONDARY', '', '852241487064596540')
        let btn5 = utility.createButton('f0Btn', 'SECONDARY', '', '737370913204600853')
        let btn6 = utility.createButton('f1Btn', 'PRIMARY', '', '⏩')

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

        btnRow0 = new ActionRowBuilder().addComponents(btn1, btn2)
        btnRow1 = new ActionRowBuilder().addComponents(btn3, btn4, btn5, btn6)
        
        let frameColor = 0x60ced6;
        let frameDescription = '';
        const buildFrameContainer = frame => new ContainerBuilder()
            .setAccentColor(frameColor)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🖼 Moldura ${current}/${total} | ${frame.name}${frameDescription ? `\n${frameDescription}` : ''}`))
            .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(frame.url)));
        
        const initialFrame = await framesService.get(frames[0]);
        const embedinteraction = (await interaction.reply({ components: [buildFrameContainer(initialFrame), btnRow0, btnRow1], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.molduras.defer_update'); });
            collector.resetTimer();

            playersService.cooldown.set(interaction.user.id, "molduras", 30);

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

            btnRow0 = new ActionRowBuilder().addComponents(btn1, btn2)
            btnRow1 = new ActionRowBuilder().addComponents(btn3, btn4, btn5, btn6)

            const frame = await framesService.get(frames[current-1])

            if (b.customId == 'nBtn') {
                
                framesService.reforge(interaction.user.id, 0)

                frameColor = 0xa60000;
                frameDescription = '❌ Moldura desequipada';
                await interaction.editReply({ components: [buildFrameContainer(await framesService.get(frames[0]))], flags: Discord.MessageFlags.IsComponentsV2 });

                return collector.stop();

            } else if (b.customId == 'sBtn'){

                framesService.reforge(interaction.user.id, frame.id)

                frameColor = 0x5bff45;
                frameDescription = '✅ Moldura equipada';
                await interaction.editReply({ components: [buildFrameContainer(frame)], flags: Discord.MessageFlags.IsComponentsV2 });
                
                return collector.stop();

            } else {
                
                frameColor = 0x60ced6;
                frameDescription = '';
                await interaction.editReply({ components: [buildFrameContainer(frame), btnRow0, btnRow1], flags: Discord.MessageFlags.IsComponentsV2 });

            }
            
        });
        
        collector.on('end', b => {

            playersService.cooldown.set(interaction.user.id, "molduras", 0);

        });

	}
};
