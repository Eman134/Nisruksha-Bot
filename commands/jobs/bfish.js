module.exports = {
    name: 'pescar',
    aliases: ['fish'],
    category: 'Trabalhos',
    description: '<:icon6:778594558745378846> Inicie uma pesca, pegue os melhores peixes e venda-os',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de pescaria para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 6) {
                API.sendError(msg, `A empresa onde você trabalha não é de pescaria!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 6) {
                API.sendError(msg, `A sua empresa não é de pescaria!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;

            }
        }

        if (!pobj.rod) {
            return API.sendError(msg, `Você precisa ter uma vara de pesca para poder iniciar uma pesca!\nCompre uma vara de pesca utilizando \`${API.prefix}pegarvara\``)
        }

        if (pobj2.level < 3) {
            API.sendError(msg, `Você não possui nível o suficiente para iniciar uma pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            API.sendError(msg, `Você já encontra-se pescando no momento! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`)
            return;
        }

        let stamina = await API.maqExtension.stamina.get(msg.author)
        let staminamax = 1000;
        let cost = pobj.rod.sta * 5

        if (stamina < cost) {
            
            API.sendError(msg, `Você precisa de no mínimo ${cost} de estamina para iniciar uma pesca\n🔸 Estamina de \`${msg.author.tag}\`: **[${stamina}/${cost}]**`)
            return;
            
        }
        
        
        let init = Date.now();
        let header = await gen(pobj)

        let body = header.levels
        let pd = header.profundidades

        let inv = '<:inv:781993473331036251>'
        let anzol = '<:anzol:781992758529097738>'

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Pescando`)
        embed.setDescription(`Pescador: ${msg.author}`);
        embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`${API.prefix}uparvara\``)
        embed.addField(`💦 Informações da pesca`, `Nível: ${pobj2.level}\nXP: ${pobj2.xp}/${pobj2.level*1980} (${Math.round(100*pobj2.xp/(pobj2.level*1980))}%)\nEstamina: ${stamina}/1000 🔸`)
        embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
        embed.setFooter(`Reaja com 🔴 para parar a pesca\nReaja com ⬇ para reposicionar o anzol\nTempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        let embedmsg = await msg.quote(embed).catch();
        embedmsg.react('🔴')
        embedmsg.react('⬇')
        
        API.cacheLists.waiting.add(msg.author, embedmsg, 'fishing');

        let coletadosx = new Map()

        const filter = (reaction, user) => {
            return ['🔴', '⬇'].includes(reaction.emoji.name) && user.id === msg.author.id;
        };

        function duplicateElements(array, times) {

            for (let i = 0; i < times; i++) {
                
                array.push('🟦')

            }

            return array

        }

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              // And swap it with the current element.
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
          
            return array;
        }

        async function gen(pobj, header) {

            let profundidades = [(pobj.rod.profundidade/4).toFixed(1), (pobj.rod.profundidade/2).toFixed(1), (pobj.rod.profundidade).toFixed(1)] 

            
            let stars = 0

            if (header) {
                profundidades = header.profundidades
            }

            let retorno

            let levels = {
                0: 1,
                1: {
                    waterarray: [],
                    profundidade: profundidades[0]
                },
                2: {
                    waterarray: [],
                    profundidade: profundidades[1]/2
                },
                3: {
                    waterarray: [],
                    profundidade: profundidades[1]
                },
                4: {
                    waterarray: [],
                    profundidade: profundidades[2]/2
                },
                5: {
                    waterarray: [],
                    profundidade: profundidades[2]
                }
            }

            
            const fish = API.company.jobs.fish.list.get(profundidades[0], profundidades[2])
            
            if (header) {
                levels = header.levels
            }

            for (let xi = 5; xi > 0; xi--) {
                
                if (header) {

                    
                    if (levels[xi.toString()].waterarray[0] != '🟦' && xi == levels[0]) {

                        let chance = 60 + (pobj.rod.stars*10)

                        if (API.random(0, 100) > chance) {

                            const capturado = fish.find((fsh) => fsh.icon == levels[xi.toString()].waterarray[0])
                            capturado.size = 1
                            retorno = await API.company.jobs.giveItem(msg, [capturado])
                            if (retorno.descartados.length == 0) {

                                stars = API.company.stars.gen()/4
                                
                                let ca = coletadosx.get(capturado.icon)
    
                                if (!coletadosx.has(capturado.icon)){
                                    coletadosx.set(capturado.icon, capturado)
                                } else {
                                    ca.size = ca.size + 1
                                    coletadosx.set(ca.icon, ca)
                                }
                            }

                        }


                    }
                    
                    
                    levels[xi.toString()].waterarray.shift()
                    
                }
                
                for (let i = 0; i < fish.length; i++) {

                    
                    if ((fish[i].profundidade >= levels[xi.toString()].profundidade) && (fish[i].profundidade <= levels[xi.toString()].profundidade*2)) {
                        if (API.random(0, 100) < 60 && API.random(0, 100) < fish[i].chance) {
                            levels[xi.toString()].waterarray.push(fish[i].icon)
                            break;
                        }
                    }
                    
                }
                
            }

            for (let xi = 1; xi < 6; xi++) {
 
                if (levels[xi.toString()].waterarray.length < 10) {
                    levels[xi.toString()].waterarray = duplicateElements(levels[xi.toString()].waterarray, 10-levels[xi.toString()].waterarray.length)

                    if (!header) shuffle(levels[xi.toString()].waterarray)

                }

            }

            return { 
                levels,
                profundidades,
                retorno,
                stars
            }
            

        }

        async function edit(msg, company) {

            try{

                let gastosta = 0

                if (API.random(0, 100) < 50) gastosta = pobj.rod.sta

                let xp = API.random(1, 3);
                API.playerUtils.execExp(msg, xp);

                await API.maqExtension.stamina.remove(msg.author, gastosta);
                
                /*let retorno = await API.company.jobs.giveItem(msg, obj2)
                let descartados = retorno.descartados
                let colocados = retorno.colocados

                for (const r of colocados) {

                    
                    let size = r.size;


                    totalcoletado += size;
                    if (coletadox.has(r.name)) coletadox.set(r.name, coletadox.get(r.name)+size)
                    else coletadox.set(r.name, size)
                    sizeMap.set(r.name, size)
                    round += size;

                    if (await API.maqExtension.storage.getSize(msg.author)+size >= arMax) break;
                    
                    
                }*/

                pobj = await API.getInfo(msg.author, 'players')
                let stamina2 = await API.maqExtension.stamina.get(msg.author)
                stamina = await API.maqExtension.stamina.get(msg.author)

                let cclist = []

                coletadosx.forEach((values,keys)=>{ 
                    cclist.push(values)
                }) 

                let totalpages = cclist.length % 5;
                if (totalpages == 0) totalpages = (cclist.length)/5;
                else totalpages = ((cclist.length-totalpages)/5)+1;

                let ccmap = ""
                for (i = 0; i < totalpages; i++){
                    ccmap += cclist.slice((totalpages-1)*5, totalpages*5).map((peixe) => peixe.size + 'x ' + peixe.icon).join(inv) + '\n'
                }

                if (ccmap == "") ccmap += "Nenhum"


                header = await gen(pobj, header)
                body = header.levels
                pd = header.profundidades

                if (header.stars > 0 ) API.company.stars.add(msg.author, company.company_id, { score: header.stars })

                embed.fields = [];
                const obj6 = await API.getInfo(msg.author, "machines");
                let sta2 = await API.maqExtension.stamina.get(msg.author);
                embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`${API.prefix}uparvara\``)
                embed.addField(`💦 Informações da pesca`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\` ${header.stars > 0 ? `**(+${header.stars} ⭐)**`:''}\nEstamina: ${stamina}/1000 🔸`)
                embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
                await embed.addField(`➰ Coletados`, ccmap)
                if (header.retorno && header.retorno.descartados.length > 0) embed.addField(`❌ Descartados`, header.retorno.descartados.map((px) => '1x ' + px.icon).join(inv))
                embed.setFooter(`Reaja com 🔴 para parar a pesca\nReaja com ⬇ para reposicionar o anzol\nTempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                
                /*for await (const r of colocados) {
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
                }*/

                    try{
                        await embedmsg.edit(embed)
                    }catch{
                        API.cacheLists.waiting.remove(msg.author, 'fishing')
                        return
                    }

                if (header.retorno && header.retorno.descartados.length > 0) {
                    API.sendErrorM(msg, `Peixes foram descartados da sua mochila enquanto você pescava! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author)})\nVisualize a mochila utilizando \`${API.prefix}mochila\``)
                    API.cacheLists.waiting.remove(msg.author, 'fishing')
                    embedmsg.reactions.removeAll();
                    return;
                }

                if (sta2 < pobj.rod.sta) {
                    API.sendErrorM(msg, `Você não possui estamina para continuar pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author)})\nVisualize a sua estamina utilizando \`${API.prefix}estamina\``)
                    API.cacheLists.waiting.remove(msg.author, 'fishing')
                    embedmsg.reactions.removeAll();
                    return;
                }

                let reacted = false
                const collector = embedmsg.createReactionCollector(filter, { time: API.company.jobs.fish.update*1000 });
                let lastreacttime = Date.now()-10000;
                collector.on('collect', (reaction, user) => {
                    reaction.users.remove(user.id).catch();
                    if (reaction.emoji.name == '🔴') {
                        reacted = true;
                        collector.stop();
                    } else if (reaction.emoji.name == '⬇') {
                        if (Date.now()-lastreacttime < 5000) return;
                        lastreacttime = Date.now()
                        header.levels["0"] = (header.levels["0"] == 5 ? 1 : header.levels["0"]+1)
                        body = header.levels
                        pd = header.profundidades

                        embed.fields = [];
                        embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`${API.prefix}uparvara\``)
                        embed.addField(`💦 Informações da pesca`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${stamina}/1000 🔸`)
                        embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
                        embed.addField(`➰ Coletados`, ccmap)
                        embed.setFooter(`Reaja com 🔴 para parar a pesca\nReaja com ⬇ para reposicionar o anzol\nTempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                        try{
                            embedmsg.edit(embed).catch()
                        }catch{
                            API.cacheLists.waiting.remove(msg.author, 'fishing')
                            return
                        }
                    }
                });

                collector.on('end', collected => {
                    if (reacted) {
                        embedmsg.reactions.removeAll();
                        API.sendError(msg, `Você parou a pesca!`)
                        API.cacheLists.waiting.remove(msg.author, 'fishing')
                    } else {edit(msg, company);}
                });
            }catch (err){
                client.emit('error', err)
            }
        }

        edit(msg, company);

	}
};