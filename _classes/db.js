const { Pool, client } = require('pg');
const admin = client;

const dbconfig = require('../_classes/config').db

const pool = new Pool(dbconfig)

module.exports = {
  pool,
  admin
} 