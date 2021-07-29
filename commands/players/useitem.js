module.exports = {
    name: 'usaritem',
    aliases: ['useitem', 'uitem', 'usari'],
    category: 'Players',
    description: 'Faz o uso de um item usável da sua mochila',
    options: [{
        name: 'item',
        type: 'STRING',
        description: 'Escreva o nome do item que você deseja usar',
        required: false
    }],
    mastery: 10,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item para uso!`, `usaritem <nome do item>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length >= 1 && (API.itemExtension.exists(API.getMultipleArgs(msg, 1), 'drops') == false)) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item EXISTENTE para uso!\nVerifique os itens disponíveis utilizando \`${API.prefix}mochila\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let id = API.getMultipleArgs(msg, 1).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); 
        const drop = API.itemExtension.get(id)

        
        if (!drop.usavel) {
            const embedtemp = await API.sendError(msg, `O item ${drop.icon} \`${drop.displayname}\` não é usável!\nDica: Os itens usáveis possuem um sufixo '💫' em seu nome na mochila.`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        
        const obj2 = await API.getInfo(msg.author, 'storage')
        if (obj2[drop.name.replace(/"/g, '')] <= 0) {
            const embedtemp = await API.sendError(msg, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
            await msg.quote({ embeds: [embedtemp]})
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
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async(b) => {

            if (!(b.user.id === msg.author.id)) return

            reacted = true;
            collector.stop();
            embed.fields = [];
            if (!b.deferred) b.deferUpdate().then().catch();

            const obj2 = await API.getInfo(msg.author, 'storage')
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para usar!`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Uso cancelado', `
                Você cancelou o uso de **${drop.icon} ${drop.displayname}**.\nDescrição do item: \`${drop.desc}\``)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            let obj3 = await API.getInfo(msg.author, 'storage')

            function sucessEmbed() {
                embed.setColor('#5bff45');
                embed.addField('✅ Item usado', `Você usou **${drop.icon} ${drop.displayname}**\nDescrição do item: \`${drop.desc}\``)
                embedmsg.edit({ embeds: [embed], components: [] });
            }

            switch (drop.type) {
                case 1:

                    const isFull = await API.maqExtension.storage.isFull(msg.author);

                    if (isFull) {
                        embed.setColor('#a60000');
                        embed.addField('❌ Uso cancelado', `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`${API.prefix}armazém\` para visualizar seus recursos\nUtilize \`${API.prefix}vender\` para vender os recursos`)
                        embedmsg.edit({ embeds: [embed], components: [] });
                        return
                    }

                    embedmsg.delete()

                    const embed2 = new Discord.MessageEmbed();
                    embed2.setTitle(`${drop.icon} ${drop.displayname}`).setColor("#2ed1ce")
                    const embedmsg2 = await msg.quote({ embeds: [embed2]});

                    
                    let totalcoletado = 0;
                    let coletadox = new Map();

                    async function edit() {

                        try{

                            let profundidade = await API.maqExtension.getDepth(msg.author)

                            let playerobj = await API.getInfo(msg.author, 'machines');
                            let maqid = playerobj.machine;
                            const maq1 = API.shopExtension.getProduct(maqid);
                            let maq = maq1

                            maq.tier = drop.tier+2
                        
                            const obj2 = await API.maqExtension.ores.gen(maq, profundidade*drop.tier*5);

                            let sizeMap = new Map();

                            let round = 0;
                            let xp = API.random(15, 35)*drop.tier;
                            xp = await API.playerUtils.execExp(msg, xp);

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
                                API.itemExtension.add(msg.author, r.name, size)
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
                                await embedmsg2.edit({ embeds: [embed2]}).catch()
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
                    await API.playerUtils.stamina.add(msg.author, drop.value);
                    sucessEmbed()
                    break;

                case 3:
                    API.playerUtils.execExp(msg, drop.value);
                    sucessEmbed()
                    break;

                default:
                    embedmsg.delete()
                    msg.quote({ content: 'Ocorreu um erro ao utilizar o item, contate algum moderador do bot.'})

            }

            API.itemExtension.set(msg.author, drop.name, obj3[drop.name.replace(/"/g, '')]-quantia)

        });
        
        collector.on('end', async collected => {
            API.playerUtils.cooldown.set(msg.author, "usaritem", 0);
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria usar **${drop.icon} ${drop.displayname}**, porém o tempo expirou!\nDescrição do item: \`${drop.desc}\``)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};