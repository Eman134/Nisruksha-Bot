const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja dar a reputação').setRequired(true))

const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["maqExtension","playerUtils","sendError","shopExtension"],
    name: 'rep',
    aliases: ['addrep'],
    category: 'Social',
    description: 'Dê uma reputação a um amigo',
    data,
    mastery: 5,
    async execute(interaction, svcMaqExtension, svcPlayerUtils, svcSendError, svcShopExtension) {
        
        let member = interaction.options.getUser('membro') || interaction.user

        if (member.id == interaction.user.id) {
            const embedtemp = await svcSendError(interaction, 'Você precisa mencionar outra pessoa para dar reputação', 'rep @membro')
            await interaction.reply({ embeds: [embedtemp]})
            return
        }

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "rep");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'rep', 'dar outra reputação')

            return;
        }

        let cmaq = await svcMaqExtension.get(interaction.user.id)

        if (cmaq < 102) {
            const embedtemp = await svcSendError(interaction, `Você precisa ter no mínimo a ${svcShopExtension.getProduct(102).icon} ${svcShopExtension.getProduct(102).name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
        
        svcPlayerUtils.cooldown.set(interaction.user.id, "rep", 43200)

        DatabaseManager.increment(member.id, "players", "reps", 1)

        await interaction.reply({ content: 'Você deu **+1 REP** para **' + member.tag + '**!' })

    },
};