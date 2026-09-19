const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const errorContainer = (interaction, message, usage) => new ContainerBuilder()
    .setAccentColor(0xb8312c)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`));
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('bio').setDescription('Escreva uma pequena biografia sobre você').setRequired(true))

const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'sobremim',
    aliases: ['biografia', 'biography', 'sobre', 'bio', 'sobre-mim'],
    category: 'Social',
    description: 'Defina a sua biografia que aparece no perfil',
    data,
    mastery: 5,
	async execute(interaction) {
        
        let bio = interaction.options.getString('bio');

        if (bio.length > 50) {
            await interaction.reply({ components: [errorContainer(interaction, 'Você não pode colocar um sobre com mais de 50 caracteres\nQuantia de caracteres da sua biografia: ' + bio.length + '/50', 'sobremim <texto>')], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        const user_id = BigInt(interaction.user.id)
        await prisma.players.upsert({ where: { user_id }, update: { bio }, create: { user_id, bio, frames: [], badges: [] } })
		const container = new ContainerBuilder()
	    .setAccentColor(0x8adb5e)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Sua biografia foi definida para:
        \`\`\`${bio}\`\`\``),
            new TextDisplayBuilder().setContent('-# Quantia de caracteres da sua biografia: ' + bio.length + '/50')
        );
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
