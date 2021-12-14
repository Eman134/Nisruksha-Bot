const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('bio').setDescription('Escreva uma pequena biografia sobre você').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'sobremim',
    aliases: ['biografia', 'biography', 'sobre', 'bio', 'sobre-mim'],
    category: 'Social',
    description: 'Defina a sua biografia que aparece no perfil',
    data,
    mastery: 5,
	async execute(API, interaction) {
        const Discord = API.Discord;

        let bio = interaction.options.getString('bio');

        if (bio.length > 50) {
            const embedtemp = await API.sendError(interaction, 'Você não pode colocar um sobre com mais de 50 caracteres\nQuantia de caracteres da sua biografia: ' + bio.length + '/50', 'sobremim <texto>')
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        DatabaseManager.set(interaction.user.id, "players", "bio", bio)
		const embed = new Discord.MessageEmbed()
	    .setColor('#8adb5e')
        .setDescription(`Sua biografia foi definida para:
        \`\`\`${bio}\`\`\``)
        .setFooter('Quantia de caracteres da sua biografia: ' + bio.length + '/50')
        await interaction.reply({ embeds: [embed] });

	}
};