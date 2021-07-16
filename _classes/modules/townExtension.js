const API = require("../api.js");

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
        'Massibi': ['roleta', 'flip'],
        'Tyris': ['roleta', 'flip']
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

})();

townExtension.getConfig = function() {
    return config
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
    const obj = await API.getInfo(member, 'players');
    if (obj.mvp != null || obj.mvp > 0) return 2
    else return 5
    /*
    let r
    if (obj.loc == 0) {
        r = API.random(1, 4);
        API.setInfo(member, 'towns', 'loc', r)
        API.townExtension.population[API.townExtension.getTownNameByNum(r)]++;
    } else {
        r = obj.loc;
    }

    const taxa = ((150+townExtension.population[API.townExtension.getTownNameByNum(r)])/75);
    return Math.round(taxa) <= 0 ? 1: Math.round(taxa);*/
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