const { Pool, client } = require('pg');
const admin = client;

const { db } = require('../_classes/config')

const pool = new Pool(db)

module.exports = {
  pool,
  admin
} 