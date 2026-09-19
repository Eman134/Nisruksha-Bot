const prisma = require('../prisma');
const contentCatalog = require('./contentCatalog');

class FramesService {
    async add(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        if (await this.has(user_id, id)) return "Já possui " + id;
        const frames = obj.frames == null ? [] : obj.frames.map(String);
        frames.unshift(id);
        await prisma.players.update({ where: { user_id: key }, data: { frames: frames.map(BigInt) } });
        return "Added " + id;
    }

    async reforge(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        const frames = obj.frames == null ? [] : obj.frames.map(String).filter((frame) => frame !== '0' && frame !== String(id));
        frames.unshift(id);
        await prisma.players.update({ where: { user_id: key }, data: { frames: frames.map(BigInt) } });
        return "Reforged " + id;
    }

    async remove(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        if (!await this.has(user_id, id)) return;
        const frames = obj.frames == null ? [] : obj.frames.map(String);
        const index = frames.indexOf(id + '');
        if (index > -1) frames.splice(index, 1);
        await prisma.players.update({ where: { user_id: key }, data: { frames: frames.map(BigInt) } });
        return "Removed " + id;
    }

    async has(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        return obj.frames != null && obj.frames.some((frame) => String(frame) === String(id));
    }

    async get(id) {
        return contentCatalog.frames.find((item) => item.id == id);
    }
}

module.exports = new FramesService();
