module.exports = {
    name: 'iniciarprocesso',
    aliases: ['startprocess', 'sproc', 'inproc'],
    category: 'none',
    description: 'Inicia um processo de limpeza de fragmentos para descobrir itens',
    companytype: 7,
    options: [
        {
            name: 'quantia',
            type: 'STRING',
            description: 'Selecione uma quantia de fragmentos para processar',
            required: true
        }],
    mastery: 30,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()

        const players_utils = await API.getInfo(msg.author, 'players_utils')
        let processjson = players_utils.process
        const machines = await API.getInfo(msg.author, 'machines')
        const level = machines.level
        const storage = await API.getInfo(msg.author, 'storage')

        const args = API.args(msg)


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

        let quantia = 0;

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fragmentos para processar!`, `iniciarprocesso <quantia>`)
            await msg.quote(embedtemp)
			return;
        }

        if (!API.isInt(API.toNumber(args[0]))) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fragmentos para processar!`, `iniciarprocesso <quantia>`)
            await msg.quote(embedtemp)
            return;
        }

        if (storage['fragmento'] <= 0) {
            const embedtemp = await API.sendError(msg, `Você não ${API.format(API.toNumber(args[0]))} fragmentos em seu armazém para processar!\nPara começar a ter fragmentos você deve adquirir um chipe de fragmentos e minerar!`)
            await msg.quote(embedtemp)
            return;
        }

        if (processjson.tools[0].process.current >= processjson.tools[0].process.max && processjson.tools[1].process.current >= processjson.tools[1].process.max) {
            const embedtemp = await API.sendError(msg, `Você atingiu o máximo de processamento simultâneos nas suas ferramentas de limpeza!\nUtilize \`${API.prefix}processos\` para visualizar seus processos.`)
            await msg.quote(embedtemp)
            return;
        }

        quantia = API.toNumber(args[0]);
        
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
                    
                    if (processjson.in[i]) embed.addField(`⏳ Processo ${processjson.in[i].id} ${(checkfi ? 'Finalizado ✅' : '')}`, `ID de Processo: ${processjson.in[i].id}${!checkfi ? '\nTempo decorrido: ' + API.ms2(Date.now() - processjson.in[i].started):''}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]\nXP ganho: ${processjson.in[i].xp}\nScore ganho: ${processjson.in[i].score} ⭐`, true)
                }
            } else {
                embed.addField(`❌ Algo inesperado aconteceu`, `Você não possui processos ativos no momento para visualizá-los\nSelecione a ferramenta para começar a processar fragmentos.`, true)
            }

        }

        let current = "processos"

        setProcess()

        function reworkButtons(current, allDisabled) {
            const btn2 = API.createButton('ferr', processjson.tools[0].process.current >= processjson.tools[0].process.max ? 'red':'green', processjson.tools[0].name + ' [' + processjson.tools[0].process.current + '/' +  + processjson.tools[0].process.max + ']', processjson.tools[0].icon.split(':')[2] ? processjson.tools[0].icon.split(':')[2].replace('>', '') : processjson.tools[0].icon, (current == 'ferr' || allDisabled || processjson.tools[0].process.current >= processjson.tools[0].process.max ? true : false))
            const btn3 = API.createButton('lqd', processjson.tools[1].process.current >= processjson.tools[1].process.max ? 'red':'green', processjson.tools[1].name + ' [' + processjson.tools[1].process.current + '/' +  + processjson.tools[1].process.max + ']', processjson.tools[1].icon.split(':')[2] ? processjson.tools[1].icon.split(':')[2].replace('>', '') : processjson.tools[1].icon, (current == 'lqd' || allDisabled || processjson.tools[1].process.current >= processjson.tools[1].process.max ? true : false))
            return [API.rowButton([btn2, btn3])]
        }

        const components = reworkButtons(current)

        let embedmsg = await msg.quote({ embed, components });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 35000 });

        let reacted = false

        collector.on('collect', async (b) => {
            reacted = true;
            embed.fields = [];
            embed.setDescription('')
            current = b.id

            b.defer()

            collector.stop()
            const storage = await API.getInfo(msg.author, 'storage')
            const players_utils = await API.getInfo(msg.author, 'players_utils')
            let processjson = players_utils.process

            const tool = (b.id == 'ferr' ? processjson.tools[0] : processjson.tools[1])

            if (API.toNumber(args[0]) < Math.round(tool.process.maxfragments*0.15)) {
                const embedtemp = await API.sendError(msg, `Você não pode processar essa quantia de fragmentos com **${tool.icon} ${tool.name}**, o mínimo é de ${Math.round(tool.process.maxfragments*0.15)}!`)
                await embedmsg.edit({ embed: embedtemp })
                return;
            }
            if (API.toNumber(args[0]) > tool.process.maxfragments) {
                const embedtemp = await API.sendError(msg, `Você não pode processar essa quantia de fragmentos com **${tool.icon} ${tool.name}**, o máximo é de ${tool.process.maxfragments}!`)
                await embedmsg.edit({ embed: embedtemp })
                return;
            }

            if (tool.process.current >= tool.process.max) {
                const embedtemp = await API.sendError(msg, `Você atingiu o máximo de processos simultâneos com **${tool.icon} ${tool.name}**!`)
                await embedmsg.edit({ embed: embedtemp })
                return;
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
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${API.company.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})

**Você iniciou um processamento de \`${quantia} fragmentos\` <:fragmento:843674514260623371> com ${tool.icon} ${tool.name}.**
**Visualize seus processos utilizando \`${API.prefix}processos\`.**
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
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${API.company.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})

**Você iniciou um processamento de \`${quantia} fragmentos\` <:fragmento:843674514260623371> com ${tool.icon} ${tool.name}.**
**Visualize seus processos utilizando \`${API.prefix}processos\`.**
`)
            }

            let id = 1
            for (i = 1; processjson.in.length+processjson.in.length; i++) {
                if (processjson.in.filter((pi) => pi.id == i).length < 1) {
                    id = i
                    break;
                }
            }

            const defaultjsonprocess = {
                id,
                tool: (b.id == 'ferr' ? 0 : 1),
                started: Date.now(),
                end: Date.now()+API.company.jobs.process.calculateTime(tool.potency.current, quantia),
                fragments: {
                    current: quantia,
                    total: quantia
                },
                xp: 0,
                score: 0
            }

            processjson.tools[(b.id == 'ferr' ? 0 : 1)].process.current += 1

            processjson.in.push(defaultjsonprocess)

            API.maqExtension.storage.setOre(msg.author, 'fragmento', storage['fragmento']-quantia)

            API.setInfo(msg.author, 'players_utils', 'process', processjson)

            const components = reworkButtons(current, true)

            await embedmsg.edit({ embed, components })

            await API.company.jobs.process.add(msg.author)
            API.cacheLists.waiting.add(msg.author, embedmsg, 'working');

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            const components = reworkButtons(current, true)
            embedmsg.edit({ embed, components })
            return;
        });

	}
};
