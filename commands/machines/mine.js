const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'minerar',
    aliases: ['m', 'mine'],
    category: 'Maquinas',
    description: 'Inicia sua máquina e cava as profundezas encontrando minérios sob a energia solar',
    mastery: 25,
    // Code Review - Falha de Arquitetura: Acoplamento excessivo e falta de camadas. Este comando mistura lógica de apresentação (Discord UI), lógica de negócios complexa (cálculo de desgaste de peças, refrigeração, pressão e geração de minérios) e acesso/gravação direta no banco de dados. Recomenda-se mover a lógica física de simulação da máquina para um serviço dedicado (ex: `MachineSimulationService`).
	async execute(API, interaction) {
        
        const member = interaction.user

        const Discord = API.Discord;
        const isFull = await API.maqExtension.storage.isFull(member.id);
        const hasMachine = await API.maqExtension.has(member.id);

        if (!(hasMachine)) {
            const embedtemp = await API.sendError(interaction, `Você ainda não possui uma máquina!\nAcesse \`/loja maquinas\` para visualizar as maquinas disponíveis`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(member.id, 'mining')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se minerando no momento! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

		if (isFull) {
            const embedtemp = await API.sendError(interaction, `Seu armazém está lotado, esvazie seu inventário para minerar novamente!\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        // Code Review - CodeSmell: Nome de variável sequencial genérico ('playerobj') e críptico ('maq'). Além disso, o arquivo faz leituras redundantes da tabela de máquinas no banco de dados (aqui e na linha 70 com a variável 'obj6').
        let playerobj = await DatabaseManager.get(member.id, 'machines');
        let maqid = playerobj.machine;

        let maq = API.shopExtension.getProduct(maqid);

        if (playerobj.durability <= Math.round(5*maq.durability/100)) {
            const embedtemp = await API.sendError(interaction, `Sua máquina não possui durabilidade o suficiente para minerar!\nUtilize \`/maquina\` para reparar a sua máquina.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const { energia, energiamax, time } = await API.maqExtension.getEnergy(interaction.user.id)

        if (energia < Math.round(15*energiamax/100)) {
            const embedtemp = await API.sendError(interaction, `Sua máquina precisa de no mínimo ${Math.round(15*energiamax/100)} de energia para ligar\nVisualize a energia utilizando \`/maquina\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const check = await API.playerUtils.cooldown.check(member.id, "mine");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'mine', 'executar um comando de mineração')

            return;
        }

        API.playerUtils.cooldown.set(member.id, "mine", 15);

        if (energia >= energiamax) {
            API.cacheLists.waiting.remove(member.id, 'mining')
        }

        let init = Date.now();
        // Code Review - CodeSmell: Leitura redundante do banco de dados. A variável `obj6` faz uma segunda consulta à tabela `machines` para o mesmo jogador, quando `playerobj` (linha 38) já contém os mesmos dados. Isso duplica chamadas de I/O desnecessariamente.
        let obj6 = await DatabaseManager.get(member.id, "machines");

        let timeupdate = API.maqExtension.update*1000

        const array = obj6.slots == null ? [] : obj6.slots
        for (const i of array){
            const chipproduct = API.shopExtension.getProduct(i.id);
            if (chipproduct.typeeffect == 4) {
            timeupdate -= Math.round(chipproduct.sizeeffect*1000)
            };
        }

        let btn = API.createButton('stopBtn', 'DANGER', 'Parar mineração')

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`${maq.icon} ${maq.name}`).setColor("#36393f")

        API.cacheLists.waiting.add(member.id, interaction, 'mining');

        let totalcoletado = 0;
        let coletadox = new Map();

        let embedinteraction

        let haschipe7 = false
        let hastotalchipe7 = 0

        function checkChipe7() {
            if (haschipe7) {
                API.eco.addToHistory(interaction.user.id, `Venda <:chip:916423648959660082> | + ${API.format(hastotalchipe7)} ${API.moneyemoji}`)
            }
        }

        async function edit() {

            try{

                let profundidade = await API.maqExtension.getDepth(member.id)

                await API.itemExtension.removeChipsDurability(member.id, API.random(1, 10))

                let playerobj = await DatabaseManager.get(member.id, 'machines');
                let maqid = playerobj.machine;
                let maq = API.shopExtension.getProduct(maqid);

                const obj2 = await API.maqExtension.ores.gen(maq, profundidade, playerobj.slots == null ? [] : playerobj.slots);

                let sizeMap = new Map();
                let round = 0;
                let xp = API.random(20, 40);
                xp = await API.playerUtils.execExp(interaction, xp);
                await API.maqExtension.removeEnergy(member.id, 1);
                
                async function setMaintenance() {
                    
                    const value = API.random(1, 16) * (maq.tier+1);
                    
                    var { durability, pressure, refrigeration } = await API.maqExtension.getMaintenance(member.id, true)
                    var [ user_durability, durabilityMax, durabilityPercent ] = durability
                    var [ user_pressure, pressureMax, pressurePercent ] = pressure
                    var [ user_refrigeration, refrigerationMax, refrigerationPercent ] = refrigeration

                    // Code Review - Bug / Exploit de Lógica: Reparo gratuito automático. Quando a durabilidade, pressão ou refrigeração da máquina atingem 0, o sistema redefine os valores para o máximo gratuitamente. Isso contorna toda a mecânica de manutenção e reparo do jogo, permitindo mineração infinita sem custos.
                    if (user_durability == 0) {
                        await DatabaseManager.set(member.id, 'machines', "durability", durabilityMax)
                    }
                    if (user_pressure == 0) {
                        await DatabaseManager.set(member.id, 'machines', "pressure", Math.round(pressureMax/2))
                    }
                    if (user_refrigeration == 0) {
                        await DatabaseManager.set(member.id, 'machines', "refrigeration", refrigerationMax)
                    }

                    var { durability, pressure, refrigeration } = await API.maqExtension.getMaintenance(member.id)
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
                                    const chipproduct = API.shopExtension.getProduct(i.id);
                                    if (chipproduct.typeeffect == 3) {
                                        fvalue -= Math.round(chipproduct.sizeeffect*fvalue/100)
                                    };
                                }
                                await DatabaseManager.increment(member.id, 'machines', name, -fvalue)
                            }
                        } catch (error) {
                            console.log(error)
                        }

                    }

                    async function checkPressure() {
                        const name = "pressure"
                        try {
                            if (refrigerationPercent <= 40) {
                                if (API.random(0, 100) < API.random(40, 70)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*6)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, -value*2)
                                }
                            } if (refrigerationPercent > 40) {
                                if (API.random(0, 100) < API.random(40, 70)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, -value*2)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, value)
                                }
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    }

                    async function checkPollutants() {
                        const name = "pollutants"
                        try {
                            if (pressurePercent > 60) {
                                if (API.random(0, 100) < API.random(40, 80)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*5)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, Math.round(value*2))
                                }
                            } else {
                                if (API.random(0, 100) < API.random(40, 80)) {
                                    await DatabaseManager.increment(member.id, 'machines', name, value*2)
                                } else {
                                    await DatabaseManager.increment(member.id, 'machines', name, Math.round(value))
                                }
                            }
                        } catch (error) {
                            console.log(error)
                        }

                    }

                    async function checkRefrigeration() {
                        const name = "refrigeration"
                        try {
                            await DatabaseManager.increment(member.id, 'machines', name, -value*4)
                        } catch (error) {
                            console.log(error)
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

                    let arMax = await API.maqExtension.storage.getMax(member.id);

                    if (await API.maqExtension.storage.getSize(member.id)+size >= arMax) {
                        size -= (await API.maqExtension.storage.getSize(member.id)+size-arMax)
                    }
                    totalcoletado += size;
                    if (coletadox.has(ore.name)) coletadox.set(ore.name, coletadox.get(ore.name)+size)
                    else coletadox.set(ore.name, size)
                    sizeMap.set(ore.name, size)
                    API.itemExtension.add(member.id, ore.name, size)
                    round += size;

                    if (await API.maqExtension.storage.getSize(member.id)+size >= arMax) break;
                    
                }
                
                let armazemmax2 = await API.maqExtension.storage.getMax(member.id);
                const ep = await API.itemExtension.getEquippedChips(member.id);

                const { energia, energiamax } = await API.maqExtension.getEnergy(member.id)
                
                var { durability, pressure, pollutants, refrigeration } = await API.maqExtension.getMaintenance(member.id, true)
                var [ _, _, durabilityPercent ] = durability
                var [ _, _, pressurePercent ] = pressure
                var [ _, _, pollutantsPercent ] = pollutants
                var [ _, _, refrigerationPercent ] = refrigeration

                let progress2 = API.getProgress(8, { 60: '<:energyfull:741675235010674849>', 30: '<:energy:850573316602200064>', 0: '<:energy:850573316728946698>' }, '<:energyempty:741675234796503041>', (energia+1 < 0 ? 0 : energia+1), energiamax);
                embed.fields = [];
                const obj6 = await DatabaseManager.get(member.id, "machines");
                const arsize = await API.maqExtension.storage.getSize(member.id);
                
                await embed.setDescription(`Minerador: ${member}`);
                await embed.addField(`<:storageinfo:738427915531845692> Informações do armazém`, `Capacidade: [${arsize}/${armazemmax2}]g\nTotal coletado: ${totalcoletado}g\nColetado neste update: ${round}g`)
                await embed.addField(`<:info:736274028515295262> Informações da máquina`, `${ep == null || ep.length == 0 ?'\nChipes: Nenhum instalado\n': `\nChipes: [${ep.map((i) => `${API.shopExtension.getProduct(i.id).icon}`).join(', ')}]\n`}Profundidade: ${profundidade}m\nDurabilidade: ${durabilityPercent}%\nPressão: ${pressurePercent}%\nRefrigeração: ${refrigerationPercent}%\nPoluentes: ${pollutantsPercent}%`)
                await embed.addField(`⛏ Informações de mineração`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${(100*obj6.xp/(obj6.level*1980)).toFixed(2)}%) \`(+${xp} XP)\`\nEnergia: ${progress2}`)
                embed.setFooter(`Tempo de atualização: ${timeupdate/1000} segundos\nTempo minerando: ${API.ms(Date.now()-init)}`, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                let itensObj = API.itemExtension.getObj();
                
                for await (const r of obj2) {

                    const ore = r.oreobj
                    const orechips = r.orechips
                    const chipsstring = r.chipsstring

                    const chipe7 = orechips && orechips.chipe7
                    
                    let qnt = sizeMap.get(ore.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    // Code Review - CodeSmell: Linha excessivamente longa e complexa (~280 caracteres). Template literal com múltiplas operações ternárias aninhadas, capitalização manual e `.map()` identity (`chipicon => chipicon`). Quebrar em variáveis intermediárias e usar uma função de capitalização.
                    embed.addField(`${ore.icon} ${ore.name.charAt(0).toUpperCase() + ore.name.slice(1)} +${qnt}g${chipsstring && chipsstring.length > 0 ? ' [' + chipsstring.map((chipicon) => chipicon).join(', ') + ']':''}`, `\`\`\`autohotkey\nColetado: ${coletadox.get(ore.name) == undefined ? '0':coletadox.get(ore.name)}g\`\`\``, true)
                    if (chipe7) {
                        const minerioatual = itensObj.minerios.find((i) => i.name == ore.name)
                        const totalchipe7 = Math.round(qnt*(minerioatual.price.max))
                        hastotalchipe7 += totalchipe7
                        haschipe7 = true
                        API.eco.money.add(member.id, totalchipe7)
                    }

                }

                try{
                    if (interaction.replied) {
                        // Code Review - CodeSmell: Referência desatualizada de mensagem. A chamada `editReply` não atualiza a variável `embedinteraction`, que continuará apontando para a resposta inicial. Se o bot precisasse coletar eventos baseados no objeto mais recente, causaria inconsistências.
                        await interaction.editReply({ embeds: [embed], components: [API.rowComponents([btn])], fetchReply: true })
                    }
                    else {
                        embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn])], fetchReply: true })
                    }
                }catch (err){
					API.cacheLists.waiting.remove(member.id, 'mining')
                    return
                }

                async function checkStop() {

                    let isStopping = false
                    let stoppingMessage = ""
                    
                    var { durability, pressure, pollutants, refrigeration } = await API.maqExtension.getMaintenance(member.id)

                    var [ _, _, durabilityPercent ] = durability
                    var [ _, _, pressurePercent ] = pressure
                    var [ _, _, pollutantsPercent ] = pollutants
                    var [ _, _, refrigerationPercent ] = refrigeration

                    const storagesize = await API.maqExtension.storage.getSize(member.id)
                    const storagemax = await API.maqExtension.storage.getMax(member.id);

                    async function checkMaintenance(name, percent) {

                        if (name == 'durability' && percent < 1) {
                            stoppingMessage = `Sua máquina não possui durabilidade para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent < 20) {
                            stoppingMessage = `Sua máquina não possui pressão para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pressure' && percent > 80) {
                            stoppingMessage = `A pressão da sua máquina está em nível crítico para continuar minerando! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'pollutants' && percent > 90) {
                            stoppingMessage = `Sua máquina está com o máximo de poluentes armazenados! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        } else if (name == 'refrigeration' && percent < 15) {
                            stoppingMessage = `Sua máquina não possui líquido de refrigeração suficiente para manter a pressão da máquina! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/maquina\` para reparar a sua máquina.`
                            isStopping = true
                            return { isStopping, stoppingMessage }
                        }
                    }

                    await checkMaintenance('durability', durabilityPercent)
                    await checkMaintenance('pressure', pressurePercent)
                    await checkMaintenance('pollutants', pollutantsPercent)
                    await checkMaintenance('refrigeration', refrigerationPercent)

                    if (storagesize >= storagemax) {
                        stoppingMessage = `Seu armazém lotou enquanto você minerava! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nUtilize \`/armazém\` para visualizar seus recursos\nUtilize \`/vender\` para vender os recursos`
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }
                    if ((energia+1 < 0 ? 0 : energia+1) <= 0) {
                        stoppingMessage = `A energia de sua máquina esgotou! [[VER MINERAÇÃO]](${API.cacheLists.waiting.getLink(member.id, 'mining')})\nVisualize a energia utilizando \`/maquina\``
                        isStopping = true
                        return { isStopping, stoppingMessage }
                    }

                    return { isStopping, stoppingMessage }
                }

                const { isStopping, stoppingMessage } = await checkStop()

                if (isStopping) {
                    // Code Review - CodeSmell: Duplicação de código. A lógica para registrar a venda do chip 7 no histórico é idêntica à declarada na função helper `checkChipe7`.
                    if (haschipe7) {
                        API.eco.addToHistory(interaction.user.id, `Venda <:chip:916423648959660082> | + ${API.format(hastotalchipe7)} ${API.moneyemoji}`)
                    }
                    API.cacheLists.waiting.remove(member.id, 'mining')
                    const embedtemp = await API.sendError(interaction, stoppingMessage)
                    await interaction.followUp({ embeds: [embedtemp] })
                    await interaction.editReply({ embeds: [embed], components: [] })
                    return
                }

                let stopped = false

                const filter = i => i.user.id === member.id;

                const collector = embedinteraction.createMessageComponentCollector({ filter, time: timeupdate });

                collector.on('collect', async (b) => {

                    if (b.customId == 'stopBtn') {
                        if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
                        stopped = true
                        btn.setDisabled()
                        API.cacheLists.waiting.remove(member.id, 'mining')
                        await interaction.editReply({ embeds: [embed], components: [] }).catch()
                        collector.stop();
                    }
                });

                collector.on('end', async collected => {
                    if (stopped) {
                        checkChipe7()
                        API.cacheLists.waiting.remove(member.id, 'mining');
                        const embedtemp = await API.sendError(interaction, `Você parou o funcionamento da sua máquina!`)
                        await interaction.followUp({ embeds: [embedtemp] })
                    } else {
                        // Code Review - Bug / Falha de Arquitetura: Chamada recursiva indireta. Quando o collector expira sem o jogador parar, `edit()` se chama novamente. Isso cria uma cadeia de recursão crescente sem condição de término (a pilha cresce a cada ciclo de mineração). A Promise retornada por `edit()` também não é awaited, mascarando erros assíncronos.
                        edit();
                    }
                });

            }catch (err) {
                checkChipe7()
                API.client.emit('error', err)
                API.cacheLists.waiting.remove(member.id, 'mining');
            }
        }
        try {
            await edit();
        } catch (err) {
            API.client.emit('error', err)
            API.cacheLists.waiting.remove(member.id, 'mining');
        }
	}
};