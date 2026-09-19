const DatabaseManager = require('../manager/DatabaseManager');
const { readFileSync } = require('fs')

class FramesService {
constructor() {
    this.database = new DatabaseManager();
    this.json = [];
}

async add(user_id, id) {
    this.load()
    const obj = await this.database.get(user_id, "players")
    const temphas = await this.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempframes = (obj.frames == null ? [] : obj.frames)
    tempframes.unshift(id)
    await this.database.set(user_id, "players", "frames", tempframes)

    return "Added " + id
}

async reforge(user_id, id) {
    
    this.load()

    const obj = await this.database.get(user_id, "players")

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

    await this.database.set(user_id, "players", "frames", tempframes)

    return "Reforged " + id
}

async remove(user_id, id) {
    this.load()
    const obj = await this.database.get(user_id, "players")
    const temphas = await this.has(user_id, id)
    if (!temphas) return
    let tempframes = (obj.frames == null ? [] : obj.frames)
    const index = tempframes.indexOf(id + '');
    if (index > -1) {
        tempframes.splice(index, 1);
    }
    await this.database.set(user_id, "players", "frames", tempframes)

    return "Removed " + id
}

async has(user_id, id) {
    this.load()
    const obj = await this.database.get(user_id, "players")
    let has = false
    if (obj.frames != null && obj.frames.length > 0) {
        if (obj.frames.includes(id) || obj.frames.includes(id + '')) has = true
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
        const jsonF = readFileSync('./_json/social/frames.json', 'utf8')
        const cm = JSON.parse(jsonF);
        this.json = cm
    }
}
}

module.exports = new FramesService();
