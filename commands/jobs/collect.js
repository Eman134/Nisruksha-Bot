module.exports = {
    name: 'coletar',
    aliases: ['col', 'collect'],
    category: 'none',
    description: 'Coleta diferente sementes e flores para plantação',
    options: [],
    mastery: 30,
    companytype: 1,
	async execute(API, msg, company) {

        const Discord = API.Discord;

        let pobj2 = await API.getInfo(msg.author, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(msg, `Você não possui nível o suficiente para iniciar uma coleta!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            await msg.quote(embedtemp)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'collecting')) {
            const embedtemp = await API.sendError(msg, `Você já encontra-se coletando no momento! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})`)
            await msg.quote(embedtemp)
            return;
        }

        const sta = await API.maqExtension.stamina.get(msg.author);

        if (sta <= 40) {
            const embedtemp = await API.sendError(msg, `Você precisa de no mínimo 40 pontos de Estamina para iniciar uma coleta!\nVisualize sua estamina atual usando \`${API.prefix}estamina\``)
            await msg.quote(embedtemp)
            return;
        }

        let btn = API.createButton('stopBtn', 'red', 'Parar coleta')

        let component = API.rowButton([btn])

        let init = Date.now();

        let seedobj = API.maqExtension.ores.getObj().drops.filter(i => i.type == "seed");
        let loc = await API.townExtension.getTownNum(msg.author)
        seedobj = seedobj.filter(seed => seed.loc.includes(loc.toString()) || seed.loc.includes('*'))
        if (API.debug) console.log(seedobj)

        let obj6 = await API.getInfo(msg.author, "machines");
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Coletando`)
        embed.setDescription(`Agricultor: ${msg.author}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
        await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${sta}/1000 🔸`)
        embed.setFooter(`Tempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        let embedmsg = await msg.quote(embed);
        API.cacheLists.waiting.add(msg.author, embedmsg, 'collecting');
        
        function gen(){
            let por = 6;
            let array = [];
            let i = 1
            for (const seed of seedobj) {
                if (seed != undefined) {
                    let t = Math.round((61/(parseFloat(`1.${API.random(6, 9)}${API.random(0, 9)}`)))*0.1);
                    t += Math.round(por/i/2*0.1);

                    t = Math.round((seed.name.toLowerCase().includes('soja') ? t * 1.7 :t )/2);
                    let d = API.maqExtension.ores.getDrop(seed.name);
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
                xp = await API.playerUtils.execExp(msg, xp);
                await API.maqExtension.stamina.remove(msg.author, 30);
                
                let retorno = await API.company.jobs.giveItem(msg, obj2)
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
                const obj6 = await API.getInfo(msg.author, "machines");
                let sta2 = await API.maqExtension.stamina.get(msg.author);
                embed.setDescription(`Agricultor: ${msg.author}\nPlantas disponíveis nesta vila: ${seedobj.map((see) => see.icon).join('')}`);
                await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEstamina: ${await API.maqExtension.stamina.get(msg.author)}/1000 🔸 \`(-30)\``)
                embed.setFooter(`Tempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                
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
                        await embedmsg.edit({ embed, component })
                    }catch{
                        API.cacheLists.waiting.remove(msg.author, 'collecting')
                    }

                if (descartados.length == seedobj.length) {
                    const embedtemp = await API.sendError(msg, `Itens foram descartados da sua mochila enquanto você coletava! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})\nVisualize a mochila utilizando \`${API.prefix}mochila\``)
                    await msg.quote({ embed: embedtemp, mention: true } )
                    API.cacheLists.waiting.remove(msg.author, 'collecting')
                    return;
                }

                if (sta2 < 30) {
                    const embedtemp = await API.sendError(msg, `Você não possui estamina para continuar coletando! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})\nVisualize a sua estamina utilizando \`${API.prefix}estamina\``)
                    await msg.quote({ embed: embedtemp, mention: true } )
                    API.cacheLists.waiting.remove(msg.author, 'collecting')
                    return;
                }

                let reacted = false
                const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
                const collector = embedmsg.createButtonCollector(filter, { time: API.company.jobs.agriculture.update*1000 });

                collector.on('collect', (b) => {
                    if (b.id == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                        b.defer()
                    }
                });

                collector.on('end', async collected => {
                    if (reacted) {
                        const embedtemp = await API.sendError(msg, `Você parou a coleta!`)
                        await msg.quote(embedtemp)
                        API.cacheLists.waiting.remove(msg.author, 'collecting')
                    } else {
                        edit();
                    }
                });

            }catch (err){
                API.client.emit('error', err)
            }
        }
        edit();
	}
};