const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, FileBuilder, ActionRowBuilder } = require('@discordjs/builders');
const clientService = require('../../_classes/services/clientService');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const companyService = require('../../_classes/services/company');
const itemsService = require('../../_classes/services/items');
const runtime = require('../../_classes/services/runtime');
const imagesService = require('../../_classes/services/images');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'caçar',
    disabled: true,
    aliases: ['hunt'],
    category: 'none',
    description: 'Inicia uma caçada á monstros ao redor da sua localização', 
    mastery: 13,
    companytype: -1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
        const user_id = BigInt(interaction.user.id)
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        let pobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

        if (pobj2.level < 3) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui nível o suficiente para iniciar uma caçada!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'hunting')) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você já encontra-se caçando no momento! [[VER BATALHA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'hunting')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let stamina = await playersService.stamina.get(interaction.user.id)

        let cost = pobj2.level+1 * 2
        cost > 30 ? cost = 30 : cost = cost;

        if (stamina < cost) {
            
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui estamina o suficiente para procurar algum monstro\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${cost}]**`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;

        }

        const check = await playersService.cooldown.check(interaction.user.id, "hunt");
        if (check) {

            await playersService.cooldown.message(interaction, 'hunt', 'realizar uma nova caçada')

            return;
        }

        await playersService.cooldown.set(interaction.user.id, "hunt", 60);

        await playersService.stamina.remove(interaction.user.id, cost - 1)

        let container
        
        let monster = await companyService.jobs.explore.searchMob(pobj2.level);

        if (!monster) {
            container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Nenhum monstro por perto\nVocê gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`/estamina\` para visualizar suas estamina atual\n❌ Você não encontrou nenhum monstro nessa caçada.`))
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        }
        
        container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Você deseja iniciar uma nova caçada?**\nVocê gastou ${cost} pontos de Estamina 🔸 para procurar um monstro!\nUtilize \`/estamina\` para visualizar suas estamina atual.`),
            new TextDisplayBuilder().setContent(`**Informações do monstro**\nNome: **${monster.name}**\nNível: **${monster.level}**`)
        ).addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: monster.image } }))

        const btn0 = utility.createButton('fight', 'SUCCESS', 'Lutar', '⚔')
        const btn1 = utility.createButton('run', 'DANGER', 'Fugir', '🏃🏾‍♂️')
        const btn2 = utility.createButton('autofight', 'SECONDARY', 'Luta Automática', '🤖')

        const rb0 = [ btn0, btn1 ]

        if (pobj.mvp != null) rb0.push(btn2)

        const rowButton0 = new ActionRowBuilder().addComponents(...rb0)

        const embedinteraction = (await interaction.reply( { components: [container, rowButton0], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true } )).resource.message;
		await cacheListsService.waiting.add(interaction.user.id, interaction, 'hunting')
		await cacheListsService.waiting.add(interaction.user.id, interaction, 'working');

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 45000 });
        let reacted = false;
        let inbattle = false;
        let dead = false;
        let equips = await companyService.jobs.explore.equips.get(pobj2.level, 3);
        let reactequips = {};
        let reactequiplist = ['fight', 'run', 'autofight'];
        let fixedembed = container
        let autohunt = false
        const equipsBtn = []
        let components = []
        let combo = []
        let timing = 0
        let resultDescription = ''
        collector.on('collect', async (b) => {

            if (Date.now()-timing < 0) return
            
            if (!reactequiplist.includes(b.customId)) return;

            timing = Date.now()+2500

            reacted = true;

            if (b.customId == 'run' && inbattle == false) {
                reacted = true
                collector.stop();
                return;
            }

            function getRarity(level) { 

                const lastequiplevel = Math.max(...equips.map((equip) => equip.level));

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

                const rarityIcon = itemsService.translateRarity(rarity)
                return { rarityIcon, rarity }
            }

            async function build(lost) {
                
                let stp = await playersService.stamina.get(interaction.user.id);

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

                let percent01 = Math.round(100*(stp)/(1000));
                let percent02 = Math.round(100*(stptdp)/(1000));
                let percent03 = Math.round(100*(monster.csta)/(monster.sta));
                let percent04 = Math.round(100*(stcstatdm)/(monster.sta));

                if (runtime.debug) console.log(`Stamina player: ${percent01}%` + (td_.player > 0 ? ` (-${td_.player} = ${percent01}%)`.red:` (-${td_.player} = ${percent01}%)`.green))

                if (runtime.debug) console.log(`Stamina monstro: ${percent03}%` + (td_.monster > 0 ?` (-${td_.monster} = ${percent03}%)`.red:` (-${td_.monster} = ${percent03}%)`.green))
                
                const avatarurl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })

                let machineobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
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
                ]

                const huntimage = await imagesService.imagegens.get('hunt.js')({

                    avatarurl, 
                    monster,
                    playerlevel,
                    playerstaminamax: 1000,
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
                await playersService.stamina.remove(interaction.user.id, td_.player)

                return { attach: huntimage, plost }

            }

            async function monsterlost(mo) {

                let cr = utility.random(0, 100)
                let array2 = mo.drops;

                array2.sort(function(a, b){
                    return a.chance - b.chance;
                });

                let drops = []

                for (const r of array2) {
					let rx = utility.random(0, 100)
                    if (rx < r.chance) {
                        let d = await itemsService.get(r.name);
                        if (d) {
                            d.size = utility.random(1, r.maxdrops)
                            drops.push(d);
                        }
                    }
                }
                drops = drops.filter(xxx => xxx.size > 0)
                
                let descartado = []
                let colocados = []
                
                let xp = utility.random(Math.round((mo.level+1)), Math.round((mo.level+1)*1.15))
                xp = await playersService.execExp(interaction, xp)
                
                let retorno = await itemsService.give(interaction, drops)

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

                let dropsmap = drops.sort(sortrarity).map(d => `[${itemsService.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let colocadosmap = colocados.sort(sortrarity).map(d => `[${itemsService.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');
                let descartadosmap = descartado.sort(sortrarity).map(d => `[${itemsService.translateRarity(d.rarity)}] **${d.size}x ${d.icon} ${d.displayname}**`).join('\n');

                let score = ((companyService.stars.gen())*1.2).toFixed(2)
                companyService.stars.add(interaction.user.id, company.company_id, { score })

                return `✅ Você ganhou a batalha! **(+${xp} XP)** ${score > 0 ? `**(+${score} ⭐)**`:''}\n \nDrops do monstro:\n${dropsmap.length > 0 ? `${dropsmap}\n \nColocados na mochila:\n${colocadosmap.length == 0 ? `Todos os itens foram descartados por sua mochila estar lotada!`:colocadosmap}\n \nDescartados:\n${descartadosmap.length == 0 ? `Nenhum item descartado`:descartadosmap}\n \nVisualize os itens colocados usando \`/mochila\``:`Sem drops`}`
                
            }
            
            async function playerlost(member) {
                
                const member_id = BigInt(member.id)
                await prisma.machines.upsert({ where: { user_id: member_id }, update: { xp: 0 }, create: { user_id: member_id, xp: 0, slots: [] } })
                playersService.stamina.subset(member.id, 0)
                return `❌ Você perdeu a batalha!\nVocê perdeu seu progresso de xp!\nVeja seu progresso atual utilizando \`/perfil\``

            }
            
            if ((b.customId == 'fight' || b.customId == 'autofight') && !inbattle) {
                
                
                if (pobj.mvp && b.customId == 'autofight') {
                    autohunt = true
                }

                await cacheListsService.waiting.add(interaction.user.id, embedinteraction, 'hunting')
                await cacheListsService.waiting.add(interaction.user.id, embedinteraction, 'working');

                inbattle = true
                
                const embed = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Caçada\nOBS: Os equipamentos são randômicos de acordo com o seu nível.\n**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**${!autohunt ? `\n**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}]**`: ''}`))
                
                for (const r of equips) {
                    let id = r.icon.split(':')[2].replace('>', '');
                    r.id = id
                    if (!autohunt) {
                        equipsBtn.push(utility.createButton(id, 'SECONDARY', '', id))
                    }
                    reactequips[id] = r;
                    reactequiplist.push(id)
                    embed.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**[${getRarity(r.level).rarityIcon}] ${r.icon} ${r.name}**\nForça: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``))
                }

                if (!autohunt) components = [ new ActionRowBuilder().addComponents(...equipsBtn) ]
                
				let firstbuild = await build({ player: 0, monster: 0 }, true)

                embed.addFileComponents(new FileBuilder().setURL('attachment://image.png'))

                await interaction.editReply({ components: [embed, ...components], flags: Discord.MessageFlags.IsComponentsV2, files: [firstbuild.attach] });

                
                fixedembed = embed
                
                if (autohunt) {
                    
                    setTimeout(async function(){ 
                        await go() 
                    }, 6000)
                } else {
                        if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.cacar.defer_update'); });
                    timing = Date.now()
                }

                return;
                
            }

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.cacar.defer_update'); });
            
            if(!inbattle) return

            async function go() {
            
                let eq = reactequips[b.customId];

                let youhasbeencombedmeuamigo = false

                if (autohunt) {
                    Object.keys(reactequips)
                    eq = reactequips[Object.keys(reactequips)[utility.random(0, Object.keys(reactequips).length-1)]]
                } else {
                    if (combo.length >= 5) combo = []
                    combo.push(clientService.current.emojis.cache.get(b.customId))

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
                let roll = utility.random(0, 100)
                if (roll < eq.chance || youhasbeencombedmeuamigo) {
                    let reroll = utility.random(0, 50)
                    lost.player = Math.round(eq.dmg/utility.random(3, 4))
                    if (reroll < 13) lost.player = Math.round(1.5*lost.player)
                    else if(utility.random(0, 50) < 10 || youhasbeencombedmeuamigo) {
                        lost.player = 0
                        crit = Math.round(eq.dmg/2)
                    }
                    let roll3 = utility.random(0, 100)
                    if (roll3 <= eq.crit || youhasbeencombedmeuamigo) {
                        crit = Math.round(eq.dmg/2)
                    }
                    lost.monster = Math.round(eq.dmg)+crit
                    if (youhasbeencombedmeuamigo) lost.player = Math.round(monster.level/3)
                } else {
                    lost.player = Math.round((monster.level/1.5)+(40*eq.dmg/100))
                }
                
                if (runtime.debug) console.log(`${eq.name}`.yellow)
                
                const embed = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Caçada\nOBS: Os equipamentos são randômicos de acordo com o seu nível.\n**CAÇA AUTOMÁTICA: ${autohunt ? '✅':'❌'}**${!autohunt ? `\n**COMBO: [${combo[0] || ' '}] [${combo[1] || ' '}] [${combo[2] || ' '}] [${combo[3] || ' '}] [${combo[4] || ' '}] ${youhasbeencombedmeuamigo ? ' 💥':''}**`: ''}`))
                    
                for (const r of equips) {
                    embed.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**[${getRarity(r.level).rarityIcon}] ${r.icon} ${r.name}**\nForça: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`\nCrítico: \`${r.crit}%\``))
                }
                
                let buildlost = await build(lost)
                
                embed.addFileComponents(new FileBuilder().setURL('attachment://image.png'))
                
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
                    resultDescription = await playerlost(interaction.user)
                } else if (monster.csta <= 0) {
                    currinteraction = `\n🎗 ${monster.name} perdeu o combate!`
                    resultDescription = await monsterlost(monster)
                }
                }
                
                embed.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Informações do ataque atual**\n${currinteraction}${autohunt && !dead ? '\n \n🤖 Caça automática a cada 16 segundos': ''}${resultDescription ? `\n\n${resultDescription}` : ''}`))

                try {
                    if (dead) {
                        await interaction.editReply({ components: [embed], attachments: [], flags: Discord.MessageFlags.IsComponentsV2, files: [buildlost.attach]})
                    } else {
                        await interaction.editReply({ components: [embed, ...components], attachments: [], flags: Discord.MessageFlags.IsComponentsV2, files: [buildlost.attach] })
                    }
                } catch (error) {
                    reportError(error, 'command.cacar.edit_progress', { userId: interaction.user.id });
                    setTimeout(async function(){
                        try {
                            if (dead) {
                                await interaction.editReply({ components: [embed], flags: Discord.MessageFlags.IsComponentsV2, files: [buildlost.attach]})
                            } else {
                                await interaction.editReply({ components: [embed, ...components], flags: Discord.MessageFlags.IsComponentsV2, files: [buildlost.attach] })
                            }
                        } catch (error) {
                            reportError(error, 'command.cacar.cleanup', { userId: interaction.user.id });
                            await cacheListsService.waiting.remove(interaction.user.id, 'hunting')
                            await cacheListsService.waiting.remove(interaction.user.id, 'working');
                            collector.stop();
                            autohunt = false
                        }
                    }, 3000)
                }
                
                fixedembed = embed

                if (dead) {
                    await cacheListsService.waiting.remove(interaction.user.id, 'hunting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
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
            await cacheListsService.waiting.remove(interaction.user.id, 'hunting')
            await cacheListsService.waiting.remove(interaction.user.id, 'working');
            playersService.cooldown.set(interaction.user.id, "hunt", 0);

            if (dead) return

            if (reacted) {
                interaction.editReply({ components: [new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Mas que covarde!\n❌ Você não teve coragem de atacar o monstro e saiu correndo do combate!`))], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            
            }
            interaction.editReply({ components: [new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Oops, o monstro percebeu sua presença!\n❌ Você demorou demais para a caçada e o monstro conseguiu fugir a tempo`))], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
