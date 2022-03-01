const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'pescar',
    aliases: ['fish'],
    category: 'none',
    description: 'Inicie uma pesca, pegue os melhores peixes e venda-os',
    mastery: 30,
    companytype: 6,
	async execute(API, interaction, company) {

        const Discord = API.Discord;
        const client = API.client;
        
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (!pobj.rod) {
            const embedtemp = await API.sendError(interaction, `Você precisa ter uma vara de pesca para poder iniciar uma pesca!\nCompre uma vara de pesca utilizando \`/pegarvara\``)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(interaction, `Você não possui nível o suficiente para iniciar uma pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'fishing')) {
            const embedtemp = await API.sendError(interaction, `Você já encontra-se pescando no momento! [[VER PESCA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'fishing')})`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let stamina = await API.playerUtils.stamina.get(interaction.user.id)
        let staminamax = 1000;
        let cost = pobj.rod.sta * 5

        if (stamina < cost) {
            
            const embedtemp = await API.sendError(interaction, `Você precisa de no mínimo ${cost} de estamina para iniciar uma pesca\n🔸 Estamina de \`${interaction.user.tag}\`: **[${stamina}/${cost}]**`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
            
        }
        
        
        let init = Date.now();
        let header = await gen(pobj)

        let body = header.levels
        let pd = header.profundidades

        let inv = '<:inv:781993473331036251>'
        let anzol = '<:anzol:830810178440921128>'

        function reworkBtns() {

            let buttons = []

            let btn = API.createButton('stopBtn', 'DANGER', 'Parar pesca')
            let btn1 = API.createButton('downBtn', 'SECONDARY', 'Descer anzol', '⬇')
            let btn2 = API.createButton('upBtn', 'SECONDARY', 'Subir anzol', '⬆')

            buttons.push(btn)
            buttons.push(btn1)
            
            if (pobj.mvp != null) { 
                buttons.push(btn2) 
            }

            return [API.rowComponents(buttons)]
        }

        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Pescando`)
        embed.setDescription(`Pescador: ${interaction.user}`);
        embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`/uparvara\``)
        embed.addField(`💦 Informações da pesca`, `Nível: ${pobj2.level}\nXP: ${pobj2.xp}/${pobj2.level*1980} (${Math.round(100*pobj2.xp/(pobj2.level*1980))}%)\nEstamina: ${stamina < 1 ? 0 : stamina}/1000 🔸`)
        embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤${inv.repeat(3) + '<:light:830799704463769600>'}\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
        embed.setFooter(`Tempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        let embedinteraction = await interaction.reply({ embeds: [embed], components: reworkBtns(), fetchReply: true }).catch();
        
        API.cacheLists.waiting.add(interaction.user.id, interaction, 'fishing');
        API.cacheLists.waiting.add(interaction.user.id, interaction, 'working');

        let coletados = new Map()

        const filter = i => i.user.id === interaction.user.id;

        function duplicateElements(array, times) {

            for (let i = 0; i < times; i++) {
                
                array.push('🟦')

            }

            return array

        }

        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            while (0 !== currentIndex) {
          
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
          
            return array;
        }

        async function gen(pobj, header) {

            let profundidades = [
                (parseFloat(pobj.rod.profundidade)/4).toFixed(1), 
                (parseFloat(pobj.rod.profundidade)/2).toFixed(1), 
                (parseFloat(pobj.rod.profundidade)).toFixed(1)
            ] 
            
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

                        let chance = 30 + (pobj.rod.stars*5)
                        if (pobj.mvp != null) chance += 10

                        if (API.random(0, 100) < chance) {

                            const capturado = fish.find((fsh) => fsh.icon == levels[xi.toString()].waterarray[0])

                            retorno = await API.itemExtension.give(interaction, [capturado])

                            if (retorno.descartados.length == 0 && retorno.colocados.length > 0) {

                                if (API.random(0, 100) < 35) stars = (API.company.stars.gen()/2).toFixed(2)

                                ca = coletados.get(capturado.icon)

                                if (coletados.has(capturado.icon)) {
                                    coletados.set(capturado.icon, {
                                        icon: capturado.icon,
                                        quantia: coletados.get(capturado.icon).quantia + 1
                                    })
                                } else {
                                    coletados.set(capturado.icon, {
                                        icon: capturado.icon,
                                        quantia: 1
                                    })
                                }


                            } else if (retorno.descartados.length > 0) {

                                retorno.descartados = [capturado.icon]
                                
                            }

                        }

                    }
                    
                    levels[xi.toString()].waterarray.shift()
                    
                }
                
                for (let i = 0; i < fish.length; i++) {

                    
                    if ((fish[i].profundidade >= levels[xi.toString()].profundidade) && (fish[i].profundidade <= levels[xi.toString()].profundidade*2)) {
                        if (API.random(0, 100) < 50 && API.random(0, 220) < fish[i].chance) {
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

        async function edit(interaction, company) {

            header = await gen(pobj, header)
            body = header.levels
            pd = header.profundidades

            let cclist = [ ...coletados.values()];

            let totalpages = cclist.length % 5;
            if (totalpages == 0) totalpages = (cclist.length)/5;
            else totalpages = ((cclist.length-totalpages)/5)+1;

            let ccmap = ""
            for (i = totalpages; i > 0; i--){
                let ic = totalpages+1-i
                ccmap += cclist.slice((ic-1)*5, ic*5).map((peixe) => peixe.quantia + 'x ' + peixe.icon).join(inv) + '\n'
            }

            if (cclist.length == 0) ccmap += "Nenhum"

            try{

                let gastosta = 5

                if (API.random(0, 100) < 60) gastosta = pobj.rod.sta

                let xp = API.random(1, 3);
                xp = await API.playerUtils.execExp(interaction, xp);

                await API.playerUtils.stamina.remove(interaction.user.id, gastosta);

                pobj = await DatabaseManager.get(interaction.user.id, 'players')

                stamina = await API.playerUtils.stamina.get(interaction.user.id)

                if (header.stars > 0 ) API.company.stars.add(interaction.user.id, company.company_id, { score: header.stars })

                embed.fields = [];
                const obj6 = await DatabaseManager.get(interaction.user.id, "machines");
                let sta2 = await API.playerUtils.stamina.get(interaction.user.id);
                embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`/uparvara\``)
                embed.addField(`💦 Informações da pesca`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%) \`(+${xp} XP)\` ${header.stars > 0 ? `**(+${header.stars} ⭐)**`:''}\nEstamina: ${stamina < 1 ? 0 : stamina}/1000 🔸 \`(-${gastosta})\``)
                embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤${inv.repeat(3) + '<:light:830799704463769600>'}\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
                await embed.addField(`➰ Coletados`, ccmap)
                if (header.retorno && header.retorno.descartados.length > 0) embed.addField(`❌ Descartados`, header.retorno.descartados.map((px) => '1x ' + px).join(inv))
                embed.setFooter(`Tempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));

                try{
                    await embedinteraction.edit({ embeds: [embed], components: reworkBtns() })
                }catch{
                    API.cacheLists.waiting.remove(interaction.user.id, 'fishing')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                    return
                }

                if (header.retorno && header.retorno.descartados.length > 0) {
                    API.cacheLists.waiting.remove(interaction.user.id, 'fishing')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                    const embedtemp = await API.sendError(interaction, `Peixes foram descartados da sua mochila enquanto você pescava! [[VER PESCA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'fishing')})\nVisualize a mochila utilizando \`/mochila\``)
                    await interaction.followUp({ embeds: [embedtemp], mention: true } )
                    return;
                }

                if (sta2 < pobj.rod.sta) {
                    API.cacheLists.waiting.remove(interaction.user.id, 'fishing')
                    API.cacheLists.waiting.remove(interaction.user.id, 'working');
                    const embedtemp = await API.sendError(interaction, `Você não possui estamina para continuar pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(interaction.user.id, 'fishing')})\nVisualize a sua estamina utilizando \`/estamina\``)
                    await interaction.followUp({ embeds: [embedtemp], mention: true } )
                    return;
                }

                let reacted = false
                const collector = embedinteraction.createMessageComponentCollector({ filter, time: API.company.jobs.fish.update*1000 });

                collector.on('collect', async (b) => {
  
                    if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
                    if (b.customId == 'stopBtn') {
                        reacted = true;
                        collector.stop();
                    } else if (b.customId == 'downBtn' || b.customId == 'upBtn') {
                        
                        if (b.customId == 'downBtn') {
                            header.levels["0"] = (header.levels["0"] == 5 ? 1 : header.levels["0"]+1)
                        } else {
                            header.levels["0"] = (header.levels["0"] == 1 ? 5 : header.levels["0"]-1)
                        }

                        body = header.levels
                        pd = header.profundidades

                        embed.fields = [];
                        embed.addField(`${pobj.rod.icon} ${pobj.rod.name} \`${API.company.jobs.formatStars(pobj.rod.stars)}\``, `Gasto: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPara dar upgrade utilize \`/uparvara\``)
                        embed.addField(`💦 Informações da pesca`, `Nível: ${obj6.level}\nXP: ${obj6.xp}/${obj6.level*1980} (${Math.round(100*obj6.xp/(obj6.level*1980))}%)\nEstamina: ${stamina < 1 ? 0 : stamina}/1000 🔸`)
                        embed.addField(`🔹 Pescaria`, `${pobj.rod.icon}👤${inv.repeat(3) + '<:light:830799704463769600>'}\n${body["0"] == 1 ? anzol : inv}${body["1"].waterarray.join('')} ${pd[0]}m\n${body["0"] == 2 ? anzol : inv}${body["2"].waterarray.join('')}\n${body["0"] == 3 ? anzol : inv}${body["3"].waterarray.join('')} ${pd[1]}m\n${body["0"] == 4 ? anzol : inv}${body["4"].waterarray.join('')}\n${body["0"] == 5 ? anzol : inv}${body["5"].waterarray.join('')} ${pd[2]}m`)
                        await embed.addField(`➰ Coletados`, ccmap)
                        embed.setFooter(`Tempo de atualização: ${API.company.jobs.fish.update} segundos\nTempo pescando: ${API.ms(Date.now()-init)}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
                        try{
                            await embedinteraction.edit({ embeds: [embed], components: reworkBtns() })
                        }catch{
                            API.cacheLists.waiting.remove(interaction.user.id, 'fishing')
                            API.cacheLists.waiting.remove(interaction.user.id, 'working');
                            return
                        }
                    }
                });

                collector.on('end', async collected => {
                    await embedinteraction.edit({ embeds: [embed], components: [] })
                    if (reacted) {
                        API.cacheLists.waiting.remove(interaction.user.id, 'fishing')
                        API.cacheLists.waiting.remove(interaction.user.id, 'working');
                        await embedinteraction.edit({ embeds: [embed], components: [] })

                    } else {
                        edit(interaction, company);
                    }
                });
                
            }catch (err){
                API.client.emit('error', err)
            }
        }

        edit(interaction, company);

	}
};