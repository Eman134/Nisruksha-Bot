const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja a máquina de algum membro'))

module.exports = {
    name: 'maquina',
    aliases: ['maquina', 'maq', 'machine'],
    category: 'Maquinas',
    description: 'Visualiza as informações da sua máquina',
    data,
    mastery: 35,
	async execute(API, interaction) {

        let member = interaction.options.getUser('membro') || interaction.user

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "maq");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'maq', 'visualizar uma máquina')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "maq", 10);

        const embedinteraction = await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações da máquina`, fetchReply: true })

        const machinesobj = await DatabaseManager.get(member.id, 'machines')
        
        const memberobj = await DatabaseManager.get(member.id, 'players')

        const profundidade = await API.maqExtension.getDepth(member.id)

        const machineid = machinesobj.machine;
        const machineproduct = API.shopExtension.getProduct(machineid);

        const { energia, energiamax, time } = await API.maqExtension.getEnergy(member.id)

        const chips = await API.itemExtension.getChips(member.id);
        
        const mvp = (memberobj.mvp == null ? false : true)
        
        const maxslots = API.maqExtension.getSlotMax(machinesobj.level, mvp)

        let equippedchips = await API.itemExtension.getEquippedChips(member.id);

        if (maxslots < 5) {
    
            let placa;
            let slot = 5-1;
            if (!(equippedchips[slot] == null || equippedchips[slot] == undefined|| equippedchips[slot] == 0)) {

                const eqslot = typeof equippedchips[slot] === 'object' ? equippedchips[slot].id : equippedchips[slot]
                placa = API.shopExtension.getProduct(eqslot);
    
                equippedchips.length == 1 ? equippedchips = [] : equippedchips.splice(slot, 1);
            
                await DatabaseManager.increment(member.id, 'storage', `"piece:${placa.id}"`, 1)
                await DatabaseManager.set(member.id, 'machines', `slots`, equippedchips)
                equippedchips = await API.itemExtension.getEquippedChips(member.id);
    
            }
    
        }

        let { pollutants, refrigeration, pressure, durability } = await API.maqExtension.getMaintenance(member.id)

        var [_, _, durabilityPercent, durabilityPrice] = durability
        var [_, _, pressurePercent, pressurePrice] = pressure
        var [_, _, pollutantsPercent, pollutantsPrice] = pollutants
        var [_, _, refrigerationPercent, refrigerationPrice] = refrigeration

        async function getMachineImage () {

            try {
                const machineimage = await API.img.imagegens.get('machine.js')(API, {
    
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
                console.log(error)
            }

        }

        let machineimage = await getMachineImage();

        let rememberEnergy = false

        let isEquipping = false

        let isMaintenance = false

        function makeComponents (disableall) {

            try {
                const components = [];
                const firstrow = []
                const isMining = API.cacheLists.waiting.includes(member.id, 'mining')

                const energyBtnText = `[${energia}/${energiamax}]${energia < energiamax && !disableall && !rememberEnergy ? ' ' + API.ms2(time) : ''}`
                const energyBtn = API.createButton('energyBtn', 'SUCCESS', energyBtnText, '🔋')

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
                
                const maintenanceBtn = API.createButton('maintenance', 'SUCCESS', 'Manutenção', '🔨')
                if (disableall || isMaintenance) {
                    maintenanceBtn.setDisabled(true)
                }

                const chipsBtn = API.createButton('chips', 'SUCCESS', 'Chipes', '833803786022682636')
                if (disableall || isEquipping) {
                    chipsBtn.setDisabled(true)
                }

                const repairBtnText = `${durabilityPercent < 60 ? `Reparar por ${API.format(durabilityPrice)} 💰` : `Reparado`}`
                const repairBtnIcon = getMaintenanceIcon('durability', durabilityPercent)
                const repairBtn = API.createButton('durability', 'SECONDARY', repairBtnText, repairBtnIcon)
                
                if (durabilityPercent >= 60 || disableall) {
                    repairBtn.setDisabled(true)
                }

                const pressureBtnText = `${pressurePercent < 20 || pressurePercent > 80 ? `Corrigir pressão por ${API.format(pressurePrice)} 💰` : `Presurizado`}`
                const pressureBtnIcon = getMaintenanceIcon('pressure', pressurePercent)
                const pressureBtn = API.createButton('pressure', 'SECONDARY', pressureBtnText, pressureBtnIcon)
                
                if ((pressurePercent >= 20 && pressurePercent <= 80) || disableall) {
                    pressureBtn.setDisabled(true)
                }

                const refrigerationBtnText = `${refrigerationPercent < 15 ? `Refrigerar por ${API.format(refrigerationPrice)} 💰` : `Refrigerado`}`
                const refrigerationBtnIcon = getMaintenanceIcon('refrigeration', refrigerationPercent)
                const refrigerationBtn = API.createButton('refrigeration', 'SECONDARY', refrigerationBtnText, refrigerationBtnIcon)
                
                if (refrigerationPercent >= 40 || disableall) {
                    refrigerationBtn.setDisabled(true)
                }

                const pollutantsBtnText = `${pollutantsPercent > 40 ? `Liberar poluentes por ${API.format(pollutantsPrice)} 💰` : `Sem poluentes`}`
                const pollutantsBtnIcon = getMaintenanceIcon('pollutants', pollutantsPercent)
                const pollutantsBtn = API.createButton('pollutants', 'SECONDARY', pollutantsBtnText, pollutantsBtnIcon)
                
                if (pollutantsPercent <= 40 || disableall) {
                    pollutantsBtn.setDisabled(true)
                }

                let unequipallBtn
                if (mvp) {
                    unequipallBtn = API.createButton('unequipall', 'SECONDARY', 'Desequipar todos', '🗑️')
                } else {
                    unequipallBtn = API.createButton('unequipall', 'DANGER', '[MVP] Desequipar todos', '758717273304465478').setDisabled(true)
                }

                if (disableall) unequipallBtn.setDisabled(true)

                if (isMining) {
                    const miningBtn = API.createButton((API.cacheLists.waiting.getLink(member.id, 'mining') || ''), 'LINK', 'Ver mineração', '🔎')
                    firstrow.push(miningBtn)
                } else if (member.id == interaction.user.id) {
                    firstrow.push(energyBtn, maintenanceBtn, chipsBtn)
                    if (equippedchips.length > 0 && isEquipping) {
                        firstrow.push(unequipallBtn)
                    }
                }

                if (firstrow.length == 0) return []

                const row1 = API.rowComponents(firstrow)

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
                            const chipe = API.shopExtension.getProduct(equippedchips[slot].id);
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
                        const slotBtn = API.createButton(`${type}-${slot}`, slotBtnColor, slotBtnText, slotBtnIcon)
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

                    const row2 = API.rowComponents(slotsrow)

                    components.push(row2)

                }

                if (isMaintenance) {
                    const maintenancerow = []
                    maintenancerow.push(repairBtn, refrigerationBtn, pressureBtn, pollutantsBtn)
                    
                    const row3 = API.rowComponents(maintenancerow)

                    components.push(row3)
                }

                return components
            } catch (error) {
                console.log(error)
            }

        }

        const embed = new API.Discord.MessageEmbed()

        function reworkEmbed(chips) {
            embed.fields = []
            let chipsmap = chips.map((p, index) => `**${p.size}x** ${p.icon} ${p.name} | **ID: ${index+1}**`).join('\n');
            embed.setDescription(`OBS: A cada **6 níveis** você adquire **+1 slot** para equipar chipes!\nVocê não pode desequipar chipes que perderam uma durabilidade, se não eles serão descartados!`)
            .addField(`<:chip:833521401951944734> Inventário de Chipes`, (chips.length <= 0 ? '**Não possui chipes de aprimoramento**' : chipsmap))
            embed.setAuthor(member.tag, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            embed.setColor('#7e6eb5')
            embed.setImage('attachment://image.png')
        }

        reworkEmbed(chips)
        
        await interaction.editReply({ content: null, embeds: [embed], files: [machineimage], components: makeComponents() });

        const filter = i => i.user.id === member.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        collector.on('collect', async (b) => {

            const isMining = API.cacheLists.waiting.includes(member.id, 'mining')
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
            
            editObj.components = makeComponents()
            editObj.files = [machineimage]

            if (menu) {
                editObj.components.push(API.rowComponents([menu]))
                //editObj.components.splice(1, 1)
            }
                
            if (!b.deferred) b.deferUpdate().then().catch();
            await interaction.editReply(editObj);
            collector.resetTimer();

        });
        
        collector.on('end', async collected => {
            interaction.editReply({ content: null, embeds: [embed], files: [machineimage], components: makeComponents(true) });
        });

        async function pressEnergyBtn() {
            rememberEnergy = true
            const embed2 = new API.Discord.MessageEmbed()

            const { energia, energiamax, time } = await API.maqExtension.getEnergy(member.id)
            
            const pObj = await DatabaseManager.get(member.id, 'players')
            perm = pObj.perm
            
            embed2.addField(`<:energia:833370616304369674> Energia de \`${member.tag}\`: **[${energia}/${energiamax}]**`, `Irá recuperar completamente em: \`${API.ms(time)}\`\n**Você será relembrado quando sua energia recarregar!**\nOBS: A energia não recupera enquanto estiver usando!`)
            embed2.setColor('#42f569')
            embed2.setFooter(`1 ponto de energia recupera a cada ${API.maqExtension.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}`)
            await interaction.followUp({ embeds: [embed2], ephemeral: true });

            if (API.cacheLists.remember.includes(member.id, "energia")) return;
            API.cacheLists.remember.add(member.id, interaction.channel.id, "energia");
            async function rem(){

                const { energia, energiamax, time } = await API.maqExtension.getEnergy(member.id)

                if (energia >= energiamax) {
                    await interaction.channel.send({ content: `${interaction.user} Relatório de energia: ${energia}/${energiamax}`, mention: true})
                    if (API.cacheLists.remember.includes(member.id, "energia")) {
                        API.cacheLists.remember.remove(member.id, "energia")
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

                if (API.cacheLists.waiting.includes(member.id, 'mining')) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no reparo', `Você não pode realizar reparos de uma máquina enquanto estiver minerando!`)
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                var maintenance = await API.maqExtension.getMaintenance(member.id)
    
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
    
                const money = await API.eco.money.get(member.id);
    
                if (money < price) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no reparo', `Você não possui dinheiro suficiente para reparar a sua máquina**!\nSeu dinheiro atual: **${API.format(money)}/${API.format(price)} ${API.money} ${API.moneyemoji}**`)
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                const micon = getMaintenanceIcon(repairType, percent)

                await API.eco.money.remove(member.id, price);
                await API.eco.addToHistory(member.id, `Manutenção ${micon.length > 1 ? API.client.emojis.cache.get(micon) : micon} | - ${API.format(price)}`)
    
                if (repairType == 'durability' || repairType == 'refrigeration') {
                    await DatabaseManager.set(member.id, 'machines', repairType, max)
                } else if (repairType == 'pressure') {
                    await DatabaseManager.set(member.id, 'machines', 'pressure', Math.round(max/2))
                } else if (repairType == 'pollutants') {
                    await DatabaseManager.set(member.id, 'machines', 'pollutants', 0)
                }
    
                var maintenance = await API.maqExtension.getMaintenance(member.id)
    
                var [_, maxdurability2, durabilityPercent2, durabilityPrice2] = maintenance.durability
                var [_, maxdressure2, pressurePercent2, pressurePrice2] = maintenance.pressure
                var [_, maxpollutants2, pollutantsPercent2, pollutantsPrice2] = maintenance.pollutants
                var [_, maxrefrigeration2, refrigerationPercent2, refrigerationPrice2] = maintenance.refrigeration
    
                eval(repairType + 'Percent = ' + repairType + 'Percent2')
            } catch (error) {
                console.log(error)
            }

        }

        async function pressEquipChip() {

            let chips = await API.itemExtension.getChips(interaction.user.id);

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
            
            const menu = API.createMenu({ id: 'selectchip', placeholder: 'Selecione o chipe que deseja equipar', min:1, max:1 }, options)

            if (disable) menu.setDisabled(true)

            return menu
            
        }
        
        async function equipChip(chipe) {
            try {
                const chips = await API.itemExtension.getChips(interaction.user.id);
                const playerobj = await DatabaseManager.get(interaction.user.id, 'machines');
                
                let contains = chips.length >= chipe;
                
                const placa = chips[chipe]
                
                if (!contains) {
                    const embedtemp = await API.sendError(interaction, `Você não possui este chipe no inventário da máquina para equipar!\nUtilize \`/maquina\` para visualizar seus chipes`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }
                
                const maxslots = API.maqExtension.getSlotMax(playerobj.level, mvp)
                
                if (playerobj.slots != null && playerobj.slots.length >= maxslots) {
                    const embedtemp = await API.sendError(interaction, `Você não possui slots suficientes na sua máquina para equipar isto!\nUtilize \`/maquina\` para visualizar seus slots`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }

                await API.itemExtension.givePiece(interaction.user.id, { id: placa.id, durability: placa.durability });
                await DatabaseManager.set(interaction.user.id, 'storage', `"piece:${placa.id}"`, placa.size-1)
                equippedchips = await API.itemExtension.getEquippedChips(member.id);
                const newchips = await API.itemExtension.getChips(interaction.user.id);
                reworkEmbed(newchips)
            } catch (error) {
                console.log(error)
            }

        }

        async function pressUnEquipChip(slot) {
            await API.itemExtension.unequipChip(interaction.user.id, slot)
            equippedchips = await API.itemExtension.getEquippedChips(member.id);
            const newchips = await API.itemExtension.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

        async function pressUnEquipAllChips() {
            await API.itemExtension.unequipAllChips(interaction.user.id)
            equippedchips = []
            const newchips = await API.itemExtension.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

	}
};