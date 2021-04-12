module.exports = {
    name: 'energia',
    aliases: ['energy', 'e'],
    category: 'Maquinas',
    description: 'Visualiza a energia da sua máquina',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let time = await API.maqExtension.getEnergyTime(msg.author)
        let energiamax = await API.maqExtension.getEnergyMax(msg.author)
        let energia = await API.maqExtension.getEnergy(msg.author)
        let perm = await API.getPerm(msg.author);
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        if (energia < energiamax) embed.addField(`🔋 Energia de \`${msg.author.tag}\`: **[${energia}/${energiamax}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\n**Reaja com ⏰ para ser relembrado quando sua energia recarregar**\nOBS: A energia não recupera enquanto estiver usando!`)
        else embed.addField(`🔋 Energia de \`${msg.author.tag}\`: **[${energia}/${energiamax}]**`, `Energia já está completamente cheia! Utilize \`${API.prefix}minerar\`\nOBS: A energia não recupera enquanto estiver usando!`)
        
        embed.setFooter(`1 ponto de energia recupera a cada ${API.maqExtension.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
        
        const embedmsg = await msg.quote(embed);
        if (energia == energiamax) return;
        embedmsg.react('⏰')

        const filter = (reaction, user) => {
            return reaction.emoji.name === '⏰' && user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 20000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            reacted = true;
            const embed2 = new Discord.MessageEmbed()
            const e1 = await API.maqExtension.getEnergy(msg.author);
            const e2 = await API.maqExtension.getEnergyMax(msg.author);
            const e3 = await API.maqExtension.getEnergyTime(msg.author);
            
            perm = await API.getPerm(msg.author);
            
            embed2.addField(`🔋 Energia de \`${msg.author.tag}\`: **[${e1}/${e2}]**`, `Irá recuperar completamente em: \`${API.ms(e3)}\`\n**Você será relembrado quando sua energia recarregar!**\nOBS: A energia não recupera enquanto estiver usando!`)
            embed2.setColor('#42f569')
            embed2.setFooter(`1 ponto de energia recupera a cada ${API.maqExtension.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            
            embedmsg.edit(embed2);
            collector.stop();

            if (API.cacheLists.rememberenergy.includes(msg.author.id)) return;
            API.cacheLists.rememberenergy.push(msg.author.id);
            async function rem(){
                if (await API.maqExtension.getEnergy(msg.author) >= await API.maqExtension.getEnergyMax(msg.author)) {
                    msg.quote({ content: `Relatório de energia: ${await API.maqExtension.getEnergy(msg.author)}/${await API.maqExtension.getEnergyMax(msg.author)}`, mention: true})
                    if (API.cacheLists.rememberenergy.includes(msg.author.id)) {
                        const index = API.cacheLists.rememberenergy.indexOf(msg.author.id);
                        //API.updateBotInfo();
                        if (index > -1) {
                            API.cacheLists.rememberenergy.splice(index, 1);
                        }
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
            let time = await API.maqExtension.getEnergyTime(msg.author);
            perm = await API.getPerm(msg.author);
            embed.fields = []
            embed.setColor('#32a893')
            embed.addField(`🔋 Energia de \`${msg.author.tag}\`: **[${energia}/${energiamax}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\nOBS: A energia não recupera enquanto estiver usando!`)
            embed.setFooter(`1 ponto de energia recupera a cada ${API.maqExtension.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            embedmsg.edit(embed);
        });

	}
};