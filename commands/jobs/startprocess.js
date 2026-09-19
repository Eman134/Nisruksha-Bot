const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const itemsService = require('../../_classes/services/items');
const cacheListsService = require('../../_classes/services/cacheLists');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia de fragmentos para processar').setRequired(true))

module.exports = {
    name: 'iniciarprocesso',
    aliases: ['startprocess', 'sproc', 'inproc'],
    category: 'none',
    description: 'Inicia um processo de limpeza de fragmentos para descobrir itens',
    companytype: 7,
    data,
    mastery: 30,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
		const embed = new Discord.EmbedBuilder()

        const user_id = BigInt(interaction.user.id)
        const players_utils = await prisma.players_utils.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
        let processjson = players_utils.process
        const machines = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
        const level = machines.level
        const storage = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })

        const quantia = interaction.options.getInteger("quantia")

        if (players_utils.process == null) {

            const defaultjson = {
                tools: {
                    0: companyService.jobs.process.tools.search(level, 0),
                    1: companyService.jobs.process.tools.search(level, 1),
                },
    
                in: []

            }

            processjson = defaultjson

            await prisma.players_utils.update({ where: { user_id }, data: { process: defaultjson } })
        }

        if (storage['fragmento'] <= quantia) {
            const embedtemp = await utility.sendError(interaction, `Você não possui ${utility.format(quantia)} fragmentos em seu armazém para processar!\nPara começar a ter fragmentos você deve adquirir um chipe de fragmentos e minerar!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (processjson.in.filter((proca) => proca.tool == 0).length >= processjson.tools[0].process.max && processjson.in.filter((proca) => proca.tool == 1).length >= processjson.tools[1].process.max) {
            const embedtemp = await utility.sendError(interaction, `Você atingiu o máximo de processamento simultâneos nas suas ferramentas de limpeza!\nUtilize \`/processos\` para visualizar seus processos.`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        function setProcess() {
            if (processjson.in.length > 0) {
                for (i = 0; i < processjson.in.length; i++) {
                    const checkfi = processjson.in[i].fragments.current == 0
                    
                    if (processjson.in[i]) embed.addFields({ name: `⏳ Processo ${processjson.in[i].id} ${(checkfi ? 'Finalizado ✅' : '')}`, value: `ID de Processo: ${processjson.in[i].id}${!checkfi ? '\nTempo decorrido: ' + compactTime(Date.now() - processjson.in[i].started):''}\nMétodo de Limpeza: ${processjson.tools[processjson.in[i].tool].icon} ${processjson.tools[processjson.in[i].tool].name}\nFragmentos em Limpeza: [${processjson.in[i].fragments.current}/${processjson.in[i].fragments.total}]\nXP ganho: ${processjson.in[i].xp}\nScore ganho: ${processjson.in[i].score} ⭐`, inline: true })
                }
            } else {
                embed.addFields({ name: `❌ Algo inesperado aconteceu`, value: `Você não possui processos ativos no momento para visualizá-los\nSelecione a ferramenta para começar a processar fragmentos.`, inline: true })
            }

        }

        let current = "processos"

        setProcess()

        function reworkButtons(current, allDisabled) {
            const btn2 = utility.createButton('ferr', processjson.in.filter((proca) => proca.tool == 0).length >= processjson.tools[0].process.max ? 'DANGER':'SUCCESS', processjson.tools[0].name + ' [' + processjson.in.filter((proca) => proca.tool == 0).length + '/' +  + processjson.tools[0].process.max + ']', processjson.tools[0].icon.split(':')[2] ? processjson.tools[0].icon.split(':')[2].replace('>', '') : processjson.tools[0].icon, (current == 'ferr' || allDisabled || processjson.in.filter((proca) => proca.tool == 0).length >= processjson.tools[0].process.max ? true : false))
            const btn3 = utility.createButton('lqd', processjson.in.filter((proca) => proca.tool == 1).length >= processjson.tools[1].process.max ? 'DANGER':'SUCCESS', processjson.tools[1].name + ' [' + processjson.in.filter((proca) => proca.tool == 1).length + '/' +  + processjson.tools[1].process.max + ']', processjson.tools[1].icon.split(':')[2] ? processjson.tools[1].icon.split(':')[2].replace('>', '') : processjson.tools[1].icon, (current == 'lqd' || allDisabled || processjson.in.filter((proca) => proca.tool == 1).length >= processjson.tools[1].process.max ? true : false))
            return [utility.rowComponents([btn2, btn3])]
        }

        const components = reworkButtons(current)

        let embedinteraction = (await interaction.reply({ embeds: [embed], components, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 35000 });

        let reacted = false

        const custostart = 100

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            embed.fields = [];
            embed.setDescription('')
            current = b.customId

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.iniciar.defer_update'); });

            collector.stop()
            
            const storage = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
            const players_utils = await prisma.players_utils.upsert({ where: { user_id }, update: { user_id }, create: { user_id } })
            let processjson = players_utils.process

            const tool = (b.customId == 'ferr' ? processjson.tools[0] : processjson.tools[1])
            const toolid = (b.customId == 'ferr' ? 0 : 1)

            let stamina = await playersService.stamina.get(interaction.user.id)

            if (stamina < custostart) {
                
                const embedtemp = await utility.sendError(interaction, `Você não possui estamina o suficiente para iniciar um processo\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${custostart}]**`)
                await interaction.reply({ embeds: [embedtemp]})
                interaction.editReply({ embeds: [embed], components: [] })
                return;

            }

            playersService.stamina.remove(interaction.user.id, custostart)

            if (quantia < Math.round(tool.process.maxfragments*0.15)) {
                const embedtemp = await utility.sendError(interaction, `Você não pode processar essa quantia de fragmentos com **${tool.icon} ${tool.name}**, o mínimo é de ${Math.round(tool.process.maxfragments*0.15)}!`)
                await interaction.editReply({ embeds: [embedtemp] })
                return;
            }
            if (quantia > tool.process.maxfragments) {
                const embedtemp = await utility.sendError(interaction, `Você não pode processar essa quantia de fragmentos com **${tool.icon} ${tool.name}**, o máximo é de ${tool.process.maxfragments}!`)
                await interaction.editReply({ embeds: [embedtemp] })
                return;
            }

            if (storage['fragmento'] <= quantia) {
                const embedtemp = await utility.sendError(interaction, `Você não possui ${utility.format(quantia)} fragmentos em seu armazém para processar!\nPara começar a ter fragmentos você deve adquirir um chipe de fragmentos e minerar!`)
                await interaction.editReply({ embeds: [embedtemp] })
                return;
            }

            if (processjson.in.filter((proca) => proca.tool == toolid).length >= tool.process.max) {
                const embedtemp = await utility.sendError(interaction, `Você atingiu o máximo de processos simultâneos com **${tool.icon} ${tool.name}**!`)
                await interaction.editReply({ embeds: [embedtemp] })
                return;
            }

            if (b.customId == 'ferr') {
        
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${processjson.in.filter((proca) => proca.tool == 0).length}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${compactTime(companyService.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Durabilidade: ${tool.durability.current}/${tool.durability.max} (${(tool.durability.current/tool.durability.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${companyService.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})

**Você usou ${custostart} pontos de Estamina 🔸 e iniciou um processamento de \`${quantia} fragmentos\` <:fragmento:843674514260623371> com ${tool.icon} ${tool.name}.**
**Visualize seus processos utilizando \`/processos\`.**
`)
            } if (b.customId == 'lqd') {
                embed.setDescription(
`${tool.icon} ${tool.name}
Progresso de Trabalho: Nível ${tool.toollevel.current}/${tool.toollevel.max} - ${tool.toollevel.exp}/${tool.toollevel.max*tool.toollevel.max*100} XP - ${(100*(tool.toollevel.exp)/(tool.toollevel.max*tool.toollevel.max*100)).toFixed(2)}%
Processos simultâneos: ${processjson.in.filter((proca) => proca.tool == 1).length}/${tool.process.max}
Máximo de Fragmentos por Processo: ${tool.process.maxfragments}
Tempo de Limpeza Médio: ${compactTime(companyService.jobs.process.calculateTime(tool.potency.current, tool.process.maxfragments))}
Tanque: ${(tool.fuel.current/1000).toFixed(2)}/${(tool.fuel.max/1000).toFixed(2)}L (${(tool.fuel.current/tool.fuel.max*100).toFixed(2)}%)
<:mitico:852302869746548787>${tool.drops.mythic}% <:lendario:852302870144745512>${tool.drops.lendary}% <:epico:852302869628715050>${tool.drops.epic}% <:raro:852302870074359838>${tool.drops.rare}% <:incomum:852302869888630854>${tool.drops.uncommon}% <:comum:852302869889155082>${tool.drops.common}%
Potência de Limpeza: [${tool.potency.rangemin}-**${tool.potency.current}**-${tool.potency.rangemax}]/${tool.potency.max} (${(tool.potency.current/tool.potency.max*100).toFixed(2)}%) (${companyService.jobs.process.translatePotency(Math.round(tool.potency.current/tool.potency.max*100))})

**Você usou ${custostart} pontos de Estamina 🔸 e iniciou um processamento de \`${quantia} fragmentos\` <:fragmento:843674514260623371> com ${tool.icon} ${tool.name}.**
**Visualize seus processos utilizando \`/processos\`.**
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
                tool: (b.customId == 'ferr' ? 0 : 1),
                started: Date.now(),
                end: Date.now()+companyService.jobs.process.calculateTime(tool.potency.current, quantia),
                fragments: {
                    current: quantia,
                    total: quantia
                },
                xp: 0,
                score: 0
            }

            itemsService.set(interaction.user.id, 'fragmento', storage['fragmento']-quantia)

            processjson.in.push(defaultjsonprocess)

            await prisma.players_utils.update({ where: { user_id }, data: { process: processjson } })

            const components = reworkButtons(current, true)

            await interaction.editReply({ embeds: [embed], components })

            await companyService.jobs.process.add(interaction.user.id)
            await cacheListsService.waiting.add(interaction.user.id, embedinteraction, 'working');

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            interaction.editReply({ embeds: [embed], components: [] })
            return;
        });

	}
};
