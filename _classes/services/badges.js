const prisma = require('../prisma');
const { readFileSync } = require('fs');

class BadgesService {
    constructor() {
        this.json = [];
    }

async add(user_id, id) {
    this.load();
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    const temphas = await this.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempbadges = (obj.badges == null ? [] : obj.badges.map(String))
    tempbadges.push(id + '')
    await prisma.players.update({ where: { user_id: key }, data: { badges: tempbadges.map(BigInt) } })
    return "Added " + id
}

async remove(user_id, id) {
    this.load()
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    const temphas = await this.has(user_id, id)
    if (!temphas) return "Don't have"
    let tempbadges = (obj.badges == null ? [] : obj.badges.map(String))
    const index = tempbadges.indexOf(id  + '');
    if (index > -1) {
        tempbadges.splice(index, 1);
    }
    await prisma.players.update({ where: { user_id: key }, data: { badges: tempbadges.map(BigInt) } })
    return "Removed " + id
}

async has(user_id, id) {
    this.load()
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    let has = false
    if (obj.badges != null) {
        if (obj.badges.some((badge) => String(badge) === String(id))) has = true
    }
    return has
}

get(id) {
    this.load()
    const tempbadge = this.json.find((item) => item.id == id)
    return tempbadge
}

load() {
    if (this.json.length == 0) {
        const jsonF = readFileSync('./_json/social/badges.json', 'utf8')
        const cm = JSON.parse(jsonF);
        this.json = cm
    }
}
}

module.exports = new BadgesService();
