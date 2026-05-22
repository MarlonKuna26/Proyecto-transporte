const fs = require('fs');

try {
  const env = fs.readFileSync('c:/Users/ASUS/OneDrive/Escritorio/Proyecto-transporte/packages/backend/.env', 'utf8');
  env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const k = parts[0].trim();
      const v = parts.slice(1).join('=').trim();
      if (k && v) process.env[k] = v;
    }
  });
} catch (e) {
  console.log('Error reading .env', e.message);
}

const { Client } = require('c:/Users/ASUS/OneDrive/Escritorio/Proyecto-transporte/packages/backend/node_modules/pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5433),
    user: process.env.DB_USER || 'u_ride_user',
    password: process.env.DB_PASSWORD || 'secure_password_123',
    database: process.env.DB_NAME || 'u_ride_dev',
  });

  await client.connect();
  console.log('Connected to DB');
  
  const res = await client.query('SELECT * FROM solicitudes_viaje WHERE estado = \'ACCEPTED\' LIMIT 1');
  if (res.rows.length > 0) {
    const row = res.rows[0];
    console.log('Raw DB Row:', row);
    
    // Let's see how the backend maps and serializes this
    // We can simulate mapRow
    const { RideRequest } = require('c:/Users/ASUS/OneDrive/Escritorio/Proyecto-transporte/packages/backend/src/modules/ride-requests/domain/entities/RideRequest');
    const requestObj = new RideRequest(
      row.viaje_id, row.pasajero_id, row.asientos_solicitados, row.mensaje,
      row.estado, row.respondido_en ? new Date(row.respondido_en) : null,
      row.motivo_rechazo || null,
      row.id, new Date(row.creado_en), new Date(row.actualizado_en)
    );
    console.log('Serialized JSON:', JSON.stringify(requestObj, null, 2));
  } else {
    console.log('No accepted request found');
  }

  await client.end();
}

main().catch(console.error);
