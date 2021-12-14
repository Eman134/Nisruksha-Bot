const { SlashCommandBuilder } = require('@discordjs/builders');
const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('id-caixa').setDescription('Digite o id da caixa da sua mochila').setRequired(true))

module.exports = {
    name: 'recompensascaixa',
    aliases: ['recomcaixa', 'boxrewards', 'recc'],
    category: 'Players',
    description: 'Visualiza as recompensas de uma caixa misteriosa da sua mochila',
    data,
    mastery: 10,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const id = interaction.options.getInteger('id-caixa');

        const obj = await DatabaseManager.get(interaction.user.id, 'storage');

        if (obj[`crate:${id}`] == null || obj[`crate:${id}`] < 1 || obj[`crate:${id}`] == undefined) {
            const embedtemp = await API.sendError(interaction, `Você não possui uma caixa com este id!\nUtilize \`/mochila\` para visualizar suas caixas`, `recc 1`)
            await interaction.reply({ embeds: [embedtemp]})
			return;
        }

        const crateobj = API.crateExtension.obj[id.toString()]
        let rewardsmap = "Esta caixa possui recompensas randômicas... Nunca se sabe o que pode vir dela."

        if (typeof crateobj.rewards != 'string') {
            
            rewardsmap = API.crateExtension.obj[id.toString()].rewards.sort(function(a, b){
                return b.chance - a.chance;
            }).map(r => `${r.icon} ${r.name} - \`(Chance de ${r.chance}%)\``).join('\n');

        }
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#606060')
        .setDescription(`🏅 Recompensas disponíveis\n \n${rewardsmap}`)
        .setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        await interaction.reply({ embeds: [embed] });

	}
};