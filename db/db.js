require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let db = null;

if (process.env.DB_TYPE === 'sqlite') {
  db = new sqlite3.Database(process.env.SQLITE_DB_PATH);
  module.exports = {
    type: 'sqlite',
    db
  };
} else if (process.env.DB_TYPE === 'postgres') {
  const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
  });

  module.exports = {
    type: 'postgres',
    pool
  };
} else {
  throw new Error('DB_TYPE inválido. Use "sqlite" ou "postgres".');
}
