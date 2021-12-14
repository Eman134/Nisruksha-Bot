const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'coletar',
    aliases: ['col', 'collect'],
    category: 'none',
    description: 'Coleta diferente sementes e flores para plantação',
    mastery: 30,
    companytype: 1,
	async execute(API, interaction, company) {

        const Discord = API.Discord;

        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(interaction, `Você não possui nível o suficiente para iniciar uma coleta!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'collecting')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se coletando no momento! [[VER COLETA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'collecting')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const sta = await API.playerUtils.stamina.get(interaction.user.id);

        if (sta < 40) {
            const embedtemp = await API.sendError(interaction, `Você precisa de no mínimo 40 pontos de Estamina para iniciar uma coleta!\nVisualize sua estamina atual usando \`/estamina\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let btn = API.createButton('stopBtn', 'DANGER', 'Parar coleta')

        let init = Date.now();

        let seedobj = API.itemExtension.getObj().drops.filter(i => i.type == "seed");
        let loc = await API.townExtension.getTownNum(interaction.user.id)
        seedobj = seedobj.filter(seed => seed.loc.includes(loc.toString()) || seed.loc.includes('*'))
        if (API.debug) console.log(seedobj)

        let obj6 = await DatabaseManager.get(interaction.user.id, "machines");
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Coletando`)
        embed.setDescription(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
        await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${sta}/1000 🔸`)
        embed.setFooter(`Tempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        const embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn])], fetchReply: true });

        API.cacheLists.waiting.add(interaction.user.id, interaction, 'collecting');
        API.cacheLists.waiting.add(interaction.user.id, interaction, 'working');
        
        function gen(){
            let por = 6;
            let array = [];
            let i = 1
            for (const seed of seedobj) {
                if (seed != undefined) {
                    let t = Math.round((61/(parseFloat(`1.${API.random(6, 9)}${API.random(0, 9)}`)))*0.1);
                    t += Math.round(por/i/2*0.1);

                    t = Math.round((seed.name.toLowerCase().includes('soja') ? t * 1.7 :t )/2);
                    let d = API.itemExtension.get(seed.name);
                    d.size = t;

                    let cha = API.random(0, 100)
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
                let xp = API.random(2, 6);
                xp = await API.playerUtils.execExp(interaction, xp);
                const gastoestamina = API.random(20, 40)
                await API.playerUtils.stamina.remove(interaction.user.id, gastoestamina);
                
                let retorno = await API.itemExtension.give(interaction, obj2)
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
                let sta2 = await API.playerUtils.stamina.get(interaction.user.id);
                embed.setDescription(`Agricultor: ${interaction.user}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
                await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEstamina: ${await API.playerUtils.stamina.get(interaction.user.id)}/1000 🔸 \`(-${gastoestamina})\``)
                embed.setFooter(`Tempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));

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
                    await interaction.editReply({ embeds: [embed], components: [API.rowComponents([btn])] })
                }catch{
                    API.cacheLists.waiting.remove(interaction.user.id, 'collecting')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                }

                if (descartados.length == seedobj.length) {
                    const embedtemp = await API.sendError(interaction, `Itens foram descartados da sua mochila enquanto você coletava! [[VER COLETA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a mochila utilizando \`/mochila\``)
                    await interaction.reply({ embeds: [embedtemp], mention: true } )
                    API.cacheLists.waiting.remove(interaction.user.id, 'collecting')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                if (sta2 < gastoestamina) {
                    const embedtemp = await API.sendError(interaction, `Você não possui estamina para continuar coletando! [[VER COLETA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'collecting')})\nVisualize a sua estamina utilizando \`/estamina\``)
                    await interaction.reply({ embeds: [embedtemp], mention: true } )
                    API.cacheLists.waiting.remove(interaction.user.id, 'collecting')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                    return;
                }

                let reacted = false
                const filter = i => i.user.id === interaction.user.id;
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: API.company.jobs.agriculture.update*1000 });
                collector.on('collect', (b) => {

                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        if (b && !b.deferred) b.deferUpdate().then().catch(console.error); 
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        API.cacheLists.waiting.remove(interaction.user.id, 'collecting')
                        API.cacheLists.waiting.remove(interaction.user.id, 'working');
                        await interaction.editReply({ embeds: [embed], components: [] }).catch()
                        const embedtemp = await API.sendError(interaction, `Você parou a coleta!`)
                        await interaction.followUp({ embeds: [embedtemp]})
                    } else {
                        edit()
                    }
                });

            }catch (err){
                API.client.emit('error', err)
            }
        }
        edit();
	}
};