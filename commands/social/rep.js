const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const playersService = require('../../_classes/services/players');
const machinesService = require('../../_classes/services/machines');
const shopService = require('../../_classes/services/shop');
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addUserOption(option => option.setName('membro').setDescription('Mencione o membro que deseja dar a reputação').setRequired(true))

const prisma = require('../../_classes/prisma');

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
            const product = await shopService.getProduct(102);
            const embedtemp = await utility.sendError(interaction, `Você precisa ter no mínimo a ${product.icon} ${product.name} para dar rep á alguém!`)
            await interaction.reply({ embeds: [embedtemp]})
            return
        }
        
        playersService.cooldown.set(interaction.user.id, "rep", 43200)

        const user_id = BigInt(member.id)
        await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        await prisma.players.update({ where: { user_id }, data: { reps: { increment: BigInt(1) } } })

        await interaction.reply({ content: 'Você deu **+1 REP** para **' + member.tag + '**!' })

    },
};
