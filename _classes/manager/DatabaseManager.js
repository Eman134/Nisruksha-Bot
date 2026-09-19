const prisma = require('../prisma');

const TABLES = [
    'players',
    'servers',
    'globals',
    'storage',
    'players_utils',
    'machines',
    'cooldowns',
    'companies',
    'towns'
];

const numericDefaults = {
    money: 0,
    points: 0,
    token: 0,
    bank: 0,
    reps: 0,
    cmdsexec: 0,
    mastery: 0,
    streak: 0,
    dep: 0,
    tran: 0,
    saq: 0,
    totalcmd: 0,
    totaldonates: 0,
    donates: 0,
    level: 1,
    xp: 0,
    totalxp: 0,
    storage: 1,
    loc: 0,
    status: 0,
    lastcmd: 0,
    type: 0,
    company_id: null,
    user_id: null,
    server_id: null
};

const DEFAULTS = {
    players: {
        ...numericDefaults,
        perm: 1,
        mvp: null,
        banreason: null,
        company: null,
        companyact: null,
        stamina: Date.now(),
        plots: null,
        frames: [],
        badges: [],
        bglink: null
    },
    servers: {
        server_id: null,
        status: 0,
        banreason: null,
        cmdsexec: 0,
        lastcmd: 0
    },
    globals: {
        ...numericDefaults,
        status: 0,
        man: null,
        events: null,
        bets: null,
        keys: null,
        remember: null,
        processing: null
    },
    storage: { user_id: null, storage: 1 },
    players_utils: { user_id: null, backpack: 1, process: null, invite: null },
    machines: {
        user_id: null,
        machine: 1,
        level: 1,
        xp: 0,
        totalxp: 0,
        durability: 0,
        pressure: 0,
        refrigeration: 0,
        slots: null
    },
    cooldowns: { user_id: null },
    companies: {
        company_id: null,
        user_id: null,
        score: 0,
        workers: [],
        funcmax: 3,
        openvacancie: true
    },
    towns: { user_id: null, loc: 0 }
};

function assertTable(table) {
    if (!TABLES.includes(table)) {
        throw new TypeError(`Tabela não suportada: ${table}`);
    }
}

function keyFor(value, column) {
    return `${column}:${String(value)}`;
}

function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

class DatabaseManager {
    async _find(table, column, value) {
        assertTable(table);
        const rows = await prisma.legacyRow.findMany({ where: { tableName: table } });
        return rows.find((row) => row.data && String(row.data[column]) === String(value));
    }

    _rowData(row, table, key, keyColumn) {
        const defaults = clone(DEFAULTS[table] || {});
        const data = { ...defaults, ...(row?.data || {}) };
        if (data[keyColumn] === undefined || data[keyColumn] === null) data[keyColumn] = key;
        return data;
    }

    async setIfNotExists(value, table, column = 'user_id') {
        assertTable(table);
        if (await this._find(table, column, value)) return;
        const key = keyFor(value, column);
        const defaults = { ...(DEFAULTS[table] || {}), [column]: value };

        try {
            await prisma.legacyRow.upsert({
                where: { tableName_key: { tableName: table, key } },
                create: { tableName: table, key, data: defaults },
                update: {}
            });
        } catch (error) {
            if (error?.code !== 'P2002') throw error;
        }
    }

    async get(userId, table, column = 'user_id') {
        if (typeof userId === 'object') throw new TypeError(`user_id is not valid:get:${table}:${userId}`);
        await this.setIfNotExists(userId, table, column);
        const row = await this._find(table, column, userId);
        return this._rowData(row, table, userId, column);
    }

    async set(userId, table, column, data, columnwhere = 'user_id') {
        if (typeof userId === 'object') throw new TypeError(`user_id is not valid:set:${table}:${column}:${userId}`);
        if (!column) throw new TypeError(`column is undefined:set:${table}:${column}`);
        await this.setIfNotExists(userId, table, columnwhere);
        const row = await this._find(table, columnwhere, userId);
        const next = { ...this._rowData(row, table, userId, columnwhere), [column.replace(/^"|"$/g, '')]: clone(data) };
        return prisma.legacyRow.update({ where: { id: row.id }, data: { data: next } });
    }

    async increment(userId, table, column, amount, columnwhere = 'user_id') {
        if (typeof userId === 'object') throw new TypeError(`user_id is not valid:increment:${table}:${column}:${userId}`);
        await this.setIfNotExists(userId, table, columnwhere);
        return prisma.$transaction(async (tx) => {
            const rows = await tx.legacyRow.findMany({ where: { tableName: table } });
            const row = rows.find((candidate) => String(candidate.data?.[columnwhere]) === String(userId));
            if (!row) throw new Error(`Registro não encontrado: ${table}.${columnwhere}=${userId}`);
            const current = this._rowData(row, table, userId, columnwhere);
            const field = column.replace(/^"|"$/g, '');
            const value = Number(current[field] || 0) + Number(amount);
            current[field] = value;
            return tx.legacyRow.update({ where: { id: row.id }, data: { data: current } });
        });
    }

    async findMany(table, where = {}) {
        assertTable(table);
        const rows = await prisma.legacyRow.findMany({ where: { tableName: table } });
        return rows
            .filter((row) => Object.entries(where).every(([column, value]) => matches(row.data?.[column], value)))
            .map((row) => this._rowData(row, table, row.data?.user_id || row.data?.server_id, row.data?.user_id !== undefined ? 'user_id' : 'server_id'));
    }

    async deleteMany(table, where = {}) {
        assertTable(table);
        const rows = await prisma.legacyRow.findMany({ where: { tableName: table } });
        const matching = rows.filter((row) => Object.entries(where).every(([column, value]) => matches(row.data?.[column], value)));
        if (matching.length) await prisma.legacyRow.deleteMany({ where: { id: { in: matching.map((row) => row.id) } } });
        return { count: matching.length };
    }

    async updateMany(table, where, updates) {
        const rows = await this.findMany(table, where);
        for (const row of rows) {
            const id = row.user_id ?? row.server_id ?? row.company_id;
            const column = row.user_id !== undefined ? 'user_id' : row.server_id !== undefined ? 'server_id' : 'company_id';
            await this.set(id, table, Object.keys(updates)[0], Object.values(updates)[0], column);
        }
        return { count: rows.length };
    }

    async tableNames() {
        return TABLES;
    }

    async columns(table) {
        assertTable(table);
        const rows = await prisma.legacyRow.findMany({ where: { tableName: table } });
        return [...new Set([
            ...Object.keys(DEFAULTS[table] || {}),
            ...rows.flatMap((row) => Object.keys(row.data || {}))
        ])];
    }

    async reset(table) {
        if (table === 'all') return prisma.legacyRow.deleteMany();
        return this.deleteMany(table);
    }

    async size() {
        const count = await prisma.legacyRow.count();
        return `${count} registros`;
    }

}

function matches(actual, expected) {
    if (expected && typeof expected === 'object') {
        if ('not' in expected) return actual !== expected.not;
        if ('gt' in expected) return Number(actual) > Number(expected.gt);
        if ('gte' in expected) return Number(actual) >= Number(expected.gte);
        if ('lt' in expected) return Number(actual) < Number(expected.lt);
        if ('lte' in expected) return Number(actual) <= Number(expected.lte);
    }
    return String(actual) === String(expected);
}

module.exports = DatabaseManager;
