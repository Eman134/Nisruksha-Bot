module.exports = {
    name: 'sugerir',
    aliases: ['sugestao', 'sugestão', 'sugest', 'sug'],
    category: 'Outros',
    description: 'Faça uma sugestão de sistemas ou ideias para o bot',
    options: [{
      name: 'sugestão',
      type: 'STRING',
      description: 'Escreva uma sugestão para o bot',
      required: true,
    }],
    mastery: 20,
    async execute(API, msg) {

        let args = API.args(msg)
        const Discord = API.Discord;

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, 'Você precisa definir um texto explicando a sugestão', 'sugerir <texto>')
            await msg.quote(embedtemp)
            return;
        }
  
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${msg.author.tag} | ${msg.author.id}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Sugestão enviada com sucesso!
        \`\`\`${API.getMultipleArgs(msg, 1)}\`\`\``)
        
        await msg.quote(embed);

        const embed2 = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${msg.author.tag} | ${msg.author.id}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
        \`\`\`${API.getMultipleArgs(msg, 1)}\`\`\``)
        try{
            let msg2 = await API.client.channels.cache.get('693910939111653436').send(embed2);
            await msg2.react(`👍🏾`)
            await msg2.react(`👎🏾`)
        }catch{}
  
      }
  };