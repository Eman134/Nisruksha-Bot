const Discord = require('discord.js');
const config = require('../../_classes/config');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('expressão').setDescription('Coloque uma expressão de matemática para calcular').setRequired(true))

module.exports = {
    name: 'calcular',
    aliases: ['calc', 'calculate'],
    category: 'Outros',
    description: 'Facilite suas contas utilizando este comando',
    data,
    mastery: 10,
	async execute(interaction) {

                const args = interaction.options.getString('expressão');
        
        var happycalculator = require('happycalculator');

        try {
            var resultado = happycalculator.calculate(args.split('÷').join('/'));
            if (resultado.toString().includes(config.app.token)) {
                return interaction.reply({ components: [new TextDisplayBuilder().setContent('**Token do bot**: OdIcBaAzD2NzYxMSA3b2TOa4vca.Xvko_Q.A6F3EHwD3abV-Xabc_as9FEMm6eXD?')], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            let container
            if (resultado == null || !Number.isFinite(Number(resultado))) {
                container = new ContainerBuilder()
                    .setAccentColor(0x36393f)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent('Ao infinito, e além!'))
                    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: 'https://i.imgur.com/9EDKaRj.gif' } }));
                return interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            container = new ContainerBuilder()
                .setAccentColor(0x36393f)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Resultado: \`${resultado}\``))
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: 'https://media.tenor.com/images/c2f392370c8b20cc99d04148c7b6bebc/tenor.gif' } }));
            return interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
        } catch (error) {
            reportError(error, 'command.calcular');
            const errorContainer = new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nHouve um erro ao realizar o seu calculo! Tente novamente`));
            await interaction.reply({ components: [errorContainer], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        };

	}
};
