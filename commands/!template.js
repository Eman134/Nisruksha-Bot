const { reportError } = require('../_classes/debug');

module.exports = {
    requiredServices: ["Discord","company","createButton","rowComponents"],
    name: 'template',
    aliases: [],
    category: 'none',
    description: 'none',
	async execute(interaction, svcDiscord, svcCompany, svcCreateButton, svcRowComponents) {        
		const embed = new svcDiscord.MessageEmbed()
		.setDescription(`**Reaja com os itens abaixo p/ interação**\n \n👨🏽‍🌾 Tipos de Empresas\n \n📃 Empresas Existentes`, ``)

        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

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
            const embed = new svcDiscord.MessageEmbed();
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `Você iria enviar o currículo para a empresa **${svcCompany.e[svcCompany.types[1]].icon}**, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed] });
            return;
        });

	}
};
