

module.exports = {
    name: 'processos',
    aliases: ['menuprocessos', 'procs', 'processamentos'],
    category: 'none',
    description: 'Veja os seus processamentos que estão sendo realizados ou foram realizados e também as ferramentas de limpeza',
    companytype: 7,
    mastery: 30,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()

        const players_utils = await API.getInfo(msg.author, 'players_utils')
        const machines = await API.getInfo(msg.author, 'machines')

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
                    embed.addField(`⏳ Processo ${processjson.in[i].id}: ${API.ms2(Date.now()-processjson.in[i].started)}`, `Termina em: ${API.ms2(Date.now()-processjson.in[i].end > 0 ? 'Finalizado' : API.ms2(-1*(Date.now()-processjson.in[i].end)))} \nID de Processo: ${processjson.in[i].id}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]`, true)
                }
            } else {
                embed.addField(`❌ Algo inesperado aconteceu`, `Você não possui processos ativos no momento para visualizá-los\nUtilize \`${API.prefix}iniciarprocesso\` para começar a processar fragmentos.`, true)
            }

        }

        let current = "processos"

        setProcess()

        function reworkButtons(current, allDisabled) {
            const btn0 = API.createButton('processos', 'grey', 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            const btn1 = API.createButton('inv', 'grey', 'Inventário', '📦', (current == 'inv' || allDisabled ? true : false))
            const btn2 = API.createButton('ferr', 'grey', 'Ferramenta de Limpeza', '🔨', (current == 'ferr' || allDisabled ? true : false))
            const btn3 = API.createButton('lqd', 'grey', 'Líquido de Limpeza', '🧪', (current == 'lqd' || allDisabled ? true : false))
            return [API.rowButton([btn0, btn1, btn2, btn3])]
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
            
            if (b.id == 'ferr') {
                const tool = processjson.tools[0]
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*1000} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*1000)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Potência de Limpeza: ${tool.potency.current}/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${tool.potency.name})
Tempo de Limpeza Máximo: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Durabilidade: ${tool.durability.current}/${tool.durability.max} (${(tool.durability.current/tool.durability.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%`)
            } if (b.id == 'lqd') {
                const tool = processjson.tools[1]
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*1000} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*1000)).toFixed(2)}%
Processos simultâneos: ${tool.process.current}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Potência de Limpeza: ${tool.potency.current}/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${tool.potency.name})
Tempo de Limpeza Máximo: ${API.ms2(API.company.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Consumo: ${(tool.fuel.consume/1000).toFixed(2)}L/1000 <:fragmento:843674514260623371>
Tanque: ${(tool.fuel.current/1000).toFixed(2)}/${(tool.fuel.max/1000).toFixed(2)}L
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%`)
            } if (b.id == 'processos') {
                embed.setDescription('')
                setProcess()
            }

            b.defer()

            collector.resetTimer()

            const components = reworkButtons(current)

            await embedmsg.edit({ embed, components })

        });
        
        collector.on('end', async collected => {
            const components = reworkButtons(current, true)
            embedmsg.edit({ embed, components })
            return;
        });

	}
};