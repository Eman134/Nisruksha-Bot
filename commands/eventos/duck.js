const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'patodourado',
    aliases: ['picktreasure'],
    category: 'none',
    description: 'Faça uma escavação na sua vila atual e tente encontrar tesouros',
    mastery: 60,
    companytype: -1,
	async execute(API, interaction) {

        const Discord = API.Discord;

        let townnum = await API.townExtension.getTownNum(interaction.user.id);

        if (parseInt(API.events.duck.loc) != parseInt(townnum)) {
            const embedtemp = await API.sendError(interaction, `Não possui nenhum pato dourado vivo na sua vila atual!\nUtilize \`/mapa\` para procurar algum pato em outras vilas\nOBS: Os alertas de novos eventos são feitos no servidor oficial do Nisruksha (\`/convite\`)`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        if (API.events.duck.killed.includes(interaction.user.id)) {
            const embedtemp = await API.sendError(interaction, `Você já batalhou contra este pato dourado!\nOBS: Os alertas de novos eventos são feitos no servidor oficial do Nisruksha (\`/convite\`)`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'patodourado')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se batalhando contra um pato no momento! [[VER BATALHA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'patodourado')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "patodourado");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'patodourado', 'realizar outra caçada')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "patodourado", 60);

        const embed = new Discord.MessageEmbed()
        
        let monster = {
            name: 'Pato Dourado',
            level: API.events.duck.level,
            sta: API.events.duck.sta,
            csta: API.events.duck.sta,
            image: 'https://cdn.discordapp.com/attachments/764111274756931625/919950650916372500/pato-de-borracha.png',
            effects: {
                fire: {
                    lastdmg: 0,
                    rounds: 0,
                },
                furtividade: {
                    lastdmg: 0,
                    rounds: 0,
                },
                granada: {
                    lastdmg: 0,
                    rounds: 0,
                }
            }
        }

        let machineobj = await DatabaseManager.get(interaction.user.id, 'machines')
        let playerlevel = machineobj.level;

        let player = {
            name: interaction.user.username,
            level: playerlevel,
            sta: 450,
            stamax: 450,
        }
        
        embed
        .addField(`Você deseja iniciar a batalha contra o pato dourado?`, `Derrote o pato dourado e garanta recompensas!`)
        .addField(`Informações do pato`, `Nome: **${monster.name}**\nNível: **${monster.level}**`)
        .setImage(monster.image)

        const btn0 = API.createButton('fight', 'SUCCESS', 'Lutar', '⚔')
        const btn1 = API.createButton('run', 'DANGER', 'Fugir', '🏃🏾‍♂️')

        const rowButton0 = API.rowComponents([ btn0, btn1 ])

        const embedinteraction = await interaction.reply( { embeds: [embed], components: [ rowButton0 ], fetchReply: true } );

		API.cacheLists.waiting.add(interaction.user.id, interaction, 'patodourado')

        let reacted = false;
        let inbattle = false;
        let dead = false;
        let equips = [
            {
                "name": "Kunai",
                "icon": "<:kunai:762798278751944705>",
                "level": 33,
                "description": "Uma arma de bom longo alcance perfeito para finalizar seus oponentes",
                "dmg": 30,
                "chance": 50,
                "crit": 5,
                "dmg": 40,
                "points": 0
            },
            {
                "name": "Espada de aço",
                "icon": "<:espadaaco:762798311304200213>",
                "description": "Uma espada de aço para lutas corporais",
                "level": 14,
                "dmg": 20,
                "chance": 70,
                "crit": 5,
                "points": 0
            },
            {
                "name": "Furtividade",
                "icon": "<:furtivo:919962496343896135>",
                "description": "Faz você esconder-se na batalha, esquivando-se de 2 ataques",
                "level": 25,
                "dmg": 18,
                "chance": 100,
                "crit": 100,
                "skill": "Furtividade",
                "points": 3
            },
            {
                "name": "Coquetel Molotov",
                "icon": "<:coquetelmolotov:919962667295322182>",
                "description": "Feito para incendiar seu inimigo e desabilitá-lo",
                "level": 25,
                "dmg": 12,
                "chance": 100,
                "crit": 0,
                "skill": "Molotov",
                "points": 5
            },
            {
                "name": "Granada",
                "icon": "<:granada:919962936867430431>",
                "description": "Realiza um grande dano em área para finalizar rapidamente seus inimigos",
                "level": 25,
                "dmg": 80,
                "chance": 100,
                "crit": 100,
                "skill": "Granada",
                "points": 8
            }
        ]
        let reactequips = {};
        let reactequiplist = ['fight', 'run'];
        let fixedembed = embed
        let combo = []
        let points = 0

        function getComponents() {
            let components = []
            let equipsBtn = []
            for (const r of equips) {
                let id = r.icon.split(':')[2].replace('>', '');
                r.id = id
                const btnEquip = API.createButton(id, 'SECONDARY', r.points > 0 ? `[${points}/${r.points}]` : '', id)
                if (points < r.points) {
                    btnEquip.setDisabled(true)
                }
                equipsBtn.push(btnEquip)
                reactequips[id] = r;
                reactequiplist.push(id)
            }
            components.push(API.rowComponents(equipsBtn))
            return components
        }

        function addEquipFields(embed) {
            try {
                for (const r of equips) {
                    embed.addField(`${r.icon} **${r.name}**`, `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`${r.points > 0 ? `\nPontos: \`[${points}/${r.points}]\``:''}`, true)
                }
            } catch (error) {
                console.log(error)
            }
        }

        const filter = i => i.user.id === interaction.user.id && reactequiplist.includes(i.customId);
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 45000 });

        collector.on('collect', async (b) => {

            reacted = true;

            await b.deferUpdate();

            if (b.customId == 'run' && inbattle == false) {
                collector.stop();
                return;
            }

            async function build(lost) {

                let td_ = lost

                if (!lost) {
                    td_ = {
                        player: 0,
                        monster: 0
                    }
                }
                
                player.sta <= 0 ? player.sta = 0 : null
                monster.csta <= 0 ? monster.csta = 0 : null

                // Player
                let stptdp = player.sta-td_.player <= 0 ? 0 : player.sta-td_.player
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

                let percent01 = Math.round(100*(player.sta)/(player.stamax));
                let percent02 = Math.round(100*(stptdp)/(player.stamax));
                let percent03 = Math.round(100*(monster.csta)/(monster.sta));
                let percent04 = Math.round(100*(stcstatdm)/(monster.sta));

                if (API.debug) console.log(`Stamina player: ${percent01}%` + (td_.player > 0 ? ` (-${td_.player} = ${percent01}%)`.red:` (-${td_.player} = ${percent01}%)`.green))

                if (API.debug) console.log(`Stamina pato dourado: ${percent03}%` + (td_.monster > 0 ?` (-${td_.monster} = ${percent03}%)`.red:` (-${td_.monster} = ${percent03}%)`.green))
                
                const avatarurl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })

                let machineobj = await DatabaseManager.get(interaction.user.id, 'machines')
                let playerlevel = machineobj.level;

                const equipsdata = [
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[0].id}.png?v=1`,
                        x: 150,
                        y: 29,
                    },
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[1].id}.png?v=1`,
                        x: 170,
                        y: 29,
                    },
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[2].id}.png?v=1`,
                        x: 190,
                        y: 29,
                    },
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[3].id}.png?v=1`,
                        x: 210,
                        y: 29,
                    },
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[4].id}.png?v=1`,
                        x: 230,
                        y: 29,
                    }
                ]

                const huntimage = await API.img.imagegens.get('hunt.js')(API, {

                    avatarurl, 
                    monster,
                    playerlevel,
                    playerstaminamax: player.stamax,
                    username: interaction.user.username,       
                    equips: equipsdata,
                    stptdp,
                    stcstatdm,
                    percent01,
                    percent02,
                    percent03,
                    percent04,
        
                })

                monster.csta -= td_.monster
                player.sta -= td_.player

                return { attach: huntimage, plost }

            }

            async function monsterlost(mo, embed) {
                
                let xp = API.random(Math.round((mo.level+1)), Math.round((mo.level+1)*1.15))
                xp = await API.playerUtils.execExp(interaction, xp)

                API.crateExtension.give(interaction.user.id, 4, 1)
                API.events.duck.killed.push(interaction.user.id)

                embed.fields = []
                embed.setDescription(`✅ Você ganhou a batalha! **(+${xp} XP)**\n \nDrops do monstro:\n**1x <:mystegg:919946658886864916> Ovo de pato dourado**\n \nColocados na mochila:\n**1x <:mystegg:919946658886864916> Ovo de pato dourado**\n \nDescartados:\nNenhum item descartado\n \nVisualize os itens colocados usando \`/mochila\``)
            }
            
            async function playerlost(member, embed) {
                
                embed.fields = []
                embed.setDescription(`❌ Você perdeu a batalha contra o pato dourado!`)
                player.sta = 0
                API.events.duck.killed.push(member.id)

            }
            
            if ((b.customId == 'fight') && !inbattle) {

                try {
                    API.cacheLists.waiting.add(interaction.user.id, embedinteraction, 'patodourado')

                    inbattle = true
                    
                    const embed = new Discord.MessageEmbed()
                    embed.setTitle(`Caçada`)
                    .setColor('#5bff45')
                    .setDescription(`**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}]**`)

                    const components = getComponents()

                    addEquipFields(embed)
                    
                    const firstbuild = await build()
                    
                    embed.setImage('attachment://image.png')
                    
                    await interaction.editReply({ embeds: [embed], components, files: [firstbuild.attach] });

                    fixedembed = embed

                } catch (error) {
                    console.log(error)
                }
                return;
                
            }
            
            if(!inbattle) return

            async function go() {

                
                let eq = reactequips[b.customId];
                if (!eq) return

                if (eq.points == 0 && points < 10) {
                    points++
                }
                
                let youhasbeencombedmeuamigo = false
                    
                if (combo.length >= 5) combo = []
                combo.push(API.client.emojis.cache.get(b.customId))

                if (combo.length >= 5) {
                    youhasbeencombedmeuamigo = true
                }

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

                if (eq.skill) {
                    points -= eq.points
                    switch (eq.skill) {
                        case 'Molotov':
                            monster.effects.fire.rounds = 5
                            break;
                        case 'Furtividade':
                            monster.effects.furtividade.rounds = 2
                            break;
                        case 'Granada':
                            monster.effects.granada.rounds = 1
                            break;
                        default:
                            break;
                    }
                }

                if (monster.effects.fire.rounds > 0) {
                    const dmgfire = eq.dmg
                    lost.monster += dmgfire
                    monster.effects.fire.lastdmg = dmgfire
                }
                if (monster.effects.furtividade.rounds > 0) {
                    const dmgfurtivo = eq.dmg
                    monster.effects.furtividade.lastdmg = dmgfurtivo
                    lost.monster += dmgfurtivo
                    lost.player = 0
                }
                if (monster.effects.granada.rounds > 0) {
                    const dmggranada = eq.dmg
                    monster.effects.granada.lastdmg = dmggranada
                    lost.monster += dmggranada
                }
                if (monster.effects.fire.rounds <= 0) {
                    monster.effects.fire.lastdmg = 0
                }
                if (monster.effects.furtividade.rounds <= 0) {
                    monster.effects.furtividade.lastdmg = 0
                }
                if (monster.effects.granada.rounds <= 0) {
                    monster.effects.granada.lastdmg = 0
                }
                
                if (API.debug) console.log(`${eq.name}`.yellow)
                
                const embed = new Discord.MessageEmbed()
                embed.setTitle(`Caçada`)
                .setColor('#5bff45')
                .setDescription(`**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}] ${youhasbeencombedmeuamigo ? ' 💥':''}**`)
                    
                addEquipFields(embed)
                
                let buildlost = await build(lost)

                let components = getComponents()
                
                embed.setImage('attachment://image.png')
                
                let currinteraction = ""

                if (lost.player == 0) {
                    currinteraction += `\n⚡ ${interaction.user.username} desviou do ataque de ${monster.name}`
                }
                if (lost.player > 0) {
                    currinteraction += `\n🔸 ${interaction.user.username} sofreu ${lost.player} de dano`
                }
                if (monster.effects.fire.lastdmg > 0) {
                    currinteraction += `\n🔥 ${monster.name} está queimando e sofreu ${monster.effects.fire.lastdmg} de dano!`
                } 
                if (monster.effects.granada.lastdmg > 0) {
                    currinteraction += `\n💣 ${player.name} acertou uma mega granada em ${monster.name} e causou ${monster.effects.granada.lastdmg} de dano!`
                } 
                if (monster.effects.furtividade.lastdmg > 0) {
                    currinteraction += `\n💨 ${interaction.user.username} está furtivo e causou ${monster.effects.furtividade.lastdmg} de dano em ${monster.name}!`
                } 
                if (lost.monster == 0) {
                    currinteraction += `\n⚡ ${monster.name} desviou do ataque de ${interaction.user.username}`
                }

                if (monster.effects.fire.rounds > 0) {
                    monster.effects.fire.rounds -= 1
                }
                if (monster.effects.furtividade.rounds > 0) {
                    monster.effects.furtividade.rounds -= 1
                }
                if (monster.effects.granada.rounds > 0) {
                    monster.effects.granada.rounds -= 1
                }

                if (lost.monster > 0) {
                    const losteffects = [monster.effects.fire.lastdmg, monster.effects.furtividade.lastdmg, monster.effects.granada.lastdmg]
                    let lostequip = lost.monster
                    for (let losteffectsint = 0; losteffectsint < losteffects.length; losteffectsint++) {
                       lostequip -= losteffects[losteffectsint]
                    }
                    currinteraction += `\n🔸 ${monster.name} sofreu ${crit > 0 ? '💥':''}${lostequip} de dano por ${eq.name}`
                }
                if (buildlost.plost) {
                    currinteraction = `\n🎗 ${interaction.user.username} perdeu o combate!`
                    await playerlost(interaction.user, embed)
                } else if (monster.csta <= 0) {
                    currinteraction = `\n🎗 ${monster.name} perdeu o combate!`
                    await monsterlost(monster, embed)
                }

                if (dead) {
                    components = []
                    API.cacheLists.waiting.remove(interaction.user.id, 'patodourado')
                    collector.stop();
                }
                
                await embed.setFooter(`Informações do ataque atual\n${currinteraction}`)

                await interaction.editReply({ embeds: [embed], attachments: [], components, files: [buildlost.attach]})

                fixedembed = embed

            }

            await go()

            collector.resetTimer();

        });
        
        collector.on('end', async collected => {
            API.cacheLists.waiting.remove(interaction.user.id, 'patodourado')
            API.playerUtils.cooldown.set(interaction.user.id, "patodourado", 0);

            if (dead) return

            if (reacted) {
                fixedembed.fields = []
                fixedembed.setTitle(`Mas que covarde!`)
                fixedembed.setColor('#a60000');
                fixedembed.setDescription(`❌ Você não teve coragem de atacar o pato dourado e saiu correndo do combate!`)
                interaction.editReply({ embeds: [fixedembed], components: [] });
                return;
            
            }
            embed.fields = []
            embed.setTitle(`Oops, o pato dourado percebeu sua presença!`)
            embed.setColor('#a60000');
            embed.setDescription(`❌ Você demorou demais para a caçada e o pato dourado conseguiu fugir a tempo`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });
        
	}
};