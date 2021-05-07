const API = require("../api.js");
const { readFileSync } = require('fs')

const badges = {
    json: []
}

badges.add = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await badges.has(member, id)
    if (temphas) return
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    tempbadges.push(id)
    API.setInfo(member, "players", "badges", tempbadges)
}

badges.remove = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await badges.has(member, id)
    if (!temphas) return
    let tempbadges = (obj.badges == null ? [] : obj.badges)
    const index = tempbadges.indexOf(id);
    if (index > -1) {
        tempbadges.splice(index, 1);
    }
    API.setInfo(member, "players", "badges", tempbadges)
}

badges.has = async function (member, id) {
    badges.load()
    const obj = await API.getInfo(member, "players")
    let has = false
    if (obj.badges != null) {
        if (obj.badges.includes(id)) has = true
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