const { Client } = require('pg');
const client = new Client({ user: 'postgres', password: '182004', database: 'u_ride_esp', host: 'localhost', port: 5432 });

client.connect()
  .then(() => client.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pagos_metodo_pago_check';`))
  .then(res => {
    console.log("CONSTRAINT DEF:", res.rows[0]);
    return client.query(`ALTER TABLE pagos DROP CONSTRAINT pagos_metodo_pago_check;`);
  })
  .then(() => {
    console.log("Constraint dropped.");
    return client.query(`ALTER TABLE pagos ADD CONSTRAINT pagos_metodo_pago_check CHECK (metodo_pago::text = ANY (ARRAY['CASH'::character varying, 'TRANSFER'::character varying, 'PAYPAL'::character varying]::text[]));`);
  })
  .then(() => {
    console.log("Constraint added with PAYPAL.");
    client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
