const API = require("../api.js");

const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

const townExtension = {

    population: {
        'Nishigami': 0,
        'Harotec': 0,
        'Massibi': 0,
        'Tyris': 0
    },
    games: {
        'Nishigami': ['roleta', 'flip', 'luckycards'],
        'Harotec': ['roleta', 'flip', 'luckycards'],
        'Massibi': ['roleta', 'flip', 'blackjack'],
        'Tyris': ['roleta', 'flip', 'blackjack']
    }

};

(async () => {
    const text =  `SELECT * FROM towns;`;
    const res = await DatabaseManager.query(text);
    let array = res.rows;

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

})();

townExtension.getConfig = function() {
    return config
}

townExtension.getTownNum = async function(user_id) {
    const obj = await DatabaseManager.get(user_id, 'towns');
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        DatabaseManager.set(user_id, 'towns', 'loc', r)
        townExtension.population[townExtension.getTownNameByNum(r)]++;
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

townExtension.getTownPos = async function(user_id) {
    const town = await townExtension.getTownNum(user_id);
    const obj = await townExtension.getPosByTownNum(town)
    return obj;
}

townExtension.getTownName = async function(user_id) {
    const obj = await DatabaseManager.get(user_id, 'towns');
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        DatabaseManager.set(user_id, 'towns', 'loc', r)
        townExtension.population[townExtension.getTownNameByNum(r)]++;
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

townExtension.getTownTax = async function(user_id) {
    const obj = await DatabaseManager.get(user_id, 'players');
    if (obj.mvp != null || obj.mvp > 0) return 2
    else return 5
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