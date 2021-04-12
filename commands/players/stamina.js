module.exports = {
    name: 'estamina',
    aliases: ['stamina', 'est', 'st'],
    category: 'Players',
    description: 'Visualiza as informações da sua estamina',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let time = await API.maqExtension.stamina.time(msg.author)
        let staminamax = 1000;
        let stamina = await API.maqExtension.stamina.get(msg.author)
        let perm = await API.getPerm(msg.author);

		const embed = new Discord.MessageEmbed()
	    .setColor('#e06f0b')
        if (stamina < staminamax) embed.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\n**Reaja com ⏰ para ser relembrado quando sua estamina recarregar**\nOBS: A estamina não recupera enquanto estiver usando!`)
        else embed.addField(`🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${staminamax}]**`, `Estamina já está completamente cheia!\nOBS: A estamina não recupera enquanto estiver usando!`)
        //embed.setFooter(`1 ponto de estamina recupera a cada ${API.maqExtension.recoverstamina[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
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
            //embed2.setFooter(`1 ponto de estamina recupera a cada ${API.maqExtension.recoverstamina[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            embedmsg.edit(embed2);
            if (API.cacheLists.rememberstamina.includes(msg.author.id)) return;
            API.cacheLists.rememberstamina.push(msg.author.id);
            collector.stop();
           // API.updateBotInfo();
            async function rem(){
                if (await API.maqExtension.stamina.get(msg.author) >= 1000) {
                    msg.quote({ content: `Relatório de estamina: ${await API.maqExtension.stamina.get(msg.author)}/1000`, mention: true})
                    const index = API.cacheLists.rememberstamina.indexOf(msg.author.id);
                    //API.updateBotInfo();
                    if (index > -1) {
                        API.cacheLists.rememberstamina.splice(index, 1);
                    }
                    return;
                } else {
                    setTimeout(function(){rem()}, await API.maqExtension.getEnergyTime(msg.author)+1000)
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
            //embed.setFooter(`1 ponto de estamina recupera a cada ${API.maqExtension.recoverstamina[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            embedmsg.edit(embed);
        });

	}
};