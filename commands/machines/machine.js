const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja a máquina de algum membro'))

module.exports = {
    requiredServices: ["Discord","cacheLists","client","createButton","createMenu","eco","format","img","itemExtension","maqExtension","money","moneyemoji","ms","playerUtils","rowComponents","sendError","shopExtension"],
    name: 'maquina',
    aliases: ['maquina', 'maq', 'machine'],
    category: 'Maquinas',
    description: 'Visualiza as informações da sua máquina',
    data,
    mastery: 35,
	async execute(interaction, svcDiscord, svcCacheLists, svcClient, svcCreateButton, svcCreateMenu, svcEco, svcFormat, svcImg, svcItemExtension, svcMaqExtension, svcMoney, svcMoneyemoji, svcMs, svcPlayerUtils, svcRowComponents, svcSendError, svcShopExtension) {

        let member = interaction.options.getUser('membro') || interaction.user

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "maq");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'maq', 'visualizar uma máquina')

            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "maq", 10);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações da máquina` })
        const embedinteraction = await interaction.fetchReply()

        const machinesobj = await DatabaseManager.get(member.id, 'machines')
        
        const memberobj = await DatabaseManager.get(member.id, 'players')

        const profundidade = await svcMaqExtension.getDepth(member.id)

        const machineid = machinesobj.machine;
        const machineproduct = svcShopExtension.getProduct(machineid);

        const { energia, energiamax, time } = await svcMaqExtension.getEnergy(member.id)

        const chips = await svcItemExtension.getChips(member.id);
        
        const mvp = (memberobj.mvp == null ? false : true)
        
        const maxslots = svcMaqExtension.getSlotMax(machinesobj.level, mvp)

        let equippedchips = await svcItemExtension.getEquippedChips(member.id);

        if (maxslots < 5) {
    
            let placa;
            let slot = 5-1;
            if (!(equippedchips[slot] == null || equippedchips[slot] == undefined|| equippedchips[slot] == 0)) {

                const eqslot = typeof equippedchips[slot] === 'object' ? equippedchips[slot].id : equippedchips[slot]
                placa = svcShopExtension.getProduct(eqslot);
    
                equippedchips.length == 1 ? equippedchips = [] : equippedchips.splice(slot, 1);
            
                await DatabaseManager.increment(member.id, 'storage', `"piece:${placa.id}"`, 1)
                await DatabaseManager.set(member.id, 'machines', `slots`, equippedchips)
                equippedchips = await svcItemExtension.getEquippedChips(member.id);
    
            }
    
        }

        let { pollutants, refrigeration, pressure, durability } = await svcMaqExtension.getMaintenance(member.id)

        var [_, _, durabilityPercent, durabilityPrice] = durability
        var [_, _, pressurePercent, pressurePrice] = pressure
        var [_, _, pollutantsPercent, pollutantsPrice] = pollutants
        var [_, _, refrigerationPercent, refrigerationPrice] = refrigeration

        async function getMachineImage () {

            try {
                const machineimage = await svcImg.imagegens.get('machine.js')(dependencies, {
    
                    profundidade,
                    energia,
                    energiamax,
                    machineproduct,
                    durabilityPercent,
                    pressurePercent,
                    pollutantsPercent,
                    refrigerationPercent,
                    maxslots,
                    equippedchips,
    
                })
                return machineimage;
            } catch (error) {
                throw reportError(error, 'command.maquina.image_generation', {
                    userId: interaction.user.id,
                    memberId: member.id,
                    machineId: machineproduct?.id,
                    image: machineproduct?.img
                });
            }

        }

        let machineimage = await getMachineImage();

        let rememberEnergy = false

        let isEquipping = false

        let isMaintenance = false

        async function makeComponents (disableall) {

            try {
                const components = [];
                const firstrow = []
                const isMining = await svcCacheLists.waiting.includes(member.id, 'mining')

                const energyBtnText = `[${energia}/${energiamax}]${energia < energiamax && !disableall && !rememberEnergy ? ' ' + svcMs(time, true) : ''}`
                const energyBtn = svcCreateButton('energyBtn', 'SUCCESS', energyBtnText, '🔋')

                if (energia == energiamax || disableall || rememberEnergy) {
                    energyBtn.setDisabled(true)
                }
                
                const getMaintenanceIcon = (type, percent) => {
                    const icons = []
                    if (type == 'durability') icons.push('🧰', '⚙', '🔩', '🔧')
                    if (type == 'pressure') icons.push('858463319904223252', '917061148715663420', '917061148715663420', '858463319904223252')
                    if (type == 'refrigeration') icons.push('917064899740438600', '917064899740438600', '917064899740438600', '917064899740438600')
                    if (type == 'pollutants') icons.push('917063856205991987', '917063856205991987', '917063856205991987', '917063856205991987')

                    if (percent <= 20) return icons[0]
                    if (percent <= 50) return icons[1]
                    if (percent <= 75) return icons[2]
                    if (percent <= 100) return icons[3]
                }
                
                const maintenanceBtn = svcCreateButton('maintenance', 'SUCCESS', 'Manutenção', '🔨')
                if (disableall || isMaintenance) {
                    maintenanceBtn.setDisabled(true)
                }

                const chipsBtn = svcCreateButton('chips', 'SUCCESS', 'Chipes', '833803786022682636')
                if (disableall || isEquipping) {
                    chipsBtn.setDisabled(true)
                }

                const repairBtnText = `${durabilityPercent < 60 ? `Reparar por ${svcFormat(durabilityPrice)} 💰` : `Reparado`}`
                const repairBtnIcon = getMaintenanceIcon('durability', durabilityPercent)
                const repairBtn = svcCreateButton('durability', 'SECONDARY', repairBtnText, repairBtnIcon)
                
                if (durabilityPercent >= 60 || disableall) {
                    repairBtn.setDisabled(true)
                }

                const pressureBtnText = `${pressurePercent < 20 || pressurePercent > 80 ? `Corrigir pressão por ${svcFormat(pressurePrice)} 💰` : `Presurizado`}`
                const pressureBtnIcon = getMaintenanceIcon('pressure', pressurePercent)
                const pressureBtn = svcCreateButton('pressure', 'SECONDARY', pressureBtnText, pressureBtnIcon)
                
                if ((pressurePercent >= 20 && pressurePercent <= 80) || disableall) {
                    pressureBtn.setDisabled(true)
                }

                const refrigerationBtnText = `${refrigerationPercent < 15 ? `Refrigerar por ${svcFormat(refrigerationPrice)} 💰` : `Refrigerado`}`
                const refrigerationBtnIcon = getMaintenanceIcon('refrigeration', refrigerationPercent)
                const refrigerationBtn = svcCreateButton('refrigeration', 'SECONDARY', refrigerationBtnText, refrigerationBtnIcon)
                
                if (refrigerationPercent >= 40 || disableall) {
                    refrigerationBtn.setDisabled(true)
                }

                const pollutantsBtnText = `${pollutantsPercent > 40 ? `Liberar poluentes por ${svcFormat(pollutantsPrice)} 💰` : `Sem poluentes`}`
                const pollutantsBtnIcon = getMaintenanceIcon('pollutants', pollutantsPercent)
                const pollutantsBtn = svcCreateButton('pollutants', 'SECONDARY', pollutantsBtnText, pollutantsBtnIcon)
                
                if (pollutantsPercent <= 40 || disableall) {
                    pollutantsBtn.setDisabled(true)
                }

                let unequipallBtn
                if (mvp) {
                    unequipallBtn = svcCreateButton('unequipall', 'SECONDARY', 'Desequipar todos', '🗑️')
                } else {
                    unequipallBtn = svcCreateButton('unequipall', 'DANGER', '[MVP] Desequipar todos', '758717273304465478').setDisabled(true)
                }

                if (disableall) unequipallBtn.setDisabled(true)

                if (isMining) {
                    const miningBtn = svcCreateButton((await svcCacheLists.waiting.getLink(member.id, 'mining') || ''), 'LINK', 'Ver mineração', '🔎')
                    firstrow.push(miningBtn)
                } else if (member.id == interaction.user.id) {
                    firstrow.push(energyBtn, maintenanceBtn, chipsBtn)
                    if (equippedchips.length > 0 && isEquipping) {
                        firstrow.push(unequipallBtn)
                    }
                }

                if (firstrow.length == 0) return []

                const row1 = svcRowComponents(firstrow)

                components.push(row1)

                if (isMining) return components

                if (maxslots > 0 && isEquipping) {

                    const slotsrow = [];

                    const genSlotBtn = (slot, { disableall, mvp }) => {
                        let slotBtnText = `[${slot+1}] `
                        let slotBtnIcon
                        let slotBtnColor = 'SECONDARY'
                        let type = 0
                        let isEquipBtn = false
                        if (equippedchips[slot]) {
                            const chipe = svcShopExtension.getProduct(equippedchips[slot].id);
                            slotBtnText += `Desequipar`
                            slotBtnIcon = chipe.icon
                            slotBtnColor = 'PRIMARY'
                            type = 1
                        } else {
                            isEquipBtn = true
                            slotBtnText = 'Equipar'
                            slotBtnIcon = '⬛'
                            type = 2
                        }
                        if (!mvp && slot == 4) {
                            slotBtnText = `[${slot+1}] ` + '[MVP]'
                            slotBtnIcon = '758717273304465478'
                            slotBtnColor = 'DANGER'
                        }
                        const slotBtn = svcCreateButton(`${type}-${slot}`, slotBtnColor, slotBtnText, slotBtnIcon)
                        if (disableall) slotBtn.setDisabled(true)
                        if (!mvp && slot == 4) slotBtn.setDisabled(true)
                        return { slotBtn, isEquipBtn }
                    }

                    let hasEquipBtn = false

                    for (let i = 0; i < maxslots; i++) {
                        const { slotBtn, isEquipBtn } = genSlotBtn(i, { disableall, mvp })
                        if (!hasEquipBtn && isEquipBtn) {
                            hasEquipBtn = true
                            slotsrow.push(slotBtn)
                        }
                        if (!isEquipBtn) {
                            slotsrow.push(slotBtn)
                        }

                    }

                    const row2 = svcRowComponents(slotsrow)

                    components.push(row2)

                }

                if (isMaintenance) {
                    const maintenancerow = []
                    maintenancerow.push(repairBtn, refrigerationBtn, pressureBtn, pollutantsBtn)
                    
                    const row3 = svcRowComponents(maintenancerow)

                    components.push(row3)
                }

                return components
            } catch (error) {
                throw reportError(error, 'command.maquina.components', {
                    userId: interaction.user.id,
                    memberId: member.id
                });
            }

        }

        const embed = new svcDiscord.MessageEmbed()

        function reworkEmbed(chips) {
            embed.fields = []
            let chipsmap = chips.map((p, index) => `**${p.size}x** ${p.icon} ${p.name} | **ID: ${index+1}**`).join('\n');
            embed.setDescription(`OBS: A cada **6 níveis** você adquire **+1 slot** para equipar chipes!\nVocê não pode desequipar chipes que perderam uma durabilidade, se não eles serão descartados!`)
            .addField(`<:chip:833521401951944734> Inventário de Chipes`, (chips.length <= 0 ? '**Não possui chipes de aprimoramento**' : chipsmap))
            embed.setAuthor(member.tag, member.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
            embed.setColor('#7e6eb5')
            embed.setImage('attachment://image.png')
        }

        reworkEmbed(chips)
        
        await interaction.editReply({ content: null, embeds: [embed], files: [machineimage], components: await makeComponents() });

        const filter = i => i.user.id === member.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        collector.on('collect', async (b) => {

            const isMining = await svcCacheLists.waiting.includes(member.id, 'mining')
            if (isMining) return collector.stop()

            const editObj = { embeds: [embed] }

            async function reworkImage() {
                machineimage = await getMachineImage();
                editObj.attachments = []
            }

            if (b.customId == 'selectchip') {
                if (b.values[0] != 'none') {
                    const selectedchip = parseInt(b.values[0].replace('chip-', ''))
                    await equipChip(selectedchip)
                    await reworkImage()
                }
            }
            
            if (b.customId == 'energyBtn') await pressEnergyBtn()

            if (['durability', 'pressure', 'refrigeration', 'pollutants'].includes(b.customId)) {
                await pressRepairBtn(b.customId)
                await reworkImage()
            }

            if (b.customId == 'unequipall') {
                await pressUnEquipAllChips()
                await reworkImage()
            }

            if (b.customId.includes('-')) {
                const splitId = b.customId.split('-')
                const type = parseInt(splitId[0])
                const slot = parseInt(splitId[1])
                if (type == 1) {
                    await pressUnEquipChip(slot)
                    await reworkImage()
                } else if (type == 2) {
                    var menu = await pressEquipChip()
                }
            }

            if (b.customId == 'chips') {
                isEquipping = true
                isMaintenance = false
            }
            
            if (b.customId == 'maintenance') {
                isMaintenance = true
                isEquipping = false
            }
            
            editObj.components = await makeComponents()
            editObj.files = [machineimage]

            if (menu) {
                editObj.components.push(svcRowComponents([menu]))
                //editObj.components.splice(1, 1)
            }
                
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.maquina.defer_update'));
            await interaction.editReply(editObj);
            collector.resetTimer();

        });
        
        collector.on('end', async collected => {
            interaction.editReply({ content: null, embeds: [embed], files: [machineimage], components: await makeComponents(true) });
        });

        async function pressEnergyBtn() {
            rememberEnergy = true
            const embed2 = new svcDiscord.MessageEmbed()

            const { energia, energiamax, time } = await svcMaqExtension.getEnergy(member.id)
            
            const pObj = await DatabaseManager.get(member.id, 'players')
            perm = pObj.perm
            
            embed2.addField(`<:energia:833370616304369674> Energia de \`${member.tag}\`: **[${energia}/${energiamax}]**`, `Irá recuperar completamente em: \`${svcMs(time)}\`\n**Você será relembrado quando sua energia recarregar!**\nOBS: A energia não recupera enquanto estiver usando!`)
            embed2.setColor('#42f569')
            embed2.setFooter(`1 ponto de energia recupera a cada ${svcMaqExtension.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            await interaction.followUp({ embeds: [embed2], flags: svcDiscord.MessageFlags.Ephemeral });

            if (await svcCacheLists.remember.includes(member.id, "energia")) return;
            await svcCacheLists.remember.add(member.id, interaction.channel.id, "energia");
            async function rem(){

                const { energia, energiamax, time } = await svcMaqExtension.getEnergy(member.id)

                if (energia >= energiamax) {
                    await interaction.channel.send({ content: `${interaction.user} Relatório de energia: ${energia}/${energiamax}`, mention: true})
                    if (await svcCacheLists.remember.includes(member.id, "energia")) {
                        await svcCacheLists.remember.remove(member.id, "energia")
                    }
                    return;
                } else {
                    setTimeout(function(){rem()}, time+1000)
                }
            
            }
            rem();
        }

        async function pressRepairBtn(repairType) {

            try {

                if (await svcCacheLists.waiting.includes(member.id, 'mining')) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no reparo', `Você não pode realizar reparos de uma máquina enquanto estiver minerando!`)
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                var maintenance = await svcMaqExtension.getMaintenance(member.id)
    
                var [_, maxdurability2, durabilityPercent2, durabilityPrice2] = maintenance.durability
                var [_, maxpressure2, pressurePercent2, pressurePrice2] = maintenance.pressure
                var [_, maxpollutants2, pollutantsPercent2, pollutantsPrice2] = maintenance.pollutants
                var [_, maxrefrigeration2, refrigerationPercent2, refrigerationPrice2] = maintenance.refrigeration
    
                const price = eval(repairType + 'Price2')
                const max = eval('max' + repairType + '2')
                const percent = eval(repairType + 'Percent2')

                const getMaintenanceIcon = (type, percent) => {
                    const icons = []
                    if (type == 'durability') icons.push('🧰', '⚙', '🔩', '🔧')
                    if (type == 'pressure') icons.push('858463319904223252', '917061148715663420', '917061148715663420', '858463319904223252')
                    if (type == 'refrigeration') icons.push('917064899740438600', '917064899740438600', '917064899740438600', '917064899740438600')
                    if (type == 'pollutants') icons.push('917063856205991987', '917063856205991987', '917063856205991987', '917063856205991987')
    
                    if (percent <= 20) return icons[0]
                    if (percent <= 50) return icons[1]
                    if (percent <= 75) return icons[2]
                    if (percent <= 100) return icons[3]
                }
    
                const svcMoney = await svcEco.svcMoney.get(member.id);
    
                if (svcMoney < price) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no reparo', `Você não possui dinheiro suficiente para reparar a sua máquina**!\nSeu dinheiro atual: **${svcFormat(svcMoney)}/${svcFormat(price)} ${svcMoney} ${svcMoneyemoji}**`)
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                const micon = getMaintenanceIcon(repairType, percent)

                await svcEco.svcMoney.remove(member.id, price);
                await svcEco.addToHistory(member.id, `Manutenção ${micon.length > 1 ? svcClient.emojis.cache.get(micon) : micon} | - ${svcFormat(price)}`)
    
                if (repairType == 'durability' || repairType == 'refrigeration') {
                    await DatabaseManager.set(member.id, 'machines', repairType, max)
                } else if (repairType == 'pressure') {
                    await DatabaseManager.set(member.id, 'machines', 'pressure', Math.round(max/2))
                } else if (repairType == 'pollutants') {
                    await DatabaseManager.set(member.id, 'machines', 'pollutants', 0)
                }
    
                var maintenance = await svcMaqExtension.getMaintenance(member.id)
    
                var [_, maxdurability2, durabilityPercent2, durabilityPrice2] = maintenance.durability
                var [_, maxdressure2, pressurePercent2, pressurePrice2] = maintenance.pressure
                var [_, maxpollutants2, pollutantsPercent2, pollutantsPrice2] = maintenance.pollutants
                var [_, maxrefrigeration2, refrigerationPercent2, refrigerationPrice2] = maintenance.refrigeration
    
                eval(repairType + 'Percent = ' + repairType + 'Percent2')
            } catch (error) {
                reportError(error, 'command.maquina.maintenance');
            }

        }

        async function pressEquipChip() {

            let chips = await svcItemExtension.getChips(interaction.user.id);

            chips = chips.filter(chip => {
                if (chip.chiptype && chip.chiptype == "one") {
                    if (equippedchips.find((echip) => echip.id == chip.id)) return false;
                }
                return true
            })

            const options = []

            for (let i = 0; i < chips.length; i++) {
                const chip = chips[i];
                if (!chip) break
                const chipicon = chip.icon.split(':')[2].replace('>', '')
                const data = {
                    label: chip.name,
                    emoji: chipicon,
                    value: 'chip-'+i,
                    description: chip.info
                }
                options.push(data)
            }
            let disable = false
            if (options.length == 0) {
                disable = true
                options.push({
                    label: 'Nenhum chipe disponível',
                    value: 'none',
                    description: 'Nenhum chipe disponível',
                    emoji: '❌',
                    default: true
                })
            }
            
            const menu = svcCreateMenu({ id: 'selectchip', placeholder: 'Selecione o chipe que deseja equipar', min:1, max:1 }, options)

            if (disable) menu.setDisabled(true)

            return menu
            
        }
        
        async function equipChip(chipe) {
            try {
                const chips = await svcItemExtension.getChips(interaction.user.id);
                const playerobj = await DatabaseManager.get(interaction.user.id, 'machines');
                
                let contains = chips.length >= chipe;
                
                const placa = chips[chipe]
                
                if (!contains) {
                    const embedtemp = await svcSendError(interaction, `Você não possui este chipe no inventário da máquina para equipar!\nUtilize \`/maquina\` para visualizar seus chipes`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }
                
                const maxslots = svcMaqExtension.getSlotMax(playerobj.level, mvp)
                
                if (playerobj.slots != null && playerobj.slots.length >= maxslots) {
                    const embedtemp = await svcSendError(interaction, `Você não possui slots suficientes na sua máquina para equipar isto!\nUtilize \`/maquina\` para visualizar seus slots`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }

                await svcItemExtension.givePiece(interaction.user.id, { id: placa.id, durability: placa.durability });
                await DatabaseManager.set(interaction.user.id, 'storage', `"piece:${placa.id}"`, placa.size-1)
                equippedchips = await svcItemExtension.getEquippedChips(member.id);
                const newchips = await svcItemExtension.getChips(interaction.user.id);
                reworkEmbed(newchips)
            } catch (error) {
                throw reportError(error, 'command.maquina.equip_chip', { userId: interaction.user.id });
            }

        }

        async function pressUnEquipChip(slot) {
            await svcItemExtension.unequipChip(interaction.user.id, slot)
            equippedchips = await svcItemExtension.getEquippedChips(member.id);
            const newchips = await svcItemExtension.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

        async function pressUnEquipAllChips() {
            await svcItemExtension.unequipAllChips(interaction.user.id)
            equippedchips = []
            const newchips = await svcItemExtension.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

	}
};
