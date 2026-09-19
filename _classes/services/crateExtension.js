const prisma = require('../prisma');
const itemService = require('./items');
const contentCatalog = require('./contentCatalog');
const UtilityService = require('./utilityService');

function shuffle(array) {
    for (let index = array.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
    return array;
}

class CrateService {
    constructor() {
        this.utility = new UtilityService();
    }

    async load() {
        return contentCatalog.crates;
    }

    async getCrates(userId) {
        const user_id = BigInt(userId);
        const storage = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
        const crates = contentCatalog.crates;
        return Object.keys(crates).map((key) => `${key};${storage[`crate_${key}`]}`);
    }

    async getCrate(id) {
        const crates = contentCatalog.crates;
        return crates[String(id)];
    }

    async getReward(id, size = 1) {
        const crate = await this.getCrate(id);
        if (!crate) return [];
        if (size > 1) return Promise.all(Array.from({ length: size }, () => this.getReward(id).then((reward) => reward[0])));

        const reward = typeof crate.rewards === 'string'
            ? await this.randomDrop()
            : this.randomReward(crate.rewards);
        return reward ? [reward] : [];
    }

    async randomDrop() {
        const drops = shuffle((await itemService.getObj()).drops.map((drop) => this.utility.clone(drop)));
        const drop = drops[this.utility.random(0, drops.length - 1)];
        const result = this.utility.clone(drop);
        result.type = 5;
        if (result.size === 0) result.size = 1;
        return result;
    }

    randomReward(rewards) {
        const chance = this.utility.random(0, 100);
        let accumulated = 0;
        for (const reward of [...rewards].sort((a, b) => a.chance - b.chance)) {
            accumulated += reward.chance;
            if (chance < accumulated) return this.utility.clone(reward);
        }
        return undefined;
    }

    async give(userId, id, amount) {
        const user_id = BigInt(userId);
        return prisma.storage.upsert({
            where: { user_id },
            update: { [`crate_${id}`]: { increment: amount } },
            create: { user_id, [`crate_${id}`]: amount }
        });
    }
}

module.exports = new CrateService();
