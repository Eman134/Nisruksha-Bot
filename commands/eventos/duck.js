const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, FileBuilder, ActionRowBuilder } = require('@discordjs/builders');
const townsService = require('../../_classes/services/towns');
const eventsService = require('../../_classes/services/events');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const imagesService = require('../../_classes/services/images');
const crateExtensionService = require('../../_classes/services/crateExtension');
const clientService = require('../../_classes/services/clientService');
const runtime = require('../../_classes/services/runtime');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

function buildMessage(interaction, { color = '#36393f', title, description, fields = [], image, file = false }) {
    const lines = [
        `**${interaction.user.tag}**`,
        title ? `## ${title}` : '',
        description || '',
        ...fields.map(({ name, value }) => `**${name}**\n${value}`)
    ].filter(Boolean);
    const container = new ContainerBuilder()
        .setAccentColor(typeof color === 'number' ? color : parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n\n')));
    if (image) container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: image } }));
    if (file) container.addFileComponents(new FileBuilder().setURL('attachment://image.png'));
    return container;
}

function buildError(interaction, message) {
    return buildMessage(interaction, { color: '#b8312c', fields: [{ name: '<:error:736274027756388353>', value: message }] });
}

module.exports = {
    name: 'patodourado',
    aliases: ['picktreasure'],
    category: 'none',
    description: 'Faça uma escavação na sua vila atual e tente encontrar tesouros',
    mastery: 60,
    companytype: -1,
	async execute(interaction) {

        
        let townnum = await townsService.getTownNum(interaction.user.id);

        if (parseInt(eventsService.duck.loc) != parseInt(townnum)) {
            await interaction.reply({ components: [buildError(interaction, `Não possui nenhum pato dourado vivo na sua vila atual!\nUtilize \`/mapa\` para procurar algum pato em outras vilas\nOBS: Os alertas de novos eventos são feitos no servidor oficial do Nisruksha (\`/convite\`)`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        const hasKilled = eventsService.duck.killed.find((killed) => killed.id == interaction.user.id)

        if (hasKilled && hasKilled.amount >= 2) {
            await interaction.reply({ components: [buildError(interaction, `Você já batalhou o máximo de vezes contra este pato dourado!\nOBS: Os alertas de novos eventos são feitos no servidor oficial do Nisruksha (\`/convite\`)`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'patodourado')) {
            await interaction.reply({ components: [buildError(interaction, `Você já encontra-se batalhando contra um pato no momento! [[VER BATALHA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'patodourado')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        const check = await playersService.cooldown.check(interaction.user.id, "patodourado");
        if (check) {

            playersService.cooldown.message(interaction, 'patodourado', 'realizar outra caçada de pato dourado')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "patodourado", 60);

        let monster = {
            name: 'Pato Dourado',
            level: eventsService.duck.level,
            sta: eventsService.duck.sta,
            csta: eventsService.duck.sta,
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

        const user_id = BigInt(interaction.user.id)
        let machineobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
        let playerlevel = machineobj.level;

        let player = {
            name: interaction.user.username,
            level: playerlevel,
            sta: 400,
            stamax: 400,
        }
        
        const btn0 = utility.createButton('fight', 'SUCCESS', 'Lutar', '⚔')
        const btn1 = utility.createButton('run', 'DANGER', 'Fugir', '🏃🏾‍♂️')
        const rowButton0 = new ActionRowBuilder().addComponents(btn0, btn1)
        const container = buildMessage(interaction, { title: 'Caçada', fields: [
            { name: 'Você deseja iniciar a batalha contra o pato dourado?', value: 'Derrote o pato dourado e garanta recompensas!' },
            { name: 'Informações do pato', value: `Nome: **${monster.name}**\nNível: **${monster.level}**` }
        ], image: monster.image });
        const embedinteraction = (await interaction.reply( { components: [container, rowButton0], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true } )).resource.message;

		await cacheListsService.waiting.add(interaction.user.id, interaction, 'patodourado')

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
        let reactequiplist = ['fight', 'run', 'changeMode'];
        let combo = []
        let points = 0
        let currentmode = 0
        let youhasbeencombedmeuamigo = false
        let losedesc = ''

        function getComponents() {
            let components = []
            let equipsBtn = []
            for (const r of equips) {
                let id = r.icon.split(':')[2].replace('>', '');
                r.id = id
                const btnEquip = utility.createButton(id, 'SECONDARY', r.points > 0 ? `[${points}/${r.points}]` : '', id)
                if (points < r.points) {
                    btnEquip.setDisabled(true)
                }
                equipsBtn.push(btnEquip)
                reactequips[id] = r;
                reactequiplist.push(id)
            }
            components.push(utility.rowComponents(equipsBtn))
            components.push(utility.rowComponents([utility.createButton('changeMode', 'SECONDARY', currentmode == 0 ? 'Compacto' : 'Detalhado', '🔄')]))
            return components
        }

        async function getContainers(currinteraction) {

            try {
                const baruser = getLifeBar(player.sta, player.stamax)
            
                const barmonster = getLifeBar(monster.csta, monster.sta)

                const combostring = `**COMBO: ${combo.map((currentcombo) => `[${currentcombo || ' '}]`).join(' ') + (' [ ] ').repeat(5-combo.length)}** ${youhasbeencombedmeuamigo ? `💥`:'' }`

                if (currentmode == 1) {
                    const equipFields = equips.map((r) => ({ name: `${r.icon} **${r.name}**`, value: `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`${r.points > 0 ? `\nPontos: \`[${points}/${r.points}]\``:''}` }));
                    const attack = `
${combostring}

${interaction.user.username} ${baruser}
${monster.name} ${barmonster}
${currinteraction ? currinteraction : ''}
`;
                    if (losedesc) attack += `\n**Resultado da caçada**\n${losedesc}`;
                    return [
                        buildMessage(interaction, { color: '#5bff45', title: 'Caçada', description: 'OBS: Os equipamentos são randômicos de acordo com o seu nível.', fields: equipFields, image: 'attachment://image.png', file: true }),
                        buildMessage(interaction, { color: '#5bff45', title: 'Caçada', fields: [{ name: 'Informações do ataque atual', value: attack }], image: 'attachment://image.png' })
                    ];
                } else {
                    const fields = equips.map((r) => ({ name: `${r.icon} **${r.name}**`, value: `Força: \`${r.dmg} DMG\` 🗡🔸\nAcerto: \`${r.chance}%\`${r.points > 0 ? `\nPontos: \`[${points}/${r.points}]\``:''}` }));
                    let attack = `
${combostring}

${interaction.user.username} ${baruser}
${monster.name} ${barmonster}
${currinteraction ? currinteraction : ''}
`;
                    if (losedesc) attack += `\n**Resultado da caçada**\n${losedesc}`;
                    return [buildMessage(interaction, { color: '#5bff45', title: 'Caçada', fields: [...fields, { name: 'Informações do ataque atual', value: attack }], image: 'attachment://image.png', file: true })];
                }
            } catch (error) {
                reportError(error, 'command.duck.execute');
            }

        }

        function getLifeBar(life, lifemax) {

            function progress(maxticks, atual, max, percento) {

                const percentage = atual / max;
                const progress = Math.round((maxticks * percentage));
                const emptyProgress = maxticks - progress;

                const frame1 = "<:life:926185180920692786>"
                const frame2 = "<:life:926185180752928838>"
                const frame3 = "<:life:926192169755238440>"
                const frame4 = "<:life:926192859097485342>"
                const frame5 = "<:life:926192858996826122>"
                const frame6 = "<:life:926192858925498460>"
            
                const progressText = frame2.repeat((progress-1 <= 0 ? 0 : progress-1));
                const emptyProgressText = frame5.repeat((emptyProgress-1 <= 0 ? 0 : emptyProgress-1));

                const initProgressText = percentage <= 0 ? frame4 : frame1;
                const endProgressText = percentage >= 0.95 ? frame3 : frame6;
            
                const bar = initProgressText + progressText + emptyProgressText + endProgressText + (percento ? Math.round((percentage)*100) + " %" : " (" + atual + "/" + max +")") ;
                
                return bar;
            }

            const lifebar = progress(8, life < 0 ? 0 : life, lifemax)

            return lifebar

        }

        const filter = i => i.user.id === interaction.user.id && reactequiplist.includes(i.customId);
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 45000 });

        collector.on('collect', async (b) => {

            if (b.customId === 'changeMode') {

                try { 
                    currentmode = currentmode == 0 ? 1 : 0
                    if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.duck.defer_update'); });
                    const components = getComponents()
                    return interaction.editReply({ components: [...await getContainers(), ...components], flags: Discord.MessageFlags.IsComponentsV2 })
                } catch (error) {
                    return reportError(error, 'command.duck.reply');
                }

            }

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

                const avatarurl = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })

                let machineobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
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
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[3].id}.png?v=1`,
                        x: 93,
                        y: 54,
                    },
                    {
                        img: `https://cdn.discordapp.com/emojis/${equips[4].id}.png?v=1`,
                        x: 113,
                        y: 54,
                    }
                ]

                if (dead || b.customId == 'fight' || b.customId == 'autofight') {
                    var huntimage = await imagesService.imagegens.get('battle.js')({
    
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
                player.sta -= td_.player

                return { attach: huntimage, plost }

            }

            async function monsterlost(mo) {
                
                let xp = utility.random(Math.round((mo.level+1)), Math.round((mo.level+1)*1.15))
                xp = await playersService.execExp(interaction, xp)

                crateExtensionService.give(interaction.user.id, 4, 1)

                const hasKilled = eventsService.duck.killed.find((killed) => killed.id == interaction.user.id)

                if (hasKilled === undefined) {
                    eventsService.duck.killed.push({ id: interaction.user.id, amount: 1 })
                } else {
                    const index = eventsService.duck.killed.indexOf(hasKilled)
                    if (index > -1) {
                        eventsService.duck.killed = eventsService.duck.killed.splice(index, 1);
                    }
                    hasKilled.amount = 2
                    eventsService.duck.killed.push({ id: interaction.user.id, amount: 2 })
                }

                losedesc = (`✅ Você ganhou a batalha! **(+${xp} XP)**\n \nDrops do monstro:\n**1x <:mystegg:919946658886864916> Ovo de pato dourado**\n \nColocados na mochila:\n**1x <:mystegg:919946658886864916> Ovo de pato dourado**\n \nDescartados:\nNenhum item descartado\n \nVisualize os itens colocados usando \`/mochila\``)
            }
            
            async function playerlost(member) {
                
                losedesc = (`❌ Você perdeu a batalha contra o pato dourado!`)
                player.sta = 0
                eventsService.duck.killed.push(member.id)

            }
            
            if ((b.customId == 'fight') && !inbattle) {

                const index = reactequiplist.indexOf('fight');
                if (index > -1) {
                    reactequiplist.splice(index, 1);
                }

                await interaction.editReply({ components: [buildMessage(interaction, { color: '#36393f', description: 'Carregando caça...' })], flags: Discord.MessageFlags.IsComponentsV2 })

                try {
                    await cacheListsService.waiting.add(interaction.user.id, embedinteraction, 'patodourado')

                    inbattle = true
 
                    const components = getComponents()
                    
                    const firstbuild = await build()
                    
                    await interaction.editReply({ components: [...await getContainers(), ...components], files: [firstbuild.attach], flags: Discord.MessageFlags.IsComponentsV2 });

                } catch (error) {
                    reportError(error, 'command.duck.collector');
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
                    
                if (combo.length >= 5) combo = []
                combo.push(clientService.current.emojis.cache.get(b.customId))

                if (combo.length >= 5) {
                    youhasbeencombedmeuamigo = true
                } else {
                    youhasbeencombedmeuamigo = false
                }

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
                
                if (runtime.debug) console.log(`${eq.name}`.yellow)
                
                let buildlost = await build(lost)

                let components = getComponents()
                
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
                    await playerlost(interaction.user)
                } else if (monster.csta <= 0) {
                    currinteraction = `\n🎗 ${monster.name} perdeu o combate!`
                    await monsterlost(monster)
                }

                if (dead) {
                    components = []
                    await cacheListsService.waiting.remove(interaction.user.id, 'patodourado')
                    collector.stop();
                }

                await interaction.editReply({ components: [...await getContainers(currinteraction), ...components], flags: Discord.MessageFlags.IsComponentsV2 })

            }

            await go()

            collector.resetTimer();

        });
        
        collector.on('end', async collected => {
            await cacheListsService.waiting.remove(interaction.user.id, 'patodourado')
            playersService.cooldown.set(interaction.user.id, "patodourado", 0);

            if (dead) return

            if (reacted) {
                interaction.editReply({ components: [buildMessage(interaction, { color: '#a60000', title: 'Mas que covarde!', description: '❌ Você não teve coragem de atacar o pato dourado e saiu correndo do combate!' })], attachments: [], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            
            }
            interaction.editReply({ components: [buildMessage(interaction, { color: '#a60000', title: 'Oops, o pato dourado percebeu sua presença!', description: '❌ Você demorou demais para a caçada e o pato dourado conseguiu fugir a tempo' })], attachments: [], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });
        
	}
};
