const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","cacheLists","company","createButton","eco","format","itemExtension","money","moneyemoji","ms","playerUtils","rowComponents"],
    name: 'processos',
    aliases: ['menuprocessos', 'procs', 'processamentos'],
    category: 'none',
    description: 'Veja todos os sistemas de processamentos, ferramentas e as limpezas',
    companytype: 7,
    mastery: 15,
	async execute(interaction, svcDiscord, svcCacheLists, svcCompany, svcCreateButton, svcEco, svcFormat, svcItemExtension, svcMoney, svcMoneyemoji, svcMs, svcPlayerUtils, svcRowComponents, company) {        
		const embed = new svcDiscord.MessageEmbed()

        const players_utils = await DatabaseManager.get(interaction.user.id, 'players_utils')
        const machines = await DatabaseManager.get(interaction.user.id, 'machines')

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "verprocessamentos");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'verprocessamentos', 'ver outra mensagem de processamentos')

            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "verprocessamentos", 35);

        const level = machines.level

        let processjson = players_utils.process

        const custoretirar = 50

        if (players_utils.process == null) {

            const defaultjson = {
                tools: {
                    0: svcCompany.jobs.process.tools.search(level, 0),
                    1: svcCompany.jobs.process.tools.search(level, 1),
                },
    
                in: []

            }

            processjson = defaultjson

            DatabaseManager.set(interaction.user.id, 'players_utils', 'process', defaultjson)
        }

        if (processjson.tools[0].durability.current <= 0 && processjson.tools[1].fuel.current <= 0) {
            await svcCacheLists.waiting.remove(member.id, 'working');
            await jobs.process.remove(member.id)
        }

        let embeds = []

        async function setProcess() {
            
            if (processjson.in.length > 0) {
                embeds = []
                for (i = 0; i < processjson.in.length; i++) {
    
                    const eproctemp = new svcDiscord.MessageEmbed()

                    const checkfi = processjson.in[i].fragments.current == 0

                    const estimadoms = svcCompany.jobs.process.calculateTime(processjson.tools[processjson.in[i].tool].potency.current, processjson.in[i].fragments.current)
                    
                    if (!processjson.in[i]) break
                    eproctemp.setDescription(`ID de Processo: ${processjson.in[i].id}${!checkfi ? '\nTempo decorrido: ' + svcMs(Date.now() - processjson.in[i].started, true):''}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]\nXP ganho: ${processjson.in[i].xp}\nScore ganho: ${processjson.in[i].score} ⭐`, true)
                
                    eproctemp.setTitle(`⏳ Processo ${processjson.in[i].id}: ${(checkfi ? 'Finalizado ✅' : svcMs(estimadoms, true))}`)

                    if (processjson.in[i].tool == 0 && processjson.tools[processjson.in[i].tool].durability.current <= 0) eproctemp.setFooter('❌ Ferramenta não possui durabilidade')
                    else if (processjson.in[i].tool == 1 && processjson.tools[processjson.in[i].tool].fuel.current <= 0) eproctemp.setFooter('❌ Não possui líquido suficiente')

                    if (processjson.in[i].drops && processjson.in[i].drops.length > 0) {

                        function gen(rarity, title) {
        
                            let cclist_rar = processjson.in[i].drops.filter((item) => item.rarity == rarity);
        
                            let ccmap_rar = ""
                            
                            if (cclist_rar.length > 0) {
                            
                                let totalpages_rar = cclist_rar.length % 5;
                                if (totalpages_rar == 0) totalpages_rar = (cclist_rar.length)/5;
                                else totalpages_rar = ((cclist_rar.length-totalpages_rar)/5)+1;
                                
                                for (iil = 0; iil < totalpages_rar; iil++){
                                    const sliced = cclist_rar.slice(((iil+1)*5)-5, ((iil+1)*5))
                                    if (sliced.length > 0) {
                                        ccmap_rar += sliced.map((item) => item.quantia + 'x ' + item.icon).join('<:inv:781993473331036251>') + '\n'
                                    }
                                }

                                if (ccmap_rar.length > 0) eproctemp.addField(title, ccmap_rar, false)
        
                            }
        
                        }
        
                        gen('common', "<:comum:852302869889155082> Comuns:\n")
                        gen('uncommon', "<:incomum:852302869888630854> Incomuns:\n")
                        gen('rare', "<:raro:852302870074359838> Raros:\n")
                        gen('epic', "<:epico:852302869628715050> Épicos:\n")
                        gen('lendary', "<:lendario:852302870144745512> Lendários:\n")
                        gen('mythic', "<:mitico:852302869746548787> Míticos:\n")
        
                    } else {
                        eproctemp.addField(`❌ Sem drops`, `Este processo ainda não possui drops de fragmentos processados.`, true)
                    }
        
                    embeds.push(eproctemp)
                
                }
            } else {
                await svcCacheLists.waiting.remove(interaction.user.id, 'working');
                embed.fields = []
                embed.setDescription(`❌ Você não possui processos ativos no momento para visualizá-los\nUtilize \`/iniciarprocesso\` para começar a processar fragmentos.`, true)
                embeds = []
                embeds.push(embed)
            }

        }

        let current = "processos"

        await setProcess()

        let tool

        function reworkButtons(current, allDisabled) {

            const components = []

            const btn0 = svcCreateButton('processos', (current == 'processos' ? 'SUCCESS': 'SECONDARY'), 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            //const btn1 = svcCreateButton('inv', (current == 'inv' ? 'SUCCESS': 'SECONDARY'), 'Inventário', '📦', (current == 'inv' || allDisabled ? true : false))
            const btn2 = svcCreateButton('ferr', (current == 'ferr' ? 'SUCCESS': 'SECONDARY'), current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) < 70 ? 'Reparar' : ('Ferramenta de Limpeza'), current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) < 70 ? '🧰' : '🛠', (current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) >= 70 || allDisabled ? true : false))
            const btn3 = svcCreateButton('lqd', (current == 'lqd' ? 'SUCCESS': 'SECONDARY'), current == 'lqd' && ((tool.fuel.current/tool.fuel.max*100).toFixed(2)) < 50 ? 'Repor' : 'Líquido de Limpeza', current == 'lqd' && ((tool.fuel.current/tool.fuel.max*100).toFixed(2)) < 50 ? '⚗' : '🧪', (current == 'lqd' && (tool.fuel.current/tool.fuel.max*100).toFixed(2) >= 50 || allDisabled ? true : false))
            
            components.push(svcRowComponents([btn0, btn2, btn3]))

            if (current == 'ferr' || current == 'lqd') {
                const btn4 = svcCreateButton('pot1', 'PRIMARY', '-5 Potência', '', ((tool.potency.current-5 < tool.potency.rangemin) || allDisabled ? true : false))
                const btn5 = svcCreateButton('pot2', 'PRIMARY', '-1 Potência', '', ((tool.potency.current-1 < tool.potency.rangemin) || allDisabled ? true : false))
                const btnreset = svcCreateButton('potreset', 'PRIMARY', '', '🔁', (allDisabled ? true : false))
                const btn6 = svcCreateButton('pot3', 'PRIMARY', '+1 Potência', '', ((tool.potency.current+1 > tool.potency.rangemax) || allDisabled ? true : false))
                const btn7 = svcCreateButton('pot4', 'PRIMARY', '+5 Potência', '', ((tool.potency.current+5 > tool.potency.rangemax) || allDisabled ? true : false))
                components.push(svcRowComponents([btn4, btn5, btnreset, btn6, btn7]))
            }

            const endprocs = processjson.in.filter(processo => {
                return processo.fragments.current == 0
            })

            if (endprocs.length > 0 && !['ferr', 'lqd'].includes(current)) {

                let butnList = []

                for (i = 0; i < endprocs.length; i++) {1
                    butnList.push(svcCreateButton('proc:' + endprocs[i].id, 'SECONDARY', ' ' + custoretirar + ' | Processo: ' + endprocs[i].id, '🔸', (allDisabled ? true : false)))
                }

                let totalcomponents = butnList.length % 5;
                if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
                else totalcomponents = ((butnList.length-totalcomponents)/5);

                totalcomponents += 1

                for (x = 0; x < totalcomponents; x++) {
                    const var1 = (x+1)*5-5
                    const var2 = ((x+1)*5)
                    const rowBtn = svcRowComponents(butnList.slice(var1, var2))
                    if (rowBtn.components.length > 0) components.push(rowBtn)

                }

            }

            return components
        }

        const components = reworkButtons(current)

        const embedinteraction = await interaction.reply({ embeds, components, withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 35000 });

        collector.on('collect', async (b) => {

            reacted = true;
            embeds = [embed]
            embed.fields = [];
            let repair = false
            let custorepair = 0
            embed.setDescription('')
            embed.setColor('#36393e')
            if ((b.customId == 'ferr' && current == 'ferr')) repair = true
            if ((b.customId == 'lqd' && current == 'lqd')) repair = true

            current = b.customId

            svcPlayerUtils.cooldown.set(interaction.user.id, "verprocessamentos", 35);

            const players_utils = await DatabaseManager.get(interaction.user.id, 'players_utils')
            const svcMoney = await svcEco.svcMoney.get(interaction.user.id)
            processjson = players_utils.process

            if (b.customId == 'processos') {
                embed.setDescription('')
                await setProcess()
            }

            if (b.customId == 'ferr') tool = processjson.tools[0]
            if (b.customId == 'lqd') tool = processjson.tools[1]

            if (b.customId.startsWith('pot')) {
                if (b.customId == 'pot1') {
                    if (tool.potency.current-5 >= tool.potency.rangemin) tool.potency.current -= 5
                }
                if (b.customId == 'pot2') {
                    if (tool.potency.current-1 >= tool.potency.rangemin) tool.potency.current -= 1
                }
                if (b.customId == 'potreset') {
                    tool.potency.current = tool.potency.default
                }
                if (b.customId == 'pot3') {
                    if (tool.potency.current+1 <= tool.potency.rangemax) tool.potency.current += 1
                }
                if (b.customId == 'pot4') {
                    if (tool.potency.current+5 <= tool.potency.rangemax) tool.potency.current += 5
                }
                processjson.tools[tool.type] = tool
                DatabaseManager.set(interaction.user.id, 'players_utils', 'process', processjson)
                b.customId = (tool.type == 0 ? 'ferr' : 'lqd')
                current = (tool.type == 0 ? 'ferr' : 'lqd')
            }
            
            if (b.customId == 'ferr') {

                if ((tool.durability.current/tool.durability.max*100).toFixed(2) < 70) {
                    custorepair = (tool.durability.max-tool.durability.current)*200
                }

                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${processjson.in.filter((proca) => proca.tool == 0).length}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${svcMs(svcCompany.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments), true)}
Durabilidade: ${tool.durability.current}/${tool.durability.max} (${(tool.durability.current/tool.durability.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${svcCompany.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})
${(tool.durability.current/tool.durability.max*100).toFixed(2) < 70 ? `Custo de reparação atual: \`${custorepair} ${svcMoney}\` ${svcMoneyemoji}` : ''}
`)
            } if (b.customId == 'lqd') {

                if ((tool.fuel.current/tool.fuel.max*100).toFixed(2) < 50) {
                    custorepair = (tool.fuel.max-tool.fuel.current)*15
                }

                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${processjson.in.filter((proca) => proca.tool == 1).length}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${svcMs(svcCompany.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments), true)}
Tanque: ${(tool.fuel.current/1000).toFixed(2)}/${(tool.fuel.max/1000).toFixed(2)}L (${(tool.fuel.current/tool.fuel.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${svcCompany.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})
${(tool.fuel.current/tool.fuel.max*100).toFixed(2) < 50 ? `Custo de reposição atual: \`${custorepair} ${svcMoney}\` ${svcMoneyemoji}` : ''}
`)
            }  if (repair) {
                if (svcMoney < custorepair) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha ' + (b.customId == 'ferr' ? 'no reparo' : 'na reposição'), `Você não possui dinheiro o suficiente para ${(b.customId == 'ferr' ? 'reparar sua ferramenta' : 'repor este líquido')}.\nSeu dinheiro atual: **${svcFormat(svcMoney)}/${svcFormat(custorepair)} ${svcMoney} ${svcMoneyemoji}**`)
                } else {

                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso ' +  (b.customId == 'ferr' ? 'no reparo' : 'na reposição'), `Você gastou **${svcFormat(custorepair)} ${svcMoney} ${svcMoneyemoji}** e ${(b.customId == 'ferr' ? 'reparou com sucesso a sua ferramenta de limpeza' : 'repôs com sucesso o líquido de limpeza')}.`)
                
                
                    if (b.customId == 'ferr') {
                        processjson.tools[0].durability.current = processjson.tools[0].durability.max

                    } else {
                        processjson.tools[1].fuel.current = processjson.tools[1].fuel.max
                    }
                    
                    DatabaseManager.set(interaction.user.id, 'players_utils', 'process', processjson)
                    await svcEco.svcMoney.remove(interaction.user.id, custorepair);
                    await svcEco.addToHistory(interaction.user.id, `${(b.customId == 'ferr' ? 'Reparo' : 'Reposição')} | - ${svcFormat(custorepair)} ${svcMoneyemoji}`)
                    await svcCompany.jobs.process.add(interaction.user.id)
                    await svcCacheLists.waiting.add(interaction.user.id, embedinteraction, 'working');
                }
                    
            
            }
            if (b.customId.startsWith('proc:')) {

                let stamina = await svcPlayerUtils.stamina.get(interaction.user.id)

                if (stamina < custoretirar) {
                    
                    await setProcess()
                    embed.addField('❌ Falha na remoção', `Você não possui estamina o suficiente para retirar um processo\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${custoretirar}]**`)
                    if (processjson.in.length > 0) embeds.push(embed)

                } else {

                    svcPlayerUtils.stamina.remove(interaction.user.id, custoretirar)

                    const id = parseInt(b.customId.replace(/proc:/g, ''))
                    const oldproc = processjson.in.find((x) => x.id == id)
                    const indexProcess = processjson.in.indexOf(oldproc)
                    processjson.in.splice(indexProcess, 1)
                    DatabaseManager.set(interaction.user.id, 'players_utils', 'process', processjson)
                    await setProcess()

                    let xp = await svcPlayerUtils.execExp(interaction, oldproc.xpbase)
                    let score = parseFloat(oldproc.score)
                    svcCompany.stars.add(interaction.user.id, company.company_id, { score })

                    const retorno = await svcItemExtension.give(interaction, oldproc.drops || [])
                    
                    embed.addField('✅ Processo ' + id + ' removido', `Você removeu um processo que foi finalizado \`(+${xp} XP)\` ${score > 0 ? `**(+${score} ⭐)**`:''}${oldproc.drops.length > 0 ? `\nOs itens que foram encontrados por este processo foram para a mochila. [Colocados: ${retorno.colocados.length} | Descartados: ${retorno.descartados.length}]`:''}`)
                    if (processjson.in.length > 0) embeds.push(embed)

                }
            }

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.trabalhar.defer_update'); });

            collector.resetTimer()
            
            const components = reworkButtons(current)
            
            await interaction.editReply({ embeds, components })
            
        });
        
        collector.on('end', async collected => {
            const components = reworkButtons(current, true)
            interaction.editReply({ embeds, components })
            svcPlayerUtils.cooldown.set(interaction.user.id, "verprocessamentos", 0);
            return;
        });

	}
};
