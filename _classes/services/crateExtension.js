const prisma = require('../prisma');
const clientService = require('./clientService');
const itemService = require('./items');
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
        this.obj = {};
        this.load();
    }

    async load() {
        try {
            this.obj = JSON.parse(require('fs').readFileSync('./_json/crates.json', 'utf8'));
        } catch (error) {
            clientService.current?.emit('error', error);
        }
    }

    async getCrates(userId) {
        const user_id = BigInt(userId);
        const storage = await prisma.storage.upsert({ where: { user_id }, update: { user_id }, create: { user_id } });
        return Object.keys(this.obj).map((key) => `${key};${storage[`crate_${key}`]}`);
    }

    getReward(id, size = 1) {
        const crate = this.obj[String(id)];
        if (!crate) return [];
        if (size > 1) return Array.from({ length: size }, () => this.getReward(id)[0]);

        const reward = typeof crate.rewards === 'string'
            ? this.randomDrop()
            : this.randomReward(crate.rewards);
        return reward ? [reward] : [];
    }

    randomDrop() {
        const drops = shuffle([...itemService.getObj().drops]);
        const drop = drops[this.utility.random(0, drops.length - 1)];
        drop.type = 5;
        if (drop.size === 0) drop.size = 1;
        return drop;
    }

    randomReward(rewards) {
        const chance = this.utility.random(0, 100);
        let accumulated = 0;
        for (const reward of [...rewards].sort((a, b) => a.chance - b.chance)) {
            accumulated += reward.chance;
            if (chance < accumulated) return reward;
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
