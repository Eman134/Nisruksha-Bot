const API = require("../api.js");

const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

const tp = {};

tp.get = async function (user_id) {
    
    const utilsobj = await DatabaseManager.get(user_id, 'players_utils')
    
    let invitejson = {
        code: String,
        qnt: Number,
        points: Number,
        usedinvite: Boolean
    }
    
    if (utilsobj.invite == null) {
    
        function randomString(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }
    
        let tempcode = randomString(6)
        if (await tp.check(tempcode)) {
            tempcode = randomString(6)
        }
    
        invitejson.code = tempcode
        invitejson.qnt = 0
        invitejson.points = 0
        invitejson.usedinvite = false
    
        DatabaseManager.set(user_id, 'players_utils', 'invite', invitejson)
    
    } else invitejson = utilsobj.invite
    
    return invitejson

}

tp.check = async function (code) {

    const text =  `SELECT * FROM players_utils WHERE invite IS NOT NULL;`
    const res = await DatabaseManager.query(text);
    const array = res.rows

    let exists = false

    let owner
    
    if (array.length <= 0) return exists
    
    for (i = 0; i < array.length; i++) {

        if (array[i].invite.code.toLowerCase() == code.toLowerCase()) {
            exists = true
            owner = array[i].user_id
            break;
        }
    }

    return {
        exists,
        owner
    }

}

tp.add = async function (user_id, po) {

  const invitejson1 = await tp.get(user_id)

  invitejson1.points += po

  DatabaseManager.set(user_id, 'players_utils', 'invite', invitejson1)
  
}

tp.remove = async function (user_id, po) {
  const invitejson1 = await tp.get(user_id)

  invitejson1.points -= po

  DatabaseManager.set(user_id, 'players_utils', 'invite', invitejson1)
}

tp.set = async function (user_id, po) {
    const invitejson1 = await tp.get(user_id)

    invitejson1.points = po
  
    DatabaseManager.set(user_id, 'players_utils', 'invite', invitejson1)
}

const bank = {};

bank.get = async function (user_id) {
    let { bank } = await DatabaseManager.get(user_id, "players");
    return bank;
}

bank.add = async function (user_id, money) {
    DatabaseManager.increment(user_id, "players", "bank", money);
}

bank.remove = async function (user_id, money) {
    DatabaseManager.increment(user_id, "players", "bank", -money);
}

bank.set = async function (user_id, money) {
    DatabaseManager.set(user_id, "players", "bank", parseInt(money));
}

const points = {};

points.get = async function (user_id) {
    let result
    let obj = await DatabaseManager.get(user_id, "players");
    result = obj["points"];
    return result;
}

points.add = async function (user_id, points) {
    DatabaseManager.increment(user_id, "players", "points", points);
}

points.remove = async function (user_id, points) {
    DatabaseManager.increment(user_id, "players", "points", -points);
}

points.set = async function (user_id, points) {
    DatabaseManager.set(user_id, "players", "points", points);
}

const money = {};

money.get = async function (user_id) {
    let { money } = await DatabaseManager.get(user_id, "players");
    return parseInt(money);
}

money.add = async function (user_id, money) {
    DatabaseManager.increment(user_id, "players", "money", money);
}
money.globaladd = async function (money) {
    API.eco.money.add(API.id, money)
}

money.remove = async function (user_id, money) {
    DatabaseManager.increment(user_id, "players", "money", -money);
}

money.globalremove = async function (money) {
    API.eco.money.remove(API.id, money)
}

money.set = async function (user_id, money) {
    await DatabaseManager.set(user_id, "players", "money", parseInt(Math.round(money)));
}

money.set = async function (user_id, points) {
    DatabaseManager.set(user_id, "players", "points", points);
}

const token = {};

token.get = async function (user_id) {
    //let result
    let { token } = await DatabaseManager.get(user_id, "players");
    //result = obj["money"];
    return token;
}

token.add = async function (user_id, token) {
    DatabaseManager.increment(user_id, "players", "token", token);
}

token.remove = async function (user_id, token) {
    DatabaseManager.increment(user_id, "players", "token", -token);
}

token.set = async function (user_id, token) {
    DatabaseManager.set(user_id, "players", "token", token);
}

const eco = {
    money,
    points,
    token,
    bank,
    tp
};

eco.getHistory = function (user_id, n) {

    const { readFileSync } = require('fs')
    let fpath = `./_localdata/profiles/${user_id}/history.yml`;
    eco.createHistoryDir(user_id);

    if (n) {
        return readFileSync(fpath, 'utf8').split('\n')[n];
    } else {
        let str = readFileSync(fpath, 'utf8').split('\n').slice(0, 5).join("\n");
        return str.replace(/<nl>/g , "\n");
    }
}

eco.createHistoryDir = function(user_id) {

    const fs = require('fs')
    let dir0 = `./_localdata/`;
    let dir = `./_localdata/profiles/`;
    let dir2 = `./_localdata/profiles/${user_id}/`;
    let fpath = `./_localdata/profiles/${user_id}/history.yml`;
    let strin = `\`${API.getFormatedDate()}\` Conta criada`
    if (!fs.existsSync(dir0)) { fs.mkdirSync(dir0);} 
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir);} 
    if (!fs.existsSync(dir2)) { fs.mkdirSync(dir2);} 
    if (!fs.existsSync(fpath)) {
        fs.writeFileSync(fpath, strin, (err) => {
            if (err) {
                API.client.emit('error', err)
                return console.log(`creating: [${err}]`)
            }
        })
        
    }
}

eco.addToHistory = async function (user_id, arg) {
    const insertLine = require('insert-line');

    eco.createHistoryDir(user_id);

    let fpath = `./_localdata/profiles/${user_id}/history.yml`;
    let content = `<t:${Math.round((Date.now())/1000)}:R> ${arg}`

    insertLine(fpath).content(content).at(1).then((err) => {
        if (err) {
            API.client.emit('error', err)
            return console.log(`inserting: [${err}]`)
        }
      })


}

module.exports = eco;