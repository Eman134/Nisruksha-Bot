const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const { SlashCommandBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()

.addSubcommand(subcommand =>
    subcommand
        .setName('lista')
        .setDescription('Veja a lista de currículos atual'))
.addSubcommand(subcommand =>
    subcommand
        .setName('aceitar')
        .setDescription('Aceita ou nega um currículo na sua empresa')
        .addIntegerOption(option => option.setName('id-currículo').setDescription('Digite o id do currículo para aceitar ou negar').setRequired(true)))
.addSubcommand(subcommand =>
    subcommand
        .setName('negar')
        .setDescription('Aceita ou nega um currículo na sua empresa')
        .addIntegerOption(option => option.setName('id-currículo').setDescription('Digite o id do currículo para aceitar ou negar').setRequired(true)))

module.exports = {
    name: 'currículos',
    aliases: ['curriculos', 'curr', 'vercurri', 'curriculo', 'currículo'],
    category: 'Empresas',
    description: 'Visualiza os currículos pendentes da sua empresa',
    data,
    mastery: 50,
	async execute(interaction) {

                
        const embed = new Discord.EmbedBuilder().setColor(`#fc7b03`)
        
        if (!(await companyService.check.hasCompany(interaction.user.id))) {
            const embedtemp = await utility.sendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const subCmd = interaction.options.getSubcommand()
        const value = interaction.options.getInteger('id-currículo')
        
        let company = await companyService.get.companyByOwnerId(interaction.user.id)
        
        let array = [];
        if (company.curriculum != null) array = company.curriculum;
        
        embed.setTitle(`${companyService.e[companyService.types[company.type]].icon} ${company.name}`)
        let botowner = await clientService.current.users.fetch(config.owner[0])
        if (subCmd == 'aceitar') {
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await utility.sendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr aceitar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            let index = array[value-1];
            let usr = await clientService.current.users.fetch(index.split(";")[0]);
            
            let xy = await companyService.check.hasCompany(usr.id)
            let xx = await companyService.check.isWorker(usr.id)
            let vac = await companyService.check.hasVacancies(company.company_id)

            array.splice(value-1, 1)

            if (xy || xx) {
                await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array)
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Houve uma falha no contrato', value: `Este membro já possui uma empresa ou trabalha em uma!` })
                await interaction.reply({ embeds: [embed] })
                return;
            }
            
            if (!(vac)) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Houve uma falha no contrato', value: `Sua empresa não possui vagas disponíveis ou estão desativadas!` })
                await interaction.reply({ embeds: [embed] })
                return;
            }

            embed.setColor("#5bff45")
            .setDescription(`Você aceitou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await interaction.reply({ embeds: [embed] })

            try {
                
                embed.setColor("#5bff45")
                .setDescription(`A empresa ${company.name} aceitou seu currículo!\nSeja bem vindo!\nPara visualizar os comandos da sua empresa utilize \`/setores\``)
                .setFooter({ text: `Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})` })
                await usr.send({ embeds: [embed]})

            } catch (error) {
                reportError(error, 'command.curriculos.user_notification', { userId: usr.id });
            }

            let workers = company.workers == null ? [] : company.workers
            workers.push(usr.id)

            await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array)
            await companyInfo.set(interaction.user.id, company.company_id, 'workers', workers)

            const user_id = BigInt(usr.id)
            await prisma.players.upsert({ where: { user_id }, update: { company: company.company_id }, create: { user_id, company: company.company_id, frames: [], badges: [] } })
            return;

        } else if (subCmd == 'negar') {
            
            if (args.length < 2) {
                const embedtemp = await utility.sendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (utility.isInt(args[1]) == false) {
                const embedtemp = await utility.sendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await utility.sendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            let index = array[value-1];
            let usr = await clientService.current.users.fetch(index.split(";")[0]);
            array.splice(value-1, 1)
            
            embed.setColor("#a60000")
            .setDescription(`Você negou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await interaction.reply({ embeds: [embed] })

            try {
                
                embed.setColor("#a60000")
                .setDescription(`A empresa ${company.name} negou seu currículo!`)
                .setFooter({ text: `Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})` })
                usr.send({ embeds: [embed]});

            } catch (error) {
                reportError(error, 'command.curriculos.rejection_notification', { userId: usr.id });
            }

            await companyInfo.set(interaction.user.id, company.company_id, 'curriculum', array)
            
            return;
        }
        
        try {
            if (company.logo != null) embed.setThumbnail(company.logo)
        }catch (err){
            clientService.current.emit('error', err)
        }
        if (array.length > 0) {
            
            for (const r of array) {
                let usr = await clientService.current.users.fetch(r.split(";")[0])
                const pobjmaq = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })
                embed.addFields({ name: `📰 Nº ${array.indexOf(r)+1}`, value: `Enviado por: ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`\nNível: ${pobjmaq.level}\nEnviou há: **${compactTime(Date.now()-parseInt(r.split(";")[1]))}**\n\`/curr <aceitar/negar> ${array.indexOf(r)+1}\`` })
            }

            embed.setColor("#5bff45")
            
        } else {
            embed.addFields({ name: `📰 Sem currículos`, value: `Sua empresa não possui currículos pendentes!` })
            embed.setColor("#a60000")
        }

        await interaction.reply({ embeds: [embed] });
        
	}
};
