const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('evento').setDescription('Evento')
    .addChoice('CORRIDA', 'RACE')
    .addChoice('TESOURO', 'TREASURE')
    .addChoice('PATO', 'DUCK')
    .setRequired(true))
.addBooleanOption(option => option.setName('vila-atual').setDescription('Se o tesouro será aleatório ou na sua vila atual').setRequired(false))

module.exports = {
    name: 'forçarevento',
    aliases: ['forcetreasure'],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(API, interaction) {

        const loc = interaction.options.getBoolean('vila-atual')
        const evento = interaction.options.getString('evento')
        await interaction.reply({ content: `Evento ${evento} executado!`})
        if(loc){
            var townnum = await API.townExtension.getTownNum(interaction.user.id)
        }
        const town = townnum == null ? undefined : townnum
        switch (evento) {
            case 'TREASURE':
                API.events.forceTreasure(town)
                break;
            case 'RACE':
                API.events.forceRace()
                break;
            case 'DUCK':
                API.events.forceDuck(town)
                break;
        }

    }
}