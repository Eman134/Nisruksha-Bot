const Discord = require('discord.js');
const townsService = require('../../_classes/services/towns');
const eventsService = require('../../_classes/services/events');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const crateExtensionService = require('../../_classes/services/crateExtension');
const clientService = require('../../_classes/services/clientService');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

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
            const embedtemp = await utility.sendError(interaction, `Não possui nenhum tesouro não explorado na sua vila atual!\nUtilize \`/mapa\` para achar algum tesouro em outras vilas\nOBS: Os alertas de novos tesouros são feitos no servidor oficial do Nisruksha (\`/convite\`)`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await utility.sendError(interaction, `Você já encontra-se escavando um tesouro no momento! [[VER ESCAVAÇÃO]](${await cacheListsService.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let obj6 = await DatabaseManager.get(interaction.user.id, "machines");

        let prof = 0
        const init = Date.now()

        function getProgress() {
            const prof2 = eventsService.treasure.profundidade

            return utility.getProgress(8, '<:escav:807999848196079646>', '<:energyempty:741675234796503041>', prof > prof2 ? prof2 : prof, prof2, true);
        }
        
        let btn = utility.createButton('stopBtn', 'DANGER', 'Parar escavação')

        let components = [utility.rowComponents([btn])]

        const embed = new Discord.EmbedBuilder();
        embed.setTitle(`🔎 Procurando tesouro`);
        embed.setDescription(`Escavador: ${interaction.user}`);
        embed.addFields({ name: `<:treasure:807671407160197141> Informações da escavação`, value: `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ${getProgress()}` })
        embed.setFooter({ text: `Tempo de atualização: ${eventsService.treasure.update} segundos\nTempo escavando: ${utility.ms(Date.now()-init)}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
        
        const embedinteraction = (await interaction.reply({ embeds: [embed], withResponse: true })).resource.message;

        await cacheListsService.waiting.add(interaction.user.id, interaction, 'digging');

        async function edit() {

            try{

                prof += utility.random(0, 6)

                let xp = utility.random(5, 20);
                xp = await playersService.execExp(interaction, xp);
                
                embed.fields = [];
                const obj6 = await DatabaseManager.get(interaction.user.id, "machines");

                let stop = false

                if (eventsService.treasure.picked) {
                    embed.setTitle(`❌ Tesouro não encontrado`);
                    embed.addFields({ name: `<:treasure:807671407160197141> Informações da escavação`, value: `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ❌ Parece que alguém o pegou antes!` })
                    embed.setFooter({ text: `Tempo escavando: ${utility.ms(Date.now()-init)}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
                    stop = true
                } else if (prof >= eventsService.treasure.profundidade && eventsService.treasure.picked == false) {
                    console.log(prof)
                    eventsService.treasure.picked = true
                    stop = true
                    embed.setTitle(`✅ Tesouro coletado`);
                    embed.addFields({ name: `<:treasure:807671407160197141> Informações da escavação`, value: `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ✅ Tesouro coletado com sucesso! (Utilize \`/mochila\`)` })
                    embed.setFooter({ text: `Tempo escavando: ${utility.ms(Date.now()-init)}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
                    crateExtensionService.give(interaction.user.id, 3, 1)
                    const channel = clientService.current.channels.cache.get(eventsService.getConfig().modules.events.channel)
                    channel.bulkDelete(10).catch((error) => reportError(error, 'command.escavar.bulk_delete'))
                } else if (prof < eventsService.treasure.profundidade){
                    embed.addFields({ name: `<:treasure:807671407160197141> Informações da escavação`, value: `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(eventsService.treasure.profundidade/3)}m\nEscavação: ${getProgress()}` })
                    embed.setFooter({ text: `Tempo de atualização: ${eventsService.treasure.update} segundos\nTempo escavando: ${utility.ms(Date.now()-init)}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
                }

                try{
                    if (stop) components = []
                    await interaction.editReply({embeds: [embed], components })
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
                        const embedtemp = await utility.sendError(interaction, `Você parou a escavação!`)
                        await interaction.followUp({ embeds: [embedtemp] })
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
