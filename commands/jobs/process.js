

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

        const processjson = players_utils.process

        /*

        {
            tools: {
                0: {
                    name: 'Marreta de Rubi',
                    icon: '🔨',
                    potency: {
                        current: 100, // Chance de dar certo a limpeza, 50%
                        max: 200
                        name: 'Média potência'
                    }
                    durability: {
                        current: 50,
                        max: 600
                    },
                    level: {
                        current: 5,
                        exp: 500,
                        maxexp: 5000
                    },
                    process: {
                        current: 0,
                        max: 2
                    },
                    drops: {
                        mythic: 1,
                        lendary: 3,
                        epic: 6,
                        rare: 20,
                        incomum: 30,
                        comum: 40
                    }
                },
                1: {
                    name: 'Ácido Muriático',
                    icon: '🧪',
                    potency: {
                        current: 100, // Chance de dar certo a limpeza, 50%
                        max: 200
                        name: 'Média potência'
                    },
                    fuel: {
                        consume: 5000 // 5L por 1000 fragmentos,
                        tank: 10000 // 10L
                    },
                    level: {
                        current: 5,
                        exp: 500,
                        maxexp: 5000
                    },
                    process: {
                        current: 0,
                        max: 2
                    },
                    drops: {
                        mythic: 1,
                        lendary: 3,
                        epic: 6,
                        rare: 20,
                        incomum: 30,
                        comum: 40
                    }
                }
            },

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
            drops: Map(name) item com quantidade
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

            if (processjson.drops.size > 0) {
                embed.addField(`Drops`, `<:comum:852302869889155082> Comuns:\n1x Chapéu de Palha   1x Dinamite\n\n<:incomum:852302869888630854> Incomuns:\n1x Frasco de Vidro`, false)
            }

        }

        let current = "processos"

        setProcess()

        function reworkButtons(current, allDisabled) {
            const btn0 = API.createButton('processos', 'grey', 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            const btn1 = API.createButton('ferr', 'grey', 'Ferramenta de Limpeza', '🔨', (current == 'ferr' || allDisabled ? true : false))
            const btn2 = API.createButton('lqd', 'grey', 'Líquido de Limpeza', '🧪', (current == 'lqd' || allDisabled ? true : false))
            return [API.rowButton([btn0, btn1, btn2])]
        }

        const components = reworkButtons(current)

        let embedmsg = await msg.quote({ embed, components });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 35000 });
        collector.on('collect', async (b) => {
            reacted = true;
            embed.fields = [];

            current = b.id
            
            if (b.id == 'ferr') {
                embed.setDescription(`
🔨 Marreta de Rubi
Progresso de Trabalho: Nível 10/50 - 14671/14672 XP - 99.9%
Máximo de processos simultâneos: 4
Máximo de Fragmentos por Processo: 300
Tempo de Limpeza: 15-25h
Durabilidade: 68%
Potência de Limpeza: 64% (Média-Alta potência)
<:mitico:852302869746548787>1% <:lendario:852302870144745512>3% <:epico:852302869628715050>6% <:raro:852302870074359838>20% <:incomum:852302869888630854>30% <:comum:852302869889155082>40%`)
            } if (b.id == 'lqd') {
                embed.setDescription(`
🧪 Ácido Muriático
Progresso de Trabalho: Nível 5/50 - 14671/14672 XP - 99.9%
Máximo de processos simultâneos: 2
Máximo de Fragmentos por Processo: 500
Tempo de Limpeza: 20-35h
Potência de Limpeza: 95% (Alta potência)
Quantidade: 15L
Consumo: 1L/1000
<:mitico:852302869746548787>3% <:lendario:852302870144745512>5% <:epico:852302869628715050>6% <:raro:852302870074359838>24% <:incomum:852302869888630854>30% <:comum:852302869889155082>30%`)
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
            const components = reworkButtons(current, allDisabled)
            embedmsg.edit({ embed, components })
            return;
        });

	}
};