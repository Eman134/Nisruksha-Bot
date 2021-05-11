const API = require("../api.js");
const { readFileSync } = require('fs')

const badges = {
    json: []
}

badges.add = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await badges.has(member, id)
    if (temphas) return "Has"
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    tempbadges.push(parseInt(id))
    API.setInfo(member, "players", "badges", tempbadges)
    return "Added"
}

badges.remove = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await badges.has(member, id)
    if (!temphas) return "Don't have"
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    const index = tempbadges.indexOf(parseInt(id));
    if (index > -1) {
        tempbadges.splice(index, 1);
    }
    API.setInfo(member, "players", "badges", tempbadges)
    return "Removed"
}

badges.has = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    let has = false
    if (obj.badges != null) {
        if (obj.badges.includes(id) || obj.badges.includes(id.toString())) has = true
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