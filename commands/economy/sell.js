module.exports = {
    name: 'vender',
    aliases: ['sell', 'v', 's'],
    category: 'Economia',
    description: 'Vende todos os recursos ou específicos do seu armazém',
    options: [
        {
            name: 'quantia',
            type: 'STRING',
            description: 'Selecione uma quantia de algum minério ou selecione tudo para vender',
            required: false
        },
        {
            name: 'minério',
            type: 'STRING',
            description: 'Selecione um minério para vender',
            required: false
        }],
    mastery: 50,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um produto para venda!`, `vender <tudo | quantia> [minério]\n${API.prefix}vender tudo\n${API.prefix}vender tudo cobre\n${API.prefix}vender 500 pedra`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let armsize = await API.maqExtension.storage.getSize(msg.author);

        if (armsize <= 0) {
            const embedtemp = await API.sendError(msg, `Você não possui recursos no seu armazém para vender!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let arg0 = args[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (args.length >= 2 && (!API.itemExtension.exists(args[1]))) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um minério EXISTENTE para venda!\nVerifique os recursos disponíveis utilizando \`${API.prefix}armazém\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if ((API.isInt(arg0) == false) && arg0 != 'tudo') {
            const embedtemp = await API.sendError(msg, `Você precisa identificar uma quantia para venda!`, `vender <tudo | quantia> [minério]\n${API.prefix}vender tudo\n${API.prefix}vender tudo cobre\n${API.prefix}vender 500 pedra`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (API.isInt(arg0) && args.length == 1) {
            const embedtemp = await API.sendError(msg, `Você precisa identificar um produto para venda!`, `vender <tudo | quantia> [minério]\n${API.prefix}vender tudo\n${API.prefix}vender tudo cobre\n${API.prefix}vender 500 pedra`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let type;
        let id = '';
        if (args.length > 1) id = args[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (arg0 == 'tudo' && args.length == 1) {
            type = 0;
        }

        let obj = API.itemExtension.getObj();
        const obj2 = await API.getInfo(msg.author, 'storage')

        if (arg0 == 'tudo' && args.length >= 2) {

            if (obj2[id] <= 0) {
                const embedtemp = await API.sendError(msg, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            type = 1;
        }

        if (API.isInt(arg0) && args.length >= 2) {
            type = 2;
            if (parseInt(arg0) <= 0) {
                const embedtemp = await API.sendError(msg, `Você não pode vender essa quantia de \`${id.charAt(0).toUpperCase() + id.slice(1)}\`!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            if (obj2[id] <= 0) {
                const embedtemp = await API.sendError(msg, `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (parseInt(arg0) > obj2[id]) {
                const embedtemp = await API.sendError(msg, `Você não possui **${arg0}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
        }

        const check = await API.playerUtils.cooldown.check(msg.author, "venda");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'venda', 'vender minérios novamente')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "venda", 35);

        let total = 0;
        let totalsize = 0;
        let caseprice = 0;
        switch (type) {
            case 0:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        total += obj2[r.name]*r.price.atual;
                        totalsize += obj2[r.name]
                    }
                //}
                break;
            case 1:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        let _id = r.name;
                        if (id == _id) caseprice = r.price.atual;
                    }
                //}
                total += obj2[id]*caseprice;
                totalsize = obj2[id];
                break;
            case 2:
                //for (const key in obj) {
                    for (const r of obj.minerios) {
                        let _id = r.name;
                        if (id == _id) caseprice = r.price.atual;
                    }
                //}
                totalsize = parseInt(arg0);
                total += parseInt(arg0)*caseprice;
                break;
        }
        total = Math.round(total);

        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji}?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentInteractionCollector(filter, { time: 30000 });
        let selled = false;
        collector.on('collect', async(b) => {
            selled = true;
            collector.stop();
            embed.fields = [];
            b.deferUpdate()
            if (b.customID == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji}.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            let obj3 = await API.getInfo(msg.author, 'storage')

            switch (type) {
                case 0:

                    let armsize2 = await API.maqExtension.storage.getSize(msg.author);

                    if (armsize2 <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui recursos no seu armazém para vender!`)
                        embedmsg.edit({ embeds: [embed], components: [] })
                        return;
                    }

                    //for (const key in obj) {
                        for (const r of obj.minerios) {
                            API.itemExtension.set(msg.author, r.name, 0)
                        }
                    //}
                    break;
                case 1:

                    if (obj3[id] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        embedmsg.edit({ embeds: [embed], components: [] })
                        return;
                    }

                    API.itemExtension.set(msg.author, id, 0)
                    break;
                case 2:

                    if (obj3[id] <= 0) {
                        embed.addField('❌ Venda cancelada', `Você não possui \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        embedmsg.edit({ embeds: [embed], components: [] })
                        return;
                    }

                    if (parseInt(arg0) > obj3[id]) {
                        embed.addField('❌ Venda cancelada', `Você não possui **${arg0}g** de \`${id.charAt(0).toUpperCase() + id.slice(1)}\` no seu armazém para vender!`)
                        embedmsg.edit({ embeds: [embed], components: [] })
                        return;
                    }

                    API.itemExtension.set(msg.author, id, obj2[id]-parseInt(arg0))
                    break;
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji}.`)
            if(API.debug) embed.addField('<:error:736274027756388353> Depuração', `\n\`\`\`js\nSize: ${totalsize > 1000 ? Math.round(totalsize/1000) + 'kg': totalsize + 'g'}\nTotal: $${API.format(total)}\nResposta em: ${Date.now()-msg.createdTimestamp}ms\`\`\``)
            embedmsg.edit({ embeds: [embed], components: [] });
            API.eco.addToHistory(msg.author, `Venda | + ${API.format(total)} ${API.moneyemoji}`)
            API.eco.money.add(msg.author, total)
        });
        
        collector.on('end', collected => {
            API.playerUtils.cooldown.set(msg.author, "venda", 0);
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender **${totalsize > 1000 ? Math.round(totalsize/1000).toFixed(1) + 'kg': totalsize + 'g'}** de \`${type == 0 ? 'Tudo' : id.charAt(0).toUpperCase() + id.slice(1)}\` pelo preço de **${API.format(total)} ${API.money}** ${API.moneyemoji}, porém o tempo expirou!`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};