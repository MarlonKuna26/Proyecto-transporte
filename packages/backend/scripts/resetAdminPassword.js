const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@institucion.edu';
  const newPassword = process.env.ADMIN_PASSWORD;

  if (!newPassword) {
    console.error('Define ADMIN_PASSWORD en variables de entorno.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'u_ride_dev',
  });

  if (!process.env.DB_PASSWORD) {
    console.error('Define DB_PASSWORD en variables de entorno.');
    process.exit(1);
  }

  await client.connect();

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const result = await client.query(
    `
    UPDATE users
    SET hashed_password = $1,
        role = 'ADMIN',
        is_verified = true,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = $2
    RETURNING email, role, is_verified;
    `,
    [passwordHash, email],
  );

  if (result.rowCount === 0) {
    console.log(`No existe usuario con email: ${email}`);
    process.exitCode = 1;
  } else {
    console.log('Admin actualizado:');
    console.table(result.rows);
    console.log(`Password nueva: ${newPassword}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error('Error reseteando admin:', error.message);
  process.exit(1);
});
