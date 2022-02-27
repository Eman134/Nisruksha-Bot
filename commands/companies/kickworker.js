const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja demitir').setRequired(true))
.addStringOption(option => option.setName('motivo').setDescription('Explique o motivo da demoção').setRequired(true))
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'demitir',
    aliases: ['demotar', 'expulsar'],
    category: 'Empresas',
    description: 'Demite um funcionário da sua empresa',
    data,
    mastery: 20,
	async execute(API, interaction) {

        const Discord = API.Discord;

        if (!(await API.company.check.hasCompany(interaction.user.id))) {
            const embedtemp = await API.sendError(interaction, `Você deve possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let member = interaction.options.getUser('membro');

        let motivo = interaction.options.getString('motivo')

        let pobj2 = await API.company.get.companyByOwnerId(interaction.user.id)

        if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
            const embedtemp = await API.sendError(interaction, `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`/func\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company = pobj2;
        
		const embed = new Discord.MessageEmbed()
		embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**?`)
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!b.deferred) b.deferUpdate().then().catch();
            reacted = true;
            embed.fields = []
            collector.stop();
            
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Demissão cancelada', `
                Você cancelou a demissão de ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            let pobj2 = await API.company.get.companyByOwnerId(interaction.user.id)
            
            if (pobj2.workers == null || !(pobj2.workers.includes(member.id))) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Este funcionário não trabalha em sua empresa!\nVeja seus funcionários usando \`/func\``)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            if (API.cacheLists.waiting.includes(member.id, 'working')) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha na demissão', `Você não pode demitir um funcionário enquanto o mesmo está trabalhando na mesma!`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
            
            API.company.jobs.process.remove(member.id)

            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Demitido!', `Você demitiu ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**!\nMotivo: ${motivo}`)

            await interaction.editReply({ embeds: [embed], components: [] });

            let company2 = await API.company.get.companyByOwnerId(interaction.user.id);
            let botowner = await API.client.users.fetch(API.owner[0])
            try{
                embed.fields = [];
                embed.setColor("#a60000")
                .setDescription(`Você foi demitido da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**\nMotivo: ${motivo}`)
                .setFooter(`Você está em consentimento em receber DM\'S do bot para ações da empresa onde trabalha!\nCaso esta mensagem foi um engano, contate o criador do bot (${botowner.tag})`)
                await member.send({ embeds: [embed], components: [] }).catch()
            }catch{}

            
            const list = company2.workers;
            let index = list.indexOf(member.id);
            if (index > -1) {
                list.splice(index, 1);
            }
            
            API.setCompanieInfo(interaction.user.id, company2.company_id, 'workers', list)
            DatabaseManager.set(member.id, 'players', 'company', null)
            DatabaseManager.set(member.id, 'players', 'companyact', null)
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            embed.fields = []
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria demitir ${member} 🡮 \`${member.tag}\` 🡮 \`${member.id}\` da empresa **${API.company.e[API.company.types[company.type]].icon} ${company.name}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: [] });
            return;
        });

	}
};