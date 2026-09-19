const Discord = require('../../_classes/discordCompat');
const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const config = require('../../_classes/config');
const companyInfo = require('../../_classes/services/companyInfo');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'sairdaempresa',
    aliases: ['sairempresa', 'medemitir'],
    category: 'Empresas',
    description: 'Se demite da empresa que você trabalha atualmente',
    mastery: 50,
	async execute(interaction) {

                
        if (!(await companyService.check.isWorker(interaction.user.id))) {
            const embedtemp = await utility.sendError(interaction, `Você não trabalha em nenhuma empresa para se demitir${ await companyService.check.hasCompany(interaction.user.id) ?`\nCaso deseja fechar sua empresa utilize \`/fecharempresa\``:''}`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'working')) {
            const embedtemp = await utility.sendError(interaction, `Você não pode sair de uma empresa enquanto está trabalhando na mesma!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        let company = await companyService.get.companyById(pobj.company);
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
Você deseja se demitir da empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**?`)

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.sairempresa.defer_update'));
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a própria demissão na empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            if (!(await companyService.check.isWorker(interaction.user.id))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não trabalha em nenhuma empresa para se demitir${ await companyService.check.hasCompany(interaction.user.id) ?`\nCaso deseja fechar sua empresa utilize \`/fecharempresa\``:''}`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            companyService.jobs.process.remove(interaction.user.id)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você se demitiu da empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**!`)
            interaction.editReply({ embeds: [embed], components: [] });
            
            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            let company2 = await companyService.get.companyById(pobj.company);
            let owner = await companyService.get.ownerById(pobj.company);
            let botowner = await clientService.current.users.fetch(config.owner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`O trabalhador ${interaction.user.tag} (${interaction.user.id}) se demitiu da sua empresa!`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações de funcionários na sua empresa!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await owner.send({ embeds: [embed], components: [] })
            } catch (error) {
                reportError(error, 'command.sairempresa.owner_notification', { ownerId: owner.id });
            }

            const list = company2.workers;
            let index = list.indexOf(interaction.user.id);
            if (index > -1) {
                list.splice(index, 1);
            }

            //let score = -(pobj.companyact == null ? 0 : pobj.companyact.score)

            companyInfo.set(owner.id, company.company_id, 'workers', list)
            DatabaseManager.set(interaction.user.id, 'players', 'company', null)
            //await companyService.stars.add(interaction.user.id, company.company_id, { score })
            DatabaseManager.set(interaction.user.id, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria se demitir da empresa **${companyService.e[companyService.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
