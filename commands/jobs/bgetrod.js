module.exports = {
    name: 'pegarvara',
    aliases: ['getrod', 'trocarvara', 'comprarvara'],
    category: 'none',
    description: 'Compre ou troque uma vara de pesca',
    options: [],
    mastery: 30,
    companytype: 6,
	async execute(API, msg, company) {

        const Discord = API.Discord;

        let pobj2 = await API.getInfo(msg.author, 'machines')

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(msg, `Você não possui nível o suficiente para pegar uma vara de pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            const embedtemp = await API.sendError(msg, `Você não pode comprar/trocar uma vara enquanto estiver pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let total = 1200*(pobj2.level)
        let disp = API.company.jobs.fish.rods.possibilities(pobj2.level)

        const embed = new Discord.MessageEmbed()
        .setColor('#63b8ae')
        .setTitle('🎣 Varas disponíveis')
        .setDescription('**Explicação:** Ao confirmar a reação, o sistema irá sortear uma vara dentre as disponíveis, e a vara de pesca será essa.\n**Preço atual: ' + API.format(total) + ' ' + API.money + '** ' + API.moneyemoji)
        for (i = 0; i < disp.length; i++) {
            embed.addField(disp[i].icon + ' ' + disp[i].name, `\`${API.company.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`)
        }

        function reworkBtns(hasrod) {

            const btn0 = API.createButton(hasrod ? 'troca' : 'compra', 'SECONDARY', hasrod ? 'Trocar vara' : 'Comprar vara', hasrod ? '🔁' : '✅')
            const btn1 = API.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

            return [API.rowComponents([btn0, btn1])]
        }

        let pobjcheck = await API.getInfo(msg.author, 'players')
        if (pobjcheck.rod == null) delete pobjcheck.rod


        let embedmsg = await msg.quote({ embeds: [embed], components: reworkBtns(pobjcheck.rod) });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            reacted = true;

            let troca = b.customId == 'troca'

            let pobj2 = await API.getInfo(msg.author, 'players')
            if (pobj2.rod == null) delete pobj2.rod
            let pobj3 = await API.getInfo(msg.author, 'machines')

            if (b && !b.deferred) b.deferUpdate().then(console.log).catch(console.error);

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField(`❌ ${pobj2.rod ? 'Troca' : 'Compra'} cancelada`, `Você cancelou a ${pobj2.rod ? 'troca' : 'compra'} da sua vara de pesca!.`)
                embedmsg.edit({ embeds: [embed] });
				collector.stop();
                return;
            }

            playerobj = await API.getInfo(msg.author, 'machines')

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha na ${pobj2.rod ? 'troca' : 'compra'}`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${API.format(pobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit({ embeds: [embed] });
				collector.stop();
                return
            }
            
            API.eco.money.remove(msg.author, total)
            API.eco.addToHistory(msg.author, `${pobj2.rod ? 'Troca' : 'Compra'} de vara de pesca | - ${API.format(total)} ${API.moneyemoji}`)

            let vara = API.company.jobs.fish.rods.get(pobj3.level)
            embed.fields = []

            for (let i = 0; i < disp.length; i++) {
                embed.addField((disp[i] == vara ? ( troca ? '🔁':'✅') : ' ') + disp[i].icon + ' ' + disp[i].name, `\`${API.company.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`)
            }

            embed
            .addField(`✅ Sucesso na ${pobj2.rod ? 'troca' : 'compra'}`, `Você acaba de ${pobj2.rod ? 'trocar sua vara para:' : 'comprar uma vara:'} **${vara.icon} ${vara.name}**\nPara testar sua nova vara de pesca utilize \`${API.prefix}pescar\`!`)
            .setColor('#5bff45')
            embedmsg.edit({ embeds: [embed], components: reworkBtns(true) });
            API.setInfo(msg.author, 'players', 'rod', vara)

            collector.resetTimer();
            
        });
        
        collector.on('end', async collected => {
            if (reacted) {
                return embedmsg.edit({ embeds: [embed] });;
            }
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria ${pobj2.rod ? 'trocar sua' : 'comprar uma'} vara de pesca, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed] });
            return;
        });


	}
};