const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const config = require('../../_classes/config');
const prisma = require('../../_classes/prisma');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');

const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('status').setDescription('Selecione o status')
  .addChoices({ name: 'Comandos somente se o membro tiver no servidor oficial', value: '0' })
  .addChoices({ name: 'Uso liberado para qualquer membro', value: '1' })
  .addChoices({ name: 'Manutenção ligada', value: '2' })
.setRequired(true))
.addStringOption(option => option.setName('motivo').setDescription('Selecione um motivo para a manutenção').setRequired(true))

module.exports = {
    name: 'setgstatus',
    aliases: ['setargstatus', 'gstatus', 'setgs'],
    category: 'none',
    description: 'Modifica o status global do bot',
    data,
    perm: 5,
	async execute(interaction) {

        const status = parseInt(interaction.options.getString('status'));
        const motivo = interaction.options.getString('motivo');

        if (status == 2 && motivo == null) {
            const container = new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nVocê precisa especificar um motivo para a manutenção!\n\n**Exemplo de uso**\n\`/setgstatus 2 <motivo>\``));
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2})
            return;
        }

        let ob = {
            0: "Comandos somente se o membro tiver no servidor oficial",
            1: "Uso liberado para qualquer membro",
            2: "Manutenção ligada"
        }

        interaction.reply({ components: [new TextDisplayBuilder().setContent(`O status global do bot foi modificado para: \`${status}\` ${ob[status]}`)], flags: Discord.MessageFlags.IsComponentsV2 })

        const user_id = BigInt(config.app.id)
        await prisma.globals.upsert({ where: { user_id }, update: { status, man: motivo }, create: { user_id, status, man: motivo, keys: [], remember: [], processing: [] } })

	}
};
