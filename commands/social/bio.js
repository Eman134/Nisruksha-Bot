const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
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
            const embedtemp = await utility.sendError(interaction, 'Você não pode colocar um sobre com mais de 50 caracteres\nQuantia de caracteres da sua biografia: ' + bio.length + '/50', 'sobremim <texto>')
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const user_id = BigInt(interaction.user.id)
        await prisma.players.upsert({ where: { user_id }, update: { bio }, create: { user_id, bio, frames: [], badges: [] } })
		const embed = new Discord.EmbedBuilder()
	    .setColor('#8adb5e')
        .setDescription(`Sua biografia foi definida para:
        \`\`\`${bio}\`\`\``)
        .setFooter({ text: 'Quantia de caracteres da sua biografia: ' + bio.length + '/50' })
        await interaction.reply({ embeds: [embed] });

	}
};
