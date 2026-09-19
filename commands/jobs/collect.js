const Discord = require('../../_classes/discordCompat');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const playersService = require('../../_classes/services/players');
const itemsService = require('../../_classes/services/items');
const townsService = require('../../_classes/services/towns');
const runtime = require('../../_classes/services/runtime');
const companyService = require('../../_classes/services/company');
const clientService = require('../../_classes/services/clientService');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'coletar',
    aliases: ['col', 'collect'],
    category: 'none',
    description: 'Coleta diferente sementes e flores para plantação',
    mastery: 30,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await utility.sendError(interaction, `Você não possui nível o suficiente para iniciar uma coleta!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'collecting')) {
            const embedtemp = await utility.sendError(interaction, `Você já encontra-se coletando no momento! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const sta = await playersService.stamina.get(interaction.user.id);

        if (sta < 40) {
            const embedtemp = await utility.sendError(interaction, `Você precisa de no mínimo 40 pontos de Estamina para iniciar uma coleta!\nVisualize sua estamina atual usando \`/estamina\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let btn = utility.createButton('stopBtn', 'DANGER', 'Parar coleta')

        let init = Date.now();

        let seedobj = itemsService.getObj().drops.filter(i => i.type == "seed");
        let loc = await townsService.getTownNum(interaction.user.id)
        seedobj = seedobj.filter(seed => seed.loc.includes(loc.toString()) || seed.loc.includes('*'))
        if (runtime.debug) console.log(seedobj)

        let obj6 = await DatabaseManager.get(interaction.user.id, "machines");
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Coletando`)
        embed.setDescription(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
        await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${sta}/1000 🔸`)
        embed.setFooter(`Tempo de atualização: ${companyService.jobs.agriculture.update} segundos\nTempo coletando: ${utility.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        const embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn])], withResponse: true });

        await cacheListsService.waiting.add(interaction.user.id, interaction, 'collecting');
        await cacheListsService.waiting.add(interaction.user.id, interaction, 'working');
        
        function gen(){
            let por = 6;
            let array = [];
            let i = 1
            for (const seed of seedobj) {
                if (seed != undefined) {
                    let t = Math.round((61/(parseFloat(`1.${utility.random(6, 9)}${utility.random(0, 9)}`)))*0.1);
                    t += Math.round(por/i/2*0.1);

                    t = Math.round((seed.name.toLowerCase().includes('soja') ? t * 1.7 :t )/2);
                    let d = itemsService.get(seed.name);
                    d.size = t;

                    let cha = utility.random(0, 100)
                    if (cha < d.chance) array.push(d)
                    i++
                }
            }
            return array;
        }

        let coletadox = new Map();

        async function edit() {

            try{

                const obj2 = gen();

                let sizeMap = new Map();
                let round = 0;
                let xp = utility.random(2, 6);
                xp = await playersService.execExp(interaction, xp);
                const gastoestamina = utility.random(20, 40)
                await playersService.stamina.remove(interaction.user.id, gastoestamina);
                
                let retorno = await itemsService.give(interaction, obj2)
                let descartados = retorno.descartados
                let colocados = retorno.colocados

                for (const r of colocados) {

                    let size = r.size;

                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    round += size;
                    
                }

                embed.fields = [];
                const obj6 = await DatabaseManager.get(interaction.user.id, "machines");
                let sta2 = await playersService.stamina.get(interaction.user.id);
                embed.setDescription(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
                await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEstamina: ${await playersService.stamina.get(interaction.user.id)}/1000 🔸 \`(-${gastoestamina})\``)
                embed.setFooter(`Tempo de atualização: ${companyService.jobs.agriculture.update} segundos\nTempo coletando: ${utility.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));

                for await (const r of colocados) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    
                    embed.addField(`${r.icon} ${r.displayname} +${qnt}`, `\`\`\`autohotkey\nColetado: ${r.size}\`\`\``, true)
                }

                for await (const r of descartados) {
                    let qnt = sizeMap.get(r.name);
                    if (qnt == undefined) qnt = 0;
                    if (qnt < 1) qnt = 0;
                    embed.addField(`${r.icon} ${r.displayname} -${r.size}`, `\`\`\`autohotkey\n❌ Descartado: ${r.size}\`\`\``, true)
                }

                try{
                    await interaction.editReply({ embeds: [embed], components: [utility.rowComponents([btn])] })
                } catch (error) {
                    reportError(error, 'command.coletar.edit_progress', { userId: interaction.user.id });
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                }

                if (descartados.length == seedobj.length) {
                    const embedtemp = await utility.sendError(interaction, `Itens foram descartados da sua mochila enquanto você coletava! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a mochila utilizando \`/mochila\``)
                    await interaction.reply({ embeds: [embedtemp], mention: true } )
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                if (sta2 < gastoestamina) {
                    const embedtemp = await utility.sendError(interaction, `Você não possui estamina para continuar coletando! [[VER COLETA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a sua estamina utilizando \`/estamina\``)
                    await interaction.reply({ embeds: [embedtemp], mention: true } )
                    await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                    await cacheListsService.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: companyService.jobs.agriculture.update*1000 });
                collector.on('collect', async (b) => {

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.coletar.defer_update'); });
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        await cacheListsService.waiting.remove(interaction.user.id, 'collecting')
                        await cacheListsService.waiting.remove(interaction.user.id, 'working');
                        await interaction.editReply({ embeds: [embed], components: [] })
                        const embedtemp = await utility.sendError(interaction, `Você parou a coleta!`)
                        await interaction.followUp({ embeds: [embedtemp]})
                    } else {
                        edit()
                    }
                });

            }catch (err){
                clientService.current.emit('error', err)
            }
        }
        edit();
	}
};
