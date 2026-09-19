const playersService = require('../../_classes/services/players');
const clientService = require('../../_classes/services/clientService');
const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const prisma = require('../../_classes/prisma');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Veja os cooldowns ativos de um membro'))

module.exports = {
    name: 'cooldowns',
    aliases: ['cd'],
    category: 'Outros',
    description: 'Visualize todos os cooldowns ativos',
    data,
    mastery: 25,
	async execute(interaction) {

        let member = interaction.options.getUser('membro') || interaction.user

        let filtered = []

        let blacklist = [ 'daily2' ]

        try {
            const columns = prisma._runtimeDataModel.models.cooldowns.fields.map((field) => field.name);

            for (const column of columns.filter((name) => name !== 'user_id')) {
                const cd = await playersService.cooldown.check(member.id, column)
                if (cd) {
                    const cd2 = await playersService.cooldown.get(member.id, column)
                    if (!blacklist.includes(column)) {
                        filtered.push( {
                            name: column,
                            time: cd2
                        })
                    }
                }
            }

        } catch (err) {
            clientService.current.emit('error', err)
        }

        const description = filtered.length > 0
            ? filtered.map((i) => `${i.name} <:arrow:737370913204600853> \`${utility.ms(i.time, true)}\``).join('\n')
            : 'Não possui nenhum cooldown ativo!';
        const container = new ContainerBuilder()
            .setAccentColor(0x4ae8ac)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `## ⏰ Lista de cooldowns ativos`,
                `**${member.tag}**`,
                description
            ].join('\n\n')));
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
