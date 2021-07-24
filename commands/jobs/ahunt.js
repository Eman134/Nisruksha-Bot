const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/company/battle.png`)
}

module.exports = {
    name: 'caçar',
    aliases: ['hunt'],
    category: 'none',
    description: 'Inicia uma caçada á monstros ao redor da sua localização',
    options: [],
    mastery: 13,
    companytype: 2,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(msg, `Você não possui nível o suficiente para iniciar uma caçada!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'hunting')) {
            const embedtemp = await API.sendError(msg, `Você já encontra-se caçando no momento! [[VER BATALHA]](${API.cacheLists.waiting.getLink(msg.author, 'hunting')})`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let stamina = await API.playerUtils.stamina.get(msg.author)

        let cost = pobj2.level+1 * 2
        cost > 30 ? cost = 30 : cost = cost;

        if (stamina < cost) {
            
            const embedtemp = await API.sendError(msg, `Você não possui estamina o suficiente para procurar algum monstro\n🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${cost}]**`)
            await msg.quote({ embeds: [embedtemp]})
            return;

        }

        const check = await API.playerUtils.cooldown.check(msg.author, "hunt");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'hunt', 'realizar uma nova caçada')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "hunt", 0);

        API.playerUtils.stamina.remove(msg.author, cost-1)

        const embed = new Discord.MessageEmbed()
        
        let monster = API.company.jobs.explore.searchMob(pobj2.level);

        if (!monster) {
            embed.setTitle(`Nenhum monstro por perto`)
            .setDescription(`Você gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`${API.prefix}estamina\` para visualizar suas estamina atual\n❌ Você não encontrou nenhum monstro nessa caçada.`)
            await msg.quote({ embeds: [embed] });
            return;
        }
        
        embed
        .addField(`Você deseja iniciar uma nova caçada?`, `Você gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`${API.prefix}estamina\` para visualizar suas estamina atual.`)
        .addField(`Informações do monstro`, `Nome: **${monster.name}**\nNível: **${monster.level}**`)
        .setImage(monster.image)

        const btn0 = API.createButton('fight', 'SUCCESS', 'Lutar', '⚔')
        const btn1 = API.createButton('run', 'DANGER', 'Fugir', '🏃🏾‍♂️')
        const btn2 = API.createButton('autofight', 'SECONDARY', 'Luta Automática', '🤖')

        const rb0 = [ btn0, btn1 ]

        if (pobj.mvp != null) rb0.push(btn2)

        const rowButton0 = API.rowComponents(rb0)

        const embedmsg = await msg.quote( { embeds: [embed], components: [ rowButton0 ] } );
		API.cacheLists.waiting.add(msg.author, embedmsg, 'hunting')
        API.cacheLists.waiting.add(msg.author, embedmsg, 'working');

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentCollector({ filter, time: 45000 });
        let reacted = false;
        let inbattle = false;
        let dead = false;
        let equips = API.company.jobs.explore.equips.get(pobj2.level, 3);
        let reactequips = {};
        let reactequiplist = ['fight', 'run', 'autofight'];
        let fixedembed = embed
        let lastmsg
        let autohunt = false
        const equipsBtn = []
        let components = []
        let combo = []
        let session = 0
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return            
            if (!reactequiplist.includes(b.customId)) return;

            reacted = true;

            if (b.customId == 'run' && inbattle == false) {
                reacted = true
                collector.stop();
                b.deferUpdate().catch().catch()
                return;
            }

            //collector.stop();

            async function build(lost, attach) {

                let background = bg
    
                let avatar = await API.img.loadImage(msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                avatar = await API.img.resize(avatar, 98, 98);
                //avatar = await API.img.editBorder(avatar, 75, true)
                background = await API.img.drawImage(background, avatar, 47, 16)
    
                let monsteravatar = await API.img.loadImage(monster.image);
                monsteravatar = await API.img.resize(monsteravatar, 98, 98);
                background = await API.img.drawImage(background, monsteravatar, 47, 136)
                
                let pobj2 = await API.getInfo(msg.author, 'machines')
                let playerlevel2 = pobj2.level;
                
                let stp = await API.playerUtils.stamina.get(msg.author);

                let td_ = lost

                if (!lost) {
                    td_ = {
                        player: 0,
                        monster: 0
                    }
                }
                
                stp <= 0 ? stp = 0 : stp = stp
                monster.csta <= 0 ? monster.csta = 0 : monster.csta = monster.csta
                

                // Load equips
                let equip1 = await API.img.loadImage(`https://cdn.discordapp.com/emojis/${equips[0].id}.png?v=1`)
                equip1 = await API.img.resize(equip1, 13, 13);
                background = await API.img.drawImage(background, equip1, 150, 29)

                let equip2 = await API.img.loadImage(`https://cdn.discordapp.com/emojis/${equips[1].id}.png?v=1`)
                equip2 = await API.img.resize(equip2, 13, 13);
                background = await API.img.drawImage(background, equip2, 170, 29)

                let equip3 = await API.img.loadImage(`https://cdn.discordapp.com/emojis/${equips[2].id}.png?v=1`)
                equip3 = await API.img.resize(equip3, 13, 13);
                background = await API.img.drawImage(background, equip3, 190, 29)
                

                // Player
                let stptdp = stp-td_.player <= 0 ? 0 : stp-td_.player
				let plost = false
                if (stptdp <= 0) {
                    let deadb = await API.img.loadImage(`resources/backgrounds/company/dead.png`)
                    background = await API.img.drawImage(background, deadb, 47, 16)
                    dead = true
					plost = true
                }
                
                let porcentagem01 = Math.round(100*(stp)/(1000));
                let porcentagem02 = Math.round(100*(stptdp)/(1000));
                if (API.debug) console.log(`Stamina player: ${porcentagem01}%` + (td_.player > 0 ? ` (-${td_.player} = ${porcentagem02}%)`.red:` (-${td_.player} = ${porcentagem02}%)`.green))
                
                let progress01 = await API.img.generateProgressBar(0, 249, 18, porcentagem01, 18, 0, `#de4040`)
                let progress02 = await API.img.generateProgressBar(0, 249, 18, porcentagem02, 18, 0, `#d6801a`)
                
                background = await API.img.drawImage(background, progress01, 146, 46)
                background = await API.img.drawImage(background, progress02, 146, 46)
                
                background = await API.img.drawText(background, `Estamina: ${stptdp}/1000`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 40, 8)
                background = await API.img.drawText(background, `${msg.author.username}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 70, 2)
                background = await API.img.drawText(background, `Nível ${playerlevel2}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 155, 70, 0)
                
                // Monster
                let stcstatdm = monster.csta-td_.monster <= 0 ? 0 : monster.csta-td_.monster
                
                if (stcstatdm <= 0) {
                    let deadb = await API.img.loadImage(`resources/backgrounds/company/dead.png`)
                    background = await API.img.drawImage(background, deadb, 47, 136)
                    dead = true
                }

                let porcentagem2 = Math.round(100*(monster.csta)/(monster.sta));
                let porcentagem20 = Math.round(100*(stcstatdm)/(monster.sta));

                if (API.debug) console.log(`Stamina monstro: ${porcentagem2}%` + (td_.monster > 0 ?` (-${td_.monster} = ${porcentagem20}%)`.red:` (-${td_.monster} = ${porcentagem20}%)`.green))

                let progress2 = await API.img.generateProgressBar(0, 249, 18, porcentagem2, 18, 0, `#de4040`)
                let progress20 = await API.img.generateProgressBar(0, 249, 18, porcentagem20, 18, 0, `#d6801a`)

                background = await API.img.drawImage(background, progress2, 146, 166)
                background = await API.img.drawImage(background, progress20, 146, 166)

                background = await API.img.drawText(background, `Estamina: ${stcstatdm}/${monster.sta}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 160, 8)
                background = await API.img.drawText(background, `${monster.name}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 396, 190, 2)
                background = await API.img.drawText(background, `Nível ${monster.level}`, 16, './resources/fonts/Uni Sans.ttf', '#ffffff', 155, 190, 0)

                monster.csta -= td_.monster
                API.playerUtils.stamina.remove(msg.author, td_.player)

                if (attach) {
                    const attach =  await API.img.getAttachment(background, 'hunt' + session + '.png')
                    return { attach, plost }
                }
                
                let msg2 = await API.img.sendImage(API.client.channels.cache.get('761582265741475850'), background, msg.id);
                let url = await msg2.attachments.array()[0].url

                try{
                if (lastmsg) lastmsg.delete()
                }catch{}
                lastmsg = msg2
                return { url, plost };
            }

            async function monsterlost(mo, embed) {

                let cr = API.random(0, 100)
                let array2 = mo.drops;

                array2.sort(function(a, b){
                    return a.chance - b.chance;
                });

                let drops = []

                for (const r of array2) {
					let rx = API.random(0, 100)
                    if (rx < r.chance) {
                        let d = API.itemExtension.get(r.name);
                        if (d) {
                            d.size = API.random(1, r.maxdrops)
                            drops.push(d);
                        }
                    }
                }
                drops = drops.filter(xxx => xxx.size > 0)
                
                let descartado = []
                let colocados = []
                
                let xp = API.random(Math.round((mo.level+1)), Math.round((mo.level+1)*2.5))
                xp = await API.playerUtils.execExp(msg, xp)
                
                let retorno = await API.itemExtension.give(msg, drops)

                descartado = retorno.descartados
                colocados = retorno.colocados

                let dropsmap = drops.map(d => `**${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let colocadosmap = colocados.map(d => `**${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let descartadosmap = descartado.map(d => `**${d.size}x ${d.icon} ${d.displayname}**`).join('\n');

                let score = ((API.company.stars.gen())*1.8).toFixed(2)
                API.company.stars.add(msg.author, company.company_id, { score })

                embed.fields = []
                embed.setDescription(`✅ Você ganhou a batalha! **(+${xp} XP)** ${score > 0 ? `**(+${score} ⭐)**`:''}\n \nDrops do monstro:\n${dropsmap.length > 0 ? `${dropsmap}\n \nColocados na mochila:\n${colocadosmap.length == 0 ? `Todos os itens foram descartados por sua mochila estar lotada!`:colocadosmap}\n \nDescartados:\n${descartadosmap.length == 0 ? `Nenhum item descartado`:descartadosmap}\n \nVisualize os itens colocados usando \`${API.prefix}mochila\``:`Sem drops`}`)
                
            }
            
            async function playerlost(member, embed) {
                
                embed.fields = []
                embed.setDescription(`❌ Você perdeu a batalha!\nVocê perdeu seu progresso de xp!\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
                API.setInfo(member, "machines", "xp", 0)
                API.playerUtils.stamina.subset(member, 0)

            }
            
            if ((b.customId == 'fight' || b.customId == 'autofight') && !inbattle) {
                
                
                if (pobj.mvp && b.customId == 'autofight') {
                    autohunt = true
                }

                API.cacheLists.waiting.add(msg.author, embedmsg, 'hunting')
                API.cacheLists.waiting.add(msg.author, embedmsg, 'working');

                inbattle = true
                
                const embed = new Discord.MessageEmbed()
                embed.setTitle(`Caçada`)
                .setColor('#5bff45')
                .setDescription(`OBS: Os equipamentos são randômicos de acordo com o seu nível.\n**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**${!autohunt ? `\n**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}]**`: ''}`)
                
                for (const r of equips) {
                    let id = r.icon.split(':')[2].replace('>', '');
                    r.id = id
                    if (!autohunt) {
                        equipsBtn.push(API.createButton(id, 'SECONDARY', r.name, id))
                    }
                    reactequips[id] = r;
                    reactequiplist.push(id)
                    embed.addField(`${r.icon} **${r.name}**`, `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``, true)
                }

                if (!autohunt) components = [ API.rowComponents(equipsBtn) ]
                
				let firstbuild = await build({ player: 0, monster: 0 }, true)
				
                //await embed.setImage(firstbuild.url)

                embed.setImage('attachment://hunt' + session + '.png')

                //await embedmsg.edit({ embeds: [embed], components })//, files: [firstbuild.attach] });
                await embedmsg.edit({ embeds: [embed], components, files: [firstbuild.attach] });

                fixedembed = embed

                if (autohunt) {

                    setTimeout(async function(){ 
                        await go() 
                    }, 6000)
                }

                b.deferUpdate().catch().catch()

                return;
                
            }
            
            if(!inbattle) return

            async function go() {
            
                let eq = reactequips[b.customId];

                let youhasbeencombedmeuamigo = false

                if (autohunt) {
                    Object.keys(reactequips)
                    eq = reactequips[Object.keys(reactequips)[API.random(0, Object.keys(reactequips).length-1)]]
                } else {
                    if (combo.length >= 5) combo = []
                    combo.push(API.client.emojis.cache.get(b.customId))

                    if (combo.length >= 5) {
                        youhasbeencombedmeuamigo = true
                    }

                }
                
                if (!eq) return

                let lost = {
                    player: 0,
                    monster: 0
                }

                let crit = 0;
                let roll = API.random(0, 100)
                if (roll < eq.chance || youhasbeencombedmeuamigo) {
                    let reroll = API.random(0, 50)
                    lost.player = Math.round(eq.dmg/API.random(3, 4))
                    if (reroll < 13) lost.player = Math.round(1.5*lost.player)
                    else if(API.random(0, 50) < 10 || youhasbeencombedmeuamigo) {
                        lost.player = 0
                        crit = Math.round(eq.dmg/2)
                    }
                    let roll3 = API.random(0, 100)
                    if (roll3 <= eq.crit || youhasbeencombedmeuamigo) {
                        crit = Math.round(eq.dmg/2)
                    }
                    lost.monster = Math.round(eq.dmg)+crit
                    if (youhasbeencombedmeuamigo) lost.player = Math.round(monster.level/3)
                } else {
                    lost.player = Math.round((monster.level/1.5)+(40*eq.dmg/100))
                }
                
                if (API.debug) console.log(`${eq.name}`.yellow)
                
                const embed = new Discord.MessageEmbed()
                embed.setTitle(`Caçada`)
                .setColor('#5bff45')
                .setDescription(`OBS: Os equipamentos são randômicos de acordo com o seu nível.\n**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**${!autohunt ? `\n**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}] ${youhasbeencombedmeuamigo ? ' 💥':''}**`: ''}`)
                    
                for (const r of equips) {
                    embed.addField(`${r.icon} **${r.name}**`, `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``, true)
                }
                
                let buildlost = await build(lost, true)
                
                //await embed.setImage(buildlost.url)
                //embed.attachFiles([buildlost.attach])
                embed.setImage('attachment://hunt' + session + '.png')
                
                let currmsg = ""
                {
                if (lost.player == 0) {
                    currmsg += `\n⚡ ${msg.author.username} desviou do ataque de ${monster.name}`
                }
                if (lost.player > 0) {
                    currmsg += `\n🔸 ${msg.author.username} sofreu ${lost.player} de dano`
                }
                if (lost.monster == 0) {
                    currmsg += `\n⚡ ${monster.name} desviou do ataque de ${msg.author.username}`
                }
                if (lost.monster > 0) {
                    currmsg += `\n🔸 ${monster.name} sofreu ${crit > 0 ? '💥':''}${lost.monster} de dano por ${eq.name}`
                }
                if (buildlost.plost) {
                    currmsg = `\n🎗 ${msg.author.username} perdeu o combate!`
                    await playerlost(msg.author, embed)
                } else if (monster.csta <= 0) {
                    currmsg = `\n🎗 ${monster.name} perdeu o combate!`
                    await monsterlost(monster, embed)
                }
                }
                
                await embed.setFooter(`Informações do ataque atual\n${currmsg}${autohunt && !dead ? '\n \n🤖 Caça automática a cada 16 segundos': ''}`)

                try {
                    if (dead) {
                        //await embedmsg.edit({ embeds: [embed], components: []})//, files: [buildlost.attach]})
                        await embedmsg.edit({ embeds: [embed], attachments: [], components: [], files: [buildlost.attach]})
                    } else {
                        //await embedmsg.edit({ embeds: [embed], components})//, files: [buildlost.attach] })
                        await embedmsg.edit({ embeds: [embed], attachments: [], components, files: [buildlost.attach] })
                    }
                } catch (err) {
                    console.log(err)
                    setTimeout(async function(){
                        try {
                            if (dead) {
                                //await embedmsg.edit({ embeds: [embed], components: []})//, files: [buildlost.attach]})
                                await embedmsg.edit({ embeds: [embed], components: [], files: [buildlost.attach]})
                            } else {
                                //await embedmsg.edit({ embeds: [embed], components})//, files: [buildlost.attach] })
                                await embedmsg.edit({ embeds: [embed], components, files: [buildlost.attach] })
                            }
                        } catch {
                            API.cacheLists.waiting.remove(msg.author, 'hunting')
                            API.cacheLists.waiting.remove(msg.author, 'working');
                            collector.stop();
                            autohunt = false
                        }
                    }, 3000)
                }
                fixedembed = embed

                if (dead) {
                    API.cacheLists.waiting.remove(msg.author, 'hunting')
                    API.cacheLists.waiting.remove(msg.author, 'working');
                    collector.stop();
                    autohunt = false
                }

                if (autohunt && !dead) {
                    setTimeout(async function(){ 
                        collector.resetTimer();
                        await go() 
                    }, 16000)
                }

            }

            //session += 1

            await go()

            collector.resetTimer();

            b.deferUpdate().catch().catch()

        });
        
        collector.on('end', async collected => {
            API.cacheLists.waiting.remove(msg.author, 'hunting')
            API.cacheLists.waiting.remove(msg.author, 'working');

            if (dead) return

            if (reacted) {
                fixedembed.fields = []
                fixedembed.setTitle(`Mas que covarde!`)
                fixedembed.setColor('#a60000');
                fixedembed.setDescription(`❌ Você não teve coragem de atacar o monstro e saiu correndo do combate!`)
                embedmsg.edit({ embeds: [fixedembed], components: [] });
                return;
            
            }
            embed.fields = []
            embed.setTitle(`Oops, o monstro percebeu sua presença!`)
            embed.setColor('#a60000');
            embed.setDescription(`❌ Você demorou demais para a caçada e o monstro conseguiu fugir a tempo`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};