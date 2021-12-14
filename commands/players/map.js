const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

module.exports = {
    name: 'mapa',
    aliases: ['map', 'local', 'loc', 'vilas'],
    category: 'Players',
    description: 'Visualiza o mapa do mundo, suas vilas e sua localização atual',
    mastery: 30,
	async execute(API, interaction) {

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "map");
        if (check) {

            API.playerUtils.cooldown.message(interaction, 'map', 'visualizar o mapa')

            return;
        }

        API.playerUtils.cooldown.set(interaction.user.id, "map", 15);

        await interaction.reply({ content: `<a:loading:736625632808796250> Carregando mapa` })

        const townname = await API.townExtension.getTownName(interaction.user.id);
        const townnum = await API.townExtension.getTownNumByName(townname);
        const pos = await API.townExtension.getTownPos(interaction.user.id);
        const res = await DatabaseManager.query('SELECT * FROM companies WHERE loc=$1', [townnum]);
        const hasTreasure = (API.events.treasure.loc != 0 && API.events.treasure.picked == false)
        const hasDuck = (API.events.duck.loc != 0 && API.events.duck.killed == false)
        let content = `Você se localiza na vila **${townname}**\nPopulação: **${API.townExtension.population[townname]} pessoas**\nEmpresas: **${res.rows.length}**\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(interaction.user.id)].join(', ')}**.`
        
        if (hasTreasure) {
            content += "\n<:treasure:807671407160197141> Há um tesouro não explorado no mapa!\nPara pegá-lo utilize `/pegartesouro`"
        }
        if (hasDuck) {
            content += "\n<:pato:919946658941399091> Há um pato dourado vivo no mapa!\nPara matá-lo utilize `/patodourado`"
        }

        const mapimage = await API.img.imagegens.get('map.js')(API, {

            pos,
            url: {
                avatar: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
            },
            treasure: {
                has: hasTreasure,
                pos: API.events.treasure.pos
            },
            duck: {
                has: hasDuck,
                pos: API.events.duck.pos
            }

        })

        await interaction.editReply({ content, files: [mapimage] } );
        
	}
};