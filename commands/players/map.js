const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    requiredServices: ["events","img","playerUtils","townExtension"],
    name: 'mapa',
    aliases: ['map', 'local', 'loc', 'vilas'],
    category: 'Players',
    description: 'Visualiza o mapa do mundo, suas vilas e sua localização atual',
    mastery: 30,
	async execute(interaction, svcEvents, svcImg, svcPlayerUtils, svcTownExtension) {

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "map");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'map', 'visualizar o mapa')

            return;
        }

        svcPlayerUtils.cooldown.set(interaction.user.id, "map", 15);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando mapa` })

        const townname = await svcTownExtension.getTownName(interaction.user.id);
        const townnum = await svcTownExtension.getTownNumByName(townname);
        const pos = await svcTownExtension.getTownPos(interaction.user.id);
        const companies = await DatabaseManager.findMany('companies', { loc: townnum });
        const hasTreasure = (svcEvents.treasure.loc != 0 && svcEvents.treasure.picked == false)
        const hasDuck = (svcEvents.duck.loc != 0 && svcEvents.duck.killed == false)
        let content = `Você se localiza na vila **${townname}**\nPopulação: **${svcTownExtension.population[townname]} pessoas**\nEmpresas: **${companies.length}**\nJogos disponíveis na sua vila: **${svcTownExtension.games[await svcTownExtension.getTownName(interaction.user.id)].join(', ')}**.`
        
        if (hasTreasure) {
            content += "\n<:treasure:807671407160197141> Há um tesouro não explorado no mapa!\nPara pegá-lo utilize `/pegartesouro`"
        }
        if (hasDuck) {
            content += "\n<:pato:919946658941399091> Há um pato dourado vivo no mapa!\nPara matá-lo utilize `/patodourado`"
        }

        const mapimage = await svcImg.imagegens.get('map.js')(dependencies, {

            pos,
            url: {
                avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
            },
            treasure: {
                has: hasTreasure,
                pos: svcEvents.treasure.pos
            },
            duck: {
                has: hasDuck,
                pos: svcEvents.duck.pos
            }

        })

        await interaction.editReply({ content, files: [mapimage] } );
        
	}
};
