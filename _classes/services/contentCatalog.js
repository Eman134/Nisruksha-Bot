const cacheLists = require('./cacheLists');

const ITEM_FILES = [
    './_json/ores.json',
    './_json/companies/exploration/drops_monsters.json',
    './_json/companies/agriculture/seeds.json',
    './_json/companies/fish/mobs.json',
    './_json/usaveis.json',
    './_json/companies/process/drops.json'
];

const catalog = {
    initialized: false,
    badges: null,
    frames: null,
    crates: null,
    shop: null,
    items: null,
    company: {
        exploration: { mobs: null, equips: null },
        fish: { rods: null, mobs: null },
        process: { tools: null }
    },

    async initialize() {
        if (this.initialized) return this;

        const [badges, frames, crates, shop, items, explorationMobs, explorationEquips, fishRods, fishMobs, processTools] = await Promise.all([
            cacheLists.json.load('./_json/social/badges.json', 'social-badges'),
            cacheLists.json.load('./_json/social/frames.json', 'social-frames'),
            cacheLists.json.load('./_json/crates.json', 'crates'),
            cacheLists.json.load('./_json/shop.json', 'shop'),
            cacheLists.json.composite('items', ITEM_FILES.map((filePath) => ({ path: filePath })), ([ores, ...dropLists]) => ({
                minerios: ores,
                drops: dropLists.flat()
            })),
            cacheLists.json.load('./_json/companies/exploration/mobs.json', 'company-explore-mobs'),
            cacheLists.json.load('./_json/companies/exploration/equip.json', 'company-explore-equips'),
            cacheLists.json.load('./_json/companies/fish/rods.json', 'company-fish-rods'),
            cacheLists.json.load('./_json/companies/fish/mobs.json', 'company-fish-mobs'),
            cacheLists.json.load('./_json/companies/process/tools.json', 'company-process-tools')
        ]);

        this.badges = badges;
        this.frames = frames;
        this.crates = crates;
        this.shop = shop;
        this.items = items;
        this.company.exploration.mobs = explorationMobs;
        this.company.exploration.equips = explorationEquips;
        this.company.fish.rods = fishRods;
        this.company.fish.mobs = fishMobs;
        this.company.process.tools = processTools;
        this.initialized = true;
        return this;
    },

    async saveShop(value) {
        this.shop = value;
        await cacheLists.json.save('./_json/shop.json', 'shop', value);
        return value;
    },

    async saveItems(value) {
        const version = await cacheLists.json.version(ITEM_FILES.map((filePath) => ({ path: filePath })));
        this.items = value;
        await cacheLists.json.save(null, 'items', value, version);
        return value;
    }
};

module.exports = catalog;
