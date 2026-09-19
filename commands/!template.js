const Discord = require('discord.js');
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

                
        const container = new Discord.ContainerBuilder()
            .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent('**Reaja com os itens abaixo p/ interação**\n\n👨🏽‍🌾 Tipos de Empresas\n\n📃 Empresas Existentes'));

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [container, utility.rowComponents([btn0, btn1])], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'template.defer_update'); });
            if (b.customId == 'cancel'){
                const container = new Discord.ContainerBuilder().setAccentColor(0xa60000)
                    .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(`## ❌ Currículo cancelado\nVocê cancelou o envio de currículo para a empresa **${company.name}**.`));
                interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            const container = new Discord.ContainerBuilder().setAccentColor(0x5bff45)
                .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(`## ✅ Currículo enviado\nVocê enviou o currículo para a empresa **${company.name}**!\nAguarde uma resposta da empresa.\nOBS: Para receber uma resposta você deve manter sua DM liberada.`));
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const container = new Discord.ContainerBuilder().setAccentColor(0xa60000)
                .addTextDisplayComponents(new Discord.TextDisplayBuilder().setContent(`## ❌ Tempo expirado\nVocê iria enviar o currículo para a empresa **${companyService.e[companyService.types[1]].icon}**, porém o tempo expirou.`));
            interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
