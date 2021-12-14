const { Pool } = require('pg');
const { db } = require('../config')
const pool = new Pool(db)

class DatabaseManager {
    constructor() {
    }

    getPool() {
        return pool;
    }

    async query(text, values = []) {
        return pool.query(text, values).then((data) => { return data }).catch(console.error);
    }

    async set(user_id, table, column, data, columnwhere = 'user_id') {
        if (typeof user_id === 'object') return console.log(`user_id is not a number:set:${table}:${column}:${user_id}`);
        try {
            if (!column) return console.log(`column is undefined:set:${table}:${column}`);
            await this.setIfNotExists(user_id, table, columnwhere);
            const text = `UPDATE ${table} SET ${column} = $2 WHERE ${columnwhere} = $1;`, values = [user_id, data]
            return pool.query(text, values).then((data) => { return data }).catch(console.error);
        } catch (error) {
            console.log(error);
        }
    }

    async get(user_id, table, column = 'user_id') {
        if (typeof user_id === 'object') return console.log(`user_id is not a number:get:${table}:${user_id}`);

        try {
            await this.setIfNotExists(user_id, table, column);
            const text = `SELECT * FROM ${table} WHERE ${column} = $1;`, values = [user_id];
            return pool.query(text, values).then((data) => { return data.rows[0] }).catch(console.error);
            
        } catch (error) {
            console.log(error);
        }
        
    }

    async setIfNotExists(value, table, column = 'user_id') {
        return pool.query(`INSERT INTO ${table}(${'' + column}) VALUES(${'' +value}) ON CONFLICT DO NOTHING`).then((data) => { return data }).catch(console.error);
    }

    async increment(user_id, table, column, data, columnwhere = 'user_id') {
        if (typeof user_id === 'object') return console.log(`user_id is not a number:increment:${table}:${column}:${user_id}`);
        try {
            await this.setIfNotExists(user_id, table, columnwhere);
            const text = `UPDATE ${table} SET ${column} = ${column} + $2 WHERE ${columnwhere} = $1;`, values = [user_id, data]
            return pool.query(text, values).then((data) => { return data }).catch(console.error);
        } catch (error) {
            console.log(error)
        }
    }

}

module.exports = DatabaseManager;