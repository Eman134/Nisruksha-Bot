const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'sairdaempresa',
    aliases: ['sairempresa', 'medemitir'],
    category: 'Empresas',
    description: 'Se demite da empresa que você trabalha atualmente',
    mastery: 50,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.isWorker(interaction.user.id))) {
            const embedtemp = await API.sendError(interaction, `Você não trabalha em nenhuma empresa para se demitir${ await API.company.check.hasCompany(interaction.user.id) ?`\nCaso deseja fechar sua empresa utilize \`/fecharempresa\``:''}`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (API.cacheLists.waiting.includes(interaction.user.id, 'working')) {
            const embedtemp = await API.sendError(interaction, `Você não pode sair de uma empresa enquanto está trabalhando na mesma!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        let company = await API.company.get.companyById(pobj.company);
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
Você deseja se demitir da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            if (!b.deferred) b.deferUpdate().then().catch();
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a própria demissão na empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (!(await API.company.check.isWorker(interaction.user.id))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não trabalha em nenhuma empresa para se demitir${ await API.company.check.hasCompany(interaction.user.id) ?`\nCaso deseja fechar sua empresa utilize \`/fecharempresa\``:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            API.company.jobs.process.remove(interaction.user.id)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você se demitiu da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**!`)
            interaction.editReply({ embeds: [embed], components: [] });
            
            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            let company2 = await API.company.get.companyById(pobj.company);
            let owner = await API.company.get.ownerById(pobj.company);
            let botowner = await API.client.users.fetch(API.owner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`O trabalhador ${interaction.user.tag} (${interaction.user.id}) se demitiu da sua empresa!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                owner.send({ embeds: [embed], components: [] }).catch()
            }catch{
            }

            const list = company2.workers;
            let index = list.indexOf(interaction.user.id);
            if (index > -1) {
                list.splice(index, 1);
            }

            //let score = -(pobj.companyact == null ? 0 : pobj.companyact.score)

            API.setCompanieInfo(owner.id, company.company_id, 'workers', list)
            DatabaseManager.set(interaction.user.id, 'players', 'company', null)
            //await API.company.stars.add(interaction.user.id, company.company_id, { score })
            DatabaseManager.set(interaction.user.id, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria se demitir da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};