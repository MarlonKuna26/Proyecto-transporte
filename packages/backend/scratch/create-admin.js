const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '182004',
    database: 'u_ride_esp',
  });

  await client.connect();

  const email = 'admin@uta.edu.ec';
  const rawPassword = 'admin26@';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const check = await client.query(`SELECT id FROM usuarios WHERE correo = $1`, [email]);
  if (check.rowCount > 0) {
    await client.query(`UPDATE usuarios SET rol = 'ADMIN', esta_verificado = true, contrasena_hash = $1 WHERE correo = $2`, [hashedPassword, email]);
    console.log("Usuario admin actualizado exitosamente.");
    console.log("Correo: " + email);
    console.log("Contraseña: " + rawPassword);
  } else {
    await client.query(`
      INSERT INTO usuarios (correo, nombre, contrasena_hash, rol, esta_verificado)
      VALUES ($1, 'Administrador', $2, 'ADMIN', true)
    `, [email, hashedPassword]);
    console.log("Usuario admin creado exitosamente.");
    console.log("Correo: " + email);
    console.log("Contraseña: " + rawPassword);
  }

  await client.end();
}

main().catch(console.error);
