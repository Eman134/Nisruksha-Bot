const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja demitir').setRequired(true))
.addStringOption(option => option.setName('motivo').setDescription('Explique o motivo da demoção').setRequired(true))
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","cacheLists","client","company","createButton","owner","rowComponents","sendError","setCompanieInfo"],
    name: 'demitir',
    aliases: ['demotar', 'expulsar'],
    category: 'Empresas',
    description: 'Demite um funcionário da sua empresa',
    data,
    mastery: 20,
	async execute(interaction, svcDiscord, svcCacheLists, svcClient, svcCompany, svcCreateButton, svcOwner, svcRowComponents, svcSendError, svcSetCompanieInfo) {
        if (!(await svcCompany.check.hasCompany(interaction.user.id))) {
            const embedtemp = await svcSendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let member = interaction.options.getUser('membro');

        let motivo = interaction.options.getString('motivo')

        let pobj2 = await svcCompany.get.companyByOwnerId(interaction.user.id)

        if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
            const embedtemp = await svcSendError(interaction, `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`/func\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company = pobj2;
        
		const embed = new svcDiscord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}**?`)
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().catch((error) => reportError(error, 'command.demitir.defer_update'));
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a demissão de ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            let pobj2 = await svcCompany.get.companyByOwnerId(interaction.user.id)
            
            if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`/func\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            if (await svcCacheLists.waiting.includes(member.id, 'working')) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não pode demitir um funcionário enquanto o mesmo está trabalhando na mesma!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            svcCompany.jobs.process.remove(member.id)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você demitiu ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}**!\nMotivo: ${motivo}`)

            await interaction.editReply({ embeds: [embed], components: [] });

            let company2 = await svcCompany.get.companyByOwnerId(interaction.user.id);
            let botowner = await svcClient.users.fetch(svcOwner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`Você foi demitido da empresa **${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}**\nMotivo: ${motivo}`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações da empresa onde trabalha!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await member.send({ embeds: [embed], components: [] })
            } catch (error) {
                reportError(error, 'command.demitir.member_notification', { memberId: member.id });
            }

            
            const list = company2.workers;
            let index = list.indexOf(member.id);
            if (index > -1) {
                list.splice(index, 1);
            }
            
            svcSetCompanieInfo(interaction.user.id, company2.company_id, 'workers', list)
            DatabaseManager.set(member.id, 'players', 'company', null)
            DatabaseManager.set(member.id, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${svcCompany.e[svcCompany.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};
