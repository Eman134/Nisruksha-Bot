const { Pool } = require('pg');
const { db } = require('../config')
const { reportError } = require('../debug');
const pool = new Pool(db)

pool.on('error', (error) => reportError(error, 'database.pool'));

class DatabaseManager {
    constructor() {
    }

    getPool() {
        return pool;
    }

    async query(text, values = []) {
        try {
            return await pool.query(text, values);
        } catch (error) {
            throw reportError(error, 'database.query', { query: text, values });
        }
    }

    async set(user_id, table, column, data, columnwhere = 'user_id') {
        if (typeof user_id === 'object') throw new TypeError(`user_id is not valid:set:${table}:${column}:${user_id}`);
        if (!column) throw new TypeError(`column is undefined:set:${table}:${column}`);
        await this.setIfNotExists(user_id, table, columnwhere);
        const text = `UPDATE ${table} SET ${column} = $2 WHERE ${columnwhere} = $1;`, values = [user_id, data]
        return this.query(text, values);
    }

    async get(user_id, table, column = 'user_id') {
        if (typeof user_id === 'object') throw new TypeError(`user_id is not valid:get:${table}:${user_id}`);
        await this.setIfNotExists(user_id, table, column);
        const text = `SELECT * FROM ${table} WHERE ${column} = $1;`, values = [user_id];
        const data = await this.query(text, values);
        return data.rows[0];
        
    }

    async setIfNotExists(value, table, column = 'user_id') {
        return this.query(`INSERT INTO ${table}(${'' + column}) VALUES(${'' + value}) ON CONFLICT DO NOTHING`);
    }

    async increment(user_id, table, column, data, columnwhere = 'user_id') {
        if (typeof user_id === 'object') throw new TypeError(`user_id is not valid:increment:${table}:${column}:${user_id}`);
        await this.setIfNotExists(user_id, table, columnwhere);
        const text = `UPDATE ${table} SET ${column} = ${column} + $2 WHERE ${columnwhere} = $1;`, values = [user_id, data]
        return this.query(text, values);
    }

}

module.exports = DatabaseManager;
