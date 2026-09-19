const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const itemsService = require('../../_classes/services/items');
const townsService = require('../../_classes/services/towns');
const runtime = require('../../_classes/services/runtime');
const companyService = require('../../_classes/services/company');
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'coletar',
    aliases: ['col', 'collect'],
    category: 'none',
    description: 'Coleta diferente sementes e flores para plantação',
    mastery: 30,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        
        const user_id = BigInt(interaction.user.id)
        let pobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

        if (pobj2.level < 3) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui nível o suficiente para iniciar uma coleta!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'collecting')) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você já encontra-se coletando no momento! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        const sta = await playersService.stamina.get(interaction.user.id);

        if (sta < 40) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você precisa de no mínimo 40 pontos de Estamina para iniciar uma coleta!\nVisualize sua estamina atual usando \`/estamina\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let btn = utility.createButton('stopBtn', 'DANGER', 'Parar coleta')

        let init = Date.now();

        let seedobj = (await itemsService.getObj()).drops.filter(i => i.type == "seed");
        let loc = await townsService.getTownNum(interaction.user.id)
        seedobj = seedobj.filter(seed => seed.loc.includes(loc.toString()) || seed.loc.includes('*'))
        if (runtime.debug) console.log(seedobj)

        let obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
        const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Coletando`),
            new TextDisplayBuilder().setContent(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`),
            new TextDisplayBuilder().setContent(`**🍁 Informações de coleta**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${sta}/1000 🔸`),
            new TextDisplayBuilder().setContent(`-# Tempo de atualização: ${companyService.jobs.agriculture.update} segundos\nTempo coletando: ${utility.ms(Date.now()-init)}`)
        )
        const embedinteraction = (await interaction.reply({ components: [container, new ActionRowBuilder().addComponents(btn)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        await cacheListsService.waiting.add(interaction.user.id, interaction, 'collecting');
        await cacheListsService.waiting.add(interaction.user.id, interaction, 'working');
        
        async function gen(){
            let por = 6;
            let array = [];
            let i = 1
            for (const seed of seedobj) {
                if (seed != undefined) {
                    let t = Math.round((61/(parseFloat(`1.${utility.random(6, 9)}${utility.random(0, 9)}`)))*0.1);
                    t += Math.round(por/i/2*0.1);

                    t = Math.round((seed.name.toLowerCase().includes('soja') ? t * 1.7 :t )/2);
                    let d = await itemsService.get(seed.name);
                    d.size = t;

                    let cha = utility.random(0, 100)
                    if (cha < d.chance) array.push(d)
                    i++
                }
            }
            return array;
        }

        let coletadox = new Map();

        async function edit() {

            try{

                const obj2 = await gen();

                let sizeMap = new Map();
                let round = 0;
                let xp = utility.random(2, 6);
                xp = await playersService.execExp(interaction, xp);
                const gastoestamina = utility.random(20, 40)
                await playersService.stamina.remove(interaction.user.id, gastoestamina);
                
                let retorno = await itemsService.give(interaction, obj2)
                let descartados = retorno.descartados
                let colocados = retorno.colocados

                for (const r of colocados) {

                    let size = r.size;

                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    round += size;
                    
                }

                const obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                let sta2 = await playersService.stamina.get(interaction.user.id);
                const progress = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Coletando`),
                    new TextDisplayBuilder().setContent(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`),
                    new TextDisplayBuilder().setContent(`**🍁 Informações de coleta**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEstamina: ${await playersService.stamina.get(interaction.user.id)}/1000 🔸 \`(-${gastoestamina})\``),
                    new TextDisplayBuilder().setContent(`-# Tempo de atualização: ${companyService.jobs.agriculture.update} segundos\nTempo coletando: ${utility.ms(Date.now()-init)}`)
                )

                for await (const r of colocados) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    
                    progress.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${r.icon} ${r.displayname} +${qnt}**\n\`\`\`autohotkey\nColetado: ${r.size}\`\`\``))
                }

                for await (const r of descartados) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    progress.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${r.icon} ${r.displayname} -${r.size}**\n\`\`\`autohotkey\n❌ Descartado: ${r.size}\`\`\``))
                }

                try{
                    await interaction.editReply({ components: [progress, new ActionRowBuilder().addComponents(btn)], flags: Discord.MessageFlags.IsComponentsV2 })
                } catch (error) {
                    reportError(error, 'command.coletar.edit_progress', { userId: interaction.user.id });
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                }

                if (descartados.length == seedobj.length) {
                    await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Itens foram descartados da sua mochila enquanto você coletava! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a mochila utilizando \`/mochila\``)], flags: Discord.MessageFlags.IsComponentsV2, mention: true } )
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                if (sta2 < gastoestamina) {
                    await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui estamina para continuar coletando! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a sua estamina utilizando \`/estamina\``)], flags: Discord.MessageFlags.IsComponentsV2, mention: true } )
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: companyService.jobs.agriculture.update*1000 });
                collector.on('collect', async (b) => {

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.coletar.defer_update'); });
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                        await cacheListsService.waiting.remove(interaction.user.id, 'working');
                        await interaction.editReply({ components: [new TextDisplayBuilder().setContent(`Coleta interrompida.`)], flags: Discord.MessageFlags.IsComponentsV2 })
                        await interaction.followUp({ components: [new TextDisplayBuilder().setContent(`Você parou a coleta!`)], flags: Discord.MessageFlags.IsComponentsV2})
                    } else {
                        edit()
                    }
                });

            }catch (err){
                clientService.current.emit('error', err)
            }
        }
        edit();
	}
};
