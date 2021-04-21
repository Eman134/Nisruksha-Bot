const API = require("../api.js");
const conf = require("../../_classes/config");
const config = conf.modules.townExtension

const townExtension = {

    population: {
        'Nishigami': 0,
        'Harotec': 0,
        'Massibi': 0,
        'Tyris': 0
    },
    games: {
        'Nishigami': ['roleta', 'flip'],
        'Harotec': ['roleta', 'flip'],
        'Massibi': ['roleta', 'flip'],
        'Tyris': ['roleta', 'flip']
    },
    treasure: {
        loc: 0,
        update: 5,
        profundidade: 0,
        pos: {},
        picked: false
    }

};

(async () => {
    const text =  `SELECT * FROM towns;`;
    let array = [];
    try {
        let res = await API.db.pool.query(text);
        array = res.rows;
    } catch (err) {
        console.log(err.stack)
    }

    for (const r of array) {
        if (!(r.user_id == undefined)) {
            if (r.user_id != null) {
                if (r.user_id != 0) {
                    if (!(r.loc == 0)) {
                        townExtension.population[townExtension.getTownNameByNum(r.loc)]++;
                    }
                }
            }
        }
    }

    let intervalTreasure = (API.random(config.treasure.minInterval, config.treasure.maxInterval))*60*1000
    
    setInterval(async () => {
        
        townExtension.forceTreasure()

    }, intervalTreasure);

})();

townExtension.getConfig = function() {
    return config
}

townExtension.forceTreasure = async function() {
    const embed = new API.Discord.MessageEmbed()
    embed.setColor('RANDOM')
    embed.setTitle("Siga este canal em seu servidor para avisos de tesouros")
    embed.setDescription("<:treasure:807671407160197141> **Um novo tesouro foi descoberto! Procure-o pelas vilas e seja o primeiro a pegá-lo**\nUtilize `" + API.prefix + "mapa` e `" + API.prefix + "pegartesouro` respectivamente para procurar e pegar o tesouro.\nA cotação pode ter sofrido ajustes pelo tesouro!")

    townExtension.treasure.loc = API.random(1, 4)
    const treasurepos = await API.townExtension.getPosByTownNum(townExtension.treasure.loc);
    townExtension.treasure.pos = treasurepos
    townExtension.treasure.profundidade = API.random(15, 45)
    townExtension.treasure.picked = false
    const channel = API.client.channels.cache.get(config.treasure.channel)
    await channel.bulkDelete(20).catch()
    await channel.send(embed).then((embedmsg) => {
		if (channel.type == 'news') embedmsg.crosspost()
	})
    return "Enviado com sucesso para " + config.treasure.channel
}

townExtension.getTownNum = async function(member) {
    const obj = await API.getInfo(member, 'towns');
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        API.setInfo(member, 'towns', 'loc', r)
        API.townExtension.population[API.townExtension.getTownNameByNum(r)]++;
    } else {
        r = obj.loc;
    }

    return r;
}

townExtension.getPosByTownNum = async function(town) {
    const obj = {}
    switch (town) {
        case 1:
            obj.x = API.random(70, 130);
            obj.y = API.random(15, 40);
            break;
        case 2:
            obj.x = API.random(1580, 1650);
            obj.y = API.random(60, 90);
            break;
        case 3:
            obj.x = API.random(1100, 1150);
            obj.y = API.random(1120, 1150);
            break;
        case 4:
            obj.x = API.random(350, 400);
            obj.y = API.random(840, 860)
            break;
    }
    return obj;
}

townExtension.getTownPos = async function(member) {
    const town = await townExtension.getTownNum(member);
    const obj = await townExtension.getPosByTownNum(town)
    return obj;
}

townExtension.getTownName = async function(member) {
    const obj = await API.getInfo(member, 'towns');
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        API.setInfo(member, 'towns', 'loc', r)
        API.townExtension.population[API.townExtension.getTownNameByNum(r)]++;
    } else {
        r = obj.loc;
    }

    const name = {
        1: 'Nishigami',
        2: 'Harotec',
        3: 'Massibi',
        4: 'Tyris'
    }
    return name[r];
}

townExtension.getTownTax = async function(member) {
    const obj = await API.getInfo(member, 'towns');
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        API.setInfo(member, 'towns', 'loc', r)
        API.townExtension.population[API.townExtension.getTownNameByNum(r)]++;
    } else {
        r = obj.loc;
    }

    const taxa = ((150+townExtension.population[API.townExtension.getTownNameByNum(r)])/65);
    return Math.round(taxa) <= 0 ? 1: Math.round(taxa);
}

townExtension.getTownNameByNum = function(r) {
    const name = {
        1: 'Nishigami',
        2: 'Harotec',
        3: 'Massibi',
        4: 'Tyris'
    }
    return name[r];
}

townExtension.getTownNumByName = function(name) {

    let id = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let num;
    switch (id) {
        case 'nishigami':
            num = 1;
            break;
        case 'harotec':
            num = 2;
            break;
        case 'massibi':
            num = 3;
            break;
        case 'tyris':
            num = 4;
            break;
        default:
            num = 0;
            break;
    }
    return num;
}

module.exports = townExtension;