module.exports = {
    name: 'sairdaempresa',
    aliases: ['sairempresa', 'medemitir'],
    category: 'Empresas',
    description: 'Se demite da empresa que você trabalha atualmente',
    options: [],
    mastery: 50,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você não trabalha em nenhuma empresa para se demitir${ await API.company.check.hasCompany(msg.author) ?`\nCaso deseja fechar sua empresa utilize \`${API.prefix}fecharempresa\``:''}`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(msg.author, 'working')) {
            const embedtemp = await API.sendError(msg, `Você não pode sair de uma empresa enquanto está trabalhando na mesma!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let pobj = await API.getInfo(msg.author, 'players')

        let company = await API.company.get.companyById(pobj.company);
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
Você deseja se demitir da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a própria demissão na empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            if (!(await API.company.check.isWorker(msg.author))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não trabalha em nenhuma empresa para se demitir${ await API.company.check.hasCompany(msg.author) ?`\nCaso deseja fechar sua empresa utilize \`${API.prefix}fecharempresa\``:''}`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            API.company.jobs.process.remove(msg.author)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você se demitiu da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**!`)
            embedmsg.edit({ embeds: [embed], components: [] });
            
            let pobj = await API.getInfo(msg.author, 'players')
            let company2 = await API.company.get.companyById(pobj.company);
            let owner = await API.company.get.ownerById(pobj.company);
            let botowner = await API.client.users.fetch(API.owner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`O trabalhador ${msg.author.tag} (${msg.author.id}) se demitiu da sua empresa!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                owner.send({ embeds: [embed], components: [] }).catch()
            }catch{
            }

            const list = company2.workers;
            let index = list.indexOf(msg.author.id);
            if (index > -1) {
                list.splice(index, 1);
            }

            //let score = -(pobj.companyact == null ? 0 : pobj.companyact.score)

            API.setCompanieInfo(owner, company.company_id, 'workers', list)
            API.setInfo(msg.author, 'players', 'company', null)
            //await API.company.stars.add(msg.author, company.company_id, { score })
            API.setInfo(msg.author, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria se demitir da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};