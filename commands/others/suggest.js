const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('sugestão').setDescription('Escreva uma sugestão para o bot').setRequired(true))

module.exports = {
    name: 'sugerir',
    aliases: ['sugestao', 'sugestão', 'sugest', 'sug'],
    category: 'Outros',
    description: 'Faça uma sugestão de sistemas ou ideias para o bot',
    data,
    mastery: 20,
    async execute(API, interaction) {

        const Discord = API.Discord;

        const sugestão = interaction.options.getString('sugestão')

        let cmaq = await API.maqExtension.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await API.sendError(interaction, `Você precisa ter no mínimo a ${API.shopExtension.getProduct(102).icon} ${API.shopExtension.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
  
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${interaction.user.tag} | ${interaction.user.id}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Sugestão enviada com sucesso!
        \`\`\`${sugestão}\`\`\`[Entre em meu servidor para visualizar a resposta da sugestão](https://bit.ly/svnisru)`)
        
        await interaction.reply({ embeds: [embed] });

        const embed2 = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${interaction.user.tag} | ${interaction.user.id}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
        \`\`\`${sugestão}\`\`\``)
        try{
            let interaction2 = await API.client.channels.cache.get('693910939111653436').send({ embeds: [embed2] });
            await interaction2.react(`👍`)
            await interaction2.react(`👎`)
        }catch{}
  
      }
  };