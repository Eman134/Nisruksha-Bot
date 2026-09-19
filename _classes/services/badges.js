const DatabaseManager = require('../manager/DatabaseManager');
const { readFileSync } = require('fs');

class BadgesService {
    constructor() {
        this.database = new DatabaseManager();
        this.json = [];
    }

async add(user_id, id) {
    this.load();
    const obj = await this.database.get(user_id, "players")
    const temphas = await this.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    tempbadges.push(id + '')
    await this.database.set(user_id, "players", "badges", tempbadges)
    return "Added " + id
}

async remove(user_id, id) {
    this.load()
    const obj = await this.database.get(user_id, "players")
    const temphas = await this.has(user_id, id)
    if (!temphas) return "Don't have"
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    const index = tempbadges.indexOf(id  + '');
    if (index > -1) {
        tempbadges.splice(index, 1);
    }
    await this.database.set(user_id, "players", "badges", tempbadges)
    return "Removed " + id
}

async has(user_id, id) {
    this.load()
    const obj = await this.database.get(user_id, "players")
    let has = false
    if (obj.badges != null) {
        if (obj.badges.includes(id) || obj.badges.includes(id + '')) has = true
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
