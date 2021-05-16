module.exports = {
    name: 'usaritem',
    aliases: ['useitem', 'uitem', 'usari'],
    category: 'Players',
    description: 'Faz o uso de um item usável da sua mochila',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        if (args.length == 0) {
            API.sendError(msg, `Você precisa identificar um item para uso!`, `usaritem <nome do item>`)
            return;
        }

        if (args.length >= 1 && (API.maqExtension.ores.checkExists(API.getMultipleArgs(msg, 1), 'drops') == false)) {
            API.sendError(msg, `Você precisa identificar um item EXISTENTE para uso!\nVerifique os itens disponíveis utilizando \`${API.prefix}mochila\``)
            return;
        }

        let id = API.getMultipleArgs(msg, 1).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); 
        const drop = API.maqExtension.ores.getDrop(id)

        
        if (!drop.usavel) {
            API.sendError(msg, `O item ${drop.icon} \`${drop.displayname}\` não é usável!\nDica: Os itens usáveis possuem um sufixo '💫' em seu nome na mochila.`)
            return;
        }
        
        const obj2 = await API.getInfo(msg.author, 'storage')
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            API.sendError(msg, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
            return;
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "usaritem");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'usaritem', 'usar itens novamente')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "usaritem", 15);

        const quantia = 1
        
        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja utilizar o item **${drop.icon} ${drop.displayname}** da sua mochila?\nDescrição do item: \`${drop.desc}\``)
        
        let embedmsg = await msg.quote(embed);

        embedmsg.react('✅')
        embedmsg.react('❌')
        let emojis = ['✅', '❌']

        const filter = (reaction, user) => {
            return user.id === msg.author.id && emojis.includes(reaction.emoji.name);
        };
        
        let collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async(reaction, user) => {
            reacted = true;
            collector.stop();
            embed.fields = [];

            const obj2 = await API.getInfo(msg.author, 'storage')
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
                embedmsg.edit(embed);
                return;
            }

            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você cancelou o uso de **${drop.icon} ${drop.displayname}**.\nDescrição do item: \`${drop.desc}\``)
                embedmsg.edit(embed);
                return;
            }

            let obj3 = await API.getInfo(msg.author, 'storage')

            API.maqExtension.storage.setOre(msg.author, drop.name, obj3[drop.name.replace(/"/g, '')]-quantia)

            function sucessEmbed() {
                embed.setColor('#5bff45');
                embed.addField('✅ Item usado', `Você usou **${drop.icon} ${drop.displayname}**\nDescrição do item: \`${drop.desc}\``)
                embedmsg.edit(embed);
            }

            switch (drop.type) {
                case 1:

                    embedmsg.delete()

                    const embed2 = new Discord.MessageEmbed();
                    embed2.setTitle(`${drop.icon} ${drop.displayname}`).setColor("#2ed1ce")
                    const embedmsg2 = await msg.quote(embed2)

                    
                    let totalcoletado = 0;
                    let coletadox = new Map();

                    async function edit() {

                        try{

                            let profundidade = await API.maqExtension.getDepth(msg.author)

                            let playerobj = await API.getInfo(msg.member, 'machines');
                            let maqid = playerobj.machine;
                            const maq1 = API.shopExtension.getProduct(maqid);
                            const maq = maq1
                        
                            const obj2 = await API.maqExtension.ores.gen(maq, profundidade*drop.tier*5);

                            let sizeMap = new Map();

                            let round = 0;
                            let xp = API.random(15, 35)*drop.tier;
                            xp = await API.playerUtils.execExp(msg, xp);
                            
                            maq.tier = ( maq.tier > 2 ? Math.round(maq.tier/2) : maq.tier)

                                for await (const r of obj2) {
            
            
                                    let size = r.size*drop.tier;
                
                                    let arMax = await API.maqExtension.storage.getMax(msg.author);
                
                                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) {
                                        size -= (await API.maqExtension.storage.getSize(msg.author)+size-arMax)
                                    }
                                    totalcoletado += size;
                                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                                    else coletadox.set(r.name, size)
                                    sizeMap.set(r.name, size)
                                    API.maqExtension.storage.giveOre(msg.author, r.name, size)
                                    round += size;
                
                                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) break;
                                    
                                }
                            
                            
                            let armazemmax2 = await API.maqExtension.storage.getMax(msg.author);
                            embed2.fields = [];
                            const obj6 = await API.getInfo(msg.author, "machines");
                            const arsize = await API.maqExtension.storage.getSize(msg.author);

                            await embed2.setDescription(`Minerador: ${msg.author}`);
                            await embed2.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                            await embed2.addField(`💥 Informações de explosão`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nTier da dinamite: ${drop.tier}`)
                            for await (const r of obj2) {
                                let qnt = sizeMap.get(r.name);
                                if (qnt == undefined) qnt = 0;
                                if (qnt < 1) qnt = 0;
                                embed2.addField(`${r.icon} ${r.name.charAt(0).toUpperCase() + r.name.slice(1)} +${qnt}g`, `\`\`\`autohotkey\nColetado: ${coletadox.get(r.name) == undefined ? '0':coletadox.get(r.name)}g\`\`\``, true)
                            }
                            try{
                                await embedmsg2.edit({ embed: embed2, allowedMentions: {"replied_user": false}}).catch()
                            }catch{
                                return
                            }
                        }catch (err){
                            API.client.emit('error', err)
                            console.log(err)
                        }
                    }

                    await edit()

                    break;
                case 2:
                    await API.maqExtension.stamina.add(msg.author, drop.value);
                    sucessEmbed()
                    break;
                default:
                    embedmsg.delete()
                    msg.quote('Ocorreu um erro ao utilizar o item, contate algum moderador do bot.')
                    break;
            }

        });
        
        collector.on('end', async collected => {
            try {await embedmsg.reactions.removeAll().catch();} catch {}
            API.playerUtils.cooldown.set(msg.author, "usaritem", 0);
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria usar **${drop.icon} ${drop.displayname}**, porém o tempo expirou!\nDescrição do item: \`${drop.desc}\``)
            embedmsg.edit(embed);
            return;
        });

	}
};