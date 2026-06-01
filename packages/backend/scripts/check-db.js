const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '182004',
    database: process.env.DB_NAME || 'u_ride_esp',
  });

  await client.connect();
  console.log('Connected to DB');

  const res = await client.query('SELECT * FROM solicitudes_viaje');
  console.log('Total solicitudes_viaje rows:', res.rows.length);
  console.log(JSON.stringify(res.rows, null, 2));

  const users = await client.query('SELECT id, nombre, correo FROM usuarios');
  console.log('Total usuarios rows:', users.rows.length);
  console.log(JSON.stringify(users.rows, null, 2));

  await client.end();
}

main().catch(console.error);
