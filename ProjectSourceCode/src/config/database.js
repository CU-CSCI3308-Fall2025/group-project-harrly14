const pgp = require('pg-promise')();

// flexibility for Render and Docker
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'db',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// apparently this helps with gracefully shutting down docker containers
db.$pgp = pgp;

module.exports = db;