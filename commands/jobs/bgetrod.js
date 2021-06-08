module.exports = {
    name: 'pegarvara',
    aliases: ['getrod', 'trocarvara', 'comprarvara'],
    category: 'Trabalhos',
    description: '<:icon6:830966666082910228> Compre ou troque uma vara de pesca',
    options: [],
    mastery: 30,
	async execute(API, msg) {

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de pescaria para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote(embedtemp)
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 6) {
                const embedtemp = await API.sendError(msg, `A empresa onde você trabalha não é de pescaria!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote(embedtemp)
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 6) {
                const embedtemp = await API.sendError(msg, `A sua empresa não é de pescaria!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote(embedtemp)
                return;

            }
        }

        if (pobj2.level < 3) {
            const embedtemp = await API.sendError(msg, `Você não possui nível o suficiente para pegar uma vara de pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`${API.prefix}perfil\``)
            await msg.quote(embedtemp)
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'fishing')) {
            const embedtemp = await API.sendError(msg, `Você não pode comprar/trocar uma vara enquanto estiver pescando! [[VER PESCA]](${API.cacheLists.waiting.getLink(msg.author, 'fishing')})`);
            await msg.quote(embedtemp)
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

            const btn0 = API.createButton(hasrod ? 'troca' : 'compra', 'grey', hasrod ? 'Trocar vara' : 'Comprar vara', hasrod ? '🔁' : '✅')
            const btn1 = API.createButton('cancel', 'grey', 'Cancelar', '❌')

            return [API.rowButton([btn0, btn1])]
        }

        let pobjcheck = await API.getInfo(msg.author, 'players')
        if (pobjcheck.rod == null) delete pobjcheck.rod


        let embedmsg = await msg.quote({ embed, components: reworkBtns(pobjcheck.rod) });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 60000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            reacted = true;

            let troca = b.id == 'troca'

            let pobj2 = await API.getInfo(msg.author, 'players')
            if (pobj2.rod == null) delete pobj2.rod
            let pobj3 = await API.getInfo(msg.author, 'machines')

            b.defer()

            if (b.id == 'cancel'){
                embed.setColor('#a60000');
                embed.addField(`❌ ${pobj2.rod ? 'Troca' : 'Compra'} cancelada`, `Você cancelou a ${pobj2.rod ? 'troca' : 'compra'} da sua vara de pesca!.`)
                embedmsg.edit({ embed });
				collector.stop();
                return;
            }

            playerobj = await API.getInfo(msg.author, 'machines')

            if (pobj2.money < total) {
                embed.setColor('#a60000');
                embed.addField(`❌ Falha na ${pobj2.rod ? 'troca' : 'compra'}`, `Você não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${API.format(pobj2.money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
                embedmsg.edit({ embed });
				collector.stop();
                return
            }
            
            API.eco.money.remove(msg.author, total)
            API.eco.addToHistory(msg.member, `${pobj2.rod ? 'Troca' : 'Compra'} de vara de pesca | - ${API.format(total)} ${API.moneyemoji}`)

            let vara = API.company.jobs.fish.rods.get(pobj3.level)
            embed.fields = []

            for (let i = 0; i < disp.length; i++) {
                embed.addField((disp[i] == vara ? ( troca ? '🔁':'✅') : ' ') + disp[i].icon + ' ' + disp[i].name, `\`${API.company.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`)
            }

            embed
            .addField(`✅ Sucesso na ${pobj2.rod ? 'troca' : 'compra'}`, `Você acaba de ${pobj2.rod ? 'trocar sua vara para:' : 'comprar uma vara:'} **${vara.icon} ${vara.name}**\nPara testar sua nova vara de pesca utilize \`${API.prefix}pescar\`!`)
            .setColor('#5bff45')
            embedmsg.edit({ embed, components: reworkBtns(true) });
            API.setInfo(msg.author, 'players', 'rod', vara)

            collector.resetTimer({ time: 30000 });
            
        });
        
        collector.on('end', async collected => {
            if (reacted) {
                return embedmsg.edit({ embed });;
            }
            embed.fields = []
            embed.setDescription('')
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria ${pobj2.rod ? 'trocar sua' : 'comprar uma'} vara de pesca, porém o tempo expirou.`)
            embedmsg.edit({ embed });
            return;
        });


	}
};