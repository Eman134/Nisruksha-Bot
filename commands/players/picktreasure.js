module.exports = {
    name: 'pegartesouro',
    aliases: ['picktreasure'],
    category: 'Players',
    description: 'Faça uma escavação na sua vila atual e tente encontrar tesouros',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        let townnum = await API.townExtension.getTownNum(msg.author);

        if (parseInt(API.events.treasure.loc) != parseInt(townnum) || API.events.treasure.picked) {
            API.sendError(msg, `Não possui nenhum tesouro não explorado na sua vila atual!\nUtilize \`${API.prefix}mapa\` para achar algum tesouro em outras vilas\nOBS: Os alertas de novos tesouros são feitos no servidor oficial do Nisruksha (\`${API.prefix}convidar\`)`)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'digging')) {
            API.sendError(msg, `Você já encontra-se escavando um tesouro no momento! [[VER ESCAVAÇÃO]](${API.cacheLists.waiting.getLink(msg.author, 'digging')})`)
            return;
        }
        
        let obj6 = await API.getInfo(msg.author, "machines");

        let prof = 0
        const init = Date.now()

        function getProgress() {
            const prof2 = API.events.treasure.profundidade

            return API.getProgress(8, '<:escav:807999848196079646>', '<:energyempty:741675234796503041>', prof > prof2 ? prof2 : prof, prof2, true);
        }
        
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`🔎 Procurando tesouro`);
        embed.setDescription(`Escavador: ${msg.author}`);
        embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`)
        embed.setFooter(`Reaja com 🔴 para parar a escavação\nTempo de atualização: ${API.events.treasure.update} segundos\nTempo escavando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        let embedmsg
        try {
            embedmsg = await msg.quote(embed).then((ems) => embedmsg = ems).catch();
        } catch {}
        embedmsg.react('🔴')        

        API.cacheLists.waiting.add(msg.author, embedmsg, 'digging');

        const filter = (reaction, user) => {
            return reaction.emoji.name === '🔴' && user.id === msg.author.id;
        };

        async function edit() {

            try{

                prof += API.random(0, 6)

                let xp = API.random(5, 20);
                API.playerUtils.execExp(msg, xp);
                
                embed.fields = [];
                const obj6 = await API.getInfo(msg.author, "machines");

                let stop = false

                if (API.events.treasure.picked) {
                    embed.setTitle(`❌ Tesouro não encontrado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ❌ Parece que alguém o pegou antes!`)
                    embed.setFooter(`Tempo escavando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    stop = true
                } else if (prof >= API.events.treasure.profundidade && API.events.treasure.picked == false) {
                    API.events.treasure.picked = true
                    stop = true
                    embed.setTitle(`✅ Tesouro coletado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ✅ Tesouro coletado com sucesso! (Utilize \`${API.prefix}mochila\`)`)
                    embed.setFooter(`Tempo escavando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    API.crateExtension.give(msg.author, 3, 1)
                    const channel = API.client.channels.cache.get(API.events.getConfig().events.channel)
                    channel.bulkDelete(100).catch()
                } else if (prof < API.events.treasure.profundidade){
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`)
                    embed.setFooter(`Reaja com 🔴 para parar a escavação\nTempo de atualização: ${API.events.treasure.update} segundos\nTempo escavando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                }
                

                try{
                    await embedmsg.edit({embed, allowedMentions: {"parse": []}}).catch()
                }catch{
                    API.cacheLists.waiting.remove(msg.author, 'digging');
                    return
                }

                if (stop) {
                    console.log('Stopped')
                    API.cacheLists.waiting.remove(msg.author, 'digging');
                    return embedmsg.reactions.removeAll();
                }

                let reacted = false
                const collector = embedmsg.createReactionCollector(filter, { time: API.events.treasure.update*1000 });

                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name == '🔴') {
                        reacted = true;
                        collector.stop();
                        API.cacheLists.waiting.remove(msg.author,  'digging');
                    }
                });

                collector.on('end', collected => {
                    if (reacted) {
                        embedmsg.reactions.removeAll();
                        API.sendError(msg, `Você parou a escavação!`)
                        API.cacheLists.waiting.remove(msg.author, 'digging');
                    } else {edit();}
                });
            }catch (err){
                client.emit('error', err)
            }
        }
        edit();
	}
};