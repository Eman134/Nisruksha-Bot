module.exports = {
    name: 'venderitem',
    aliases: ['sellitem', 'vitem', 'vi', 'si', 'venderi'],
    category: 'Economia',
    description: 'Vende tods os ítens ou específicos da sua mochila',
    options: [
    {
        name: 'quantia',
        type: 'STRING',
        description: 'Selecione uma quantia de algum item ou selecione tudo para vender',
        required: false
    },
    {
        name: 'item',
        type: 'STRING',
        description: 'Selecione um item para vender',
        required: false
    }],
    mastery: 50,
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item para venda!`, `venderitem <tudo | quantia> [nome do item]\n${API.prefix}venderitem tudo\n${API.prefix}venderitem tudo olho\n${API.prefix}venderitem 10 Carne de monstro`)
            await msg.quote(embedtemp)
            return;
        }

        let armsize = await API.company.jobs.itens.get(msg.author, true, true);

        if (armsize <= 0) {
            const embedtemp = await API.sendError(msg, `Você não possui itens na sua mochila para vender!`)
            await msg.quote(embedtemp)
            return;
        }

        let arg0 = args[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (args.length >= 2 && (API.maqExtension.ores.checkExists(API.getMultipleArgs(msg, 2), 'drops') == false)) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item EXISTENTE para venda!\nVerifique os itens disponíveis utilizando \`${API.prefix}mochila\``)
            await msg.quote(embedtemp)
            return;
        }

        if ((API.isInt(arg0) == false) && arg0 != 'tudo') {
            const embedtemp = await API.sendError(msg, `Você precisa identificar uma quantia para venda!`, `venderitem <tudo | quantia> [nome do item]\n${API.prefix}venderitem tudo\n${API.prefix}venderitem tudo olho\n${API.prefix}venderitem 10 Carne de monstro`)
            await msg.quote(embedtemp)
            return;
        }

        if (API.isInt(arg0) && args.length == 1) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um item para venda!`, `venderitem <tudo | quantia> [nome do item]\n${API.prefix}venderitem tudo\n${API.prefix}venderitem tudo olho\n${API.prefix}venderitem 10 Carne de monstro`)
            await msg.quote(embedtemp)
            return;
        }

        let type;
        let id = '';
        let drop
        let realname = ""
        if (args.length > 1) {id = API.getMultipleArgs(msg, 2).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); drop = API.maqExtension.ores.getDrop(id)}
        if (drop) realname = drop.name
        if (arg0 == 'tudo' && args.length == 1) {
            type = 0;
        }

        let obj = API.maqExtension.ores.getObj();
        const obj2 = await API.getInfo(msg.author, 'storage')

        if (arg0 == 'tudo' && args.length >= 2) {

            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                const embedtemp = await API.sendError(msg, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await msg.quote(embedtemp)
                return;
            }

            type = 1;
        }

        if (API.isInt(arg0) && args.length >= 2) {
            type = 2;
            if (parseInt(arg0) <= 0) {
                const embedtemp = await API.sendError(msg, `Você não pode vender essa quantia de ${drop.icon} \`${drop.displayname}\`!`)
                await msg.quote(embedtemp)
                return;
            }
            if (obj2[drop.name.replace(/"/g, '')] <= 0) {
                const embedtemp = await API.sendError(msg, `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await msg.quote(embedtemp)
                return;
            }

            if (parseInt(arg0) > obj2[drop.name.replace(/"/g, '')]) {
                const embedtemp = await API.sendError(msg, `Você não possui **${arg0}x** ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                await msg.quote(embedtemp)
                return;
            }
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "vendaitem");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'vendaitem', 'vender itens novamente')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "vendaitem", 35);

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

                totalsize = parseInt(arg0);
                total += parseInt(arg0)*drop.price;
                break;
        }
        total = Math.round(total);

        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
        } else {
            company = await API.company.get.company(msg.author);
        }

        let owner
        
        if (company) owner = await API.company.get.ownerById(company.company_id);

        let totaltaxa = 0
        if (company) totaltaxa = Math.round(company.taxa*total/100)

        let totalantes = total
        
        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa)**`}?`)
        
        let msgembed = await msg.quote(embed);

        msgembed.react('✅')
        msgembed.react('❌')
        let emojis = ['✅', '❌']

        const filter = (reaction, user) => {
            return user.id === msg.author.id && emojis.includes(reaction.emoji.name);
        };
        
        let collector = msgembed.createReactionCollector(filter, { time: 30000 });
        let selled = false;
        collector.on('collect', async(reaction, user) => {
            selled = true;
            collector.stop();
            embed.fields = [];
            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa)**`}.`)
                msgembed.edit(embed);
                return;
            }

            let obj3 = await API.getInfo(msg.author, 'storage')

            switch (type) {
                case 0:

                    let armsize2 = await API.company.jobs.itens.get(msg.author, true, true);

                    if (armsize2 <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui itens na sua mochila para vender!`)
                        msgembed.edit(embed)
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.drops) {
                            API.maqExtension.storage.setOre(msg.author, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        msgembed.edit(embed)
                        return;
                    }

                    API.maqExtension.storage.setOre(msg.author, realname, 0)
                    break;
                case 2:

                    if (obj3[drop.name.replace(/"/g, '')] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        msgembed.edit(embed)
                        return;
                    }

                    if (parseInt(arg0) > obj3[drop.name.replace(/"/g, '')]) {
                        embed.addField('❌ Venda cancelada', `Você não possui **${arg0}x** de ${drop.icon} \`${drop.displayname}\` na sua mochila para vender!`)
                        msgembed.edit(embed)
                        return;
                    }

                    API.maqExtension.storage.setOre(msg.author, realname, obj3[drop.name.replace(/"/g, '')]-parseInt(arg0))
                    break;
            }

            
            pobj = await API.getInfo(msg.author, 'players')
            
            if (await API.company.check.isWorker(msg.author)) {
                company = await API.company.get.companyById(pobj.company);
            } else {
                company = await API.company.get.company(msg.author);
            }
            if (company) owner = await API.company.get.ownerById(company.company_id);

            totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            totalantes = total
            total = Math.round(total-totaltaxa)

            if (owner && msg.author.id == owner.id) {
                total = totalantes
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${API.format(totalantes)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa)**`}.`)
            if(API.debug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${API.format(total)}\nResposta em: ${Date.now()-msg.createdTimestamp}ms\`\`\``)
            msgembed.edit(embed);
            API.eco.addToHistory(msg.member, `Venda | + ${API.format(total)} ${API.moneyemoji}`)

            API.eco.money.add(msg.author, total)
            
            if (!company || (owner && msg.author.id == owner.id)) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            API.setCompanieInfo(owner, company.company_id, 'rend', rend)

            API.eco.bank.add(owner, totaltaxa)

            API.company.stars.add(msg.author, company.company_id, { rend: totaltaxa })

        });
        
        collector.on('end', collected => {
            msgembed.reactions.removeAll();
            API.playerUtils.cooldown.set(msg.author, "vendaitem", 0);
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender **${totalsize}x** de **${type == 0 ? 'Tudo' : `${drop.icon} ${drop.displayname}`}** da sua mochila pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa)**`}, porém o tempo expirou!`)
            msgembed.edit(embed);
            return;
        });

	}
};