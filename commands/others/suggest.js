const Discord = require('discord.js');
const machinesService = require('../../_classes/services/machines');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const shopService = require('../../_classes/services/shop');
const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
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
            const product = await shopService.getProduct(102);
            const errorContainer = new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nVocê precisa ter no mínimo a ${product.icon} ${product.name} para dar rep á alguém!`));
            await interaction.reply({ components: [errorContainer], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }
  
        const container = new ContainerBuilder()
         .setAccentColor(Math.floor(Math.random() * 0xffffff))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${interaction.user.tag} | ${interaction.user.id}**\nSugestão enviada com sucesso!
         \`\`\`${sugestão}\`\`\`[Entre em meu servidor para visualizar a resposta da sugestão](https://bit.ly/svnisru)`));
        
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

        const container2 = new ContainerBuilder()
         .setAccentColor(Math.floor(Math.random() * 0xffffff))
         .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${interaction.user.tag} | ${interaction.user.id}**\n🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
         \`\`\`${sugestão}\`\`\``));
        try{
            let interaction2 = await clientService.current.channels.cache.get('693910939111653436').send({ components: [container2], flags: Discord.MessageFlags.IsComponentsV2 });
            await interaction2.react(`👍`)
            await interaction2.react(`👎`)
        } catch (error) {
            reportError(error, 'command.sugerir.publish', { userId: interaction.user.id });
        }
  
      }
  };
