module.exports = {
    name: 'uparvara',
    aliases: ['rodupgrade', 'varaupgrade', 'rodup', 'varaup', 'uv'],
    category: 'none',
    description: 'Dê upgrade na vara de pesca para melhorar a pescaria',
    options: [],
    mastery: 40,
    companytype: 6,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await API.getInfo(msg.author, 'players')
        if (pobj.rod == null) delete pobj.rod

        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            const embedtemp = await API.sendError(msg, `Você não pode upar uma vara enquanto estiver pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!pobj.rod) {
            const embedtemp = await API.sendError(msg, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`${API.prefix}pegarvara\``)
            await msg.quote({ embeds: [embedtemp]})
            return
        }

        let total = Math.round(3200*pobj.rod.level*2)

        const embed = new Discord.MessageEmbed()
        .setColor('#63b8ae')
        .setTitle(pobj.rod.icon + ' ' + pobj.rod.name)
        .setDescription(`\`${API.company.jobs.formatStars(pobj.rod.stars)}\`\nGasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
        let embedmsg
        await msg.quote({ embeds: [embed] }).then((emsg) => {
            embedmsg = emsg
            emsg.react('🔼')
        })

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 30000 });
        let reacted = false;
		let upgraded = false
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(['🔼'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();

            let pobj2 = await API.getInfo(msg.author, 'players')
            if (pobj2.rod == null) delete pobj2.rod

            playerobj = await API.getInfo(msg.author, 'machines')

            if (!pobj2.rod) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`${API.prefix}pegarvara\``)
                embedmsg.edit({ embed });
                return
            }
    

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${API.format(pobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit({ embed });
                return
            }

            let list = []

            if (pobj2.rod.stars < 5) {
                list.push(0)
            }

            if (pobj2.rod.sta > 6) {
                list.push(1)
            }
            

            if (!pobj2.rod.maxprofundidade) {
                if (Object.keys(API.company.jobs.fish.rods.obj).length == 0) API.company.jobs.fish.rods.load();
                let equipobj = API.company.jobs.fish.rods.obj;
        
                for (const r of equipobj) {
                    
                    if (pobj2.rod.level == r.level) {
                        pobj2.rod.maxprofundidade = r.maxprofundidade;
                    }
        
                }

            }
            
            if (pobj2.rod.profundidade < pobj2.rod.maxprofundidade) {
                list.push(2)
            }

            if (list.length == 0) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return embedmsg.edit({ embed });
            }
			upgraded = true

            API.eco.money.remove(msg.author, total)
            API.eco.addToHistory(msg.member, `Upgrade da vara de pesca | - ${API.format(total)} ${API.moneyemoji}`)

            if (list.includes(0)) {

                pobj2.rod.stars += 1
                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${API.company.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e adicionou uma estrela ⭐ ao nível da sua vara de pesca!`)
                return embedmsg.edit({ embed });

            } if (list.includes(1)) {
                pobj2.rod.sta -= 1
                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45')
                .setDescription(`\`${API.company.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e diminuiu o gasto de estamina 🔸 da sua vara de pesca!`)
                return embedmsg.edit({ embed });

            } if (list.includes(2)) {
                pobj2.rod.profundidade = (parseFloat(pobj2.rod.profundidade) + parseFloat("0." + API.random(2, 5))).toFixed(1)

                if (pobj2.rod.profundidade >= pobj2.rod.maxprofundidade) pobj2.rod.profundidade = pobj2.rod.maxprofundidade

                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)

                embed.setColor('#5bff45')
                .setDescription(`\`${API.company.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e aumentou a profundidade alcançada pela sua vara de pesca!`)
                return embedmsg.edit({ embed })
            } else {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return embedmsg.edit({ embed });
            }
            
            
        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted || upgraded) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria upar sua vara de pesca, porém o tempo expirou.`)
            embedmsg.edit({ embed });
            return;
        });

	}
};