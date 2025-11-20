const pgp = require('pg-promise')();

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Render requires SSL
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: 'db',
      port: 5432,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };

const db = pgp(dbConfig);

// apparently this helps with gracefully shutting down docker containers
db.$pgp = pgp;

module.exports = db;