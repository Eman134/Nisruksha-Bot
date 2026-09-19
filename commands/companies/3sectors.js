const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const clientService = require('../../_classes/services/clientService');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'setores',
    aliases: ['sectors'],
    category: 'Empresas',
    description: 'Visualiza os setores de empresas e os comandos de cada um',
    mastery: 30,
    async execute(interaction) {
        let current = 'home';
        let components = [];

        function buildContainer() {
            if (current === 'home') {
                const fields = [];
                for (const name of Object.keys(companyService.e)) {
                    const sector = companyService.e[name];
                    if (sector.description) fields.push(`**${sector.icon} ${name.charAt(0).toUpperCase() + name.slice(1)}**\n${sector.description}`);
                }
                return new ContainerBuilder()
                    .setAccentColor(0x03d7fc)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('## 👨🏽‍🌾 | Setores de Empresas'),
                        ...fields.map(field => new TextDisplayBuilder().setContent(field))
                    );
            }

            const type = parseInt(current);
            const cmdlist = clientService.current.commands.filter(cmd => cmd.companytype === type);
            const description = cmdlist.map(cmd => `\`/${cmd.name}\` <:arrow:737370913204600853> ${cmd.description}${!cmd.aliases || cmd.aliases.length < 1 ? '' : `\n › Alcunhas: [\`${cmd.aliases.slice(0, 5).join(', ')}\`]`}\n`).join('\n');
            return new ContainerBuilder()
                .setAccentColor(0x03d7fc)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## <:info:736274028515295262> Comandos de ${companyService.types[type]} ${companyService.e[companyService.types[type]].icon}`),
                    new TextDisplayBuilder().setContent(description || 'Nenhum comando disponível.')
                );
        }

        function reworkButtons(allDisabled = false) {
            const buttonList = [utility.createButton('home', 'PRIMARY', 'Início', '🏠', current === 'home' || allDisabled)];
            for (const name of Object.keys(companyService.e)) {
                const sector = companyService.e[name];
                if (sector.description) buttonList.push(utility.createButton(sector.tipo.toString(), current === sector.tipo.toString() ? 'SUCCESS' : 'SECONDARY', '', sector.icon.split(':')[2] ? sector.icon.split(':')[2].replace('>', '') : sector.icon, current === sector.tipo.toString() || allDisabled));
            }
            components = [];
            for (let index = 0; index < buttonList.length; index += 5) {
                components.push(new ActionRowBuilder().addComponents(...buttonList.slice(index, index + 5)));
            }
        }

        reworkButtons();
        const message = (await interaction.reply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async b => {
            if (b.user.id !== interaction.user.id) return;
            current = b.customId;
            reworkButtons();
            await interaction.editReply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 });
            collector.resetTimer();
            if (!b.deferred) b.deferUpdate().catch(error => { throw reportError(error, 'command.setores.defer_update'); });
        });

        collector.on('end', () => {
            reworkButtons(true);
            interaction.editReply({ components: [buildContainer(), ...components], flags: Discord.MessageFlags.IsComponentsV2 });
        });
    }
};
