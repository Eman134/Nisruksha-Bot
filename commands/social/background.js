const Discord = require('discord.js');
const imagesService = require('../../_classes/services/images');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
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
          const embedtemp = await utility.sendError(interaction, `O link que você enviou não é de uma imagem! Por favor coloque uma imagem upada.`)
          await interaction.reply({ embeds: [embedtemp]})
          return;
        }

        if(bg.width * bg.height * 4 > 32000000) {
          const embedtemp = await utility.sendError(interaction, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(bg.width * bg.height * 4/10000000).toFixed(1)}/3 MB**`)
          await interaction.reply({ embeds: [embedtemp]})
          return;
        }

        const user_id = BigInt(interaction.user.id)
        await prisma.players.upsert({ where: { user_id }, update: { bglink }, create: { user_id, bglink, frames: [], badges: [] } })

        const embed = new Discord.EmbedBuilder()
        .setColor('#8adb5e')
        .setDescription(`Seu background foi definido para:`)
        .setImage(bglink);
        await interaction.reply({ embeds: [embed] });

        const embed2 = new Discord.EmbedBuilder()
        .setColor('#8adb5e')
        .setDescription(`Background de \`${interaction.user.tag} | ${interaction.user.id}\``)
        .setImage(bglink);
        try{
            await clientService.current.channels.cache.get('736383144499871765').send({ embeds: [embed2] });
        } catch (error) {
            reportError(error, 'command.background.publish', { userId: interaction.user.id });
        }

	}
};
