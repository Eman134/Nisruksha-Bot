const Discord = require('discord.js');
const machinesService = require('../../_classes/services/machines');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const shopService = require('../../_classes/services/shop');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('sugestão').setDescription('Escreva uma sugestão para o bot').setRequired(true))

module.exports = {
    name: 'sugerir',
    aliases: ['sugestao', 'sugestão', 'sugest', 'sug'],
    category: 'Outros',
    description: 'Faça uma sugestão de sistemas ou ideias para o bot',
    data,
    mastery: 20,
    async execute(interaction) {

        
        const sugestão = interaction.options.getString('sugestão')

        let cmaq = await machinesService.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await utility.sendError(interaction, `Você precisa ter no mínimo a ${shopService.getProduct(102).icon} ${shopService.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
  
        const embed = new Discord.EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xffffff))
        .setAuthor({ name: `${interaction.user.tag} | ${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        .setDescription(`Sugestão enviada com sucesso!
        \`\`\`${sugestão}\`\`\`[Entre em meu servidor para visualizar a resposta da sugestão](https://bit.ly/svnisru)`)
        
        await interaction.reply({ embeds: [embed] });

        const embed2 = new Discord.EmbedBuilder()
        .setColor(Math.floor(Math.random() * 0xffffff))
        .setAuthor({ name: `${interaction.user.tag} | ${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
        .setDescription(`🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
        \`\`\`${sugestão}\`\`\``)
        try{
            let interaction2 = await clientService.current.channels.cache.get('693910939111653436').send({ embeds: [embed2] });
            await interaction2.react(`👍`)
            await interaction2.react(`👎`)
        } catch (error) {
            reportError(error, 'command.sugerir.publish', { userId: interaction.user.id });
        }
  
      }
  };
