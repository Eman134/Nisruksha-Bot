module.exports = {
    name: 'estamina',
    aliases: ['stamina', 'est', 'st'],
    category: 'Players',
    description: 'Visualiza as informações da sua estamina',
    mastery: 10,
	async execute(API, msg) {

        const Discord = API.Discord;

        let time = await API.maqExtension.stamina.time(msg.author)
        let staminamax = 1000;
        let stamina = await API.maqExtension.stamina.get(msg.author)
        let perm = await API.getPerm(msg.author);

		const embed = new Discord.MessageEmbed()
	    .setColor('#e06f0b')
        if (stamina < staminamax) embed.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\n**Reaja com ⏰ para ser relembrado quando sua estamina recarregar**\nOBS: A estamina não recupera enquanto estiver usando!`)
        else embed.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`, `Estamina já está completamente cheia!\nOBS: A estamina não recupera enquanto estiver usando!`)
        const embedmsg = await msg.quote(embed);
        if (stamina == staminamax) return;
        embedmsg.react('⏰')

        const filter = (reaction, user) => {
            return reaction.emoji.name === '⏰' && user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            reacted = true;
            const embed2 = new Discord.MessageEmbed()
            const e1 = await API.maqExtension.stamina.get(msg.author);
            const e2 = 1000
            const e3 = await API.maqExtension.stamina.time(msg.author);
            embed2.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${e1}/${e2}]**`, `Irá recuperar completamente em: \`${API.ms(e3)}\`\n**Você será relembrado quando sua estamina recarregar!**\nOBS: A estamina não recupera enquanto estiver usando!`)
            embed2.setColor('#42f569')
            embedmsg.edit(embed2);
            collector.stop();
            if (API.cacheLists.remember.includes(msg.author, "estamina")) return;
            API.cacheLists.remember.add(msg.author, msg.channel.id, "estamina");
            async function rem(){
                if (await API.maqExtension.stamina.get(msg.author) >= 1000) {
                 await msg.quote({ content: `Relatório de estamina: ${await API.maqExtension.stamina.get(msg.author)}/1000`, mention: true})
                    API.cacheLists.remember.remove(msg.author, "estamina")
                    return;
                } else {
                    setTimeout(function(){rem()}, await API.maqExtension.stamina.time(msg.author)+1000)
                }
            }  
            rem();
        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            let time = await API.maqExtension.stamina.time(msg.author);
            let st = await API.maqExtension.stamina.get(msg.author);
            embed.fields = []
            embed.setColor('#e06f0b')
            embed.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${st}/${1000}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\nOBS: A estamina não recupera enquanto estiver usando!`)
            embedmsg.edit({ embed });
        });

	}
};