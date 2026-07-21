const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  throw new Error('DATABASE_URL or DB_PASSWORD is required in production');
}
const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eldercare',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
