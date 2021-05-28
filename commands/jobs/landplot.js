module.exports = {
    name: 'terrenoatual',
    aliases: ['landplot', 'terrain', 'lote', 'plot'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Visualiza as informações da plantação e terreno',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de agricultura para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote({ embed: embedtemp, reply: { messageReference: this.id }})
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 1) {
                const embedtemp = await API.sendError(msg, `A empresa onde você trabalha não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote({ embed: embedtemp, reply: { messageReference: this.id }})
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 1) {
                const embedtemp = await API.sendError(msg, `A sua empresa não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote({ embed: embedtemp, reply: { messageReference: this.id }})
                return;

            }
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "landplot");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'landplot', 'executar outro comando de terreno')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "landplot", 20);

        let plot = {}
        let townnum = await API.townExtension.getTownNum(msg.author);
        let townname = await API.townExtension.getTownName(msg.author);
        let contains = false
        if (pobj.plots && Object.keys(pobj.plots).length > 0) {
            for (let r of Object.keys(pobj.plots)) {
                r = pobj.plots[r]
                if (townnum == r.loc) {

                    let areaplant = 0;
                    if (r.plants) {
                        for (const rarea of r.plants) {
                            areaplant += rarea.area
                        }
                    }

                    r.areaplant = areaplant

                    contains = true
                    plot = r;
                    break;
                }
            }
        }
        
        const embed = new Discord.MessageEmbed()

        if (!contains) {

            const price = 100000

            const embedtemp = await API.sendError(msg, `Você não possui terrenos na sua vila atual!\nPara adquirir o terreno nesta vila reaja com <:terreno:765944910179336202>\nPreço: \`${API.format(price)} ${API.money}\` ${API.moneyemoji}`)
            const embedmsg = await msg.quote({ embed: embedtemp, reply: { messageReference: this.id }})
        
            await embedmsg.react('765944910179336202')
    
            const filter = (reaction, user) => {
                return user.id === msg.author.id;
            };
            
            const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
            let reacted = false;
            collector.on('collect', async (reaction, user) => {
                await reaction.users.remove(user.id);
                if (!(['765944910179336202'].includes(reaction.emoji.id))) return;
                reacted = true;
                collector.stop();
                embed.fields = [];

                pobj = await API.getInfo(msg.author, 'players')

                const money = await API.eco.money.get(msg.author);
      
                if (!(money >= price)) {
                  embed.setColor('#a60000');
                  embed.addField('❌ Falha na compra', `Você não possui dinheiro suficiente para comprar um terreno!\nSeu dinheiro atual: **${API.format(money)}/${API.format(price)} ${API.money} ${API.moneyemoji}**`)
                  embedmsg.edit(embed);
                  return;
                }

                let townnum = await API.townExtension.getTownNum(msg.author);
                let plot = {
                  loc: townnum,
                  area: 10,
                  cons: 100
                }
                let plots = pobj.plots
                if (plots) {
                  if (Object.keys(plots).includes(townnum.toString())) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha na compra', `Você já possui um terreno nessa vila!\nUtilize \`${API.prefix}terrenos\` para visualizar seus terrenos`)
                    embedmsg.edit(embed);
                    return;
                  }
                } else {
                  plots = {}
                }
  
                plots[townnum] = plot
  
                API.setInfo(msg.author, 'players', 'plots', plots)
    
                embed.setColor('#5bff45');
                embed.addField('✅ Terreno adquirido', `
                Você comprou seu terreno na vila **${townname}**\nUtilize \`${API.prefix}terrenoatual\` e \`${API.prefix}terrenos\` para mais informações.`)
                embedmsg.edit(embed);

                API.playerUtils.cooldown.set(msg.author, "landplot", 0);

                await API.eco.money.remove(msg.author, price);
                await API.eco.addToHistory(msg.member, `Compra <:terreno:765944910179336202> | - ${API.format(price)}`)
    
            });
            
            collector.on('end', async collected => {
                embedmsg.reactions.removeAll();
                if (reacted) return
                embed.setColor('#a60000');
                embed.addField('❌ Tempo expirado', `
                Você iria comprar um terreno, porém o tempo expirou!`)
                embedmsg.edit(embed);
            });

            return;
        }

        const priceupgrade = 10

		embed.setColor(`#a4e05a`)
        .setTitle(`<:terreno:765944910179336202> Informações do seu terreno`) // \nConservação do terreno: \`${plot.cons}%\`
        .setDescription(` ${plot.area < 100 ? `Preço de upgrade (+10m²): \`${priceupgrade} ${API.money2}\` ${API.money2emoji}`:''}\nÁrea máxima em m²: \`${plot.area}m²\`\nLotes de plantação: \`${plot.plants ? plot.plants.length : 0}/5\`\nÁrea com plantação: \`${plot.areaplant}m²\`\nLocalização: \`${townname}\``)
        if (plot.plants && plot.plants.length > 0){
            let x = 1;
            for (const r of plot.plants) {
                //let adubacao = API.getProgress(8, '<:adub:765647640238227510>', '<:energyempty:741675234796503041>', r.adubacao, 100)

                let ob = {
                    percent: 100,
                    ms: 0
                }

                if (r.maxtime-(Date.now()-r.planted) < 0) {
                    ob.percent = 100
                } else {
                    ob.ms = r.maxtime-(Date.now()-r.planted)

                    ob.percent = 100-Math.round(ob.ms*100/r.maxtime)
                }

                let crescimento = API.getProgress(12, '<:cresc:765647640594481183>', '<:energyempty:741675234796503041>', ob.percent, 100, true)
                // \nAdubação do lote: ${adubacao}
                embed.addField(`Lote ${x}: ${r.seed.icon} ${r.seed.displayname}`, `Área da plantação: ${r.area}m²\nQuantia: ${r.qnt}\nCrescimento atual: ${crescimento}\nTempo para o crescimento: ${ob.percent >= 100 ? '✅ Crescido':API.ms2(ob.ms)}`)
                x++
            }
        } else {
            embed.addField(`❌ Não possui plantações`, `Utilize \`${API.prefix}coletar\` para coletar plantas ou sementes e começar a plantar`)
        }
        if (plot.area < 100) embed.setFooter('Reaja com 🔼 para realizar o upgrade no terreno')
        const embedmsg = await msg.quote(embed);
        if (plot.area >= 100) return

        await embedmsg.react('🔼')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });

        collector.on('collect', async (reaction, user) => {

            await reaction.users.remove(user.id);
            if (!(['🔼'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            embed.setFooter('')

            const points = await API.eco.points.get(msg.author);

            pobj = await API.getInfo(msg.author, 'players')

            if (!(points >= priceupgrade)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no upgrade', `Você não possui cristais suficiente para dar upgrade no terreno!\nSeus cristais atuais: **${API.format(points)}/${API.format(priceupgrade)} ${API.money2} ${API.money2emoji}**`)
                embedmsg.edit(embed);
                return;
            }

            if (plot.area+10 > 100) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no upgrade', `Você atingiu o limite de área de 100m² para um terreno!\nCaso deseja ter mais terrenos basta comprá-los em outras vilas!`)
                embedmsg.edit(embed);
                return;
            }

            embed.setColor('#5bff45');
            embed.addField('✅ Upgrade realizado', `
            Você pagou \`${priceupgrade} ${API.money2}\` ${API.money2emoji} e deu upgrade no seu terreno na vila **${townname}**!\nNova área do terreno: ${plot.area + 10}m²`)
            embedmsg.edit(embed);

            let plots = pobj.plots
            plots[townnum].area = plot.area+10

            API.setInfo(msg.author, 'players', 'plots', plots)

            API.playerUtils.cooldown.set(msg.author, "landplot", 0);

            API.eco.points.remove(msg.author, priceupgrade);
            await API.eco.addToHistory(msg.member, `Upgrade <:terreno:765944910179336202> | - ${priceupgrade} ${API.money2emoji}`)

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
        });

	}
};