

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

        function setProcess() {
            embed.addField(`⏳ Processo 1: 26h 13m 25s`, `ID de Processo: 1\nMétodo de Limpeza: 🧪 Ácido Muriático\nFragmentos em Limpeza: [5/500]`, true)
            .addField(`⏳ Processo 2: 13h 18m 57s`, `ID de Processo: 2\nMétodo de Limpeza: 🔨 Marreta de Rubi\nFragmentos em Limpeza: [17/300]`, true)
            .addField(`Drops`, `<:comum:852302869889155082> Comuns:\n1x Chapéu de Palha   1x Dinamite\n\n<:incomum:852302869888630854> Incomuns:\n1x Frasco de Vidro`, false)
        }

        let current = "processos"

        setProcess()

        function reworkButtons(current, allDisabled) {
            const btn0 = API.createButton('processos', 'grey', 'Processos', '⏳', (current == 'processos' || allDisabled ? true : false))
            const btn1 = API.createButton('ferr', 'grey', 'Ferramenta de Limpeza', '🔨', (current == 'ferr' || allDisabled ? true : false))
            const btn2 = API.createButton('lqd', 'grey', 'Líquido de Limpeza', '🧪', (current == 'lqd' || allDisabled ? true : false))
            return [API.rowButton([btn0, btn1, btn2])]
        }

        let embedmsg = await msg.quote({ embed, components: reworkButtons(current) });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 35000 });
        collector.on('collect', async (b) => {
            reacted = true;
            embed.fields = [];
            b.defer()

            collector.resetTimer()

            current = b.id
            
            if (b.id == 'ferr') {
                embed.setDescription(`
🔨 Marreta de Rubi
Progresso de Trabalho: Nível 10/50 - 14671/14672 XP - 99.9%
Máximo de processos simultâneos: 4
Máximo de Fragmentos por Processo: 300
Tempo de Limpeza: 15-25h
Durabilidade: 68%
Penetração: 14%
<:mitico:852302869746548787>1% <:lendario:852302870144745512>3% <:epico:852302869628715050>6% <:raro:852302870074359838>20% <:incomum:852302869888630854>30% <:comum:852302869889155082>40%`)
            } if (b.id == 'lqd') {
                embed.setDescription(`
🧪 Ácido Muriático
Progresso de Trabalho: Nível 5/50 - 14671/14672 XP - 99.9%
Máximo de processos simultâneos: 2
Máximo de Fragmentos por Processo: 500
Tempo de Limpeza: 20-35h
Potência: Alta potência
Quantidade: 15L
Consumo: 1L/1000
<:mitico:852302869746548787>3% <:lendario:852302870144745512>5% <:epico:852302869628715050>6% <:raro:852302870074359838>24% <:incomum:852302869888630854>30% <:comum:852302869889155082>30%`)
            } if (b.id == 'processos') {
                embed.setDescription('')
                setProcess()
            }

            embedmsg.edit({ embed, components: reworkButtons(current) })

        });
        
        collector.on('end', async collected => {
            embedmsg.edit({ embed })
            return;
        });

	}
};