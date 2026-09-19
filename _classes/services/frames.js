const prisma = require('../prisma');
const { readFileSync } = require('fs')

class FramesService {
constructor() {
    this.json = [];
}

async add(user_id, id) {
    this.load()
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    const temphas = await this.has(user_id, id)
    if (temphas) return "Já possui " + id
    let tempframes = (obj.frames == null ? [] : obj.frames.map(String))
    tempframes.unshift(id)
    await prisma.players.update({ where: { user_id: key }, data: { frames: tempframes.map(BigInt) } })

    return "Added " + id
}

async reforge(user_id, id) {
    
    this.load()

    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });

    let tempframes = (obj.frames == null ? [] : obj.frames.map(String))

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

    await prisma.players.update({ where: { user_id: key }, data: { frames: tempframes.map(BigInt) } })

    return "Reforged " + id
}

async remove(user_id, id) {
    this.load()
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    const temphas = await this.has(user_id, id)
    if (!temphas) return
    let tempframes = (obj.frames == null ? [] : obj.frames.map(String))
    const index = tempframes.indexOf(id + '');
    if (index > -1) {
        tempframes.splice(index, 1);
    }
    await prisma.players.update({ where: { user_id: key }, data: { frames: tempframes.map(BigInt) } })

    return "Removed " + id
}

async has(user_id, id) {
    this.load()
    const key = BigInt(user_id);
    const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
    let has = false
    if (obj.frames != null && obj.frames.length > 0) {
        if (obj.frames.some((frame) => String(frame) === String(id))) has = true
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
