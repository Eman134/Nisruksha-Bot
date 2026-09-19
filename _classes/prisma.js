const { PrismaClient } = require('@prisma/client');
const { databaseUrl } = require('./config');

process.env.DATABASE_URL ||= databaseUrl;

const prisma = global.__nisrukshaPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.__nisrukshaPrisma = prisma;
}

module.exports = prisma;
