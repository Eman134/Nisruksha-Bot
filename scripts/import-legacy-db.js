const prisma = require('../_classes/prisma');
const { reportError } = require('../_classes/debug');

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

async function main() {
    for (const table of TABLES) {
        let rows;
        try {
            // This is the one-time bridge from the old PostgreSQL tables. Runtime
            // access goes through Prisma's LegacyRow model only.
            rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
        } catch (error) {
            if (error.code === 'P2010' || /does not exist/i.test(error.message)) {
                console.log(`[IMPORT] Tabela ${table} não encontrada, ignorando.`);
                continue;
            }
            throw error;
        }

        for (const row of rows) {
            const data = serialize(row);
            const key = getKey(table, row);
            await prisma.legacyRow.upsert({
                where: { tableName_key: { tableName: table, key } },
                create: { tableName: table, key, data },
                update: { data }
            });
        }

        console.log(`[IMPORT] ${table}: ${rows.length} registros`);
    }
}

function serialize(value) {
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
    }
    return value;
}

function getKey(table, row) {
    if (table === 'companies') return `company_id:${row.company_id}:user_id:${row.user_id}`;
    if (row.user_id !== undefined) return `user_id:${row.user_id}`;
    if (row.server_id !== undefined) return `server_id:${row.server_id}`;
    if (row.company_id !== undefined) return `company_id:${row.company_id}`;
    throw new Error(`Não foi possível identificar o registro legado de ${table}`);
}

main()
    .catch((error) => {
        reportError(error, 'database.import_legacy');
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
