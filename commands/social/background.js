const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('link').setDescription('Coloque um link de uma imagem para background').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
  name: 'background',
  category: 'Social',
  description: 'Muda a imagem de fundo no seu perfil',
  data,
  mastery: 7,
	async execute(API, interaction) {

        const Discord = API.Discord;

        let bglink = interaction.options.getString('link');

        let bg 
        
        try {
          bg = await API.img.Canvas.loadImage(bglink);
        } catch (error) {
          const embedtemp = await API.sendError(interaction, `O link que você enviou não é de uma imagem! Por favor coloque uma imagem upada.`)
          await interaction.reply({ embeds: [embedtemp]})
          return;
        }

        if(bg.width * bg.height * 4 > 32000000) {
          const embedtemp = await API.sendError(interaction, `A imagem que você enviou é muito pesada! Por favor envie uma imagem mais leve.\nTamanho do arquivo: **${(bg.width * bg.height * 4/10000000).toFixed(1)}/3 MB**`)
          await interaction.reply({ embeds: [embedtemp]})
          return;
        }

        DatabaseManager.set(interaction.user.id, 'players', 'bglink', bglink)

        const embed = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Seu background foi definido para:`)
        .setImage(bglink);
        await interaction.reply({ embeds: [embed] });

        const embed2 = new Discord.MessageEmbed()
        .setColor('#8adb5e')
        .setDescription(`Background de \`${interaction.user.tag} | ${interaction.user.id}\``)
        .setImage(bglink);
        try{
            await API.client.channels.cache.get('736383144499871765').send({ embeds: [embed2] });
        }catch{

        }

	}
};