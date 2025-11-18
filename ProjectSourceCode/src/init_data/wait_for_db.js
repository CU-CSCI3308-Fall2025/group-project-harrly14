const { Client } = require('pg');

async function waitForDB() {
  const client = new Client({
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });
  
  let retries = 30;
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
      await new Promise(res => setTimeout(res, 1000));
    }
  }
}

waitForDB().catch(err => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});