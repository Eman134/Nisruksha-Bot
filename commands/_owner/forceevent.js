const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('evento').setDescription('Evento')
    .addChoice('CORRIDA', 'RACE')
    .addChoice('TESOURO', 'TREASURE')
    .addChoice('PATO', 'DUCK')
    .setRequired(true))
.addBooleanOption(option => option.setName('vila-atual').setDescription('Se o tesouro será aleatório ou na sua vila atual').setRequired(false))

module.exports = {
    requiredServices: ["events","townExtension"],
    name: 'forçarevento',
    aliases: ['forcetreasure'],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(interaction, svcEvents, svcTownExtension) {

        const loc = interaction.options.getBoolean('vila-atual')
        const evento = interaction.options.getString('evento')
        await interaction.reply({ content: `Evento ${evento} executado!`})
        if(loc){
            var townnum = await svcTownExtension.getTownNum(interaction.user.id)
        }
        const town = townnum == null ? undefined : townnum
        switch (evento) {
            case 'TREASURE':
                svcEvents.forceTreasure(town)
                break;
            case 'RACE':
                svcEvents.forceRace()
                break;
            case 'DUCK':
                svcEvents.forceDuck(town)
                break;
        }

    }
}