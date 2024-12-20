const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'secure_user',
  password: 'RajoNarivony',
  port: 5432,
});

module.exports = {
  getConnection: async () => {
    const client = await pool.connect();
    // await client.query('BEGIN'); // set auto commit faulse
    return client;
  },
};