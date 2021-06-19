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
                for (i = 0; i < processjson.in.length; i++) {
    
                    const checkfi = processjson.in[i].fragments.current == 0

                    const estimadoms = API.company.jobs.process.calculateTime(processjson.tools[processjson.in[i].tool].potency.current, processjson.in[i].fragments.current)
                    
                    if (processjson.in[i]) embed.addField(`⏳ Processo ${processjson.in[i].id}: ${(checkfi ? 'Finalizado ✅' : API.ms2(estimadoms))}`, `ID de Processo: ${processjson.in[i].id}${!checkfi ? '\nTempo decorrido: ' + API.ms2(Date.now() - processjson.in[i].started):''}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]\nXP ganho: ${processjson.in[i].xp}\nScore ganho: ${processjson.in[i].score.toFixed(2)} ⭐`, true)
                }
            } else {
                embed.addField(`❌ Algo inesperado aconteceu`, `Você não possui processos ativos no momento para visualizá-los\nUtilize \`${API.prefix}iniciarprocesso\` para começar a processar fragmentos.`, true)
            }

        }

        let current = "processos"

        setProcess()

        let tool

        function reworkButtons(current, allDisabled) {

            const components = []

            const btn0 = API.createButton('processos', (current == 'processos' ? 'green': 'grey'), 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            const btn1 = API.createButton('inv', (current == 'inv' ? 'green': 'grey'), 'Inventário', '📦', (current == 'inv' || allDisabled ? true : false))
            const btn2 = API.createButton('ferr', (current == 'ferr' ? 'green': 'grey'), 'Ferramenta de Limpeza', '🔨', (current == 'ferr' || allDisabled ? true : false))
            const btn3 = API.createButton('lqd', (current == 'lqd' ? 'green': 'grey'), 'Líquido de Limpeza', '🧪', (current == 'lqd' || allDisabled ? true : false))
            
            components.push(API.rowButton([btn0, btn1, btn2, btn3]))

            if (current == 'ferr' || current == 'lqd') {
                const btn4 = API.createButton('pot1', 'blurple', '-5 Potência', '', ((tool.potency.current-5 < tool.potency.rangemin) || allDisabled ? true : false))
                const btn5 = API.createButton('pot2', 'blurple', '-1 Potência', '', ((tool.potency.current-1 < tool.potency.rangemin) || allDisabled ? true : false))
                const btnreset = API.createButton('potreset', 'blurple', '', '🔁', (allDisabled ? true : false))
                const btn6 = API.createButton('pot3', 'blurple', '+1 Potência', '', ((tool.potency.current+1 > tool.potency.rangemax) || allDisabled ? true : false))
                const btn7 = API.createButton('pot4', 'blurple', '+5 Potência', '', ((tool.potency.current+5 > tool.potency.rangemax) || allDisabled ? true : false))
                components.push(API.rowButton([btn4, btn5, btnreset, btn6, btn7]))
            }

            const endprocs = processjson.in.filter(processo => {
                return processo.fragments.current == 0
            })

            if (endprocs.length > 0) {

                let butnList = []

                for (i = 0; i < endprocs.length; i++) {1
                    butnList.push(API.createButton('proc:' + endprocs[i].id, 'grey', 'Processo: ' + endprocs[i].id, '', (allDisabled ? true : false)))
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

        let embedmsg = await msg.quote({ embed, components });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 35000 });

        collector.on('collect', async (b) => {
            reacted = true;
            embed.fields = [];
            embed.setDescription('')
            current = b.id
            API.playerUtils.cooldown.set(msg.author, "verprocessamentos", 35);

            const players_utils = await API.getInfo(msg.author, 'players_utils')
            processjson = players_utils.process

            if (b.id == 'inv') {
                embed.setDescription('Inventário de itens processados')
                if (processjson.drops && processjson.drops.length > 0) {
    
                    function gen(rarity, title) {
    
                        let cclist_rar = processjson.drops.filter((item) => item.rarity == rarity);

                        let ccmap_rar = ""
                        
                        if (cclist_rar.length > 0) {
                        
                            let totalpages_rar = cclist_rar.length % 5;
                            if (totalpages_rar == 0) totalpages = (cclist_rar.length)/5;
                            else totalpages_rar = ((cclist_rar.length-totalpages_rar)/5)+1;

                            for (i = totalpages_rar; i > 0; i--){
                                let ic = totalpages_rar+1-i
                                ccmap_rar += cclist_rar.slice((ic-1)*5, ic*5).map((item) => item.quantia + 'x ' + item.icon).join('<:inv:781993473331036251>') + '\n'
                            }

                            embed.addField(title, ccmap_rar, false)

                        }
    
                    }
    
                    gen('common', "<:comum:852302869889155082> Comuns:\n")
                    gen('uncommon', "<:incomum:852302869888630854> Incomuns:\n")
                    gen('rare', "<:raro:852302870074359838> Raros:\n")
                    gen('epic', "<:epico:852302869628715050> Épicos:\n")
                    gen('lendary', "<:lendario:852302870144745512> Lendários:\n")
                    gen('mythic', "<:mitico:852302869746548787> Míticos:\n")
    
                } else {
                    embed.addField(`❌ Algo inesperado aconteceu`, `Você não possui itens que foram encontrados de processos\nUtilize \`${API.prefix}iniciarprocesso\` para começar a processar fragmentos.`, true)
                }
            }

            if (b.id == 'processos') {
                embed.setDescription('')
                setProcess()
            }

            if (b.id == 'ferr') tool = processjson.tools[0]
            if (b.id == 'lqd') tool = processjson.tools[1]

            if (b.id.startsWith('pot')) {
                if (b.id == 'pot1') {
                    if (tool.potency.current-5 >= tool.potency.rangemin) tool.potency.current -= 5
                }
                if (b.id == 'pot2') {
                    if (tool.potency.current-1 >= tool.potency.rangemin) tool.potency.current -= 1
                }
                if (b.id == 'potreset') {
                    tool.potency.current = tool.potency.default
                }
                if (b.id == 'pot3') {
                    if (tool.potency.current+1 <= tool.potency.rangemax) tool.potency.current += 1
                }
                if (b.id == 'pot4') {
                    if (tool.potency.current+5 <= tool.potency.rangemax) tool.potency.current += 5
                }
                processjson.tools[tool.type] = tool
                API.setInfo(msg.author, 'players_utils', 'process', processjson)
                b.id = (tool.type == 0 ? 'ferr' : 'lqd')
                current = (tool.type == 0 ? 'ferr' : 'lqd')
            }
            
            if (b.id == 'ferr') {
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*1000)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Durabilidade: ${tool.durability.current}/${tool.durability.max} (${(tool.durability.current/tool.durability.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${tool.potency.name})
`)
            } if (b.id == 'lqd') {
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*1000)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Consumo: ${(tool.fuel.consume/1000).toFixed(2)}L por 1000 <:fragmento:843674514260623371>
Tanque: ${(tool.fuel.current/1000).toFixed(2)}/${(tool.fuel.max/1000).toFixed(2)}L
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${tool.potency.name})
`)
            } 
            if (b.id.startsWith('proc:')) {
                const id = parseInt(b.id.replace(/proc:/g, ''))
            }

            b.defer()

            collector.resetTimer()

            const components = reworkButtons(current)

            await embedmsg.edit({ embed, components })

        });
        
        collector.on('end', async collected => {
            const components = reworkButtons(current, true)
            embedmsg.edit({ embed, components })
            API.playerUtils.cooldown.set(msg.author, "verprocessamentos", 0);
            return;
        });

	}
};