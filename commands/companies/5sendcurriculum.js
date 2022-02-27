const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('empresa').setDescription('Digite o código da empresa que deseja enviar o currículo').setRequired(true))

module.exports = {
    name: 'enviarcurriculo',
    aliases: ['enviarcurrículo', 'enviarc'],
    category: 'Empresas',
    description: 'Envia um currículo de trabalho para alguma empresa',
    data,
    mastery: 20,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const company_id = interaction.options.getString('empresa')

        if (await API.company.check.hasCompany(interaction.user.id)) {
            const embedtemp = await API.sendError(interaction, `Você não pode enviar currículo para alguma empresa pois você já possui uma`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await API.company.check.isWorker(interaction.user.id)) {
            const embedtemp = await API.sendError(interaction, `Você não pode enviar currículo para outra empresa pois você já trabalha em uma`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let company

        try{

            company = await API.company.get.companyById(company_id)
			
			if (!company) {
                const embedtemp = await API.sendError(interaction, `O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``)
                await interaction.reply({ embeds: [embedtemp]})
                return;
			}

        }catch (err){ 
            API.client.emit('error', err)
            throw err 
        }

        let locname = API.townExtension.getTownNameByNum(company.loc)
        let townname = await API.townExtension.getTownName(interaction.user.id);
        
        if (locname != townname) {
            const embedtemp = await API.sendError(interaction, `Você precisa estar na mesma vila da empresa para enviar o currículo!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``, `mover ${locname}`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const pobjmaq = await DatabaseManager.get(interaction.user.id, 'machines')

        if (pobjmaq.level < 3) {
            const embedtemp = await API.sendError(interaction, `Você não possui nível o suficiente para enviar currículo!\nSeu nível atual: **${pobjmaq.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!(await API.company.check.hasVacancies(company_id))) {
            const embedtemp = await API.sendError(interaction, `Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }


        if (company.curriculum != null && company.curriculum.length >= 10) {
            const embedtemp = await API.sendError(interaction, `Esta empresa já possui o máximo de currículos pendentes **10/10**.`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        let clist0 = []
        if (company.curriculum != null) {
            clist0 = company.curriculum
        }
        let currincl = false
        for (const r of clist0) {
            if (r.includes(interaction.user.id)) {currincl = true;break}
        }

        if (currincl == true) {
            const embedtemp = await API.sendError(interaction, `Você já enviou um currículo para esta empresa! Aguarde uma resposta.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja enviar seu currículo para a empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**?`)
        .setFooter('Ao enviar o currículo você está em consentimento em receber DM\'S do bot de quando você for aceito ou negado na empresa!')
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
            collector.stop();
            embed.fields = [];

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Currículo cancelado', `
                Você cancelou o envio de currículo para a empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            } else {
                
                
                let companyobj = await API.company.get.companyById(company_id)

                if (!companyobj) {
                    const embedtemp = await API.sendError(interaction, `O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``)
           	        await interaction.reply({ embeds: [embedtemp]})
                    return;
                }

                if (companyobj.curriculum != null && companyobj.curriculum.includes(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no currículo', `
                    Você já enviou um currículo para esta empresa! Aguarde uma resposta..`)
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                if (await API.company.check.hasCompany(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no currículo', `
                    Você não pode enviar currículo para alguma empresa pois você já possui uma`)
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
        
                if (await API.company.check.isWorker(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no currículo', `
                    Você não pode enviar currículo para outra empresa pois você já trabalha em uma`)
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                if (!(await API.company.check.hasVacancies(company_id))) {
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no currículo', `
                    Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!`)
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                let clist = []
                if (companyobj.curriculum != null) {
                    clist = companyobj.curriculum
                }
                clist.push(`${interaction.user.id};${Date.now()}`)
                embed.setColor('#5bff45')
                let botowner = await API.client.users.fetch(API.owner[0])
                try {
                    let companyowner = await API.client.users.fetch(companyobj.user_id)
                    API.setCompanieInfo(companyowner.id, companyobj.company_id, "curriculum", clist)
                    const embed2 = new Discord.MessageEmbed()
                    embed2.setColor('#5bff45')
                    embed2.setDescription(`O membro ${interaction.user} enviou um currículo para a sua empresa!\nUtilize \`/curriculos\` em algum servidor do bot para visualizar os currículos pendentes.`)
                    .setFooter(`Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                    await companyowner.send({ embeds: [embed2], components: [] }).catch()
                } catch { 
                }
                
                embed.setColor('#5bff45');
                embed.addField('✅ Currículo enviado', `
                Você enviou o currículo para a empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`)
                .setFooter('Ao enviar o currículo você está em consentimento em receber DM\'S do bot de quando você for aceito ou negado na empresa!')
                interaction.editReply({ embeds: [embed], components: [] });

                return;
            }

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria enviar o currículo para a empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};