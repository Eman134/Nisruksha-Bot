const API = require("../api.js");
const { readFileSync } = require('fs')

const frames = {
    json: []
}

frames.add = async function (member, id) {
    frames.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await frames.has(member, id)
    if (temphas) return
    let tempframes = (obj.frames == null ? [] : obj.frames)
    tempframes.push(id)
    API.setInfo(member, "players", "frames", tempframes)
}

frames.remove = async function (member, id) {
    frames.load()
    const obj = await API.getInfo(member, "players")
    const temphas = await frames.has(member, id)
    if (!temphas) return
    let tempframes = (obj.frames == null ? [] : obj.frames)
    const index = tempframes.indexOf(id);
    if (index > -1) {
        tempframes.splice(index, 1);
    }
    API.setInfo(member, "players", "frames", tempframes)
}

frames.has = async function (member, id) {
    frames.load()
    const obj = await API.getInfo(member, "players")
    let has = false
    if (obj.frames != null) {
        if (obj.frames.includes(id)) has = true
    }
    return has
}

frames.get = function (id) {
    frames.load()
    const tempbadge = frames.json.find((item) => item.id == id)
    return tempbadge
}

frames.load = function () {
    if (frames.json.length == 0) {
        const jsonF = readFileSync('./_json/social/frames.json', 'utf8')
        const cm = JSON.parse(jsonF);
        frames.json = cm
    }
}

module.exports = frames