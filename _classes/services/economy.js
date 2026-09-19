const prisma = require('../prisma');
const config = require('../config');
const clientService = require('./clientService');
const UtilityService = require('./utilityService');

class EconomyService {
constructor() {
const client = clientService.current;
const utility = new UtilityService();
const id = config.app.id;
const getPlayers = (user_id, select) => {
    const key = BigInt(user_id);
    return prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] }, ...(select ? { select } : {}) });
};
const getPlayersUtils = (user_id) => {
    const key = BigInt(user_id);
    return prisma.players_utils.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key }, select: { invite: true } });
};
const updatePlayers = async (user_id, data) => {
    await getPlayers(user_id, { user_id: true });
    return prisma.players.update({ where: { user_id: BigInt(user_id) }, data });
};
const tp = {};

tp.get = async function (user_id) {
    
    const key = BigInt(user_id);
    const utilsobj = await getPlayersUtils(user_id)
    
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
    
        await prisma.players_utils.update({ where: { user_id: key }, data: { invite: invitejson } })
    
    } else invitejson = utilsobj.invite
    
    return invitejson

}

tp.check = async function (code) {

    const array = await prisma.players_utils.findMany({ where: { invite: { not: null } }, select: { user_id: true, invite: true } });

    let exists = false

    let owner
    
    if (array.length <= 0) return exists
    
    for (i = 0; i < array.length; i++) {

        if (array[i].invite.code.toLowerCase() == code.toLowerCase()) {
            exists = true
            owner = String(array[i].user_id)
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

  await prisma.players_utils.update({ where: { user_id: BigInt(user_id) }, data: { invite: invitejson1 } })
  
}

tp.remove = async function (user_id, po) {
  const invitejson1 = await tp.get(user_id)

  invitejson1.points -= po

  await prisma.players_utils.update({ where: { user_id: BigInt(user_id) }, data: { invite: invitejson1 } })
}

tp.set = async function (user_id, po) {
    const invitejson1 = await tp.get(user_id)

    invitejson1.points = po
  
    await prisma.players_utils.update({ where: { user_id: BigInt(user_id) }, data: { invite: invitejson1 } })
}

const bank = {};

bank.get = async function (user_id) {
    let { bank } = await getPlayers(user_id, { bank: true });
    return bank;
}

bank.add = async function (user_id, money) {
    await updatePlayers(user_id, { bank: { increment: money } });
}

bank.remove = async function (user_id, money) {
    await updatePlayers(user_id, { bank: { increment: -money } });
}

bank.set = async function (user_id, money) {
    await updatePlayers(user_id, { bank: parseInt(money) });
}

const points = {};

points.get = async function (user_id) {
    let result
    let obj = await getPlayers(user_id, { points: true });
    result = obj["points"];
    return result;
}

points.add = async function (user_id, points) {
    await updatePlayers(user_id, { points: { increment: points } });
}

points.remove = async function (user_id, points) {
    await updatePlayers(user_id, { points: { increment: -points } });
}

points.set = async function (user_id, points) {
    await updatePlayers(user_id, { points });
}

const money = {};

money.get = async function (user_id) {
    let { money } = await getPlayers(user_id, { money: true });
    return parseInt(money);
}

money.add = async function (user_id, money) {
    await updatePlayers(user_id, { money: { increment: money } });
}
money.globaladd = async function (amount) {
    money.add(id, amount)
}

money.remove = async function (user_id, money) {
    await updatePlayers(user_id, { money: { increment: -money } });
}

money.globalremove = async function (amount) {
    money.remove(id, amount)
}

money.set = async function (user_id, money) {
    await updatePlayers(user_id, { money: parseInt(Math.round(money)) });
}

money.set = async function (user_id, points) {
    await updatePlayers(user_id, { points });
}

const token = {};

token.get = async function (user_id) {
    //let result
    let { token } = await getPlayers(user_id, { token: true });
    //result = obj["money"];
    return token;
}

token.add = async function (user_id, token) {
    await updatePlayers(user_id, { token: { increment: token } });
}

token.remove = async function (user_id, token) {
    await updatePlayers(user_id, { token: { increment: -token } });
}

token.set = async function (user_id, token) {
    await updatePlayers(user_id, { token });
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
    let strin = `\`${utility.getFormatedDate()}\` Conta criada`
    if (!fs.existsSync(dir0)) { fs.mkdirSync(dir0);} 
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir);} 
    if (!fs.existsSync(dir2)) { fs.mkdirSync(dir2);} 
    if (!fs.existsSync(fpath)) {
        fs.writeFileSync(fpath, strin, (err) => {
            if (err) {
                client.emit('error', err)
                return
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
            client.emit('error', err)
            return
        }
      })


}

Object.assign(this, eco);
}
}

module.exports = new EconomyService();
