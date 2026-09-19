const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('quantia').setDescription('Selecione uma quantia de algum item ou "tudo" para vender').setRequired(true))
.addStringOption(option => option.setName('item').setDescription('Selecione um item para venda').setRequired(false))

module.exports = {
    requiredServices: ["Discord","company","createButton","debug","eco","format","isInt","itemExtension","money","moneyemoji","playerUtils","rowComponents","sendError","setCompanieInfo"],
    name: 'venderitem',
    aliases: ['sellitem', 'vitem', 'vi', 'si', 'venderi'],
    category: 'Economia',
    description: 'Vende tods os ítens ou específicos da sua mochila',
    data,
    mastery: 50,
	async execute(interaction, svcDiscord, svcCompany, svcCreateButton, svcDebug, svcEco, svcFormat, svcIsInt, svcItemExtension, svcMoney, svcMoneyemoji, svcPlayerUtils, svcRowComponents, svcSendError, svcSetCompanieInfo) {

        let item = interaction.options.getString('item')
        let quantia = interaction.options.getString('quantia')

        const armsize = await svcItemExtension.getInv(interaction.user.id, true, true);

        if (armsize <= 0) {
            const embedtemp = await svcSendError(interaction, `Você não possui itens na sua mochila para vender!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (item != null && !svcItemExtension.exists(item, 'drops')) {
            const embedtemp = await svcSendError(interaction, `Você precisa identificar um item EXISTENTE para venda!\nVerifique os itens disponíveis utilizando \`/mochila\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (item != null) item = item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        quantia = quantia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

        if ((svcIsInt(quantia) == false) && quantia != 'tudo') {
            const embedtemp = await svcSendError(interaction, `Você precisa identificar uma quantia para venda!`, `venderitem <tudo | quantia> [nome do item]\n/venderitem tudo\n/venderitem tudo olho\n/venderitem 10 Carne de monstro`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (svcIsInt(quantia) && item == null) {
            const embedtemp = await svcSendError(interaction, `Você precisa identificar um item para venda!`, `venderitem <tudo | quantia> [nome do item]\n/venderitem tudo\n/venderitem tudo olho\n/venderitem 10 Carne de monstro`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let type;
        let id = '';
        let drop
        let realname = ""
        if (item != null) {id = item; drop = svcItemExtension.get(id) }
        if (drop) realname = drop.name
        if (quantia == 'tudo' && item == null) {
            type = 0;
        }

        let obj = svcItemExtension.getObj();
        const obj2 = await DatabaseManager.get(interaction.user.id, 'storage')

        if (quantia == 'tudo' && item != null) {

            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                const embedtemp = await svcSendError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            type = 1;
        }

        if (svcIsInt(quantia) && item != null) {
            type = 2;
            if (parseInt(quantia) <= 0) {
                const embedtemp = await svcSendError(interaction, `Você não pode vender essa quantia de ${drop.icon} \`${drop.displayname}\`!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                const embedtemp = await svcSendError(interaction, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            if (parseInt(quantia) > obj2[drop.name.replace(/"/g, '')]) {
                const embedtemp = await svcSendError(interaction, `Você não possui **${quantia}x** ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
        }

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "vendaitem");
        if (check) {
            svcPlayerUtils.cooldown.message(interaction, 'vendaitem', 'vender itens novamente')
            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "vendaitem", 35);

        let total = 0;
        let totalsize = 0;
        let caseprice = 0;
        switch (type) {
            case 0:
                //for (const key in obj) {
                    for (const r of obj.drops) {
                        total += obj2[r.name.replace(/"/g, '')]*r.price;
                        totalsize += obj2[r.name.replace(/"/g, '')]
                    }
                //}
                break;
            case 1:
                total += obj2[drop.name.replace(/"/g, '')]*drop.price;
                totalsize = obj2[drop.name.replace(/"/g, '')];
                break;
            case 2:

                totalsize = parseInt(quantia);
                total += parseInt(quantia)*drop.price;
                break;
        }
        total = Math.round(total);

        let company;
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        
        if (await svcCompany.check.isWorker(interaction.user.id)) {
            company = await svcCompany.get.companyById(pobj.company);
        } else {
            company = await svcCompany.get.companyByOwnerId(interaction.user.id);
        }

        let owner
        
        if (company) owner = await svcCompany.get.ownerById(company.company_id);

        let totaltaxa = 0
        if (company) totaltaxa = Math.round(company.taxa*total/100)

        let totalantes = total
        
        const embed = new svcDiscord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${svcFormat(total)} ${svcMoney}** ${svcMoneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${svcFormat(totaltaxa)} ${svcMoney} ${svcMoneyemoji} de taxa da empresa)**`}?`)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let selled = false;
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.venderitem.defer_update'); });
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${svcFormat(total)} ${svcMoney}** ${svcMoneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${svcFormat(totaltaxa)} ${svcMoney} ${svcMoneyemoji} de taxa da empresa)**`}.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            let obj3 = await DatabaseManager.get(interaction.user.id, 'storage')

            switch (type) {
                case 0:

                    let armsize2 = await svcItemExtension.getInv(interaction.user.id, true, true);

                    if (armsize2 <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui itens na sua mochila para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.drops) {
                            svcItemExtension.set(interaction.user.id, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    svcItemExtension.set(interaction.user.id, realname, 0)
                    break;
                case 2:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    if (parseInt(quantia) > obj3[drop.name.replace(/"/g, '')]) {
                        embed.addField('❌ Venda cancelada', `Você não possui **${quantia}x** de ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        interaction.editReply({ embeds: [embed], components: [] })
                        return;
                    }

                    svcItemExtension.set(interaction.user.id, realname, obj3[drop.name.replace(/"/g, '')]-parseInt(quantia))
                    break;
            }

            
            pobj = await DatabaseManager.get(interaction.user.id, 'players')
            
            if (await svcCompany.check.isWorker(interaction.user.id)) {
                company = await svcCompany.get.companyById(pobj.company);
            } else {
                company = await svcCompany.get.companyByOwnerId(interaction.user.id);
            }
            if (company) owner = await svcCompany.get.ownerById(company.company_id);

            totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            totalantes = total
            total = Math.round(total-totaltaxa)

            if (owner && interaction.user.id == owner.id) {
                total = totalantes
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${svcFormat(totalantes)} ${svcMoney}** ${svcMoneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${svcFormat(totaltaxa)} ${svcMoney} ${svcMoneyemoji} de taxa da empresa)**`}.`)
            if(svcDebug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${svcFormat(total)}\nResposta em: ${Date.now()-interaction.createdTimestamp}ms\`\`\``)
            interaction.editReply({ embeds: [embed], components: [] });
            svcEco.addToHistory(interaction.user.id, `Venda | + ${svcFormat(total)} ${svcMoneyemoji}`)

            svcEco.svcMoney.add(interaction.user.id, total)
            
            if (!company || (owner && interaction.user.id == owner.id)) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            svcSetCompanieInfo(owner.id, company.company_id, 'rend', rend)

            svcEco.bank.add(owner.id, totaltaxa)

            svcCompany.stars.add(interaction.user.id, company.company_id, { rend: totaltaxa })

        });
        
        collector.on('end', collected => {
            svcPlayerUtils.cooldown.set(interaction.user.id, "vendaitem", 0);
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${svcFormat(total)} ${svcMoney}** ${svcMoneyemoji} ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% | ${svcFormat(totaltaxa)} ${svcMoney} ${svcMoneyemoji} de taxa da empresa)**`}, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
