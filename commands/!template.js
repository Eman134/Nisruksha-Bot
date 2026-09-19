const Discord = require('../_classes/discordCompat');
const UtilityService = require('../_classes/services/utilityService');
const utility = new UtilityService();
const companyService = require('../_classes/services/company');
const { reportError } = require('../_classes/debug');

module.exports = {
    name: 'template',
    aliases: [],
    category: 'none',
    description: 'none',
	async execute(interaction) {

                
		const embed = new Discord.MessageEmbed()
		.setDescription(`**Reaja com os itens abaixo p/ interação**\n \n👨🏽‍🌾 Tipos de Empresas\n \n📃 Empresas Existentes`, ``)

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            embed.fields = [];
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'template.defer_update'); });
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Currículo cancelado', `
                Você cancelou o envio de currículo para a empresa **${company.name}**.`)
                interaction.editReply({ embeds: [embed] });
                return;
            }

            embed.setColor('#5bff45');
            embed.addField('✅ Currículo enviado', `
            Você enviou o currículo para a empresa **${company.name}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`)
            interaction.editReply({ embeds: [embed] });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria enviar o currículo para a empresa **${companyService.e[companyService.types[1]].icon}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed] });
            return;
        });

	}
};
