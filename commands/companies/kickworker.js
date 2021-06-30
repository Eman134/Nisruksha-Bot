module.exports = {
    name: 'demitir',
    aliases: ['demotar', 'expulsar'],
    category: 'Empresas',
    description: 'Demite um funcionário da sua empresa',
    options: [{
        name: 'id-membro',
        type: 'STRING',
        description: 'Digite o id do membro que deseja demotar',
        required: false
    }],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let args = API.args(msg)

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você deve digitar o **ID** ou **MENCIONAR** o funcionário que deseja demitir`, `demitir @membro <motivo>\n${API.prefix}demitir 422002630106152970 <motivo>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length == 1) {
            const embedtemp = await API.sendError(msg, `Você deve especificar um motivo para a demissão`, `demitir @membro <motivo>\n${API.prefix}demitir 422002630106152970 <motivo>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let member;
        if (msg.mentions.users.size < 1) {
            try{
                member = await API.client.users.fetch(args[0])
            }catch{
                const embedtemp = await API.sendError(msg, `Este funcionário não foi encontrado!\nVocê deve digitar o **ID** ou **MENCIONAR** o funcionário que deseja demitir`, `demitir @membro <motivo>\n${API.prefix}demitir 422002630106152970 <motivo>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
        } else {
            member = msg.mentions.users.first();
        }

        let pobj2 = await API.company.get.company(msg.author)

        if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
            const embedtemp = await API.sendError(msg, `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`${API.prefix}func\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let company = pobj2;
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
Você deseja demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**?`)
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            b.deferUpdate()
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customID == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a demissão de ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            let pobj2 = await API.company.get.company(msg.author)

            if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`${API.prefix}func\``)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            if (API.cacheLists.waiting.includes(member, 'working')) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não pode demitir um funcionário enquanto o mesmo está trabalhando na mesma!`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            API.company.jobs.process.remove(member)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você demitiu ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**!\nMotivo: ${API.getMultipleArgs(msg, 2)}`)
            embedmsg.edit({ embeds: [embed], components: [] });

            let company2 = await API.company.get.company(msg.author);
            let botowner = await API.client.users.fetch(API.owner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`Você foi demitido da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**\nMotivo: ${API.getMultipleArgs(msg, 2)}`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações da empresa onde trabalha!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await member.send({ embeds: [embed], components: [] }).catch()
            }catch{}

            
            const list = company2.workers;
            let index = list.indexOf(member.id);
            if (index > -1) {
                list.splice(index, 1);
            }
            
            API.setCompanieInfo(msg.author, company2.company_id, 'workers', list)
            API.setInfo(member, 'players', 'company', null)
            API.setInfo(member, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};