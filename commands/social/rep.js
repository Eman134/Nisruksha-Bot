const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja dar a reputação').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'rep',
    aliases: ['addrep'],
    category: 'Social',
    description: 'Dê uma reputação a um amigo',
    data,
    mastery: 5,
    async execute(API, interaction) {
        
        let member = interaction.options.getUser('membro') || interaction.user

        if (member.id == interaction.user.id) {
            const embedtemp = await API.sendError(interaction, 'Você precisa mencionar outra pessoa para dar reputação', 'rep @membro')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "rep");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'rep', 'dar outra reputação')

            return;
        }

        let cmaq = await API.maqExtension.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await API.sendError(interaction, `Você precisa ter no mínimo a ${API.shopExtension.getProduct(102).icon} ${API.shopExtension.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
        
        API.playerUtils.cooldown.set(interaction.user.id, "rep", 43200)

        DatabaseManager.increment(member.id, "players", "reps", 1)

        await interaction.reply({ content: 'Você deu **+1 REP** para **' + member.tag + '**!' })

    },
};