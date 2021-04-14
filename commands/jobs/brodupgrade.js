module.exports = {
    name: 'uparvara',
    aliases: ['rodupgrade', 'varaupgrade', 'rodup', 'varaup'],
    category: 'Trabalhos',
    description: '<:icon6:830966666082910228> Dê upgrade na vara de pesca para melhorar a pescaria',
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
        if (pobj.rod == null) delete pobj.rod
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

        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            API.sendError(msg, `Você não pode upar uma vara enquanto estiver pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`);
            return;
        }

        if (!pobj.rod) {
            return API.sendError(msg, `Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`${API.prefix}pegarvara\``)
        }

        let total = Math.round(3200*pobj2.level*2)

        const embed = new Discord.MessageEmbed()
        .setColor('#63b8ae')
        .setTitle(pobj.rod.icon + ' ' + pobj.rod.name)
        .setDescription(`\`${API.company.jobs.formatStars(pobj.rod.stars)}\` *(20% chance de aumentar)* \nGasto por turno: **${pobj.rod.sta} 🔸** *(36% chance de aumentar)*\nProfundidade: **${pobj.rod.profundidade}m** *(44% chance de aumentar)*\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
        let embedmsg
        await msg.quote(embed).then((emsg) => {
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
                embedmsg.edit(embed);
                return
            }
    

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${API.format(pobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit(embed);
                return
            }
            
            API.eco.money.remove(msg.author, total)
            API.eco.addToHistory(msg.member, `Upgrade da vara de pesca | - ${API.format(total)} ${API.moneyemoji}`)

            let list = []

            if (pobj2.rod.stars < 5) {
                list.push(0)
            }
            if (pobj2.rod.sta < 10) {
                list.push(1)
            }
            if (pobj2.rod.profundidade < pobj2.rod.maxprofundidade) {
                list.push(2)
            }

            if (list.length == 0) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return embedmsg.edit(embed);
            }
			upgraded = true

            const randomd = API.random(0, 100)

            if (list.includes(0) && randomd <= 20) {

                pobj2.rod.stars += 1
                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45');
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e adicionou uma estrela ⭐ ao nível da sua vara de pesca!`)
                return embedmsg.edit(embed);

            } else if (list.includes(1) && randomd <= 56) {
                pobj2.rod.sta -= 1
                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)
                embed.setColor('#5bff45');
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e diminuiu o gasto de estamina 🔸 da sua vara de pesca!`)
                return embedmsg.edit(embed);

            } else if (list.includes(2) && randomd <= 100) {
                pobj2.rod.profundidade = (parseFloat(pobj2.rod.profundidade) + parseFloat("0." + API.random(2, 5))).toFixed(1)

                if (pobj2.rod.profundidade >= pobj2.rod.maxprofundidade) pobj2.rod.profundidade = pobj2.rod.maxprofundidade

                API.setInfo(msg.author, 'players', 'rod', pobj2.rod)

                embed.setColor('#5bff45')
                .setDescription(`\`${API.company.jobs.formatStars(pobj2.rod.stars)}\` *(20% chance)* \nGasto por turno: **${pobj2.rod.sta} 🔸** *(36% chance)*\nProfundidade: **${pobj2.rod.profundidade}m** *(44% chance)*\nPreço do upgrade: **${total} ${API.money} ${API.moneyemoji}**`)
                embed.addField(`✅ Sucesso no upgrade`, `Você gastou **${API.format(total)} ${API.money} ${API.moneyemoji}** e aumentou a profundidade alcançada pela sua vara de pesca!`)
                return embedmsg.edit(embed)
            } else {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha no upgrade`, `Você não possui mais upgrades disponíveis nessa vara de pesca!`)
                return embedmsg.edit(embed);
            }
            
        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted || upgraded) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria upar sua vara de pesca, porém o tempo expirou.`)
            embedmsg.edit(embed);
            return;
        });

	}
};