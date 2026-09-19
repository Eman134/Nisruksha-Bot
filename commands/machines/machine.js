const playersService = require('../../_classes/services/players');
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
const itemsService = require('../../_classes/services/items');
const imagesService = require('../../_classes/services/images');
const cacheListsService = require('../../_classes/services/cacheLists');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const economyService = require('../../_classes/services/economy');
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const storageField = (value) => String(value).replace(/^"|"$/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[: ]/g, '_');

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
	async execute(interaction) {

        let member = interaction.options.getUser('membro') || interaction.user

        const check = await playersService.cooldown.check(interaction.user.id, "maq");
        if (check) {

            playersService.cooldown.message(interaction, 'maq', 'visualizar uma máquina')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "maq", 10);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando informações da máquina` })
        const embedinteraction = await interaction.fetchReply()

        const user_id = BigInt(member.id)
        const machinesobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
        
        const memberobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        const profundidade = await machinesService.getDepth(member.id)

        const machineid = machinesobj.machine;
        const machineproduct = await shopService.getProduct(machineid);

        const { energia, energiamax, time } = await machinesService.getEnergy(member.id)

        const chips = await itemsService.getChips(member.id);
        
        const mvp = (memberobj.mvp == null ? false : true)
        
        const maxslots = machinesService.getSlotMax(machinesobj.level, mvp)

        let equippedchips = await itemsService.getEquippedChips(member.id);

        if (maxslots < 5) {
    
            let placa;
            let slot = 5-1;
            if (!(equippedchips[slot] == null || equippedchips[slot] == undefined|| equippedchips[slot] == 0)) {

                const eqslot = typeof equippedchips[slot] === 'object' ? equippedchips[slot].id : equippedchips[slot]
                placa = await shopService.getProduct(eqslot);
    
                equippedchips.length == 1 ? equippedchips = [] : equippedchips.splice(slot, 1);
            
                const pieceField = storageField(`piece:${placa.id}`)
                await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
                await prisma.storage.update({ where: { user_id }, data: { [pieceField]: { increment: 1 } } })
                await prisma.machines.update({ where: { user_id }, data: { slots: equippedchips } })
                equippedchips = await itemsService.getEquippedChips(member.id);
    
            }
    
        }

        let { pollutants, refrigeration, pressure, durability } = await machinesService.getMaintenance(member.id)

        var [_, _, durabilityPercent, durabilityPrice] = durability
        var [_, _, pressurePercent, pressurePrice] = pressure
        var [_, _, pollutantsPercent, pollutantsPrice] = pollutants
        var [_, _, refrigerationPercent, refrigerationPrice] = refrigeration

        async function getMachineImage () {

            try {
                const machineimage = await imagesService.imagegens.get('machine.js')({
    
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
                const isMining = await cacheListsService.waiting.includes(member.id, 'mining')

                const energyBtnText = `[${energia}/${energiamax}]${energia < energiamax && !disableall && !rememberEnergy ? ' ' + utility.ms(time, true) : ''}`
                const energyBtn = utility.createButton('energyBtn', 'SUCCESS', energyBtnText, '🔋')

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
                
                const maintenanceBtn = utility.createButton('maintenance', 'SUCCESS', 'Manutenção', '🔨')
                if (disableall || isMaintenance) {
                    maintenanceBtn.setDisabled(true)
                }

                const chipsBtn = utility.createButton('chips', 'SUCCESS', 'Chipes', '833803786022682636')
                if (disableall || isEquipping) {
                    chipsBtn.setDisabled(true)
                }

                const repairBtnText = `${durabilityPercent < 60 ? `Reparar por ${utility.format(durabilityPrice)} 💰` : `Reparado`}`
                const repairBtnIcon = getMaintenanceIcon('durability', durabilityPercent)
                const repairBtn = utility.createButton('durability', 'SECONDARY', repairBtnText, repairBtnIcon)
                
                if (durabilityPercent >= 60 || disableall) {
                    repairBtn.setDisabled(true)
                }

                const pressureBtnText = `${pressurePercent < 20 || pressurePercent > 80 ? `Corrigir pressão por ${utility.format(pressurePrice)} 💰` : `Presurizado`}`
                const pressureBtnIcon = getMaintenanceIcon('pressure', pressurePercent)
                const pressureBtn = utility.createButton('pressure', 'SECONDARY', pressureBtnText, pressureBtnIcon)
                
                if ((pressurePercent >= 20 && pressurePercent <= 80) || disableall) {
                    pressureBtn.setDisabled(true)
                }

                const refrigerationBtnText = `${refrigerationPercent < 15 ? `Refrigerar por ${utility.format(refrigerationPrice)} 💰` : `Refrigerado`}`
                const refrigerationBtnIcon = getMaintenanceIcon('refrigeration', refrigerationPercent)
                const refrigerationBtn = utility.createButton('refrigeration', 'SECONDARY', refrigerationBtnText, refrigerationBtnIcon)
                
                if (refrigerationPercent >= 40 || disableall) {
                    refrigerationBtn.setDisabled(true)
                }

                const pollutantsBtnText = `${pollutantsPercent > 40 ? `Liberar poluentes por ${utility.format(pollutantsPrice)} 💰` : `Sem poluentes`}`
                const pollutantsBtnIcon = getMaintenanceIcon('pollutants', pollutantsPercent)
                const pollutantsBtn = utility.createButton('pollutants', 'SECONDARY', pollutantsBtnText, pollutantsBtnIcon)
                
                if (pollutantsPercent <= 40 || disableall) {
                    pollutantsBtn.setDisabled(true)
                }

                let unequipallBtn
                if (mvp) {
                    unequipallBtn = utility.createButton('unequipall', 'SECONDARY', 'Desequipar todos', '🗑️')
                } else {
                    unequipallBtn = utility.createButton('unequipall', 'DANGER', '[MVP] Desequipar todos', '758717273304465478').setDisabled(true)
                }

                if (disableall) unequipallBtn.setDisabled(true)

                if (isMining) {
                    const miningBtn = utility.createButton((await cacheListsService.waiting.getLink(member.id, 'mining') || ''), 'LINK', 'Ver mineração', '🔎')
                    firstrow.push(miningBtn)
                } else if (member.id == interaction.user.id) {
                    firstrow.push(energyBtn, maintenanceBtn, chipsBtn)
                    if (equippedchips.length > 0 && isEquipping) {
                        firstrow.push(unequipallBtn)
                    }
                }

                if (firstrow.length == 0) return []

                const row1 = utility.rowComponents(firstrow)

                components.push(row1)

                if (isMining) return components

                if (maxslots > 0 && isEquipping) {

                    const slotsrow = [];

                    const genSlotBtn = async (slot, { disableall, mvp }) => {
                        let slotBtnText = `[${slot+1}] `
                        let slotBtnIcon
                        let slotBtnColor = 'SECONDARY'
                        let type = 0
                        let isEquipBtn = false
                        if (equippedchips[slot]) {
                            const chipe = await shopService.getProduct(equippedchips[slot].id);
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
                        const slotBtn = utility.createButton(`${type}-${slot}`, slotBtnColor, slotBtnText, slotBtnIcon)
                        if (disableall) slotBtn.setDisabled(true)
                        if (!mvp && slot == 4) slotBtn.setDisabled(true)
                        return { slotBtn, isEquipBtn }
                    }

                    let hasEquipBtn = false

                    for (let i = 0; i < maxslots; i++) {
                        const { slotBtn, isEquipBtn } = await genSlotBtn(i, { disableall, mvp })
                        if (!hasEquipBtn && isEquipBtn) {
                            hasEquipBtn = true
                            slotsrow.push(slotBtn)
                        }
                        if (!isEquipBtn) {
                            slotsrow.push(slotBtn)
                        }

                    }

                    const row2 = utility.rowComponents(slotsrow)

                    components.push(row2)

                }

                if (isMaintenance) {
                    const maintenancerow = []
                    maintenancerow.push(repairBtn, refrigerationBtn, pressureBtn, pollutantsBtn)
                    
                    const row3 = utility.rowComponents(maintenancerow)

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

        const embed = new Discord.EmbedBuilder()

        function reworkEmbed(chips) {
            embed.fields = []
            let chipsmap = chips.map((p, index) => `**${p.size}x** ${p.icon} ${p.name} | **ID: ${index+1}**`).join('\n');
            embed.setDescription(`OBS: A cada **6 níveis** você adquire **+1 slot** para equipar chipes!\nVocê não pode desequipar chipes que perderam uma durabilidade, se não eles serão descartados!`)
            .addFields({ name: `<:chip:833521401951944734> Inventário de Chipes`, value: (chips.length <= 0 ? '**Não possui chipes de aprimoramento**' : chipsmap) })
            embed.setAuthor({ name: member.tag, iconURL: member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
            embed.setColor('#7e6eb5')
            embed.setImage('attachment://image.png')
        }

        reworkEmbed(chips)
        
        await interaction.editReply({ content: null, embeds: [embed], files: [machineimage], components: await makeComponents() });

        const filter = i => i.user.id === member.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        collector.on('collect', async (b) => {

            const isMining = await cacheListsService.waiting.includes(member.id, 'mining')
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
                editObj.components.push(utility.rowComponents([menu]))
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
            const embed2 = new Discord.EmbedBuilder()

            const { energia, energiamax, time } = await machinesService.getEnergy(member.id)
            
            const pObj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            perm = pObj.perm
            
            embed2.addFields({ name: `<:energia:833370616304369674> Energia de \`${member.tag}\`: **[${energia}/${energiamax}]**`, value: `Irá recuperar completamente em: \`${utility.ms(time)}\`\n**Você será relembrado quando sua energia recarregar!**\nOBS: A energia não recupera enquanto estiver usando!` })
            embed2.setColor('#42f569')
            embed2.setFooter({ text: `1 ponto de energia recupera a cada ${machinesService.recoverenergy[perm]} segundos${perm > 1 ? `\nComo você possui um cargo especial, sua energia recupera mais rápido!`:'\nSua energia recupera mais devagar por não ter nenhum cargo no bot!'}` })
            await interaction.followUp({ embeds: [embed2], flags: Discord.MessageFlags.Ephemeral });

            if (await cacheListsService.remember.includes(member.id, "energia")) return;
            await cacheListsService.remember.add(member.id, interaction.channel.id, "energia");
            async function rem(){

                const { energia, energiamax, time } = await machinesService.getEnergy(member.id)

                if (energia >= energiamax) {
                    await interaction.channel.send({ content: `${interaction.user} Relatório de energia: ${energia}/${energiamax}`, mention: true})
                    if (await cacheListsService.remember.includes(member.id, "energia")) {
                        await cacheListsService.remember.remove(member.id, "energia")
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

                if (await cacheListsService.waiting.includes(member.id, 'mining')) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no reparo', value: `Você não pode realizar reparos de uma máquina enquanto estiver minerando!` })
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                var maintenance = await machinesService.getMaintenance(member.id)
    
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
    
                const money = await economyService.money.get(member.id);
    
                if (money < price) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no reparo', value: `Você não possui dinheiro suficiente para reparar a sua máquina**!\nSeu dinheiro atual: **${utility.format(money)}/${utility.format(price)} ${utility.money} ${utility.moneyemoji}**` })
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                
                const micon = getMaintenanceIcon(repairType, percent)

                await economyService.money.remove(member.id, price);
                await economyService.addToHistory(member.id, `Manutenção ${micon.length > 1 ? clientService.current.emojis.cache.get(micon) : micon} | - ${utility.format(price)}`)
    
                if (repairType == 'durability' || repairType == 'refrigeration') {
                    await prisma.machines.update({ where: { user_id }, data: { [repairType]: max } })
                } else if (repairType == 'pressure') {
                    await prisma.machines.update({ where: { user_id }, data: { pressure: Math.round(max/2) } })
                } else if (repairType == 'pollutants') {
                    await prisma.machines.update({ where: { user_id }, data: { pollutants: 0 } })
                }
    
                var maintenance = await machinesService.getMaintenance(member.id)
    
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

            let chips = await itemsService.getChips(interaction.user.id);

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
            
            const menu = utility.createMenu({ id: 'selectchip', placeholder: 'Selecione o chipe que deseja equipar', min:1, max:1 }, options)

            if (disable) menu.setDisabled(true)

            return menu
            
        }
        
        async function equipChip(chipe) {
            try {
                const chips = await itemsService.getChips(interaction.user.id);
                const interaction_user_id = BigInt(interaction.user.id)
                const playerobj = await prisma.machines.upsert({ where: { user_id: interaction_user_id }, update: { user_id: interaction_user_id }, create: { user_id: interaction_user_id, slots: [] } });
                
                let contains = chips.length >= chipe;
                
                const placa = chips[chipe]
                
                if (!contains) {
                    const embedtemp = await utility.sendError(interaction, `Você não possui este chipe no inventário da máquina para equipar!\nUtilize \`/maquina\` para visualizar seus chipes`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }
                
                const maxslots = machinesService.getSlotMax(playerobj.level, mvp)
                
                if (playerobj.slots != null && playerobj.slots.length >= maxslots) {
                    const embedtemp = await utility.sendError(interaction, `Você não possui slots suficientes na sua máquina para equipar isto!\nUtilize \`/maquina\` para visualizar seus slots`);
                    await interaction.editReply({ embeds: [embedtemp]})
                    return;
                }

                await itemsService.givePiece(interaction.user.id, { id: placa.id, durability: placa.durability });
                const pieceField = storageField(`piece:${placa.id}`)
                await prisma.storage.upsert({ where: { user_id: interaction_user_id }, update: { user_id: interaction_user_id }, create: { user_id: interaction_user_id } })
                await prisma.storage.update({ where: { user_id: interaction_user_id }, data: { [pieceField]: placa.size-1 } })
                equippedchips = await itemsService.getEquippedChips(member.id);
                const newchips = await itemsService.getChips(interaction.user.id);
                reworkEmbed(newchips)
            } catch (error) {
                throw reportError(error, 'command.maquina.equip_chip', { userId: interaction.user.id });
            }

        }

        async function pressUnEquipChip(slot) {
            await itemsService.unequipChip(interaction.user.id, slot)
            equippedchips = await itemsService.getEquippedChips(member.id);
            const newchips = await itemsService.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

        async function pressUnEquipAllChips() {
            await itemsService.unequipAllChips(interaction.user.id)
            equippedchips = []
            const newchips = await itemsService.getChips(interaction.user.id);
            reworkEmbed(newchips)
        }

	}
};
