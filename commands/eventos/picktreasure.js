const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","cacheLists","client","crateExtension","createButton","events","getProgress","ms","playerUtils","random","rowComponents","sendError","townExtension"],
    name: 'pegartesouro',
    aliases: ['picktreasure'],
    category: 'none',
    description: 'Faça uma escavação na sua vila atual e tente encontrar tesouros',
    mastery: 40,
    companytype: -1,
	async execute(interaction, svcDiscord, svcCacheLists, svcClient, svcCrateExtension, svcCreateButton, svcEvents, svcGetProgress, svcMs, svcPlayerUtils, svcRandom, svcRowComponents, svcSendError, svcTownExtension) {
        let townnum = await svcTownExtension.getTownNum(interaction.user.id);

        if (parseInt(svcEvents.treasure.loc) != parseInt(townnum) || svcEvents.treasure.picked) {
            const embedtemp = await svcSendError(interaction, `Não possui nenhum tesouro não explorado na sua vila atual!\nUtilize \`/mapa\` para achar algum tesouro em outras vilas\nOBS: Os alertas de novos tesouros são feitos no servidor oficial do Nisruksha (\`/convite\`)`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await svcCacheLists.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await svcSendError(interaction, `Você já encontra-se escavando um tesouro no momento! [[VER ESCAVAÇÃO]](${await svcCacheLists.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let obj6 = await DatabaseManager.get(interaction.user.id, "machines");

        let prof = 0
        const init = Date.now()

        function svcGetProgress() {
            const prof2 = svcEvents.treasure.profundidade

            return svcGetProgress(8, '<:escav:807999848196079646>', '<:energyempty:741675234796503041>', prof > prof2 ? prof2 : prof, prof2, true);
        }
        
        let btn = svcCreateButton('stopBtn', 'DANGER', 'Parar escavação')

        let components = [svcRowComponents([btn])]

        const embed = new svcDiscord.MessageEmbed();
        embed.setTitle(`🔎 Procurando tesouro`);
        embed.setDescription(`Escavador: ${interaction.user}`);
        embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nProfundidade: ${Math.round(svcEvents.treasure.profundidade/3)}m\nEscavação: ${svcGetProgress()}`)
        embed.setFooter(`Tempo de atualização: ${svcEvents.treasure.update} segundos\nTempo escavando: ${svcMs(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        const embedinteraction = await interaction.reply({ embeds: [embed], withResponse: true });

        await svcCacheLists.waiting.add(interaction.user.id, interaction, 'digging');

        async function edit() {

            try{

                prof += svcRandom(0, 6)

                let xp = svcRandom(5, 20);
                xp = await svcPlayerUtils.execExp(interaction, xp);
                
                embed.fields = [];
                const obj6 = await DatabaseManager.get(interaction.user.id, "machines");

                let stop = false

                if (svcEvents.treasure.picked) {
                    embed.setTitle(`❌ Tesouro não encontrado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(svcEvents.treasure.profundidade/3)}m\nEscavação: ❌ Parece que alguém o pegou antes!`)
                    embed.setFooter(`Tempo escavando: ${svcMs(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    stop = true
                } else if (prof >= svcEvents.treasure.profundidade && svcEvents.treasure.picked == false) {
                    console.log(prof)
                    svcEvents.treasure.picked = true
                    stop = true
                    embed.setTitle(`✅ Tesouro coletado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(svcEvents.treasure.profundidade/3)}m\nEscavação: ✅ Tesouro coletado com sucesso! (Utilize \`/mochila\`)`)
                    embed.setFooter(`Tempo escavando: ${svcMs(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    svcCrateExtension.give(interaction.user.id, 3, 1)
                    const channel = svcClient.channels.cache.get(svcEvents.getConfig().modules.events.channel)
                    channel.bulkDelete(10).catch((error) => reportError(error, 'command.escavar.bulk_delete'))
                } else if (prof < svcEvents.treasure.profundidade){
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(svcEvents.treasure.profundidade/3)}m\nEscavação: ${svcGetProgress()}`)
                    embed.setFooter(`Tempo de atualização: ${svcEvents.treasure.update} segundos\nTempo escavando: ${svcMs(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                }

                try{
                    if (stop) components = []
                    await interaction.editReply({embeds: [embed], components })
                }catch (err) {
                    reportError(err, 'command.picktreasure.collector');
                    await svcCacheLists.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                if (stop) {
                    await svcCacheLists.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: svcEvents.treasure.update*1000 });

                collector.on('collect', async (b) => {

                    if (!(b.user.id === interaction.user.id)) return  

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.escavar.defer_update'));
                        await svcCacheLists.waiting.remove(interaction.user.id,  'digging');
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        const embedtemp = await svcSendError(interaction, `Você parou a escavação!`)
                        await interaction.followUp({ embeds: [embedtemp] })
                        await svcCacheLists.waiting.remove(interaction.user.id, 'digging');
                    } else {
                        edit();
                    }
                });

            } catch (error) {
                reportError(error, 'command.escavar.progress');
                await svcCacheLists.waiting.remove(interaction.user.id, 'digging');
            }
        }
        edit();
	}
};
