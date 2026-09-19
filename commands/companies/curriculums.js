const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
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
    requiredServices: ["Discord","client","company","isInt","ms","owner","sendError","setCompanieInfo"],
    name: 'currículos',
    aliases: ['curriculos', 'curr', 'vercurri', 'curriculo', 'currículo'],
    category: 'Empresas',
    description: 'Visualiza os currículos pendentes da sua empresa',
    data,
    mastery: 50,
	async execute(interaction, svcDiscord, svcClient, svcCompany, svcIsInt, svcMs, svcOwner, svcSendError, svcSetCompanieInfo) {        
        const embed = new svcDiscord.MessageEmbed().setColor(`#fc7b03`)
        
        if (!(await svcCompany.check.hasCompany(interaction.user.id))) {
            const embedtemp = await svcSendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const subCmd = interaction.options.getSubcommand()
        const value = interaction.options.getInteger('id-currículo')
        
        let company = await svcCompany.get.companyByOwnerId(interaction.user.id)
        
        let array = [];
        if (company.curriculum != null) array = company.curriculum;
        
        embed.setTitle(`${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}`)
        let botowner = await svcClient.users.fetch(svcOwner[0])
        if (subCmd == 'aceitar') {
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await svcSendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr aceitar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            let index = array[value-1];
            let usr = await svcClient.users.fetch(index.split(";")[0]);
            
            let xy = await svcCompany.check.hasCompany(usr.id)
            let xx = await svcCompany.check.isWorker(usr.id)
            let vac = await svcCompany.check.hasVacancies(company.company_id)

            array.splice(value-1, 1)

            if (xy || xx) {
                await svcSetCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
                embed.setColor('#a60000');
                embed.addField('❌ Houve uma falha no contrato', `Este membro já possui uma empresa ou trabalha em uma!`)
                await interaction.reply({ embeds: [embed] })
                return;
            }
            
            if (!(vac)) {
                embed.setColor('#a60000');
                embed.addField('❌ Houve uma falha no contrato', `Sua empresa não possui vagas disponíveis ou estão desativadas!`)
                await interaction.reply({ embeds: [embed] })
                return;
            }

            embed.setColor("#5bff45")
            .setDescription(`Você aceitou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await interaction.reply({ embeds: [embed] })

            try {
                
                embed.setColor("#5bff45")
                .setDescription(`A empresa ${company.name} aceitou seu currículo!\nSeja bem vindo!\nPara visualizar os comandos da sua empresa utilize \`/setores\``)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await usr.send({ embeds: [embed]})

            } catch (error) {
                reportError(error, 'command.curriculos.user_notification', { userId: usr.id });
            }

            let workers = company.workers == null ? [] : company.workers
            workers.push(usr.id)

            await svcSetCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
            await svcSetCompanieInfo(interaction.user.id, company.company_id, 'workers', workers)

            DatabaseManager.set(usr.id, 'players', 'company', company.company_id)
            return;

        } else if (subCmd == 'negar') {
            
            if (args.length < 2) {
                const embedtemp = await svcSendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (svcIsInt(args[1]) == false) {
                const embedtemp = await svcSendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await svcSendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            let index = array[value-1];
            let usr = await svcClient.users.fetch(index.split(";")[0]);
            array.splice(value-1, 1)
            
            embed.setColor("#a60000")
            .setDescription(`Você negou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await interaction.reply({ embeds: [embed] })

            try {
                
                embed.setColor("#a60000")
                .setDescription(`A empresa ${company.name} negou seu currículo!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                usr.send({ embeds: [embed]});

            } catch (error) {
                reportError(error, 'command.curriculos.rejection_notification', { userId: usr.id });
            }

            await svcSetCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
            
            return;
        }
        
        try {
            if (company.logo != null) embed.setThumbnail(company.logo)
        }catch (err){
            svcClient.emit('error', err)
        }
        if (array.length > 0) {
            
            for (const r of array) {
                let usr = await svcClient.users.fetch(r.split(";")[0])
                const pobjmaq = await DatabaseManager.get(usr.id, 'machines')
                embed.addField(`📰 Nº ${array.indexOf(r)+1}`, `Enviado por: ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`\nNível: ${pobjmaq.level}\nEnviou há: **${svcMs(Date.now()-parseInt(r.split(";")[1]), true)}**\n\`/curr <aceitar/negar> ${array.indexOf(r)+1}\``)
            }

            embed.setColor("#5bff45")
            
        } else {
            embed.addField(`📰 Sem currículos`, `Sua empresa não possui currículos pendentes!`)
            embed.setColor("#a60000")
        }

        await interaction.reply({ embeds: [embed] });
        
	}
};
