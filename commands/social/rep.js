const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
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
    async execute(interaction) {
        
        let member = interaction.options.getUser('membro') || interaction.user

        if (member.id == interaction.user.id) {
            const embedtemp = await utility.sendError(interaction, 'Você precisa mencionar outra pessoa para dar reputação', 'rep @membro')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const check = await playersService.cooldown.check(interaction.user.id, "rep");
        if (check) {

            playersService.cooldown.message(interaction, 'rep', 'dar outra reputação')

            return;
        }

        let cmaq = await machinesService.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await utility.sendError(interaction, `Você precisa ter no mínimo a ${shopService.getProduct(102).icon} ${shopService.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
        
        playersService.cooldown.set(interaction.user.id, "rep", 43200)

        DatabaseManager.increment(member.id, "players", "reps", 1)

        await interaction.reply({ content: 'Você deu **+1 REP** para **' + member.tag + '**!' })

    },
};