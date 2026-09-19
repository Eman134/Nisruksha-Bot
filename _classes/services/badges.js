const prisma = require('../prisma');
const contentCatalog = require('./contentCatalog');

class BadgesService {
    async add(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        if (await this.has(user_id, id)) return "Já possui " + id;
        const badges = obj.badges == null ? [] : obj.badges.map(String);
        badges.push(id + '');
        await prisma.players.update({ where: { user_id: key }, data: { badges: badges.map(BigInt) } });
        return "Added " + id;
    }

    async remove(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        if (!await this.has(user_id, id)) return "Don't have";
        const badges = obj.badges == null ? [] : obj.badges.map(String);
        const index = badges.indexOf(id + '');
        if (index > -1) badges.splice(index, 1);
        await prisma.players.update({ where: { user_id: key }, data: { badges: badges.map(BigInt) } });
        return "Removed " + id;
    }

    async has(user_id, id) {
        const key = BigInt(user_id);
        const obj = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        return obj.badges != null && obj.badges.some((badge) => String(badge) === String(id));
    }

    async get(id) {
        return contentCatalog.badges.find((item) => item.id == id);
    }
}

module.exports = new BadgesService();
