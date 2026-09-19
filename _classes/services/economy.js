const prisma = require('../prisma');
const config = require('../config');
const clientService = require('./clientService');
const UtilityService = require('./utilityService');

class EconomyService {
constructor() {
const utility = new UtilityService();
const id = config.app.id;
const getPlayer = (userId, select) => {
    const user_id = BigInt(userId);
    return prisma.players.upsert({
        where: { user_id },
        update: { user_id },
        create: { user_id, frames: [], badges: [] },
        ...(select ? { select } : {})
    });
};
const updatePlayer = async (userId, data) => {
    const user_id = BigInt(userId);
    await getPlayer(user_id, { user_id: true });
    return prisma.players.update({ where: { user_id }, data });
};
const getPlayersUtils = (userId) => {
    const user_id = BigInt(userId);
    return prisma.players_utils.upsert({
        where: { user_id },
        update: { user_id },
        create: { user_id },
        select: { invite: true }
    });
};
const tp = {};

tp.get = async function (user_id) {
    
    const key = BigInt(user_id);
    const utilsobj = await getPlayersUtils(key);
    
    let invitejson = {
        code: String,
        qnt: Number,
        points: Number,
        usedinvite: Boolean
    }
    
    if (utilsobj.invite == null) {
    
        function randomString(length) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }
    
        let tempcode = randomString(6);
        let attempts = 0;
        while ((await tp.check(tempcode)).exists && attempts < 10) {
            tempcode = randomString(6);
            attempts += 1;
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
    const normalizedCode = String(code).toLowerCase();
    const invite = array.find((entry) => entry.invite?.code?.toLowerCase() === normalizedCode);
    return { exists: Boolean(invite), owner: invite ? String(invite.user_id) : undefined };

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
    const { bank } = await getPlayer(user_id, { bank: true });
    return bank;
}

bank.add = async function (user_id, money) {
    await updatePlayer(user_id, { bank: { increment: money } });
}

bank.remove = async function (user_id, money) {
    await updatePlayer(user_id, { bank: { increment: -money } });
}

bank.set = async function (user_id, money) {
    await updatePlayer(user_id, { bank: parseInt(money) });
}

const points = {};

points.get = async function (user_id) {
    const { points } = await getPlayer(user_id, { points: true });
    return points;
}

points.add = async function (user_id, points) {
    await updatePlayer(user_id, { points: { increment: points } });
}

points.remove = async function (user_id, points) {
    await updatePlayer(user_id, { points: { increment: -points } });
}

points.set = async function (user_id, points) {
    await updatePlayer(user_id, { points });
}

const money = {};

money.get = async function (user_id) {
    const { money } = await getPlayer(user_id, { money: true });
    return parseInt(money);
}

money.add = async function (user_id, money) {
    await updatePlayer(user_id, { money: { increment: money } });
}
money.globaladd = async function (amount) {
    return money.add(id, amount);
}

money.remove = async function (user_id, money) {
    await updatePlayer(user_id, { money: { increment: -money } });
}

money.globalremove = async function (amount) {
    return money.remove(id, amount);
}

money.set = async function (user_id, money) {
    await updatePlayer(user_id, { money: parseInt(Math.round(money)) });
}

const token = {};

token.get = async function (user_id) {
    const { token } = await getPlayer(user_id, { token: true });
    return token;
}

token.add = async function (user_id, token) {
    await updatePlayer(user_id, { token: { increment: token } });
}

token.remove = async function (user_id, token) {
    await updatePlayer(user_id, { token: { increment: -token } });
}

token.set = async function (user_id, token) {
    await updatePlayer(user_id, { token });
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
        fs.writeFileSync(fpath, strin);
        
    }
}

eco.addToHistory = async function (user_id, arg) {
    const insertLine = require('insert-line');

    eco.createHistoryDir(user_id);

    let fpath = `./_localdata/profiles/${user_id}/history.yml`;
    let content = `<t:${Math.round((Date.now())/1000)}:R> ${arg}`

    try {
        await insertLine(fpath).content(content).at(1);
    } catch (err) {
        clientService.current?.emit('error', err);
    }
}

Object.assign(this, eco);
}
}

module.exports = new EconomyService();
