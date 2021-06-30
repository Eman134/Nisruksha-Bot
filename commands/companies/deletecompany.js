module.exports = {
    name: 'fecharempresa',
    aliases: ['closecompany'],
    category: 'Empresas',
    description: 'Feche a sua empresa atual',
    options: [],
    mastery: 50,
	async execute(API, msg) {

        let args = API.args(msg);
        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você não possui uma empresa aberta para fecha-la!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let company = await API.company.get.company(msg.author)


        let locname = API.townExtension.getTownNameByNum(company.loc)
        let townname = await API.townExtension.getTownName(msg.author);
        
        if (locname != townname) {
            const embedtemp = await API.sendError(msg, `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`${API.prefix}mapa\` e \`${API.prefix}mover\``, `mover ${locname}`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (company.workers != null && company.workers.length > 0) {
            const embedtemp = await API.sendError(msg, `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`${API.prefix}demitir\` para demitir seus funcionários`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let total = 0;

        let r1 = 150000;
        let r2 = 150000;
        let r3 = 300000;
        let r4 = 75000;

        total = r1+r2+r3+r4
        
        let playerobj = await API.getInfo(msg.author, 'machines')
        let playerobj2 = await API.getInfo(msg.author, 'players')

        const name = company.name
        const type = company.type
        const icon = API.company.e[API.company.types[type]].icon;
        let townname2 = await API.townExtension.getTownName(msg.author);
        
        const embed = new Discord.MessageEmbed()
        .addField(`📃 Informações da Empresa`, `Nome: **${name}**\nSetor: **${icon} ${API.company.types[company.type].charAt(0).toUpperCase() + API.company.types[company.type].slice(1)}**\nLocalização: **${townname2}**`)
        .addField(`🧾 Contratos`, `\`Termos de Compromisso\`\n${API.format(r1)} ${API.money} ${API.moneyemoji}\n\`Compensação de Trabalho\`\n${API.format(r2)} ${API.money} ${API.moneyemoji}\n\`Autorização de Recebimento\`\n${API.format(r3)} ${API.money} ${API.moneyemoji}\n\`Instrumento Particular\`\n${API.format(r4)} ${API.money} ${API.moneyemoji}`)
        .addField(`📑 Requisitos de fechamento`, `Valor final: **${API.format(total)} ${API.money} ${API.moneyemoji}** ${playerobj2.money >= total ? '✅':'❌'}`)
        .setColor('#00e061')
		
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            b.deferUpdate().catch()
            reacted = true;
            collector.stop();

            if (b.customID == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Fechamento cancelado', `
                Você cancelou o fechamento da empresa **${icon} ${name}**.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            playerobj = await API.getInfo(msg.author, 'machines')
            playerobj2 = await API.getInfo(msg.author, 'players')

            let locname = API.townExtension.getTownNameByNum(company.loc)
            let townname = await API.townExtension.getTownName(msg.author);
            
            if (locname != townname) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você precisa estar na mesma vila da empresa para fechar a empresa!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`${API.prefix}mapa\` e \`${API.prefix}mover ${locname}\``)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            if (company.workers != null && company.workers.length > 0) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você não pode fechar uma empresa antes de demitir os funcionários!\nUtilize \`${API.prefix}demitir\` para demitir seus funcionários`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return
            }

            if (playerobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no fechamento', `Você não possui dinheiro o suficiente para fechar sua empresa!\nSeu dinheiro atual: **${API.format(playerobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return
            }

            try {
                await API.db.pool.query(`DELETE FROM companies WHERE user_id=${msg.author.id};`);
            }catch (err) { 
                API.client.emit('error', err)
                throw err 
            }

            const code = company.company_id
            
            API.eco.money.remove(msg.author, total)
            API.eco.addToHistory(msg.author, `Empresa fechada | - ${API.format(total)} ${API.moneyemoji}`)
            townname = await API.townExtension.getTownName(msg.author);
            embed
            .addField(`✅ Sucesso no fechamento`, `Você acaba de fechar sua empresa **${icon} ${name}**!`)
            .setColor('#a60000')
            embedmsg.edit({ embeds: [embed], components: [] });

            const embed2 = new API.Discord.MessageEmbed();
            embed2.setTitle(`Empresa fechada!`) 
            .addField(`Informações da Empresa`, `Fundador: ${msg.author}\nNome: **${name}**\nSetor: **${icon} ${API.company.types[company.type].charAt(0).toUpperCase() + API.company.types[company.type].slice(1)}**\nLocalização: **${townname}**\nCódigo: **${code}**`)
            embed2.setColor('#a60000')
            API.client.guilds.cache.get('693150851396796446').channels.cache.get('747490313765126336').send({ embeds: [embed2] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria fechar a empresa **${icon} ${name}**, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });
        
	}
};