const API = require("../../_classes/api");

let bg

loadbg()

async function loadbg() {
    bg = await API.img.loadImage(`resources/backgrounds/map/map.jpg`)
}

module.exports = {
    name: 'mapa',
    aliases: ['map', 'local', 'loc', 'vilas'],
    category: 'Players',
    description: 'Visualiza o mapa do mundo, suas vilas e sua localização atual',
    mastery: 30,
	async execute(API, msg) {

        const check = await API.playerUtils.cooldown.check(msg.author, "map");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'map', 'visualizar o mapa')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "map", 60);

        let todel = await msg.quote({ content: `<a:loading:736625632808796250> Carregando mapa` })

        let background = bg

        // Mark
        let mark = await API.img.loadImage(`resources/backgrounds/map/mark.png`)
        mark = await API.img.resize(mark, 250, 250)
        let pos = await API.townExtension.getTownPos(msg.author);
        background = await API.img.drawImage(background, mark, pos.x, pos.y)

        // Avatar
        let avatar = await API.img.loadImage(msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }));
        avatar = await API.img.resize(avatar, 98, 98);
        avatar = await API.img.editBorder(avatar, 49, true)
        background = await API.img.drawImage(background, avatar, pos.x + 77, pos.y + 51)

        // Tesouro
        let tmsg = "\n<:treasure:807671407160197141> Há um tesouro não explorado na sua vila atual!\nPara pegá-lo utilize `" + API.prefix + "pegartesouro`"
        if (API.events.treasure.loc != 0 && API.events.treasure.picked == false) {
            let treasurepos = API.events.treasure.pos
            let treasureicon = await API.img.loadImage(`resources/backgrounds/map/treasure.png`)
            background = await API.img.drawImage(background, treasureicon, treasurepos.x + 75, treasurepos.y + 150)
        }

        background = await API.img.resize(background, 1024, 768);
        let townname = await API.townExtension.getTownName(msg.author);
        let townnum = await API.townExtension.getTownNumByName(townname);
        let res
        try {
            res = await API.db.pool.query('SELECT * FROM companies WHERE loc=$1', [townnum]);
            res = res.rows
        } catch (err) {
            API.client.emit('error', err)
        }

        try {
            await API.img.sendImage(msg.channel, background, msg.id, `${msg.author}\nVocê se localiza na vila **${townname}**\nPopulação: **${API.townExtension.population[townname]} pessoas**\nEmpresas: **${res.length}**\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}**.`);
            await todel.delete();
        }catch{}
        
	}
};