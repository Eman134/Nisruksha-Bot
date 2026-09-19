const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('sugestão').setDescription('Escreva uma sugestão para o bot').setRequired(true))

module.exports = {
    requiredServices: ["Discord","client","maqExtension","sendError","shopExtension"],
    name: 'sugerir',
    aliases: ['sugestao', 'sugestão', 'sugest', 'sug'],
    category: 'Outros',
    description: 'Faça uma sugestão de sistemas ou ideias para o bot',
    data,
    mastery: 20,
    async execute(interaction, svcDiscord, svcClient, svcMaqExtension, svcSendError, svcShopExtension) {
        const sugestão = interaction.options.getString('sugestão')

        let cmaq = await svcMaqExtension.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await svcSendError(interaction, `Você precisa ter no mínimo a ${svcShopExtension.getProduct(102).icon} ${svcShopExtension.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
  
        const embed = new svcDiscord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${interaction.user.tag} | ${interaction.user.id}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Sugestão enviada com sucesso!
        \`\`\`${sugestão}\`\`\`[Entre em meu servidor para visualizar a resposta da sugestão](https://bit.ly/svnisru)`)
        
        await interaction.reply({ embeds: [embed] });

        const embed2 = new svcDiscord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${interaction.user.tag} | ${interaction.user.id}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
        \`\`\`${sugestão}\`\`\``)
        try{
            let interaction2 = await svcClient.channels.cache.get('693910939111653436').send({ embeds: [embed2] });
            await interaction2.react(`👍`)
            await interaction2.react(`👎`)
        } catch (error) {
            reportError(error, 'command.sugerir.publish', { userId: interaction.user.id });
        }
  
      }
  };
