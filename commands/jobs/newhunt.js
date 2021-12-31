const API = require("../../_classes/api");
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

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
    mastery: 13,
    companytype: 2,
	async execute(API, interaction, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(interaction, `Você não possui nível o suficiente para iniciar uma caçada!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'hunting')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se caçando no momento! [[VER BATALHA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'hunting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let stamina = await API.playerUtils.stamina.get(interaction.user.id)

        let cost = pobj2.level+1 * 2
        cost > 30 ? cost = 30 : cost = cost;

        if (stamina < cost) {
            
            const embedtemp = await API.sendError(interaction, `Você não possui estamina o suficiente para procurar algum monstro\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${cost}]**`)
            await interaction.reply({ embeds: [embedtemp]})
            return;

        }

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "hunt");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'hunt', 'realizar uma nova caçada')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "hunt", 20);

        API.playerUtils.stamina.remove(interaction.user.id, cost-1)

        const embed = new Discord.MessageEmbed()
        
        let monster = API.company.jobs.explore.searchMob(pobj2.level);

        if (!monster) {
            embed.setTitle(`Nenhum monstro por perto`)
            .setDescription(`Você gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`/estamina\` para visualizar suas estamina atual\n❌ Você não encontrou nenhum monstro nessa caçada.`)
            await interaction.reply({ embeds: [embed] });
            return;
        }
        
        embed
        .addField(`Você deseja iniciar uma nova caçada?`, `Você gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`/estamina\` para visualizar suas estamina atual.`)
        .addField(`Informações do monstro`, `Nome: **${monster.name}**\nNível: **${monster.level}**`)
        .setImage(monster.image)

        const btn0 = API.createButton('fight', 'SUCCESS', 'Lutar', '⚔')
        const btn1 = API.createButton('run', 'DANGER', 'Fugir', '🏃🏾‍♂️')
        const btn2 = API.createButton('autofight', 'SECONDARY', 'Luta Automática', '🤖')

        const rb0 = [ btn0, btn1 ]

        if (pobj.mvp != null) rb0.push(btn2)

        const rowButton0 = API.rowComponents(rb0)

        const embedinteraction = await interaction.reply( { embeds: [embed], components: [ rowButton0 ], fetchReply: true } );
		API.cacheLists.waiting.add(interaction.user.id, interaction, 'hunting')
        API.cacheLists.waiting.add(interaction.user.id, interaction, 'working');

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 45000 });
        let reacted = false;
        let inbattle = false;
        let dead = false;
        let equips = API.company.jobs.explore.equips.get(pobj2.level, 3);
        let reactequips = {};
        let reactequiplist = ['fight', 'run', 'autofight'];
        let autohunt = false
        let equipsBtn = [API.createButton('changeMode', 'SECONDARY', 'Compacto', '🔄')]
        let components = []
        let combo = []
        let timing = 0
        let currentmode = 0
        collector.on('collect', async (b) => {

            if (b.customId === 'changeMode') {
                currentmode = currentmode == 0 ? 1 : 0
                equipsBtn[0].label = currentmode == 0 ? 'Compacto' : 'Detalhado'
                if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
                return interaction.editReply({ embeds: await getEmbeds(), components: [ API.rowComponents(equipsBtn) ] })
            }

            if (Date.now()-timing < 0) return
            
            if (!reactequiplist.includes(b.customId)) return;

            timing = Date.now()+2500

            reacted = true;

            if (b.customId == 'run' && inbattle == false) {
                reacted = true
                collector.stop();
                return;
            }

            async function getEmbeds() {

                const stp = await API.playerUtils.stamina.get(interaction.user.id);

                const baruser = getLifeBar(stp, 1000)
                
                const barmonster = getLifeBar(monster.csta, monster.sta)

                if (currentmode == 1) {
                    const infosEmbed = new Discord.MessageEmbed()
                    .setTitle(`Caçada`)
                    .setColor('#5bff45')
                    .setDescription(`OBS: Os equipamentos são randômicos de acordo com o seu nível.\n**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**`)
                    .setImage('attachment://image.png')

                    const embed = new Discord.MessageEmbed()
                    .setTitle(`Caçada`)
                    .setColor('#5bff45')
                    .setDescription(`
**COMBO: ${combo.map((currentcombo) => `[${currentcombo || ' '}]`).join(' ') + (' [ ] ').repeat(5-combo.length)}**

${interaction.user.username} ${baruser}
${monster.name} ${barmonster}
`)

                    for (const r of equips) {
                        infosEmbed.addField(`[${getRarity(r.level).rarityIcon}] ${r.icon} **${r.name}**`, `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``, true)
                    }
                    
                    return [infosEmbed, embed]
                } else {
                    const embed = new Discord.MessageEmbed()
                    .setTitle(`Caçada`)
                    .setColor('#5bff45')
                    .setDescription(`
OBS: Os equipamentos são randômicos de acordo com o seu nível.
**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**
**COMBO: ${combo.map((currentcombo) => `[${currentcombo || ' '}]`).join(' ') + (' [ ] ').repeat(5-combo.length)}**

${interaction.user.username} ${baruser}
${monster.name} ${barmonster}
`)
                    .setThumbnail('attachment://image.png')

                    for (const r of equips) {
                        embed.addField(`[${getRarity(r.level).rarityIcon}] ${r.icon} **${r.name}**`, `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``, true)
                    }

                    return [embed]
                }
            }

            function getRarity(level) { 

                const equipsobj = API.company.jobs.explore.equips.obj;

                const lastequiplevel = equipsobj[equipsobj.length-1].level;

                const raritynum = level*100/lastequiplevel

                if (raritynum <= 20) {
                    var rarity = 'common'
                } else if (raritynum <= 35) {
                    var rarity = 'uncommon'
                } else if (raritynum <= 50) {
                    var rarity = 'rare'
                } else if (raritynum <= 70) {
                    var rarity = 'epic'
                } else if (raritynum <= 80) {
                    var rarity = 'lendary'
                } else if (raritynum <= 100) {
                    var rarity = 'mythic'
                }

                const rarityIcon = API.itemExtension.translateRarity(rarity)
                return { rarityIcon, rarity }
            }

            async function build(lost) {
                
                try {

                    let stp = await API.playerUtils.stamina.get(interaction.user.id);

                    let td_ = lost

                    if (!lost) {
                        td_ = {
                            player: 0,
                            monster: 0
                        }
                    }
                    
                    stp <= 0 ? stp = 0 : stp = stp
                    monster.csta <= 0 ? monster.csta = 0 : monster.csta = monster.csta

                    // Player
                    let stptdp = stp-td_.player <= 0 ? 0 : stp-td_.player
                    let plost = false
                    if (stptdp <= 0) {
                        dead = true
                        plost = true
                    }
                    
                    // Monster
                    let stcstatdm = monster.csta-td_.monster <= 0 ? 0 : monster.csta-td_.monster
                    
                    if (stcstatdm <= 0) {
                        dead = true
                    }

                    const avatarurl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })

                    let machineobj = await DatabaseManager.get(interaction.user.id, 'machines')
                    let playerlevel = machineobj.level;

                    const equipsdata = [
                        {
                            img: `https://cdn.discordapp.com/emojis/${equips[0].id}.png?v=1`,
                            x: 33,
                            y: 54,
                        },
                        {
                            img: `https://cdn.discordapp.com/emojis/${equips[1].id}.png?v=1`,
                            x: 53,
                            y: 54,
                        },
                        {
                            img: `https://cdn.discordapp.com/emojis/${equips[2].id}.png?v=1`,
                            x: 73,
                            y: 54,
                        },
                    ]

                    if (dead || b.customId == 'fight' || b.customId == 'autofight') {
                        var huntimage = await API.img.imagegens.get('battle.js')(API, {
        
                            avatarurl, 
                            monster,
                            playerlevel,
                            username: interaction.user.username,       
                            equips: equipsdata,
                            stptdp,
                            stcstatdm,
                
                        })
                    }

                    monster.csta -= td_.monster
                    API.playerUtils.stamina.remove(interaction.user.id, td_.player)

                    return { attach: huntimage, plost }
                    
                } catch (error) {
                    console.log(error)
                }

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
                
                let xp = API.random(Math.round((mo.level+1)), Math.round((mo.level+1)*1.15))
                xp = await API.playerUtils.execExp(interaction, xp)
                
                let retorno = await API.itemExtension.give(interaction, drops)

                descartado = retorno.descartados
                colocados = retorno.colocados

                const sortrarity = function(a, b){
                    const rarities = {
                        "common": 0,
                        "uncommon": 1,
                        "rare": 2,
                        "epic": 3,
                        "lendary": 4,
                        "mythic": 5
                    }
                    return rarities[b.rarity] - rarities[a.rarity]
                    
                }

                let dropsmap = drops.sort(sortrarity).map(d => `[${API.itemExtension.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let colocadosmap = colocados.sort(sortrarity).map(d => `[${API.itemExtension.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let descartadosmap = descartado.sort(sortrarity).map(d => `[${API.itemExtension.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');

                let score = ((API.company.stars.gen())*1.2).toFixed(2)
                API.company.stars.add(interaction.user.id, company.company_id, { score })

                embed.fields = []
                embed.setDescription(`✅ Você ganhou a batalha! **(+${xp} XP)** ${score > 0 ? `**(+${score} ⭐)**`:''}\n \nDrops do monstro:\n${dropsmap.length > 0 ? `${dropsmap}\n \nColocados na mochila:\n${colocadosmap.length == 0 ? `Todos os itens foram descartados por sua mochila estar lotada!`:colocadosmap}\n \nDescartados:\n${descartadosmap.length == 0 ? `Nenhum item descartado`:descartadosmap}\n \nVisualize os itens colocados usando \`/mochila\``:`Sem drops`}`)
                
            }
            
            async function playerlost(member, embed) {
                
                embed.fields = []
                embed.setDescription(`❌ Você perdeu a batalha!\nVocê perdeu seu progresso de xp!\nVeja seu progresso atual utilizando \`/perfil\``)
                DatabaseManager.set(member.id, "machines", "xp", 0)
                API.playerUtils.stamina.subset(member.id, 0)

            }

            function getLifeBar(life, lifemax) {

                if (!life || !lifemax) console.log('getLifeBar', life, lifemax)

                function progress(maxticks, atual, max, percento) {
    
                    const percentage = atual / max;
                    const progress = Math.round((maxticks * percentage));
                    const emptyProgress = maxticks - progress;

                    const frame1 = "<:life:926185180920692786>"
                    const frame2 = "<:life:926185180752928838>"
                    const frame3 = "<:life:926192169755238440>"
                    const frame4 = "<:life:926192858925498460>"
                    const frame5 = "<:life:926192858925498460>"
                    const frame6 = "<:life:926192858925498460>"
                
                    const progressText = frame2.repeat((progress-1 <= 0 ? 0 : progress-1));
                    const emptyProgressText = frame5.repeat((emptyProgress-1 <= 0 ? 0 : emptyProgress-1));

                    const initProgressText = percentage == 0 ? frame4 : frame1;
                    const endProgressText = percentage >= 0.95 ? frame3 : frame6;
                
                    const bar = initProgressText + progressText + emptyProgressText + endProgressText + (percento ? Math.round((percentage)*100) + " %" : " (" + atual + "/" + max +")") ;
                    
                    return bar;
                }

                const lifebar = progress(8, life, lifemax)

                return lifebar

            }
            
            if ((b.customId == 'fight' || b.customId == 'autofight') && !inbattle) {
                
                
                if (pobj.mvp && b.customId == 'autofight') {
                    autohunt = true
                }

                API.cacheLists.waiting.add(interaction.user.id, embedinteraction, 'hunting')
                API.cacheLists.waiting.add(interaction.user.id, embedinteraction, 'working');

                inbattle = true

                
                for (const r of equips) {
                    let id = r.icon.split(':')[2].replace('>', '');
                    r.id = id
                    if (!autohunt) {
                        equipsBtn.push(API.createButton(id, 'SECONDARY', '', id))
                    }
                    reactequips[id] = r;
                    reactequiplist.push(id)
                }

                if (!autohunt) components = [ API.rowComponents(equipsBtn) ]
                
				let firstbuild = await build({ player: 0, monster: 0 }, true)
                
                try {
                    await interaction.editReply({ embeds: await getEmbeds(), components, files: [firstbuild.attach] });
                } catch (error) {
                    console.log(error)
                }
                
                if (autohunt) {
                    
                    setTimeout(async function(){ 
                        await go() 
                    }, 6000)
                } else {
                    if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
                    timing = Date.now()
                }

                return;
                
            }

            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            
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


                let buildlost = await build(lost)
                
                let currinteraction = ""
                {
                if (lost.player == 0) {
                    currinteraction += `\n⚡ ${interaction.user.username} desviou do ataque de ${monster.name}`
                }
                if (lost.player > 0) {
                    currinteraction += `\n🔸 ${interaction.user.username} sofreu ${lost.player} de dano`
                }
                if (lost.monster == 0) {
                    currinteraction += `\n⚡ ${monster.name} desviou do ataque de ${interaction.user.username}`
                }
                if (lost.monster > 0) {
                    currinteraction += `\n🔸 ${monster.name} sofreu ${crit > 0 ? '💥':''}${lost.monster} de dano por ${eq.name}`
                }
                if (buildlost.plost) {
                    currinteraction = `\n🎗 ${interaction.user.username} perdeu o combate!`
                    await playerlost(interaction.user, embed)
                } else if (monster.csta <= 0) {
                    currinteraction = `\n🎗 ${monster.name} perdeu o combate!`
                    await monsterlost(monster, embed)
                }
                }
                
                await embed.setFooter(`Informações do ataque atual\n${currinteraction}${autohunt && !dead ? '\n \n🤖 Caça automática a cada 16 segundos': ''}`)

                try {
                    if (dead) {
                        await interaction.editReply({ embeds: await getEmbeds(), attachments: [], components: [], files: [buildlost.attach]})
                    } else {
                        await interaction.editReply({ embeds: await getEmbeds() })
                    }
                } catch {
                    setTimeout(async function(){
                        try {
                            if (dead) {
                                await interaction.editReply({ embeds: await getEmbeds(), attachments: [], components: [], files: [buildlost.attach]})
                            } else {
                                await interaction.editReply({ embeds: await getEmbeds() })
                            }
                        } catch {
                            API.cacheLists.waiting.remove(interaction.user.id, 'hunting')
                            API.cacheLists.waiting.remove(interaction.user.id, 'working');
                            collector.stop();
                            autohunt = false
                        }
                    }, 3000)
                }

                if (dead) {
                    API.cacheLists.waiting.remove(interaction.user.id, 'hunting')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
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

            await go()

            collector.resetTimer();

            timing = Date.now()

        });
        
        collector.on('end', async collected => {
            API.cacheLists.waiting.remove(interaction.user.id, 'hunting')
            API.cacheLists.waiting.remove(interaction.user.id, 'working');
            API.playerUtils.cooldown.set(interaction.user.id, "hunt", 0);

            if (dead) return

            if (reacted) {
                embed.fields = []
                embed.setTitle(`Mas que covarde!`)
                embed.setColor('#a60000');
                embed.setDescription(`❌ Você não teve coragem de atacar o monstro e saiu correndo do combate!`)
                interaction.editReply({ embeds: [embed], attachments: [], components: [] });
                return;
            
            }
            embed.fields = []
            embed.setTitle(`Oops, o monstro percebeu sua presença!`)
            embed.setColor('#a60000');
            embed.setDescription(`❌ Você demorou demais para a caçada e o monstro conseguiu fugir a tempo`)
            interaction.editReply({ embeds: [embed], attachments: [], components: [] });
            return;
        });

	}
};