const prisma = require('../prisma');
const config = require('../config');
const UtilityService = require('./utilityService');

class TownsService {
    constructor() {
        const utility = new UtilityService();
        this.random = utility.random.bind(utility);
        this.population = { Nishigami: 0, Harotec: 0, Massibi: 0, Tyris: 0 };
        this.games = {
            Nishigami: ['roleta', 'flip', 'luckycards'],
            Harotec: ['roleta', 'flip', 'luckycards'],
            Massibi: ['roleta', 'flip', 'blackjack'],
            Tyris: ['roleta', 'flip', 'blackjack']
        };
        this.loadPopulation();
    }

    async loadPopulation() {
        const towns = await prisma.towns.findMany();
        for (const town of towns) {
            if (town.user_id && town.loc) this.population[this.getTownNameByNum(town.loc)]++;
        }
    }

    getConfig() {
        return config;
    }

    async getTownNum(userId) {
        const key = BigInt(userId);
        const town = await prisma.towns.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key } });
        if (town.loc !== 0) return town.loc;
        const location = this.random(1, 4);
        await prisma.towns.update({ where: { user_id: key }, data: { loc: location } });
        this.population[this.getTownNameByNum(location)]++;
        return location;
    }

    async getPosByTownNum(town) {
        const positions = {
            1: [70, 130, 15, 40],
            2: [1580, 1650, 60, 90],
            3: [1100, 1150, 1120, 1150],
            4: [350, 400, 840, 860]
        };
        const [minX, maxX, minY, maxY] = positions[town] || [0, 0, 0, 0];
        return { x: this.random(minX, maxX), y: this.random(minY, maxY) };
    }

    async getTownPos(userId) {
        return this.getPosByTownNum(await this.getTownNum(userId));
    }

    async getTownName(userId) {
        return this.getTownNameByNum(await this.getTownNum(userId));
    }

    async getTownTax(userId) {
        const key = BigInt(userId);
        const player = await prisma.players.upsert({ where: { user_id: key }, update: { user_id: key }, create: { user_id: key, frames: [], badges: [] } });
        return player.mvp != null || player.mvp > 0 ? 2 : 5;
    }

    getTownNameByNum(number) {
        return { 1: 'Nishigami', 2: 'Harotec', 3: 'Massibi', 4: 'Tyris' }[number];
    }

    getTownNumByName(name) {
        const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return { nishigami: 1, harotec: 2, massibi: 3, tyris: 4 }[normalized] || 0;
    }
}

module.exports = new TownsService();
