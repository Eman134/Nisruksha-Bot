const { readFileSync } = require('fs')
const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();

const frames = {
    json: []
}

frames.add = async function (user_id, id) {
    frames.load()
    const obj = await DatabaseManager.get(user_id, "players")
    const temphas = await frames.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempframes = (obj.frames == null ? [] : obj.frames)
    tempframes.unshift(id)
    DatabaseManager.set(user_id, "players", "frames", tempframes)

    return "Added " + id
}

frames.reforge = async function (user_id, id) {
    
    frames.load()

    const obj = await DatabaseManager.get(user_id, "players")

    let tempframes = (obj.frames == null ? [] : obj.frames)

    if (tempframes.includes('0')) {
        const index = tempframes.indexOf(0 + '');
        if (index > -1) {
            tempframes.splice(index, 1);
        }
    } if (tempframes.includes(id + '')) {
        const index = tempframes.indexOf(id + '');
        if (index > -1) {
            tempframes.splice(index, 1);
        }
    }

    tempframes.unshift(id)

    DatabaseManager.set(user_id, "players", "frames", tempframes)

    return "Reforged " + id
}

frames.remove = async function (user_id, id) {
    frames.load()
    const obj = await DatabaseManager.get(user_id, "players")
    const temphas = await frames.has(user_id, id)
    if (!temphas) return
    let tempframes = (obj.frames == null ? [] : obj.frames)
    const index = tempframes.indexOf(id + '');
    if (index > -1) {
        tempframes.splice(index, 1);
    }
    DatabaseManager.set(user_id, "players", "frames", tempframes)

    return "Removed " + id
}

frames.has = async function (user_id, id) {
    frames.load()
    const obj = await DatabaseManager.get(user_id, "players")
    let has = false
    if (obj.frames != null && obj.frames.length > 0) {
        if (obj.frames.includes(id) || obj.frames.includes(id + '')) has = true
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