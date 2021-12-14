const { readFileSync } = require('fs');
const Database = require("../manager/DatabaseManager.js");
const DatabaseManager = new Database();

const badges = {
    json: []
}

badges.add = async function (user_id, id) {
    badges.load()
    const obj = await DatabaseManager.get(user_id, "players")
    const temphas = await badges.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    tempbadges.push(id + '')
    DatabaseManager.set(user_id, "players", "badges", tempbadges)
    return "Added " + id
}

badges.remove = async function (user_id, id) {
    badges.load()
    const obj = await DatabaseManager.get(user_id, "players")
    const temphas = await badges.has(user_id, id)
    if (!temphas) return "Don't have"
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    const index = tempbadges.indexOf(id  + '');
    if (index > -1) {
        tempbadges.splice(index, 1);
    }
    DatabaseManager.set(user_id, "players", "badges", tempbadges)
    return "Removed " + id
}

badges.has = async function (user_id, id) {
    badges.load()
    const obj = await DatabaseManager.get(user_id, "players")
    let has = false
    if (obj.badges != null) {
        if (obj.badges.includes(id) || obj.badges.includes(id + '')) has = true
    }
    return has
}

badges.get = function (id) {
    badges.load()
    const tempbadge = badges.json.find((item) => item.id == id)
    return tempbadge
}

badges.load = function () {
    if (badges.json.length == 0) {
        const jsonF = readFileSync('./_json/social/badges.json', 'utf8')
        const cm = JSON.parse(jsonF);
        badges.json = cm
    }
}

module.exports = badges