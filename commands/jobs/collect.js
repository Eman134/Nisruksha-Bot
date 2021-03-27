module.exports = {
    name: 'coletar',
    aliases: ['col', 'collect'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Coleta diferente sementes e flores para plantação',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de agricultura para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 1) {
                API.sendError(msg, `A empresa onde você trabalha não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 1) {
                API.sendError(msg, `A sua empresa não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;

            }
        }

        if (pobj2.level < 3) {
            API.sendError(msg, `Você não possui nível o suficiente para iniciar uma coleta!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'collecting')) {
            API.sendError(msg, `Você já encontra-se coletando no momento! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})`)
            return;
        }

        const sta = await API.maqExtension.stamina.get(msg.author);

        if (sta < 30) {
            API.sendError(msg, `Você precisa de no mínimo 50 pontos de Estamina para iniciar uma coleta!\nVisualize sua estamina atual usando \`${API.prefix}estamina\``)
            return;
        }

        let init = Date.now();

        let obj6 = await API.getInfo(msg.author, "machines");
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Coletando`)
        embed.setDescription(`Agricultor: ${msg.author}`);
        await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${sta}/1000 🔸`)
        embed.setFooter(`Reaja com 🔴 para parar a coleta\nTempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        let embedmsg = await msg.quote(embed);
        embedmsg.react('🔴')
        API.cacheLists.waiting.add(msg.author, embedmsg, 'collecting');
        
        let seedobj = API.maqExtension.ores.getObj().drops.filter(i => i.type == "seed");
        let loc = await API.townExtension.getTownNum(msg.author)
        seedobj = seedobj.filter(seed => seed.loc.includes(loc.toString()) || seed.loc.includes('*'))
        if (API.debug) console.log(seedobj)
        
        
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

        let totalcoletado = 0;
        let coletadox = new Map();

        const filter = (reaction, user) => {
            return reaction.emoji.name === '🔴' && user.id === msg.author.id;
        };

        async function edit() {

            try{

                const obj2 = gen();

                let sizeMap = new Map();
                let round = 0;
                let xp = API.random(2, 6);
                API.playerUtils.execExp(msg, xp);
                await API.maqExtension.stamina.remove(msg.author, 30);
                
                let retorno = await API.company.jobs.giveItem(msg, obj2)
                let descartados = retorno.descartados
                let colocados = retorno.colocados

                for (const r of colocados) {

                    
                    let size = r.size;

                    /*let arMax = await API.maqExtension.storage.getMax(msg.author);

                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) {
                        size -= (await API.maqExtension.storage.getSize(msg.author)+size-arMax)
                    }*/


                    totalcoletado += size;
                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    round += size;

                    //if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) break;
                    
                    
                }

                embed.fields = [];
                const obj6 = await API.getInfo(msg.author, "machines");
                let sta2 = await API.maqExtension.stamina.get(msg.author);
                embed.setDescription(`Agricultor: ${msg.author}`);
                await embed.addField(`🍁 Informações de coleta`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\`\nEstamina: ${await API.maqExtension.stamina.get(msg.author)}/1000 🔸 \`(-30)\``)
                embed.setFooter(`Reaja com 🔴 para parar a coleta\nTempo de atualização: ${API.company.jobs.agriculture.update} segundos\nTempo coletando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                
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
                        await embedmsg.edit(embed)
                    }catch{
                        API.cacheLists.waiting.remove(msg.author, 'collecting')
                    }

                if (descartados.length == seedobj.length) {
                    API.sendErrorM(msg, `Itens foram descartados da sua mochila enquanto você coletava! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})\nVisualize a mochila utilizando \`${API.prefix}mochila\``)
                    API.cacheLists.waiting.remove(msg.author, 'collecting')
                    embedmsg.reactions.removeAll();
                    return;
                }

                if (sta2 < 30) {
                    API.sendErrorM(msg, `Você não possui estamina para continuar coletando! [[VER COLETA]](${API.cacheLists.waiting.getLink(msg.author, 'collecting')})\nVisualize a sua estamina utilizando \`${API.prefix}estamina\``)
                    API.cacheLists.waiting.remove(msg.author, 'collecting')
                    embedmsg.reactions.removeAll();
                    return;
                }

                let reacted = false
                const collector = embedmsg.createReactionCollector(filter, { time: API.company.jobs.agriculture.update*1000 });

                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name == '🔴') {
                        reacted = true;
                        collector.stop();
                    }
                });

                collector.on('end', collected => {
                    if (reacted) {
                        embedmsg.reactions.removeAll();
                        API.sendError(msg, `Você parou a coleta!`)
                        API.cacheLists.waiting.remove(msg.author, 'collecting')
                    } else {edit();}
                });
            }catch (err){
                client.emit('error', err)
                 throw err
                }
        }
        edit();
	}
};