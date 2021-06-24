module.exports = {
    name: 'processos',
    aliases: ['menuprocessos', 'procs', 'processamentos'],
    category: 'none',
    description: 'Veja todos os sistemas de processamentos, ferramentas e as limpezas',
    companytype: 7,
    mastery: 30,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()

        const players_utils = await API.getInfo(msg.author, 'players_utils')
        const machines = await API.getInfo(msg.author, 'machines')

        const check = await API.playerUtils.cooldown.check(msg.author, "verprocessamentos");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'verprocessamentos', 'ver outra mensagem de processamentos')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "verprocessamentos", 35);

        const level = machines.level

        let processjson = players_utils.process

        const custoretirar = 200

        if (players_utils.process == null) {

            const defaultjson = {
                tools: {
                    0: API.company.jobs.process.tools.search(level, 0),
                    1: API.company.jobs.process.tools.search(level, 1),
                },
    
                in: []

            }

            processjson = defaultjson

            API.setInfo(msg.author, 'players_utils', 'process', defaultjson)
        }

        let embeds = []

        /*

        {
    
            tools: {},

            in: [
                {
                    id: 1,
                    tool: 0, //Método de limpeza
                    started: timestamp,
                    end: timestamp+time,
                    fragments: {
                        current: 100,
                        total: 300
                    }
                }
            ],
            drops: []
        }

        */

        function setProcess() {
            
            if (processjson.in.length > 0) {
                embeds = []
                for (i = 0; i < processjson.in.length; i++) {
    
                    const eproctemp = new Discord.MessageEmbed()

                    const checkfi = processjson.in[i].fragments.current == 0

                    const estimadoms = API.company.jobs.process.calculateTime(processjson.tools[processjson.in[i].tool].potency.current, processjson.in[i].fragments.current)
                    
                    if (!processjson.in[i]) break
                    eproctemp.setDescription(`ID de Processo: ${processjson.in[i].id}${!checkfi ? '\nTempo decorrido: ' + API.ms2(Date.now() - processjson.in[i].started):''}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]\nXP ganho: ${processjson.in[i].xp}\nScore ganho: ${processjson.in[i].score} ⭐`, true)
                
                    eproctemp.setTitle(`⏳ Processo ${processjson.in[i].id}: ${(checkfi ? 'Finalizado ✅' : API.ms2(estimadoms))}`)
                    
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
                embed.fields = []
                embed.setDescription(`❌ Você não possui processos ativos no momento para visualizá-los\nUtilize \`${API.prefix}iniciarprocesso\` para começar a processar fragmentos.`, true)
                embeds.push(embed)
            }

        }

        let current = "processos"

        setProcess()

        let tool

        function reworkButtons(current, allDisabled) {

            const components = []

            const btn0 = API.createButton('processos', (current == 'processos' ? 'SUCCESS': 'SECONDARY'), 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            //const btn1 = API.createButton('inv', (current == 'inv' ? 'SUCCESS': 'SECONDARY'), 'Inventário', '📦', (current == 'inv' || allDisabled ? true : false))
            const btn2 = API.createButton('ferr', (current == 'ferr' ? 'SUCCESS': 'SECONDARY'), current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) < 70 ? 'Reparar' : ('Ferramenta de Limpeza'), current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) < 70 ? '🧰' : '🔨', (current == 'ferr' && ((tool.durability.current/tool.durability.max*100).toFixed(2)) >= 70 || allDisabled ? true : false))
            const btn3 = API.createButton('lqd', (current == 'lqd' ? 'SUCCESS': 'SECONDARY'), current == 'lqd' && ((tool.fuel.current/tool.fuel.max*100).toFixed(2)) < 50 ? 'Repor' : 'Líquido de Limpeza', current == 'lqd' && ((tool.fuel.current/tool.fuel.max*100).toFixed(2)) < 50 ? '⚗' : '🧪', (current == 'lqd' && (tool.fuel.current/tool.fuel.max*100).toFixed(2) >= 50 || allDisabled ? true : false))
            
            components.push(API.rowButton([btn0, btn2, btn3]))

            if (current == 'ferr' || current == 'lqd') {
                const btn4 = API.createButton('pot1', 'PRIMARY', '-5 Potência', '', ((tool.potency.current-5 < tool.potency.rangemin) || allDisabled ? true : false))
                const btn5 = API.createButton('pot2', 'PRIMARY', '-1 Potência', '', ((tool.potency.current-1 < tool.potency.rangemin) || allDisabled ? true : false))
                const btnreset = API.createButton('potreset', 'PRIMARY', '', '🔁', (allDisabled ? true : false))
                const btn6 = API.createButton('pot3', 'PRIMARY', '+1 Potência', '', ((tool.potency.current+1 > tool.potency.rangemax) || allDisabled ? true : false))
                const btn7 = API.createButton('pot4', 'PRIMARY', '+5 Potência', '', ((tool.potency.current+5 > tool.potency.rangemax) || allDisabled ? true : false))
                components.push(API.rowButton([btn4, btn5, btnreset, btn6, btn7]))
            }

            const endprocs = processjson.in.filter(processo => {
                return processo.fragments.current == 0
            })

            if (endprocs.length > 0) {

                let butnList = []

                for (i = 0; i < endprocs.length; i++) {1
                    butnList.push(API.createButton('proc:' + endprocs[i].id, 'SECONDARY', ' ' + custoretirar + ' | Processo: ' + endprocs[i].id, '🔸', (allDisabled ? true : false)))
                }

                let totalcomponents = butnList.length % 5;
                if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
                else totalcomponents = ((butnList.length-totalcomponents)/5);

                totalcomponents += 1

                for (x = 0; x < totalcomponents; x++) {
                    const var1 = (x+1)*5-5
                    const var2 = ((x+1)*5)
                    const rowBtn = API.rowButton(butnList.slice(var1, var2))
                    if (rowBtn.components.length > 0) components.push(rowBtn)

                }

            }

            return components
        }

        const components = reworkButtons(current)

        let embedmsg = await msg.quote({ embeds, components });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector(filter, { time: 35000 });

        collector.on('collect', async (b) => {
            reacted = true;
            embeds = [embed]
            embed.fields = [];
            let repair = false
            let custorepair = 0
            embed.setDescription('')
            embed.setColor('#36393e')
            if ((b.customID == 'ferr' && current == 'ferr')) repair = true
            if ((b.customID == 'lqd' && current == 'lqd')) repair = true

            current = b.customID

            API.playerUtils.cooldown.set(msg.author, "verprocessamentos", 35);

            const players_utils = await API.getInfo(msg.author, 'players_utils')
            const money = await API.eco.money.get(msg.author)
            processjson = players_utils.process

            if (b.customID == 'processos') {
                embed.setDescription('')
                setProcess()
            }

            if (b.customID == 'ferr') tool = processjson.tools[0]
            if (b.customID == 'lqd') tool = processjson.tools[1]

            if (b.customID.startsWith('pot')) {
                if (b.customID == 'pot1') {
                    if (tool.potency.current-5 >= tool.potency.rangemin) tool.potency.current -= 5
                }
                if (b.customID == 'pot2') {
                    if (tool.potency.current-1 >= tool.potency.rangemin) tool.potency.current -= 1
                }
                if (b.customID == 'potreset') {
                    tool.potency.current = tool.potency.default
                }
                if (b.customID == 'pot3') {
                    if (tool.potency.current+1 <= tool.potency.rangemax) tool.potency.current += 1
                }
                if (b.customID == 'pot4') {
                    if (tool.potency.current+5 <= tool.potency.rangemax) tool.potency.current += 5
                }
                processjson.tools[tool.type] = tool
                API.setInfo(msg.author, 'players_utils', 'process', processjson)
                b.customID = (tool.type == 0 ? 'ferr' : 'lqd')
                current = (tool.type == 0 ? 'ferr' : 'lqd')
            }
            
            if (b.customID == 'ferr') {

                if ((tool.durability.current/tool.durability.max*100).toFixed(2) < 70) {
                    custorepair = (tool.durability.max-tool.durability.current)*200
                }

                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Durabilidade: ${tool.durability.current}/${tool.durability.max} (${(tool.durability.current/tool.durability.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${API.company.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})
${(tool.durability.current/tool.durability.max*100).toFixed(2) < 70 ? `Custo de reparação atual: \`${custorepair} ${API.money}\` ${API.moneyemoji}` : ''}
`)
            } if (b.customID == 'lqd') {

                if ((tool.fuel.current/tool.fuel.max*100).toFixed(2) < 50) {
                    custorepair = (tool.fuel.max-tool.fuel.current)*15
                }

                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Tanque: ${(tool.fuel.current/1000).toFixed(2)}/${(tool.fuel.max/1000).toFixed(2)}L (${(tool.fuel.current/tool.fuel.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${API.company.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})
${(tool.fuel.current/tool.fuel.max*100).toFixed(2) < 50 ? `Custo de reposição atual: \`${custorepair} ${API.money}\` ${API.moneyemoji}` : ''}
`)
            }  if (repair) {
                if (money < custorepair) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha ' + (b.customID == 'ferr' ? 'no reparo' : 'na reposição'), `Você não possui dinheiro o suficiente para ${(b.customID == 'ferr' ? 'reparar sua ferramenta' : 'repor este líquido')}.\nSeu dinheiro atual: **${API.format(money)}/${API.format(custorepair)} ${API.money} ${API.moneyemoji}**`)
                } else {

                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso ' +  (b.customID == 'ferr' ? 'no reparo' : 'na reposição'), `Você gastou **${API.format(custorepair)} ${API.money} ${API.moneyemoji}** e ${(b.customID == 'ferr' ? 'reparou com sucesso a sua ferramenta de limpeza' : 'repôs com sucesso o líquido de limpeza')}.`)
                
                
                    if (b.customID == 'ferr') {
                        processjson.tools[0].durability.current = processjson.tools[0].durability.max

                    } else {
                        processjson.tools[1].fuel.current = processjson.tools[1].fuel.max
                    }
                    
                    API.setInfo(msg.author, 'players_utils', 'process', processjson)
                    await API.eco.money.remove(msg.author, custorepair);
                    await API.eco.addToHistory(msg.author, `${(b.customID == 'ferr' ? 'Reparo' : 'Reposição')} | - ${API.format(custorepair)} ${API.moneyemoji}`)
                }
                    
            
            }
            if (b.customID.startsWith('proc:')) {

                let stamina = await API.playerUtils.stamina.get(msg.author)

                if (stamina < custoretirar) {
                    
                    setProcess()
                    embed.addField('❌ Falha na remoção', `Você não possui estamina o suficiente para retirar um processo\n🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${custoretirar}]**`)

                } else {

                    API.playerUtils.stamina.remove(msg.author, custoretirar)

                    const id = parseInt(b.customID.replace(/proc:/g, ''))
                    const oldproc = processjson.in.find((x) => x.id == id)
                    const indexProcess = processjson.in.indexOf(oldproc)
                    processjson.in.splice(indexProcess, 1)
                    processjson.tools[oldproc.tool].process.current -= 1
                    API.setInfo(msg.author, 'players_utils', 'process', processjson)
                    setProcess()

                    let xp = await API.playerUtils.execExp(msg, oldproc.xpbase)
                    let score = parseFloat(oldproc.score)
                    API.company.stars.add(msg.author, company.company_id, { score })

                    const retorno = await API.itemExtension.give(msg, oldproc.drops || [])
                    
                    embed.addField('✅ Processo ' + id + ' removido', `Você removeu um processo que foi finalizado \`(+${xp} XP)\` ${score > 0 ? `**(+${score} ⭐)**`:''}${oldproc.drops.length > 0 ? `\nOs itens que foram encontrados por este processo foram para a mochila. [Colocados: ${retorno.colocados.length} | Descartados: ${retorno.descartados.length}]`:''}`)
                    if (processjson.in.length > 0) embeds.push(embed)

                }
            }

            b.deferUpdate()

            collector.resetTimer()

            const components = reworkButtons(current)
            
            await embedmsg.edit({ embeds, components })

        });
        
        collector.on('end', async collected => {
            const components = reworkButtons(current, true)
            embedmsg.edit({ embeds, components })
            API.playerUtils.cooldown.set(msg.author, "verprocessamentos", 0);
            return;
        });

	}
};