const machinesService = require('../../_classes/services/machines');
const Discord = require('discord.js');
const cacheListsService = require('../../_classes/services/cacheLists');
const shopService = require('../../_classes/services/shop');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const itemsService = require('../../_classes/services/items');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');

function buildMiningStatusContainer(message) {
    return new ContainerBuilder()
        .setAccentColor(0x36393f)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## MINERACAO ENCERRADA\n${message}`)
        );
}

module.exports = {
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
    mastery: 25,
	async execute(interaction) {
        
        const member = interaction.user
        await interaction.deferReply();

        const isFull = await machinesService.storage.isFull(member.id);
        const hasMachine = await machinesService.has(member.id);

        if (!(hasMachine)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Você ainda não possui uma máquina!\nAcesse `/loja maquinas` para visualizar as maquinas disponíveis')],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        if (await cacheListsService.waiting.includes(member.id, 'mining')) {
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Você já encontra-se minerando no momento! [[VER MINERACAO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})`)],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

		if (isFull) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize `/armazém` para visualizar seus recursos\nUtilize `/vender` para vender os recursos')],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        const user_id = BigInt(member.id)
        let playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
        let maqid = playerobj.machine;

        let maq = await shopService.getProduct(maqid);
        if (!maq) throw new Error(`Machine product not found: ${maqid}`);

        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize `/maquina` para reparar a sua máquina.')],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        const { energia, energiamax, time } = await machinesService.getEnergy(interaction.user.id)

        if (energia < Math.round(15*energiamax/100)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Sua máquina precisa de no mínimo ${Math.round(15*energiamax/100)} de energia para ligar\nVisualize a energia utilizando \`/maquina\``)],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        const check = await playersService.cooldown.check(member.id, "mine");
        if (check) {
            const cooldown = await playersService.cooldown.get(member.id, 'mine');
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Aguarde mais ${utility.ms(cooldown)} para executar um comando de mineracao.`)],
                flags: Discord.MessageFlags.IsComponentsV2
            });
            return;
        }

        playersService.cooldown.set(member.id, "mine", 15);

        if (energia >= energiamax) {
            await cacheListsService.waiting.remove(member.id, 'mining')
        }

        let init = Date.now();
        let obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });

        let timeupdate = machinesService.update*1000

        const array = obj6.slots == null ? [] : obj6.slots
        for (const i of array){
            const chipId = typeof i === 'object' ? i.id : i;
            const chipproduct = await shopService.getProduct(chipId);
            if (chipproduct?.typeeffect == 4) {
            timeupdate -= Math.round(chipproduct.sizeeffect*1000)
            };
        }

        let btn = utility.createButton('stopBtn', 'DANGER', 'Parar mineracao')

        await cacheListsService.waiting.add(member.id, interaction, 'mining');

        let embedinteraction

        function buildMiningContainer({ description, machine, mining, ores, showStop = true }) {
            const container = new ContainerBuilder()
                .setAccentColor(0x36393f)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(description),
                    new TextDisplayBuilder().setContent(machine),
                    new TextDisplayBuilder().setContent(mining),
                    new TextDisplayBuilder().setContent(ores)
                );

            if (showStop) {
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(btn)
                );
            }

            return container;
        }

        function buildProgress(current, max, size = 10) {
            const safeMax = Math.max(Number(max) || 0, 1);
            const safeCurrent = Math.max(0, Math.min(Number(current) || 0, safeMax));
            const filled = Math.round((safeCurrent / safeMax) * size);
            return `[${'#'.repeat(filled)}${'-'.repeat(size - filled)}] ${current}/${max}`;
        }

        function buildOreText(ores) {
            if (ores.length === 0) return '**Minerios coletados**\nNenhum minerio coletado neste update.';

            const lines = ores.map(({ name, amount, chips }) => {
                const chipText = chips.length > 0 ? ` | Chips: ${chips.join(', ')}` : '';
                return `- ${name}: +${amount}g | Update: ${amount}g${chipText}`;
            });

            return `**Minerios coletados**\n${lines.join('\n')}`;
        }

        let haschipe7 = false
        let hastotalchipe7 = 0

        function checkChipe7() {
            if (haschipe7) {
                economyService.addToHistory(interaction.user.id, `Venda CHIP 7 | + ${utility.format(hastotalchipe7)} ${utility.money}`)
            }
        }

        async function edit() {

            try{

                let profundidade = await machinesService.getDepth(member.id)

                await itemsService.removeChipsDurability(member.id, utility.random(1, 10))

                let playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                let maqid = playerobj.machine;
                let maq = await shopService.getProduct(maqid);

                const obj2 = await machinesService.ores.gen(maq, profundidade, playerobj.slots == null ? [] : playerobj.slots);

                const oreDetails = new Map();
                let round = 0;
                let xp = utility.random(20, 40);
                xp = await playersService.execExp(interaction, xp);
                await machinesService.removeEnergy(member.id, 1);
                
                async function setMaintenance() {
                    
                    const value = utility.random(1, 16) * (maq.tier+1);
                    
                    var { durability, pressure, refrigeration } = await machinesService.getMaintenance(member.id, true)
                    var [ user_durability, durabilityMax, durabilityPercent ] = durability
                    var [ user_pressure, pressureMax, pressurePercent ] = pressure
                    var [ user_refrigeration, refrigerationMax, refrigerationPercent ] = refrigeration

                    if (user_durability == 0) {
                        await prisma.machines.update({ where: { user_id }, data: { durability: durabilityMax } })
                    }
                    if (user_pressure == 0) {
                        await prisma.machines.update({ where: { user_id }, data: { pressure: Math.round(pressureMax/2) } })
                    }
                    if (user_refrigeration == 0) {
                        await prisma.machines.update({ where: { user_id }, data: { refrigeration: refrigerationMax } })
                    }

                    var { durability, pressure, refrigeration } = await machinesService.getMaintenance(member.id)
                    var [ user_durability, _, durabilityPercent ] = durability
                    var [ user_pressure, pressureMax, pressurePercent ] = pressure
                    var [ user_refrigeration, refrigerationMax, refrigerationPercent ] = refrigeration

                    const array = playerobj.slots == null ? [] : playerobj.slots

                    async function checkDurability() {
                        const name = "durability"
                        try {
                            if (durabilityPercent < 1) {
                                await prisma.machines.update({ where: { user_id }, data: { [name]: 0 } })
                            } else {
                                let fvalue = value
                                for (const i of array){
                                    const chipId = typeof i === 'object' ? i.id : i;
                                    const chipproduct = await shopService.getProduct(chipId);
                                    if (chipproduct?.typeeffect == 3) {
                                        fvalue -= Math.round(chipproduct.sizeeffect*fvalue/100)
                                    };
                                }
                                await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: -fvalue } } })
                            }
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.durability', { userId: member.id });
                        }

                    }

                    async function checkPressure() {
                        const name = "pressure"
                        try {
                            if (refrigerationPercent <= 40) {
                                if (utility.random(0, 100) < utility.random(40, 70)) {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: value*6 } } })
                                } else {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: -value*2 } } })
                                }
                            } if (refrigerationPercent > 40) {
                                if (utility.random(0, 100) < utility.random(40, 70)) {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: -value*2 } } })
                                } else {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: value } } })
                                }
                            }
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.pressure', { userId: member.id });
                        }
                    }

                    async function checkPollutants() {
                        const name = "pollutants"
                        try {
                            if (pressurePercent > 60) {
                                if (utility.random(0, 100) < utility.random(40, 80)) {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: value*5 } } })
                                } else {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: Math.round(value*2) } } })
                                }
                            } else {
                                if (utility.random(0, 100) < utility.random(40, 80)) {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: value*2 } } })
                                } else {
                                    await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: Math.round(value) } } })
                                }
                            }
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.pollutants', { userId: member.id });
                        }

                    }

                    async function checkRefrigeration() {
                        const name = "refrigeration"
                        try {
                            await prisma.machines.update({ where: { user_id }, data: { [name]: { increment: -value*4 } } })
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.refrigeration', { userId: member.id });
                        }
                    }

                    await checkDurability()
                    await checkPressure()
                    await checkPollutants()
                    await checkRefrigeration()

                }

                await setMaintenance()
                
                for await (const r of obj2) {

                    const ore = r.oreobj

                    let size = ore.size;

                    let arMax = await machinesService.storage.getMax(member.id);

                    if (await machinesService.storage.getSize(member.id)+size >= arMax) {
                        size -= (await machinesService.storage.getSize(member.id)+size-arMax)
                    }
                    const details = oreDetails.get(ore.name) || {
                        name: ore.name.charAt(0).toUpperCase() + ore.name.slice(1),
                        amount: 0,
                        chips: new Set()
                    };
                    details.amount += size;
                    for (const chipId of Object.keys(r.orechips || {})) details.chips.add(chipId.toUpperCase());
                    oreDetails.set(ore.name, details);
                    await itemsService.add(member.id, ore.name, size)
                    round += size;

                    if (r.orechips && r.orechips.chipe7) {
                        const minerioatual = (await itemsService.getObj()).minerios.find((i) => i.name == ore.name)
                        const totalchipe7 = Math.round(size * (minerioatual?.price?.max || 0))
                        hastotalchipe7 += totalchipe7
                        haschipe7 = true
                        await economyService.money.add(member.id, totalchipe7)
                    }

                    if (await machinesService.storage.getSize(member.id)+size >= arMax) break;
                    
                }
                
                let armazemmax2 = await machinesService.storage.getMax(member.id);
                const ep = await itemsService.getEquippedChips(member.id);

                const { energia, energiamax } = await machinesService.getEnergy(member.id)
                
                var { durability, pressure, pollutants, refrigeration } = await machinesService.getMaintenance(member.id, true)
                var [ _, _, durabilityPercent ] = durability
                var [ _, _, pressurePercent ] = pressure
                var [ _, _, pollutantsPercent ] = pollutants
                var [ _, _, refrigerationPercent ] = refrigeration

                const obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });
                const arsize = await machinesService.storage.getSize(member.id);
                const progress2 = buildProgress(energia + 1 < 0 ? 0 : energia + 1, energiamax);
                const chipNames = ep == null || ep.length === 0
                    ? 'Nenhum instalado'
                    : (await Promise.all(ep.map(async (i) => (await shopService.getProduct(i.id))?.name || `Chip ${i.id}`))).join(', ');
                const oreList = [...oreDetails.values()].map((details) => ({
                    ...details,
                    chips: [...details.chips]
                }));
                const container = buildMiningContainer({
                    description: `## MINERACAO | ${maq.name}\nMinerador: ${member}`,
                    machine: `**Armazem**\nCapacidade: ${arsize}/${armazemmax2}g\nArmazenado: ${arsize}g\nColetado neste update: ${round}g\n\n**Maquina**\nChips: ${chipNames}\nProfundidade: ${profundidade}m\nDurabilidade: ${durabilityPercent}%\nPressao: ${pressurePercent}%\nRefrigeracao: ${refrigerationPercent}%\nPoluentes: ${pollutantsPercent}%`,
                    mining: `**Mineracao**\nNivel: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level * 1980} (${(100 * obj6.xp / (obj6.level * 1980)).toFixed(2)}%) (+${xp} XP)\nEnergia: ${progress2}\nAtualizacao: ${timeupdate / 1000}s\nTempo minerando: ${utility.ms(Date.now() - init)}`,
                    ores: buildOreText(oreList)
                });

                try{
                    embedinteraction = await interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                } catch (error) {
                    await cacheListsService.waiting.remove(member.id, 'mining')
                    throw reportError(error, 'command.minerar.initial_reply', { userId: member.id });
                }

                async function checkStop() {

                    let isStopping = false
                    let stoppingMessage = ""
                    
                    var { durability, pressure, pollutants, refrigeration } = await machinesService.getMaintenance(member.id)

                    var [ _, _, durabilityPercent ] = durability
                    var [ _, _, pressurePercent ] = pressure
                    var [ _, _, pollutantsPercent ] = pollutants
                    var [ _, _, refrigerationPercent ] = refrigeration

                    const storagesize = await machinesService.storage.getSize(member.id)
                    const storagemax = await machinesService.storage.getMax(member.id);

                    async function checkMaintenance(name, percent) {

                        if (name == 'durability' && percent < 1) {
                            stoppingMessage = `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent < 20) {
                            stoppingMessage = `Sua máquina não possui pressão para continuar minerando! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent > 80) {
                            stoppingMessage = `A pressão da sua máquina está em nível crítico para continuar minerando! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pollutants' && percent > 90) {
                            stoppingMessage = `Sua máquina está com o máximo de poluentes armazenados! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'refrigeration' && percent < 15) {
                            stoppingMessage = `Sua máquina não possui líquido de refrigeração suficiente para manter a pressão da máquina! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        }
                    }

                    await checkMaintenance('durability', durabilityPercent)
                    await checkMaintenance('pressure', pressurePercent)
                    await checkMaintenance('pollutants', pollutantsPercent)
                    await checkMaintenance('refrigeration', refrigerationPercent)

                    if (storagesize >= storagemax) {
                        stoppingMessage = `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }
                    if ((energia+1 < 0 ? 0 : energia+1) <= 0) {
                        stoppingMessage = `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${await cacheListsService.waiting.getLink(member.id, 'mining')})\nVisualize a energia utilizando \`/maquina\``
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }

                    return { isStopping, stoppingMessage }
                }

                const { isStopping, stoppingMessage } = await checkStop()

                if (isStopping) {
                    if (haschipe7) {
                        economyService.addToHistory(interaction.user.id, `Venda CHIP 7 | + ${utility.format(hastotalchipe7)} ${utility.money}`)
                    }
                    await cacheListsService.waiting.remove(member.id, 'mining')
                    await interaction.editReply({
                        components: [buildMiningStatusContainer(stoppingMessage)],
                        flags: Discord.MessageFlags.IsComponentsV2
                    })
                    return
                }

                let stopped = false

                const filter = i => i.user.id === member.id;

                const collector = embedinteraction.createMessageComponentCollector({ filter, time: timeupdate });

                collector.on('collect', async (b) => {

                    if (b.customId == 'stopBtn') {
                        if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.minerar.defer_update'); });
                        stopped = true
                    await cacheListsService.waiting.remove(member.id, 'mining')
                        await interaction.editReply({
                            components: [buildMiningStatusContainer('Você parou o funcionamento da sua máquina!')],
                            flags: Discord.MessageFlags.IsComponentsV2
                        })
                        collector.stop();
                    }
                });

                collector.on('end', async collected => {
                    if (stopped) {
                        checkChipe7()
                        await cacheListsService.waiting.remove(member.id, 'mining');
                    } else {
                        edit().catch(async (error) => {
                            reportError(error, 'command.minerar.collector', { userId: member.id });
                            await cacheListsService.waiting.remove(member.id, 'mining');
                        });
                    }
                });

            } catch (error) {
                checkChipe7()
                await cacheListsService.waiting.remove(member.id, 'mining');
                throw reportError(error, 'command.minerar.progress', { userId: member.id });
            }
        }
        try {
            await edit();
        } catch (error) {
            await cacheListsService.waiting.remove(member.id, 'mining');
            throw reportError(error, 'command.minerar', { userId: member.id });
        }
	}
};
