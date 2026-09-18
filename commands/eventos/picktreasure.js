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
	async execute(API, interaction) {

        const Discord = API.Discord;

        let townnum = await API.townExtension.getTownNum(interaction.user.id);

        if (parseInt(API.events.treasure.loc) != parseInt(townnum) || API.events.treasure.picked) {
            const embedtemp = await API.sendError(interaction, `Não possui nenhum tesouro não explorado na sua vila atual!\nUtilize \`/mapa\` para achar algum tesouro em outras vilas\nOBS: Os alertas de novos tesouros são feitos no servidor oficial do Nisruksha (\`/convite\`)`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'digging')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se escavando um tesouro no momento! [[VER ESCAVAÇÃO]](${API.cacheLists.waiting.getLink(interaction.user.id, 'digging')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let obj6 = await DatabaseManager.get(interaction.user.id, "machines");

        let prof = 0
        const init = Date.now()

        function getProgress() {
            const prof2 = API.events.treasure.profundidade

            return API.getProgress(8, '<:escav:807999848196079646>', '<:energyempty:741675234796503041>', prof > prof2 ? prof2 : prof, prof2, true);
        }
        
        let btn = API.createButton('stopBtn', 'DANGER', 'Parar escavação')

        let components = [API.rowComponents([btn])]

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`🔎 Procurando tesouro`);
        embed.setDescription(`Escavador: ${interaction.user}`);
        embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`)
        embed.setFooter(`Tempo de atualização: ${API.events.treasure.update} segundos\nTempo escavando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        
        const embedinteraction = await interaction.reply({ embeds: [embed], fetchReply: true });

        API.cacheLists.waiting.add(interaction.user.id, interaction, 'digging');

        async function edit() {

            try{

                prof += API.random(0, 6)

                let xp = API.random(5, 20);
                xp = await API.playerUtils.execExp(interaction, xp);
                
                embed.fields = [];
                const obj6 = await DatabaseManager.get(interaction.user.id, "machines");

                let stop = false

                if (API.events.treasure.picked) {
                    embed.setTitle(`❌ Tesouro não encontrado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ❌ Parece que alguém o pegou antes!`)
                    embed.setFooter(`Tempo escavando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    stop = true
                } else if (prof >= API.events.treasure.profundidade && API.events.treasure.picked == false) {
                    console.log(prof)
                    API.events.treasure.picked = true
                    stop = true
                    embed.setTitle(`✅ Tesouro coletado`);
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ✅ Tesouro coletado com sucesso! (Utilize \`/mochila\`)`)
                    embed.setFooter(`Tempo escavando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                    API.crateExtension.give(interaction.user.id, 3, 1)
                    const channel = API.client.channels.cache.get(API.events.getConfig().modules.events.channel)
                    channel.bulkDelete(10).catch((error) => reportError(error, 'command.escavar.bulk_delete'))
                } else if (prof < API.events.treasure.profundidade){
                    embed.addField(`<:treasure:807671407160197141> Informações da escavação`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nProfundidade: ${Math.round(API.events.treasure.profundidade/3)}m\nEscavação: ${getProgress()}`)
                    embed.setFooter(`Tempo de atualização: ${API.events.treasure.update} segundos\nTempo escavando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                }

                try{
                    if (stop) components = []
                    await interaction.editReply({embeds: [embed], components })
                }catch (err) {
                    console.log(err)
                    API.cacheLists.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                if (stop) {
                    API.cacheLists.waiting.remove(interaction.user.id, 'digging');
                    return
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: API.events.treasure.update*1000 });

                collector.on('collect', (b) => {

                    if (!(b.user.id === interaction.user.id)) return  

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.escavar.defer_update'));
                        API.cacheLists.waiting.remove(interaction.user.id,  'digging');
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        const embedtemp = await API.sendError(interaction, `Você parou a escavação!`)
                        await interaction.followUp({ embeds: [embedtemp] })
                        API.cacheLists.waiting.remove(interaction.user.id, 'digging');
                    } else {
                        edit();
                    }
                });

            } catch (error) {
                reportError(error, 'command.escavar.progress');
                API.cacheLists.waiting.remove(interaction.user.id, 'digging');
            }
        }
        edit();
	}
};
