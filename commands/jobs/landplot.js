const Discord = require('../../_classes/discordCompat');
const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const companyService = require('../../_classes/services/company');
const companyInfo = require('../../_classes/services/companyInfo');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'terrenoatual',
    aliases: ['landplot', 'terrain', 'lote', 'plot'],
    category: 'none',
    description: 'Visualiza as informações da plantação e terreno',
    mastery: 18,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const check = await playersService.cooldown.check(interaction.user.id, "landplot");
        if (check) {

            playersService.cooldown.message(interaction, 'landplot', 'executar outro comando de terreno')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "landplot", 20);

        const townnum = await townsService.getTownNum(interaction.user.id);
        const townname = await townsService.getTownName(interaction.user.id);

        function hasTerrain(plots, townnum) {
            let contains = false
            if (plots && Object.keys(plots).length > 0) {
                for (let r of Object.keys(plots)) {
                    r = plots[r]
                    if (townnum == r.loc) {
                        contains = true
                        break;
                    }
                }
            }
            return contains
        }

        async function getTerrain(plots) {
            let plot = {}
            if (plots && Object.keys(plots).length > 0) {
                for (let r of Object.keys(plots)) {
                    r = plots[r]
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
            return plot
        }

        async function makeEmbed(pobj) {

            const plot = await getTerrain(pobj.plots)
            
            let adubacao = utility.getProgress(8, '<:adub:765647640238227510>', '<:energyempty:741675234796503041>', (!plot.adubacao ? 100 : plot.adubacao), 100, true)

            embed.fields = []

            embed.setColor(`#a4e05a`)
            .setTitle(`<:terreno:765944910179336202> Informações do seu terreno`) // \nConservação do terreno: \`${plot.cons}%\`
            .setDescription(` ${plot.area < 100 ? `Preço de upgrade (+10m²): \`${priceupgrade} ${utility.money2}\` ${utility.money2emoji}`:''}\nÁrea máxima em m²: \`${plot.area}m²\`\nLotes de plantação: \`${plot.plants ? plot.plants.length : 0}/5\`\nÁrea com plantação: \`${plot.areaplant}m²\`\nLocalização: \`${townname}\`\nAdubação: ${adubacao}`)

            const grow = []

            if (plot.plants && plot.plants.length > 0){
                let x = 1;
                for (const r of plot.plants) {
    
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
    
                    r.lote = x
                    r.percent = ob.percent

                    let crescimento = utility.getProgress(12, '<:cresc:765647640594481183>', '<:energyempty:741675234796503041>', ob.percent, 100, true)
                    
                    embed.addField(`Lote ${x}: ${r.seed.icon} ${r.seed.displayname}`, `Área da plantação: ${r.area}m²\nQuantia: ${r.qnt}\nCrescimento atual: ${crescimento}\nTempo para o crescimento: ${ob.percent >= 100 ? '✅ Crescido':utility.ms(ob.ms, true)}`)
                    
                    grow.push(r)
    
                    x++
                }
            } else {
                embed.addField(`❌ Não possui plantações`, `Utilize \`/coletar\` para coletar plantas ou sementes e começar a plantar`)
            }

            function reworkButtons(grow) {

                const components = []
                
                const row0 = []
                const growBtnList = []

                if (plot.area < 100) {
                    row0.push(utility.createButton('upgrade', 'SECONDARY', 'Upgrade', '833837888634486794'))
                }
                
                if (row0.length > 0) components.push(utility.rowComponents(row0))

                for (i = 0; i < grow.length; i++) {
                    growBtnList.push(utility.createButton(grow[i].lote.toString(), (grow[i].percent == 100 ? 'SUCCESS' : 'DANGER'), 'Colher', grow[i].seed.icon.split(':')[2] ? grow[i].seed.icon.split(':')[2].replace('>', '') : grow[i].seed.icon, (grow[i].percent == 100 ? false : true)))
                }

                let totalcomponents = growBtnList.length % 5;
                if (totalcomponents == 0) totalcomponents = (growBtnList.length)/5;
                else totalcomponents = ((growBtnList.length-totalcomponents)/5);

                totalcomponents += 1

                for (x = 0; x < totalcomponents; x++) {
                    if (growBtnList[x]) {
                        const var1 = (x+1)*5-5
                        const var2 = ((x+1)*5)
                        const rowBtn = utility.rowComponents(growBtnList.slice(var1, var2))
                        if (rowBtn.components.length > 0) components.push(rowBtn)
                    } else break

                }

                return components
            }
            

            return { plot, grow, components: reworkButtons(grow) }

        }
        
        const embed = new Discord.MessageEmbed()

        if (!hasTerrain(pobj.plots, townnum)) {

            const price = 100000

            const embedtemp = await utility.sendError(interaction, `Você não possui terrenos na sua vila atual!\nPara adquirir o terreno nesta vila reaja com <:terreno:765944910179336202>\nPreço: \`${utility.format(price)} ${utility.money}\` ${utility.moneyemoji}`)
            
            const embedinteraction = await interaction.reply({ embeds: [embedtemp], components: [utility.rowComponents([utility.createButton('confirm', 'SUCCESS', 'Comprar Terreno', '765944910179336202')])], withResponse: true } )

            const filter = i => i.user.id === interaction.user.id;
            
            const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
            let reacted = false;
            collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
                reacted = true;
                collector.stop();
                if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.terreno.defer_update'); });
                embed.fields = [];

                pobj = await DatabaseManager.get(interaction.user.id, 'players')

                const money = await economyService.money.get(interaction.user.id);
      
                if (!(money >= price)) {
                  embed.setColor('#a60000');
                  embed.addField('❌ Falha na compra', `Você não possui dinheiro suficiente para comprar um terreno!\nSeu dinheiro atual: **${utility.format(money)}/${utility.format(price)} ${utility.money} ${utility.moneyemoji}**`)
                  await interaction.editReply({ embeds: [embed], components: [] });
                  return;
                }

                let townnum = await townsService.getTownNum(interaction.user.id);
                let plot = {
                  loc: townnum,
                  area: 10,
                  cons: 100,
                  adubacao: 100
                }
                let plots = pobj.plots
                if (plots) {
                  if (Object.keys(plots).includes(townnum.toString())) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha na compra', `Você já possui um terreno nessa vila!\nUtilize \`/terrenos\` para visualizar seus terrenos`)
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                  }
                } else {
                  plots = {}
                }
  
                plots[townnum] = plot
  
                DatabaseManager.set(interaction.user.id, 'players', 'plots', plots)
    
                embed.setColor('#5bff45');
                embed.addField('✅ Terreno adquirido', `
                Você comprou seu terreno na vila **${townname}**\nUtilize \`/terrenoatual\` e \`/terrenos\` para mais informações.`)
                await interaction.editReply({ embeds: [embed], components: [] });

                playersService.cooldown.set(interaction.user.id, "landplot", 0);

                await economyService.money.remove(interaction.user.id, price);
                await economyService.addToHistory(interaction.user.id, `Compra <:terreno:765944910179336202> | - ${utility.format(price)}`)
    
            });
            
            collector.on('end', async collected => {
                if (reacted) return
                embed.setColor('#a60000');
                embed.addField('❌ Tempo expirado', `
                Você iria comprar um terreno, porém o tempo expirou!`)
                interaction.editReply({ embeds: [embed], components: [] });
            });

            return;
        }

        const priceupgrade = 10

        const plotReturns = await makeEmbed(pobj)

        const components = plotReturns.components

        const embedinteraction = await interaction.reply({ embeds: [embed], components, withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
                if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.terreno.defer_update'); });

            collector.resetTimer()

            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            let plotReturns = await makeEmbed(pobj)

            let plot = plotReturns.plot
            let allplots = pobj.plots
            let components = plotReturns.components

            if (b.customId == 'upgrade') {

                const points = await economyService.points.get(interaction.user.id);

                if (!(points >= priceupgrade)) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no upgrade', `Você não possui cristais suficiente para dar upgrade no terreno!\nSeus cristais atuais: **${utility.format(points)}/${utility.format(priceupgrade)} ${utility.money2} ${utility.money2emoji}**`)
                    interaction.editReply({ embeds: [embed], components });
                    return;
                }

                if (plot.area+10 > 100) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no upgrade', `Você atingiu o limite de área de 100m² para um terreno!\nCaso deseja ter mais terrenos basta comprá-los em outras vilas!`)
                    interaction.editReply({ embeds: [embed], components });
                    return;
                }

                let plots = pobj.plots
                plots[townnum].area = plot.area+10

                await DatabaseManager.set(interaction.user.id, 'players', 'plots', plots)

                playersService.cooldown.set(interaction.user.id, "landplot", 0);

                economyService.points.remove(interaction.user.id, priceupgrade);
                await economyService.addToHistory(interaction.user.id, `Upgrade <:terreno:765944910179336202> | - ${priceupgrade} ${utility.money2emoji}`)

                pobj = await DatabaseManager.get(interaction.user.id, 'players')
                plotReturns = await makeEmbed(pobj)
                components = plotReturns.components

                embed.setColor('#5bff45');
                embed.addField('✅ Upgrade realizado', `
                Você pagou \`${priceupgrade} ${utility.money2}\` ${utility.money2emoji} e deu upgrade no seu terreno na vila **${townname}**!\nNova área do terreno: ${plot.area + 10}m²`)
                
                await interaction.editReply({ embeds: [embed], components });

                return

            } else {

                let selectedplant = plot.plants[parseInt(b.customId)-1]

                if (selectedplant.percent < 100) {
                    embed.addField('❌ Falha na colheita', `Esta plantação ainda não está crescida!\nUtilize \`/terrenoatual\` para visualizar seus lotes`)
                    await interaction.editReply({ embeds: [embed], components })
                    return;
                }

                let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

                allplots[townnum].plants.splice([parseInt(b.customId)-1], 1)
                if (allplots[townnum].plants.length == 0) {
                    delete allplots[townnum].plants
                }

                await DatabaseManager.set(interaction.user.id, 'players', 'plots', allplots)

                let total = Math.round(selectedplant.qnt*selectedplant.seed.price*pobj2.level*1.5)
                
                if (await companyService.check.isWorker(interaction.user.id)) {
                    company = await companyService.get.companyById(pobj.company);
                } else {
                    company = await companyService.get.companyByOwnerId(interaction.user.id);
                }
                let owner = await companyService.get.ownerById(company.company_id);

                let totaltaxa = 0
                if (company) totaltaxa = Math.round(company.taxa*total/100)

                let totalantes = total
                total = Math.round(total-totaltaxa)

                if (interaction.user.id == owner.id) {
                    total = totalantes
                }

                let xp = utility.random(5*parseInt(pobj2.level), 8*parseInt(pobj2.level));
                xp = await playersService.execExp(interaction, xp);
                
                let score = ((companyService.stars.gen()*2.5).toFixed(2)) 

                pobj = await DatabaseManager.get(interaction.user.id, 'players')
                plotReturns = await makeEmbed(pobj)
                components = plotReturns.components

                embed.setColor('#5bff45')
                embed.addField('✅ Colheita realizada ', `Você colheu **${selectedplant.qnt}x ${selectedplant.seed.icon} ${selectedplant.seed.displayname}** do seu terreno com sucesso!\nValor da colheita: **${utility.format(total)} ${utility.money}** ${utility.moneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${utility.format(totaltaxa)} ${utility.money} ${utility.moneyemoji} de taxa da empresa**`}.\n**(+${xp} XP)** **(+${score} ⭐)**`)
                
                await interaction.editReply({ embeds: [embed], components })

                economyService.addToHistory(interaction.user.id, `Colheita ${selectedplant.seed.icon} | + ${utility.format(total)} ${utility.moneyemoji}`)

                economyService.money.add(interaction.user.id, total)

                await companyService.stars.add(interaction.user.id, company.company_id, { score })
                
                if (company == undefined || interaction.user.id == owner.id) return
                let rend = company.rend || []
                rend.unshift(totaltaxa)
                rend = rend.slice(0, 10)
                
                companyInfo.set(owner.id, company.company_id, 'rend', rend)

                companyService.stars.add(interaction.user.id, company.company_id, { rend: totaltaxa })
                
                economyService.bank.add(owner.id, totaltaxa)

            }

        });
        
        collector.on('end', async collected => {
            interaction.editReply({ embeds: [embed], components: [] })
        });

	}
};
