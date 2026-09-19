const Discord = require('discord.js');
const imagesService = require('../../_classes/services/images');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const errorContainer = (interaction, message) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}`));
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('link').setDescription('Coloque um link de uma imagem para background').setRequired(true))

const prisma = require('../../_classes/prisma');

module.exports = {
  name: 'background',
  category: 'Social',
  description: 'Muda a imagem de fundo no seu perfil',
  data,
  mastery: 7,
	async execute(interaction) {

        
        let bglink = interaction.options.getString('link');

        let bg 
        
        try {
          bg = await imagesService.loadImage(bglink);
        } catch (error) {
          await interaction.reply({ components: [errorContainer(interaction, `O link que você enviou não é de uma imagem! Por favor coloque uma imagem upada.`)], flags: Discord.MessageFlags.IsComponentsV2 })
          return;
        }

        if(bg.width * bg.height * 4 > 32000000) {
          await interaction.reply({ components: [errorContainer(interaction, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(bg.width * bg.height * 4/10000000).toFixed(1)}/3 MB**`)], flags: Discord.MessageFlags.IsComponentsV2 })
          return;
        }

        const user_id = BigInt(interaction.user.id)
        await prisma.players.upsert({ where: { user_id }, update: { bglink }, create: { user_id, bglink, frames: [], badges: [] } })

        const container = new ContainerBuilder()
            .setAccentColor(0x8adb5e)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('Seu background foi definido para:'))
            .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bglink)));
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

        const container2 = new ContainerBuilder()
            .setAccentColor(0x8adb5e)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Background de \`${interaction.user.tag} | ${interaction.user.id}\``))
            .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bglink)));
        try{
            await clientService.current.channels.cache.get('736383144499871765').send({ components: [container2], flags: Discord.MessageFlags.IsComponentsV2 });
        } catch (error) {
            reportError(error, 'command.background.publish', { userId: interaction.user.id });
        }

	}
};
