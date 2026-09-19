const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const townsService = require('../../_classes/services/towns');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('empresa').setDescription('Digite o código da empresa que deseja enviar o currículo').setRequired(true))

module.exports = {
    name: 'enviarcurriculo',
    aliases: ['enviarcurrículo', 'enviarc'],
    category: 'Empresas',
    description: 'Envia um currículo de trabalho para alguma empresa',
    data,
    mastery: 20,
	async execute(interaction) {

        
        const company_id = interaction.options.getString('empresa')

        if (await companyService.check.hasCompany(interaction.user.id)) {
            const embedtemp = await utility.sendError(interaction, `Você não pode enviar currículo para alguma empresa pois você já possui uma`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await companyService.check.isWorker(interaction.user.id)) {
            const embedtemp = await utility.sendError(interaction, `Você não pode enviar currículo para outra empresa pois você já trabalha em uma`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
        let company

        try{

            company = await companyService.get.companyById(company_id)
			
			if (!company) {
                const embedtemp = await utility.sendError(interaction, `O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``)
                await interaction.reply({ embeds: [embedtemp]})
                return;
			}

        }catch (err){ 
            clientService.current.emit('error', err)
            throw err 
        }

        let locname = townsService.getTownNameByNum(company.loc)
        let townname = await townsService.getTownName(interaction.user.id);
        
        if (locname != townname) {
            const embedtemp = await utility.sendError(interaction, `Você precisa estar na mesma vila da empresa para enviar o currículo!\nSua vila atual: **${townname}**\nVila da empresa: **${locname}**\nPara visualizar o mapa ou se mover, utilize, respectivamente, \`/mapa\` e \`/mover\``, `mover ${locname}`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const user_id = BigInt(interaction.user.id)
        const pobjmaq = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

        if (pobjmaq.level < 3) {
            const embedtemp = await utility.sendError(interaction, `Você não possui nível o suficiente para enviar currículo!\nSeu nível atual: **${pobjmaq.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!(await companyService.check.hasVacancies(company_id))) {
            const embedtemp = await utility.sendError(interaction, `Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }


        if (company.curriculum != null && company.curriculum.length >= 10) {
            const embedtemp = await utility.sendError(interaction, `Esta empresa já possui o máximo de currículos pendentes **10/10**.`)
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
            const embedtemp = await utility.sendError(interaction, `Você já enviou um currículo para esta empresa! Aguarde uma resposta.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`)
           	await interaction.reply({ embeds: [embedtemp]})
            return;
        }
        
		const embed = new Discord.EmbedBuilder()
		embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja enviar seu currículo para a empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**?` })
        .setFooter({ text: 'Ao enviar o currículo você está em consentimento em receber DM\'S do bot de quando você for aceito ou negado na empresa!' })
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.enviarcurriculo.defer_update'));
            reacted = true;
            collector.stop();
            embed.fields = [];

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Currículo cancelado', value: `
                Você cancelou o envio de currículo para a empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            } else {
                
                
                let companyobj = await companyService.get.companyById(company_id)

                if (!companyobj) {
                    const embedtemp = await utility.sendError(interaction, `O id de empresa ${company_id} é inexistente!\nPesquise empresas utilizando \`/empresas\``)
           	        await interaction.reply({ embeds: [embedtemp]})
                    return;
                }

                if (companyobj.curriculum != null && companyobj.curriculum.includes(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no currículo', value: `
                    Você já enviou um currículo para esta empresa! Aguarde uma resposta..` })
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                if (await companyService.check.hasCompany(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no currículo', value: `
                    Você não pode enviar currículo para alguma empresa pois você já possui uma` })
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
        
                if (await companyService.check.isWorker(interaction.user.id)) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no currículo', value: `
                    Você não pode enviar currículo para outra empresa pois você já trabalha em uma` })
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                if (!(await companyService.check.hasVacancies(company_id))) {
                    embed.setColor('#a60000');
                    embed.addFields({ name: '❌ Falha no currículo', value: `
                    Esta empresa não possui vagas ou estão fechadas, tente novamente quando houver vagas!` })
                    interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }
                let clist = []
                if (companyobj.curriculum != null) {
                    clist = companyobj.curriculum
                }
                clist.push(`${interaction.user.id};${Date.now()}`)
                embed.setColor('#5bff45')
                let botowner = await clientService.current.users.fetch(config.owner[0])
                try {
                    let companyowner = await clientService.current.users.fetch(String(companyobj.user_id))
                    companyInfo.set(companyowner.id, companyobj.company_id, "curriculum", clist)
                    const embed2 = new Discord.EmbedBuilder()
                    embed2.setColor('#5bff45')
                    embed2.setDescription(`O membro ${interaction.user} enviou um currículo para a sua empresa!\nUtilize \`/curriculos\` em algum servidor do bot para visualizar os currículos pendentes.`)
                    .setFooter({ text: `Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})` })
                    await companyowner.send({ embeds: [embed2], components: [] })
                } catch (error) {
                    reportError(error, 'command.enviarcurriculo.owner_notification', { companyId: companyobj.company_id });
                }
                
                embed.setColor('#5bff45');
                embed.addFields({ name: '✅ Currículo enviado', value: `
                Você enviou o currículo para a empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.` })
                .setFooter({ text: 'Ao enviar o currículo você está em consentimento em receber DM\'S do bot de quando você for aceito ou negado na empresa!' })
                interaction.editReply({ embeds: [embed], components: [] });

                return;
            }

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.EmbedBuilder();
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `Você iria enviar o currículo para a empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**, porém o tempo expirou.` })
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
