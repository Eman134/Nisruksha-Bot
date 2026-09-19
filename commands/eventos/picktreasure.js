const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const townsService = require('../../_classes/services/towns');
const eventsService = require('../../_classes/services/events');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const crateExtensionService = require('../../_classes/services/crateExtension');
const clientService = require('../../_classes/services/clientService');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

function buildMessage(interaction, { color = '#36393f', title, value, footer, button }) {
    const container = new ContainerBuilder()
        .setAccentColor(parseInt(color.slice(1), 16))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent([
            `**${interaction.user.tag}**`,
            title ? `## ${title}` : '',
            value,
            footer ? `*${footer}*` : ''
        ].filter(Boolean).join('\n\n')));
    if (button) container.addActionRowComponents(new ActionRowBuilder().addComponents(button));
    return container;
}

function buildError(interaction, value) {
    return buildMessage(interaction, { color: '#b8312c', value: `<:error:736274027756388353> ${value}` });
}

module.exports = {
    name: 'pegartesouro',
    aliases: ['picktreasure'],
    category: 'none',
    description: 'Faça uma escavação na sua vila atual e tente encontrar tesouros',
    mastery: 40,
    companytype: -1,
	async execute(interaction) {

        
        let townnum = await townsService.getTownNum(interaction.user.id);

        if (parseInt(eventsService.treasure.loc) != parseInt(townnum) || eventsService.treasure.picked) {
            await interaction.reply({ components: [buildError(interaction, `Não possui nenhum tesouro não explorado na sua vila atual!\nUtilize \`/mapa\` para achar algum tesouro em outras vilas\nOBS: Os alertas de novos tesouros são feitos no servidor oficial do Nisruksha (\`/convite\`)`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'digging')) {
            await interaction.reply({ components: [buildError(interaction, `Você já encontra-se escavando um tesouro no momento! [[VER ESCAVAÇÃO]](${await cacheListsService.waiting.getLink(interaction.user.id, 'digging')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }
        
        const user_id = BigInt(interaction.user.id)
        let obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });

        let prof = 0
        const init = Date.now()

        function getProgress() {
            const prof2 = eventsService.treasure.profundidade

            return utility.getProgress(8, '<:escav:807999848196079646>', '<:energyempty:741675234796503041>', prof > prof2 ? prof2 : prof, prof2, true);
        }
        
        let btn = utility.createButton('stopBtn', 'DANGER', 'Parar escavação')

        const components = [new ActionRowBuilder().addComponents(btn)]
        let container = buildMessage(interaction, { title: '🔎 Procurando tesouro', value: `Escavador: ${interaction.user}\n\n**<:treasure:807671407160197141> Informações da escavação**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`, footer: `Tempo de atualização: ${eventsService.treasure.update} segundos\nTempo escavando: ${utility.ms(Date.now()-init)}`, button: btn });
        const embedinteraction = (await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        await cacheListsService.waiting.add(interaction.user.id, interaction, 'digging');

        async function edit() {

            try{

                prof += utility.random(0, 6)

                let xp = utility.random(5, 20);
                xp = await playersService.execExp(interaction, xp);
                
                const obj6 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } });

                let stop = false

                if (eventsService.treasure.picked) {
                    container = buildMessage(interaction, { color: '#a60000', title: '❌ Tesouro não encontrado', value: `**<:treasure:807671407160197141> Informações da escavação**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ❌ Parece que alguém o pegou antes!`, footer: `Tempo escavando: ${utility.ms(Date.now()-init)}` });
                    stop = true
                } else if (prof >= eventsService.treasure.profundidade && eventsService.treasure.picked == false) {
                    console.log(prof)
                    eventsService.treasure.picked = true
                    stop = true
                    container = buildMessage(interaction, { color: '#5bff45', title: '✅ Tesouro coletado', value: `**<:treasure:807671407160197141> Informações da escavação**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ✅ Tesouro coletado com sucesso! (Utilize \`/mochila\`)`, footer: `Tempo escavando: ${utility.ms(Date.now()-init)}` });
                    crateExtensionService.give(interaction.user.id, 3, 1)
                    const channel = clientService.current.channels.cache.get(eventsService.getConfig().modules.events.channel)
                    channel.bulkDelete(10).catch((error) => reportError(error, 'command.escavar.bulk_delete'))
                } else if (prof < eventsService.treasure.profundidade){
                    container = buildMessage(interaction, { title: '🔎 Procurando tesouro', value: `**<:treasure:807671407160197141> Informações da escavação**\nNível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`, footer: `Tempo de atualização: ${eventsService.treasure.update} segundos\nTempo escavando: ${utility.ms(Date.now()-init)}`, button: stop ? null : btn });
                }

                try{
                    if (stop) components = []
                    await interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
                }catch (err) {
                    reportError(err, 'command.picktreasure.collector');
                    await cacheListsService.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                if (stop) {
                    await cacheListsService.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: eventsService.treasure.update*1000 });

                collector.on('collect', async (b) => {

                    if (!(b.user.id === interaction.user.id)) return  

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.escavar.defer_update'));
                        await cacheListsService.waiting.remove(interaction.user.id,  'digging');
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        await interaction.followUp({ components: [buildError(interaction, 'Você parou a escavação!')], flags: Discord.MessageFlags.IsComponentsV2 })
                        await cacheListsService.waiting.remove(interaction.user.id, 'digging');
                    } else {
                        edit();
                    }
                });

            } catch (error) {
                reportError(error, 'command.escavar.progress');
                await cacheListsService.waiting.remove(interaction.user.id, 'digging');
            }
        }
        edit();
	}
};
