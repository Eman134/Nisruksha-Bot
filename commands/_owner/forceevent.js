const townsService = require('../../_classes/services/towns');
const eventsService = require('../../_classes/services/events');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('evento').setDescription('Evento')
    .addChoices(
        { name: 'CORRIDA', value: 'RACE' },
        { name: 'TESOURO', value: 'TREASURE' },
        { name: 'PATO', value: 'DUCK' }
    )
    .setRequired(true))
.addBooleanOption(option => option.setName('vila-atual').setDescription('Se o tesouro será aleatório ou na sua vila atual').setRequired(false))

module.exports = {
    name: 'forçarevento',
    aliases: ['forcetreasure'],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(interaction) {

        const loc = interaction.options.getBoolean('vila-atual')
        const evento = interaction.options.getString('evento')
        await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Evento ${evento} executado!`)], flags: Discord.MessageFlags.IsComponentsV2 })
        if(loc){
            var townnum = await townsService.getTownNum(interaction.user.id)
        }
        const town = townnum == null ? undefined : townnum
        switch (evento) {
            case 'TREASURE':
                eventsService.forceTreasure(town)
                break;
            case 'RACE':
                eventsService.forceRace()
                break;
            case 'DUCK':
                eventsService.forceDuck(town)
                break;
        }

    }
}
