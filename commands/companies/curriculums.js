const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
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
	async execute(API, interaction) {

        const Discord = API.Discord;
        
        const embed = new Discord.MessageEmbed().setColor(`#fc7b03`)
        
        if (!(await API.company.check.hasCompany(interaction.user.id))) {
            const embedtemp = await API.sendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const subCmd = interaction.options.getSubcommand()
        const value = interaction.options.getInteger('id-currículo')
        
        let company = await API.company.get.companyByOwnerId(interaction.user.id)
        
        let array = [];
        if (company.curriculum != null) array = company.curriculum;
        
        embed.setTitle(`${API.company.e[API.company.types[company.type]].icon} ${company.name}`)
        let botowner = await API.client.users.fetch(API.owner[0])
        if (subCmd == 'aceitar') {
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await API.sendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr aceitar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }

            let index = array[value-1];
            let usr = await API.client.users.fetch(index.split(";")[0]);
            
            let xy = await API.company.check.hasCompany(usr.id)
            let xx = await API.company.check.isWorker(usr.id)
            let vac = await API.company.check.hasVacancies(company.company_id)

            array.splice(value-1, 1)

            if (xy || xx) {
                await API.setCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
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
                await usr.send({ embeds: [embed]}).catch()

            } catch{
            }

            let workers = company.workers == null ? [] : company.workers
            workers.push(usr.id)

            await API.setCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
            await API.setCompanieInfo(interaction.user.id, company.company_id, 'workers', workers)

            DatabaseManager.set(usr.id, 'players', 'company', company.company_id)
            return;

        } else if (subCmd == 'negar') {
            
            if (args.length < 2) {
                const embedtemp = await API.sendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (API.isInt(args[1]) == false) {
                const embedtemp = await API.sendError(interaction, `Você digitou o comando de forma incorreta!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            if (array[value-1] == undefined || array[value-1] == null) {
                const embedtemp = await API.sendError(interaction, `Este número de currículo é inexistente!\nVocê pode visualizar o Nº do currículo em \`/curr lista\``, `curr negar <Nº do currículo>`)
                await interaction.reply({ embeds: [embedtemp]})
                return;
            }
            
            let index = array[value-1];
            let usr = await API.client.users.fetch(index.split(";")[0]);
            array.splice(value-1, 1)
            
            embed.setColor("#a60000")
            .setDescription(`Você negou o currículo de ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\``)
            await interaction.reply({ embeds: [embed] })

            try {
                
                embed.setColor("#a60000")
                .setDescription(`A empresa ${company.name} negou seu currículo!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para saber se foi aceito ou negado na empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                usr.send({ embeds: [embed]});

            } catch{
            }

            await API.setCompanieInfo(interaction.user.id, company.company_id, 'curriculum', array)
            
            return;
        }
        
        try {
            if (company.logo != null) embed.setThumbnail(company.logo)
        }catch (err){
            API.client.emit('error', err)
        }
        if (array.length > 0) {
            
            for (const r of array) {
                let usr = await API.client.users.fetch(r.split(";")[0])
                const pobjmaq = await DatabaseManager.get(usr.id, 'machines')
                embed.addField(`📰 Nº ${array.indexOf(r)+1}`, `Enviado por: ${usr} 🡮 \`${usr.tag}\` 🡮 \`${usr.id}\`\nNível: ${pobjmaq.level}\nEnviou há: **${API.ms2(Date.now()-parseInt(r.split(";")[1]))}**\n\`/curr <aceitar/negar> ${array.indexOf(r)+1}\``)
            }

            embed.setColor("#5bff45")
            
        } else {
            embed.addField(`📰 Sem currículos`, `Sua empresa não possui currículos pendentes!`)
            embed.setColor("#a60000")
        }

        await interaction.reply({ embeds: [embed] });
        
	}
};