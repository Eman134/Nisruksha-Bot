module.exports = {
    name: 'sugerir',
    aliases: ['sugestao', 'sugestão', 'sugest', 'sug'],
    category: 'Outros',
    description: 'Faça uma sugestão de sistemas ou ideias para o bot',
      async execute(API, msg) {
  
        const boolean = await API.checkAll(msg);
        if (boolean) return;
        let args = API.args(msg)
        const Discord = API.Discord;

        if (args.length == 0) {
            API.sendError(msg, 'Você precisa definir um texto explicando a sugestão', 'sugerir <texto>')
            return;
        }
  
        const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${msg.author.tag} | ${msg.author.id}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Sugestão enviada com sucesso!
        \`\`\`${API.getMultipleArgs(msg, 1)}\`\`\``)
        msg.quote(embed);

        const embed2 = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(`${msg.author.tag} | ${msg.author.id}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`🔴 Negada | 🟠 Em análise | 🟢 Aceita | 🟣 Existente/planejada | ⚫ Ignorada
        \`\`\`${API.getMultipleArgs(msg, 1)}\`\`\``)
        try{
            let msg2 = await API.client.guilds.cache.get('693150851396796446').channels.cache.get('693910939111653436').send(embed2);
            msg2.react(`👍🏾`)
            msg2.react(`👎🏾`)
        }catch{}
  
      }
  };