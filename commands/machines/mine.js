const Database = require('../../_classes/manager/DatabaseManager');
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const DatabaseManager = new Database();

function buildMiningStatusContainer(message) {
    return new ContainerBuilder()
        .setAccentColor(0x36393f)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## MINERACAO ENCERRADA\n${message}`)
        );
}

module.exports = {
    requiredServices: ["Discord","cacheLists","createButton","eco","format","itemExtension","maqExtension","money","ms","playerUtils","random","shopExtension"],
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
    mastery: 25,
	async execute(interaction, svcDiscord, svcCacheLists, svcCreateButton, svcEco, svcFormat, svcItemExtension, svcMaqExtension, svcMoney, svcMs, svcPlayerUtils, svcRandom, svcShopExtension) {
        
        const member = interaction.user
        await interaction.deferReply();

        const isFull = await svcMaqExtension.storage.isFull(member.id);
        const hasMachine = await svcMaqExtension.has(member.id);

        if (!(hasMachine)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Você ainda não possui uma máquina!\nAcesse `/loja maquinas` para visualizar as maquinas disponíveis')],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

        if (await svcCacheLists.waiting.includes(member.id, 'mining')) {
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Você já encontra-se minerando no momento! [[VER MINERACAO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})`)],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

		if (isFull) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize `/armazém` para visualizar seus recursos\nUtilize `/vender` para vender os recursos')],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

        let playerobj = await DatabaseManager.get(member.id, 'machines');
        let maqid = playerobj.machine;

        let maq = svcShopExtension.getProduct(maqid);
        if (!maq) throw new Error(`Machine product not found: ${maqid}`);

        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer('Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize `/maquina` para reparar a sua máquina.')],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

        const { energia, energiamax, time } = await svcMaqExtension.getEnergy(interaction.user.id)

        if (energia < Math.round(15*energiamax/100)) {
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Sua máquina precisa de no mínimo ${Math.round(15*energiamax/100)} de energia para ligar\nVisualize a energia utilizando \`/maquina\``)],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

        const check = await svcPlayerUtils.cooldown.check(member.id, "mine");
        if (check) {
            const cooldown = await svcPlayerUtils.cooldown.get(member.id, 'mine');
            await interaction.editReply({
                components: [buildMiningStatusContainer(`Aguarde mais ${svcMs(cooldown)} para executar um comando de mineracao.`)],
                flags: svcDiscord.MessageFlags.IsComponentsV2
            });
            return;
        }

        svcPlayerUtils.cooldown.set(member.id, "mine", 15);

        if (energia >= energiamax) {
            await svcCacheLists.waiting.remove(member.id, 'mining')
        }

        let init = Date.now();
        let obj6 = await DatabaseManager.get(member.id, "machines");

        let timeupdate = svcMaqExtension.update*1000

        const array = obj6.slots == null ? [] : obj6.slots
        for (const i of array){
            const chipId = typeof i === 'object' ? i.id : i;
            const chipproduct = svcShopExtension.getProduct(chipId);
            if (chipproduct?.typeeffect == 4) {
            timeupdate -= Math.round(chipproduct.sizeeffect*1000)
            };
        }

        let btn = svcCreateButton('stopBtn', 'DANGER', 'Parar mineracao')

        await svcCacheLists.waiting.add(member.id, interaction, 'mining');

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
                svcEco.addToHistory(interaction.user.id, `Venda CHIP 7 | + ${svcFormat(hastotalchipe7)} ${svcMoney}`)
            }
        }

        async function edit() {

            try{

                let profundidade = await svcMaqExtension.getDepth(member.id)

                await svcItemExtension.removeChipsDurability(member.id, svcRandom(1, 10))

                let playerobj = await DatabaseManager.get(member.id, 'machines');
                let maqid = playerobj.machine;
                let maq = svcShopExtension.getProduct(maqid);

                const obj2 = await svcMaqExtension.ores.gen(maq, profundidade, playerobj.slots == null ? [] : playerobj.slots);

                const oreDetails = new Map();
                let round = 0;
                let xp = svcRandom(20, 40);
                xp = await svcPlayerUtils.execExp(interaction, xp);
                await svcMaqExtension.removeEnergy(member.id, 1);
                
                async function setMaintenance() {
                    
                    const value = svcRandom(1, 16) * (maq.tier+1);
                    
                    var { durability, pressure, refrigeration } = await svcMaqExtension.getMaintenance(member.id, true)
                    var [ user_durability, durabilityMax, durabilityPercent ] = durability
                    var [ user_pressure, pressureMax, pressurePercent ] = pressure
                    var [ user_refrigeration, refrigerationMax, refrigerationPercent ] = refrigeration

                    if (user_durability == 0) {
                        await DatabaseManager.set(member.id, 'machines', "durability", durabilityMax)
                    }
                    if (user_pressure == 0) {
                        await DatabaseManager.set(member.id, 'machines', "pressure", Math.round(pressureMax/2))
                    }
                    if (user_refrigeration == 0) {
                        await DatabaseManager.set(member.id, 'machines', "refrigeration", refrigerationMax)
                    }

                    var { durability, pressure, refrigeration } = await svcMaqExtension.getMaintenance(member.id)
                    var [ user_durability, _, durabilityPercent ] = durability
                    var [ user_pressure, pressureMax, pressurePercent ] = pressure
                    var [ user_refrigeration, refrigerationMax, refrigerationPercent ] = refrigeration

                    const array = playerobj.slots == null ? [] : playerobj.slots

                    async function checkDurability() {
                        const name = "durability"
                        try {
                            if (durabilityPercent < 1) {
                                await DatabaseManager.set(member.id, 'machines', name, 0)
                            } else {
                                let fvalue = value
                                for (const i of array){
                                    const chipId = typeof i === 'object' ? i.id : i;
                                    const chipproduct = svcShopExtension.getProduct(chipId);
                                    if (chipproduct?.typeeffect == 3) {
                                        fvalue -= Math.round(chipproduct.sizeeffect*fvalue/100)
                                    };
                                }
                                await DatabaseManager.increment(member.id, 'machines', name, -fvalue)
                            }
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.durability', { userId: member.id });
                        }

                    }

                    async function checkPressure() {
                        const name = "pressure"
                        try {
                            if (refrigerationPercent <= 40) {
                                if (svcRandom(0, 100) < svcRandom(40, 70)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*6)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, -value*2)
                                }
                            } if (refrigerationPercent > 40) {
                                if (svcRandom(0, 100) < svcRandom(40, 70)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, -value*2)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, value)
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
                                if (svcRandom(0, 100) < svcRandom(40, 80)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*5)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, Math.round(value*2))
                                }
                            } else {
                                if (svcRandom(0, 100) < svcRandom(40, 80)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*2)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, Math.round(value))
                                }
                            }
                        } catch (error) {
                            throw reportError(error, 'command.minerar.maintenance.pollutants', { userId: member.id });
                        }

                    }

                    async function checkRefrigeration() {
                        const name = "refrigeration"
                        try {
                            await DatabaseManager.increment(member.id, 'machines', name, -value*4)
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

                    let arMax = await svcMaqExtension.storage.getMax(member.id);

                    if (await svcMaqExtension.storage.getSize(member.id)+size >= arMax) {
                        size -= (await svcMaqExtension.storage.getSize(member.id)+size-arMax)
                    }
                    const details = oreDetails.get(ore.name) || {
                        name: ore.name.charAt(0).toUpperCase() + ore.name.slice(1),
                        amount: 0,
                        chips: new Set()
                    };
                    details.amount += size;
                    for (const chipId of Object.keys(r.orechips || {})) details.chips.add(chipId.toUpperCase());
                    oreDetails.set(ore.name, details);
                    svcItemExtension.add(member.id, ore.name, size)
                    round += size;

                    if (r.orechips && r.orechips.chipe7) {
                        const minerioatual = svcItemExtension.getObj().minerios.find((i) => i.name == ore.name)
                        const totalchipe7 = Math.round(size * (minerioatual?.price?.max || 0))
                        hastotalchipe7 += totalchipe7
                        haschipe7 = true
                        svcEco.svcMoney.add(member.id, totalchipe7)
                    }

                    if (await svcMaqExtension.storage.getSize(member.id)+size >= arMax) break;
                    
                }
                
                let armazemmax2 = await svcMaqExtension.storage.getMax(member.id);
                const ep = await svcItemExtension.getEquippedChips(member.id);

                const { energia, energiamax } = await svcMaqExtension.getEnergy(member.id)
                
                var { durability, pressure, pollutants, refrigeration } = await svcMaqExtension.getMaintenance(member.id, true)
                var [ _, _, durabilityPercent ] = durability
                var [ _, _, pressurePercent ] = pressure
                var [ _, _, pollutantsPercent ] = pollutants
                var [ _, _, refrigerationPercent ] = refrigeration

                const obj6 = await DatabaseManager.get(member.id, "machines");
                const arsize = await svcMaqExtension.storage.getSize(member.id);
                const progress2 = buildProgress(energia + 1 < 0 ? 0 : energia + 1, energiamax);
                const chipNames = ep == null || ep.length === 0
                    ? 'Nenhum instalado'
                    : ep.map((i) => svcShopExtension.getProduct(i.id)?.name || `Chip ${i.id}`).join(', ');
                const oreList = [...oreDetails.values()].map((details) => ({
                    ...details,
                    chips: [...details.chips]
                }));
                const container = buildMiningContainer({
                    description: `## MINERACAO | ${maq.name}\nMinerador: ${member}`,
                    machine: `**Armazem**\nCapacidade: ${arsize}/${armazemmax2}g\nArmazenado: ${arsize}g\nColetado neste update: ${round}g\n\n**Maquina**\nChips: ${chipNames}\nProfundidade: ${profundidade}m\nDurabilidade: ${durabilityPercent}%\nPressao: ${pressurePercent}%\nRefrigeracao: ${refrigerationPercent}%\nPoluentes: ${pollutantsPercent}%`,
                    mining: `**Mineracao**\nNivel: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level * 1980} (${(100 * obj6.xp / (obj6.level * 1980)).toFixed(2)}%) (+${xp} XP)\nEnergia: ${progress2}\nAtualizacao: ${timeupdate / 1000}s\nTempo minerando: ${svcMs(Date.now() - init)}`,
                    ores: buildOreText(oreList)
                });

                try{
                    embedinteraction = await interaction.editReply({ components: [container], flags: svcDiscord.MessageFlags.IsComponentsV2 })
                } catch (error) {
                    await svcCacheLists.waiting.remove(member.id, 'mining')
                    throw reportError(error, 'command.minerar.initial_reply', { userId: member.id });
                }

                async function checkStop() {

                    let isStopping = false
                    let stoppingMessage = ""
                    
                    var { durability, pressure, pollutants, refrigeration } = await svcMaqExtension.getMaintenance(member.id)

                    var [ _, _, durabilityPercent ] = durability
                    var [ _, _, pressurePercent ] = pressure
                    var [ _, _, pollutantsPercent ] = pollutants
                    var [ _, _, refrigerationPercent ] = refrigeration

                    const storagesize = await svcMaqExtension.storage.getSize(member.id)
                    const storagemax = await svcMaqExtension.storage.getMax(member.id);

                    async function checkMaintenance(name, percent) {

                        if (name == 'durability' && percent < 1) {
                            stoppingMessage = `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent < 20) {
                            stoppingMessage = `Sua máquina não possui pressão para continuar minerando! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent > 80) {
                            stoppingMessage = `A pressão da sua máquina está em nível crítico para continuar minerando! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pollutants' && percent > 90) {
                            stoppingMessage = `Sua máquina está com o máximo de poluentes armazenados! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'refrigeration' && percent < 15) {
                            stoppingMessage = `Sua máquina não possui líquido de refrigeração suficiente para manter a pressão da máquina! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        }
                    }

                    await checkMaintenance('durability', durabilityPercent)
                    await checkMaintenance('pressure', pressurePercent)
                    await checkMaintenance('pollutants', pollutantsPercent)
                    await checkMaintenance('refrigeration', refrigerationPercent)

                    if (storagesize >= storagemax) {
                        stoppingMessage = `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }
                    if ((energia+1 < 0 ? 0 : energia+1) <= 0) {
                        stoppingMessage = `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${await svcCacheLists.waiting.getLink(member.id, 'mining')})\nVisualize a energia utilizando \`/maquina\``
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }

                    return { isStopping, stoppingMessage }
                }

                const { isStopping, stoppingMessage } = await checkStop()

                if (isStopping) {
                    if (haschipe7) {
                        svcEco.addToHistory(interaction.user.id, `Venda CHIP 7 | + ${svcFormat(hastotalchipe7)} ${svcMoney}`)
                    }
                    await svcCacheLists.waiting.remove(member.id, 'mining')
                    await interaction.editReply({
                        components: [buildMiningStatusContainer(stoppingMessage)],
                        flags: svcDiscord.MessageFlags.IsComponentsV2
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
                    await svcCacheLists.waiting.remove(member.id, 'mining')
                        await interaction.editReply({
                            components: [buildMiningStatusContainer('Você parou o funcionamento da sua máquina!')],
                            flags: svcDiscord.MessageFlags.IsComponentsV2
                        })
                        collector.stop();
                    }
                });

                collector.on('end', async collected => {
                    if (stopped) {
                        checkChipe7()
                        await svcCacheLists.waiting.remove(member.id, 'mining');
                    } else {
                        edit().catch(async (error) => {
                            reportError(error, 'command.minerar.collector', { userId: member.id });
                            await svcCacheLists.waiting.remove(member.id, 'mining');
                        });
                    }
                });

            } catch (error) {
                checkChipe7()
                await svcCacheLists.waiting.remove(member.id, 'mining');
                throw reportError(error, 'command.minerar.progress', { userId: member.id });
            }
        }
        try {
            await edit();
        } catch (error) {
            await svcCacheLists.waiting.remove(member.id, 'mining');
            throw reportError(error, 'command.minerar', { userId: member.id });
        }
	}
};
