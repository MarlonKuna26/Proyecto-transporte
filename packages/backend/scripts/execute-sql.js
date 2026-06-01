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

  console.log(`Connecting to database ${process.env.DB_NAME || 'u_ride_esp'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}...`);
  await client.connect();
  console.log('Connected. Running SQL query...');
  
  const query = `ALTER TABLE public.solicitudes_viaje ADD COLUMN IF NOT EXISTS motivo_rechazo character varying(255);`;
  await client.query(query);
  
  console.log('✅ SQL query executed successfully!');
  await client.end();
}

main().catch((error) => {
  console.error('❌ Error executing SQL query:', error);
  process.exit(1);
});
