const { Client } = require('pg');
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

async function waitForDB() {
  const clientConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: 'db',
        port: 5432,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
      };

  const client = new Client(clientConfig);
  
  let retries = MAX_RETRIES;
  while (retries > 0) {
    try {
      await client.connect();
      console.log('✓ Database is ready');
      await client.end();
      return;
    } catch (err) {
      retries--;
      if (retries === 0) {
        throw new Error('Database not ready after 30 retries');
      }
      console.log(`Waiting for database... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }
}

waitForDB().catch(err => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});