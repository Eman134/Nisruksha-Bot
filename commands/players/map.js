const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const eventsService = require('../../_classes/services/events');
const imagesService = require('../../_classes/services/images');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'mapa',
    aliases: ['map', 'local', 'loc', 'vilas'],
    category: 'Players',
    description: 'Visualiza o mapa do mundo, suas vilas e sua localização atual',
    mastery: 30,
	async execute(interaction) {

        const check = await playersService.cooldown.check(interaction.user.id, "map");
        if (check) {

            playersService.cooldown.message(interaction, 'map', 'visualizar o mapa')

            return;
        }

        playersService.cooldown.set(interaction.user.id, "map", 15);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando mapa` })

        const townname = await townsService.getTownName(interaction.user.id);
        const townnum = await townsService.getTownNumByName(townname);
        const pos = await townsService.getTownPos(interaction.user.id);
        const companies = await prisma.companies.count({ where: { loc: townnum } });
        const hasTreasure = (eventsService.treasure.loc != 0 && eventsService.treasure.picked == false)
        const hasDuck = (eventsService.duck.loc != 0 && eventsService.duck.killed == false)
        let content = `Você se localiza na vila **${townname}**\nPopulação: **${townsService.population[townname]} pessoas**\nEmpresas: **${companies}**\nJogos disponíveis na sua vila: **${townsService.games[await townsService.getTownName(interaction.user.id)].join(', ')}**.`
        
        if (hasTreasure) {
            content += "\n<:treasure:807671407160197141> Há um tesouro não explorado no mapa!\nPara pegá-lo utilize `/pegartesouro`"
        }
        if (hasDuck) {
            content += "\n<:pato:919946658941399091> Há um pato dourado vivo no mapa!\nPara matá-lo utilize `/patodourado`"
        }

        const mapimage = await imagesService.imagegens.get('map.js')({

            pos,
            url: {
                avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
            },
            treasure: {
                has: hasTreasure,
                pos: eventsService.treasure.pos
            },
            duck: {
                has: hasDuck,
                pos: eventsService.duck.pos
            }

        })

        await interaction.editReply({ content, files: [mapimage] } );
        
	}
};
