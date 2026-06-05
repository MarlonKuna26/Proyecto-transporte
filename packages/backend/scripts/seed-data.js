/**
 * Seed script — Inserta datos de prueba en u_ride_esp
 * Ejecutar: node packages/backend/scripts/seed-data.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '182004',
  database: 'u_ride_esp',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Limpiando tablas...');
    await client.query(`
      TRUNCATE TABLE pagos, seguimiento_viaje, eventos_viaje, calificaciones, reportes, 
        solicitudes_viaje, viajes, vehiculos, perfiles_usuario, codigos_verificacion, 
        reglas_seguridad, registros_auditoria, ubicaciones_guardadas_usuario, usuarios CASCADE;
    `);
    console.log('✅ Tablas limpiadas\n');

    // ============ USUARIOS ============
    console.log('👥 Creando usuarios...');
    const hashedPass = await bcrypt.hash('Test1234!', 10);
    const customHashedPass = await bcrypt.hash('Marlon182004@', 10);
    const heidiPass = await bcrypt.hash('Josu123456', 10);
    const martaPass = await bcrypt.hash('Marta123', 10);
    
    const users = [
      { id: uuidv4(), correo: 'admin@uride.edu.ec', nombre: 'Admin Sistema', rol: 'ADMIN', verificado: true },
      { id: uuidv4(), correo: 'carlos.martinez@uride.edu.ec', nombre: 'Carlos Martínez', rol: 'STUDENT', verificado: true },
      { id: uuidv4(), correo: 'laura.gonzalez@uride.edu.ec', nombre: 'Laura González', rol: 'STUDENT', verificado: true },
      { id: uuidv4(), correo: 'andres.lopez@uride.edu.ec', nombre: 'Andrés López', rol: 'STUDENT', verificado: true },
      { id: uuidv4(), correo: 'maria.rodriguez@uride.edu.ec', nombre: 'María Rodríguez', rol: 'STUDENT', verificado: true },
      { id: uuidv4(), correo: 'diego.herrera@uride.edu.ec', nombre: 'Diego Herrera', rol: 'STUDENT', verificado: true },
      { id: uuidv4(), correo: 'sofia.ramirez@uride.edu.ec', nombre: 'Sofía Ramírez', rol: 'STUDENT', verificado: false },
      { id: uuidv4(), correo: 'jfiallos7065@uta.edu.ec', nombre: 'Juan Fiallos', rol: 'STUDENT', verificado: true, customHash: true },
      { id: uuidv4(), correo: 'hvillavicencio8210@uta.edu.ec', nombre: 'Heidi Villavicencio', rol: 'STUDENT', verificado: true, passwordHash: heidiPass },
      { id: uuidv4(), correo: 'mguevara4348@uta.edu.ec', nombre: 'Marta Guevara', rol: 'STUDENT', verificado: true, passwordHash: martaPass },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO usuarios (id, correo, nombre, contrasena_hash, rol, esta_verificado, reputacion) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, u.correo, u.nombre, u.passwordHash || (u.customHash ? customHashedPass : hashedPass), u.rol, u.verificado, 5.0]
      );
    }
    console.log(`  ✅ ${users.length} usuarios creados (contraseñas listas)`);

    // ============ PERFILES ============
    console.log('📝 Creando perfiles...');
    const profiles = [
      { userId: users[1].id, carrera: 'Ingeniería de Sistemas', telefono: '+593 98 765 4321', zona: 'Ficoa', barrio: 'Las Palmas', bio: 'Estudiante de 8vo semestre, conduzco un Chevrolet Aveo', contacto_emergencia: 'Padre - Pedro Martínez', telefono_emergencia: '+593 99 111 2222' },
      { userId: users[2].id, carrera: 'Derecho', telefono: '+593 99 234 5678', zona: 'Miraflores', barrio: 'Cdla. España', bio: 'Busco viajes compartidos para la universidad', contacto_emergencia: 'Madre - Ana González', telefono_emergencia: '+593 98 222 3333' },
      { userId: users[3].id, carrera: 'Medicina', telefono: '+593 96 345 6789', zona: 'Centro', barrio: 'La Merced', bio: 'Conductor responsable, viajo todos los días', contacto_emergencia: 'Hermana - Paula López', telefono_emergencia: '+593 97 333 4444' },
      { userId: users[4].id, carrera: 'Administración', telefono: '+593 95 456 7890', zona: 'Huachi Chico', barrio: 'Cdla. Presidencial', bio: 'Me gusta viajar acompañada, más seguro así!', contacto_emergencia: 'Esposo - Juan Carlos', telefono_emergencia: '+593 96 444 5555' },
      { userId: users[5].id, carrera: 'Ingeniería Civil', telefono: '+593 97 567 8901', zona: 'Izamba', barrio: 'San José', bio: 'Puntualidad ante todo', contacto_emergencia: 'Madre - Carmen Herrera', telefono_emergencia: '+593 95 555 6666' },
      { userId: users[7].id, carrera: 'Ingeniería de Sistemas', telefono: '+593 98 123 4567', zona: 'Ficoa', barrio: 'Las Palmas', bio: 'Estudiante, viajo a diario con U-Ride', contacto_emergencia: 'Madre - María Fiallos', telefono_emergencia: '+593 99 999 9999' },
      { userId: users[8].id, carrera: 'Ingeniería de Sistemas', telefono: '+593 98 222 2222', zona: 'Ficoa', barrio: 'Las Palmas', bio: 'Administradora y Conductora', contacto_emergencia: 'Padre - Juan Villavicencio', telefono_emergencia: '+593 99 222 3333' },
      { userId: users[9].id, carrera: 'Derecho', telefono: '+593 99 333 3333', zona: 'Miraflores', barrio: 'Cdla. España', bio: 'Estudiante de Derecho, busco viajes', contacto_emergencia: 'Madre - Ana Guevara', telefono_emergencia: '+593 98 333 4444' },
    ];

    for (const p of profiles) {
      await client.query(
        `INSERT INTO perfiles_usuario (usuario_id, carrera, telefono, zona, barrio, biografia, contacto_emergencia, telefono_emergencia) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.userId, p.carrera, p.telefono, p.zona, p.barrio, p.bio, p.contacto_emergencia, p.telefono_emergencia]
      );
    }
    console.log(`  ✅ ${profiles.length} perfiles creados`);

    // ============ VEHÍCULOS ============
    console.log('🚗 Creando vehículos...');
    const vehicles = [
      { id: uuidv4(), owner: users[1].id, placa: 'TBA-1234', marca: 'Chevrolet', modelo: 'Aveo Family', color: 'Rojo', anio: 2022, capacidad: 4 },
      { id: uuidv4(), owner: users[3].id, placa: 'TBA-5678', marca: 'Kia', modelo: 'Rio', color: 'Blanco', anio: 2023, capacidad: 4 },
      { id: uuidv4(), owner: users[5].id, placa: 'TBA-9012', marca: 'Hyundai', modelo: 'Accent', color: 'Gris', anio: 2021, capacidad: 3 },
      { id: uuidv4(), owner: users[7].id, placa: 'TBA-4321', marca: 'Toyota', modelo: 'Yaris', color: 'Rojo', anio: 2023, capacidad: 4 },
      { id: uuidv4(), owner: users[8].id, placa: 'TST-1234', marca: 'Toyota', modelo: 'Yaris', color: 'Rojo', anio: 2023, capacidad: 4 },
    ];

    for (const v of vehicles) {
      await client.query(
        `INSERT INTO vehiculos (id, propietario_id, placa, marca, modelo, color, anio, capacidad, esta_activo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [v.id, v.owner, v.placa, v.marca, v.modelo, v.color, v.anio, v.capacidad]
      );
    }
    console.log(`  ✅ ${vehicles.length} vehículos creados`);

    // ============ VIAJES ============
    console.log('🛣️  Creando viajes...');
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const fmt = d => d.toISOString().split('T')[0];

    // Coordenadas de Ambato:
    // Centro: -1.2491, -78.6167
    // Ficoa: -1.2350, -78.6280
    // Miraflores: -1.2580, -78.6250
    // Huachi Chico: -1.2650, -78.6100
    // Izamba: -1.2200, -78.5900
    // Universidad (UTA campus Huachi): -1.2630, -78.6200
    // Terminal Terrestre: -1.2580, -78.6050

    const rides = [
      { id: uuidv4(), conductor: users[1].id, vehiculo: vehicles[0].id, zona_origen: 'Ficoa', detalle_origen: 'Av. Los Guaytambos y Montalvo', zona_destino: 'Universidad', detalle_destino: 'Campus Huachi — UTA', fecha: fmt(tomorrow), hora: '06:30', asientos: 3, precio: 0.75, estado: 'PUBLISHED', notas: 'Salgo puntual, paso por Miraflores', reglas: 'No fumar, puntualidad', lat_o: -1.2350, lng_o: -78.6280, lat_d: -1.2630, lng_d: -78.6200 },
      { id: uuidv4(), conductor: users[3].id, vehiculo: vehicles[1].id, zona_origen: 'Centro', detalle_origen: 'Parque Cevallos y Bolívar', zona_destino: 'Universidad', detalle_destino: 'Facultad de Medicina — UTA', fecha: fmt(tomorrow), hora: '07:00', asientos: 3, precio: 0.50, estado: 'PUBLISHED', notas: 'Acepto pasajeros en la ruta', reglas: 'Usar cinturón', lat_o: -1.2491, lng_o: -78.6167, lat_d: -1.2630, lng_d: -78.6200 },
      { id: uuidv4(), conductor: users[5].id, vehiculo: vehicles[2].id, zona_origen: 'Izamba', detalle_origen: 'Panamericana Norte y entrada a Izamba', zona_destino: 'Universidad', detalle_destino: 'Parqueadero UTA', fecha: fmt(tomorrow), hora: '06:00', asientos: 2, precio: 1.00, estado: 'PUBLISHED', notas: 'Viaje temprano, ideal para clase de 7am', reglas: 'Puntualidad estricta', lat_o: -1.2200, lng_o: -78.5900, lat_d: -1.2630, lng_d: -78.6200 },
      { id: uuidv4(), conductor: users[1].id, vehiculo: vehicles[0].id, zona_origen: 'Universidad', detalle_origen: 'Campus Huachi — UTA', zona_destino: 'Ficoa', detalle_destino: 'Av. Los Guaytambos', fecha: fmt(tomorrow), hora: '18:00', asientos: 3, precio: 0.75, estado: 'PUBLISHED', notas: 'Regreso en la tarde', reglas: 'No fumar', lat_o: -1.2630, lng_o: -78.6200, lat_d: -1.2350, lng_d: -78.6280 },
      { id: uuidv4(), conductor: users[3].id, vehiculo: vehicles[1].id, zona_origen: 'Miraflores', detalle_origen: 'Av. Miraflores y Atahualpa', zona_destino: 'Huachi Chico', detalle_destino: 'Terminal Terrestre', fecha: fmt(dayAfter), hora: '14:00', asientos: 4, precio: 1.00, estado: 'PUBLISHED', notas: 'Viaje de fin de semana', reglas: null, lat_o: -1.2580, lng_o: -78.6250, lat_d: -1.2650, lng_d: -78.6100 },
      // Viaje completado
      { id: uuidv4(), conductor: users[1].id, vehiculo: vehicles[0].id, zona_origen: 'Ficoa', detalle_origen: 'Av. Los Guaytambos', zona_destino: 'Universidad', detalle_destino: 'Campus UTA', fecha: fmt(yesterday), hora: '07:00', asientos: 1, precio: 0.75, estado: 'COMPLETED', notas: null, reglas: null, lat_o: -1.2350, lng_o: -78.6280, lat_d: -1.2630, lng_d: -78.6200 },
      // Viaje en progreso
      { id: uuidv4(), conductor: users[5].id, vehiculo: vehicles[2].id, zona_origen: 'Izamba', detalle_origen: 'Panamericana Norte', zona_destino: 'Universidad', detalle_destino: 'Campus Huachi', fecha: fmt(today), hora: '07:30', asientos: 1, precio: 1.00, estado: 'IN_PROGRESS', notas: 'En camino', reglas: null, lat_o: -1.2200, lng_o: -78.5900, lat_d: -1.2630, lng_d: -78.6200 },
    ];

    for (const r of rides) {
      await client.query(
        `INSERT INTO viajes (id, conductor_id, vehiculo_id, zona_origen, detalle_origen, zona_destino, detalle_destino, fecha_salida, hora_salida, asientos_disponibles, precio_por_asiento, estado, notas, reglas, latitud_origen, longitud_origen, latitud_destino, longitud_destino) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [r.id, r.conductor, r.vehiculo, r.zona_origen, r.detalle_origen, r.zona_destino, r.detalle_destino, r.fecha, r.hora, r.asientos, r.precio, r.estado, r.notas, r.reglas, r.lat_o, r.lng_o, r.lat_d, r.lng_d]
      );
    }
    console.log(`  ✅ ${rides.length} viajes creados`);

    // ============ SOLICITUDES DE VIAJE ============
    console.log('📨 Creando solicitudes de viaje...');
    const requests = [
      { id: uuidv4(), viaje: rides[0].id, pasajero: users[2].id, estado: 'ACCEPTED', mensaje: 'Hola, viajo al campus, ¿me llevas?', asientos: 1 },
      { id: uuidv4(), viaje: rides[0].id, pasajero: users[4].id, estado: 'PENDING', mensaje: '¿Puedes recogerme cerca de Ficoa?', asientos: 1 },
      { id: uuidv4(), viaje: rides[1].id, pasajero: users[2].id, estado: 'ACCEPTED', mensaje: 'También voy a la universidad', asientos: 1 },
      { id: uuidv4(), viaje: rides[1].id, pasajero: users[4].id, estado: 'REJECTED', mensaje: 'Necesito 3 puestos, ¿será posible?', asientos: 3 },
      { id: uuidv4(), viaje: rides[2].id, pasajero: users[1].id, estado: 'ACCEPTED', mensaje: 'Perfecto para mi clase de 7am', asientos: 1 },
      { id: uuidv4(), viaje: rides[5].id, pasajero: users[2].id, estado: 'ACCEPTED', mensaje: 'Gracias por el viaje!', asientos: 1 },
      { id: uuidv4(), viaje: rides[5].id, pasajero: users[4].id, estado: 'ACCEPTED', mensaje: 'Listo, nos vemos', asientos: 1 },
      { id: uuidv4(), viaje: rides[6].id, pasajero: users[2].id, estado: 'ACCEPTED', mensaje: 'Vamos!', asientos: 1 },
    ];

    for (const r of requests) {
      await client.query(
        `INSERT INTO solicitudes_viaje (id, viaje_id, pasajero_id, estado, mensaje, asientos_solicitados, respondido_en) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [r.id, r.viaje, r.pasajero, r.estado, r.mensaje, r.asientos, r.estado !== 'PENDING' ? new Date() : null]
      );
    }
    console.log(`  ✅ ${requests.length} solicitudes creadas`);

    // ============ PAGOS ============
    console.log('💰 Creando pagos...');
    const payments = [
      { solicitud: requests[0].id, monto: 0.75, metodo: 'CASH', estado: 'COMPLETED' },
      { solicitud: requests[2].id, monto: 0.50, metodo: 'TRANSFER', estado: 'COMPLETED', referencia: 'TRF-2026-001' },
      { solicitud: requests[4].id, monto: 1.00, metodo: 'CASH', estado: 'PENDING' },
      { solicitud: requests[5].id, monto: 0.75, metodo: 'WALLET', estado: 'COMPLETED' },
      { solicitud: requests[6].id, monto: 0.75, metodo: 'CASH', estado: 'COMPLETED' },
      { solicitud: requests[7].id, monto: 1.00, metodo: 'TRANSFER', estado: 'PENDING', referencia: 'TRF-2026-002' },
    ];

    for (const p of payments) {
      await client.query(
        `INSERT INTO pagos (solicitud_viaje_id, monto, metodo_pago, estado, referencia_transaccion) 
         VALUES ($1, $2, $3, $4, $5)`,
        [p.solicitud, p.monto, p.metodo, p.estado, p.referencia || null]
      );
    }
    console.log(`  ✅ ${payments.length} pagos creados`);

    // ============ CALIFICACIONES ============
    console.log('⭐ Creando calificaciones...');
    const ratings = [
      { viaje: rides[5].id, calificador: users[2].id, calificado: users[1].id, puntuacion: 5, comentario: 'Excelente conductor, muy puntual y amable', rol: 'DRIVER' },
      { viaje: rides[5].id, calificador: users[4].id, calificado: users[1].id, puntuacion: 4, comentario: 'Buen viaje, auto limpio', rol: 'DRIVER' },
      { viaje: rides[5].id, calificador: users[1].id, calificado: users[2].id, puntuacion: 5, comentario: 'Pasajera respetuosa y puntual', rol: 'PASSENGER' },
      { viaje: rides[5].id, calificador: users[1].id, calificado: users[4].id, puntuacion: 4, comentario: 'Buena compañía de viaje', rol: 'PASSENGER' },
    ];

    for (const r of ratings) {
      await client.query(
        `INSERT INTO calificaciones (viaje_id, calificador_id, calificado_id, puntuacion, comentario, rol_en_viaje) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [r.viaje, r.calificador, r.calificado, r.puntuacion, r.comentario, r.rol]
      );
    }
    console.log(`  ✅ ${ratings.length} calificaciones creadas`);

    // Update reputation based on ratings
    await client.query(`
      UPDATE usuarios SET reputacion = sub.avg_score FROM (
        SELECT calificado_id, AVG(puntuacion) as avg_score FROM calificaciones GROUP BY calificado_id
      ) sub WHERE usuarios.id = sub.calificado_id
    `);

    // ============ REPORTES ============
    console.log('🚩 Creando reportes...');
    const reports = [
      { reportante: users[4].id, reportado: users[6].id, viaje: null, motivo: 'SUSPICIOUS_BEHAVIOR', descripcion: 'Este usuario parece falso, no tiene correo institucional verificado', estado: 'PENDING' },
      { reportante: users[2].id, reportado: users[5].id, viaje: rides[2].id, motivo: 'LATE_ARRIVAL', descripcion: 'Llegó 20 minutos tarde al punto de recogida', estado: 'RESOLVED' },
    ];

    for (const r of reports) {
      await client.query(
        `INSERT INTO reportes (reportante_id, reportado_id, viaje_id, motivo, descripcion, estado) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [r.reportante, r.reportado, r.viaje, r.motivo, r.descripcion, r.estado]
      );
    }
    console.log(`  ✅ ${reports.length} reportes creados`);

    // ============ REGLAS DE SEGURIDAD ============
    console.log('🔒 Creando reglas de seguridad...');
    const rules = [
      { titulo: 'Verificación institucional', descripcion: 'Todos los usuarios deben verificar su correo institucional antes de usar la plataforma', icono: '✅', orden: 1 },
      { titulo: 'Compartir ubicación en tiempo real', descripcion: 'Durante el viaje, la ubicación del conductor se comparte con los pasajeros en tiempo real', icono: '📍', orden: 2 },
      { titulo: 'Contacto de emergencia', descripcion: 'Cada usuario debe registrar un contacto de emergencia en su perfil', icono: '🆘', orden: 3 },
      { titulo: 'Calificación obligatoria', descripcion: 'Al finalizar un viaje, tanto conductor como pasajeros deben calificarse mutuamente', icono: '⭐', orden: 4 },
      { titulo: 'Cero tolerancia al acoso', descripcion: 'Cualquier comportamiento inapropiado será sancionado con suspensión inmediata', icono: '🚫', orden: 5 },
      { titulo: 'Uso de cinturón de seguridad', descripcion: 'Todos los ocupantes del vehículo deben usar cinturón de seguridad', icono: '🔒', orden: 6 },
    ];

    for (const r of rules) {
      await client.query(
        `INSERT INTO reglas_seguridad (titulo, descripcion, icono, orden_mostrado, esta_activa) 
         VALUES ($1, $2, $3, $4, true)`,
        [r.titulo, r.descripcion, r.icono, r.orden]
      );
    }
    console.log(`  ✅ ${rules.length} reglas de seguridad creadas`);

    // ============ SEGUIMIENTO DE VIAJE (GPS) ============
    console.log('📡 Creando datos de seguimiento GPS...');
    // Simular tracking para el viaje en progreso (rides[6]) — Izamba → Universidad (UTA) en Ambato
    const trackingPoints = [
      { lat: -1.2200, lng: -78.5900 },  // Inicio — Izamba
      { lat: -1.2250, lng: -78.5950 },
      { lat: -1.2320, lng: -78.6010 },
      { lat: -1.2400, lng: -78.6060 },
      { lat: -1.2500, lng: -78.6120 },
      { lat: -1.2560, lng: -78.6170 },  // Posición actual — acercándose a la UTA
    ];

    for (let i = 0; i < trackingPoints.length; i++) {
      const timestamp = new Date(Date.now() - (trackingPoints.length - i) * 5 * 60000); // cada 5 min
      await client.query(
        `INSERT INTO seguimiento_viaje (viaje_id, latitud_actual, longitud_actual, rumbo, velocidad, ultima_actualizacion) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rides[6].id, trackingPoints[i].lat, trackingPoints[i].lng, 220 + i * 5, 25 + Math.random() * 15, timestamp]
      );
    }
    console.log(`  ✅ ${trackingPoints.length} puntos de tracking GPS creados`);

    // ============ EVENTOS DE VIAJE ============
    console.log('📜 Creando eventos de viaje...');
    const events = [
      { viaje: rides[5].id, tipo: 'PUBLISHED', desc: 'Viaje publicado por el conductor' },
      { viaje: rides[5].id, tipo: 'PASSENGER_JOINED', desc: 'Laura González se unió al viaje' },
      { viaje: rides[5].id, tipo: 'PASSENGER_JOINED', desc: 'María Rodríguez se unió al viaje' },
      { viaje: rides[5].id, tipo: 'STARTED', desc: 'Viaje iniciado por el conductor' },
      { viaje: rides[5].id, tipo: 'COMPLETED', desc: 'Viaje completado exitosamente' },
      { viaje: rides[6].id, tipo: 'PUBLISHED', desc: 'Viaje publicado' },
      { viaje: rides[6].id, tipo: 'PASSENGER_JOINED', desc: 'Laura González se unió al viaje' },
      { viaje: rides[6].id, tipo: 'STARTED', desc: 'Viaje en progreso — GPS activo' },
    ];

    for (const e of events) {
      await client.query(
        `INSERT INTO eventos_viaje (viaje_id, tipo_evento, descripcion) VALUES ($1, $2, $3)`,
        [e.viaje, e.tipo, e.desc]
      );
    }
    console.log(`  ✅ ${events.length} eventos de viaje creados`);

    // ============ AUDITORÍA ============
    console.log('📋 Creando registros de auditoría...');
    await client.query(
      `INSERT INTO registros_auditoria (tipo_entidad, id_entidad, accion, cambios, realizado_por) VALUES 
       ('USER', $1, 'CREATED', '{"source": "seed"}', $1),
       ('RIDE', $2, 'CREATED', '{"source": "seed"}', $3)`,
      [users[0].id, rides[0].id, users[1].id]
    );
    console.log('  ✅ 2 registros de auditoría creados');

    // ============ RESUMEN ============
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE — AMBATO, ECUADOR');
    console.log('='.repeat(50));
    console.log(`
📊 Resumen:
  👥 ${users.length} usuarios (contraseña: Test1234!)
  📝 ${profiles.length} perfiles
  🚗 ${vehicles.length} vehículos
  🛣️  ${rides.length} viajes (5 publicados, 1 completado, 1 en progreso)
  📨 ${requests.length} solicitudes
  💰 ${payments.length} pagos
  ⭐ ${ratings.length} calificaciones
  🚩 ${reports.length} reportes
  🔒 ${rules.length} reglas de seguridad
  📡 ${trackingPoints.length} puntos GPS
  📜 ${events.length} eventos de viaje

🔑 Cuentas de prueba:
  Admin:   admin@uride.edu.ec / Test1234!
  Carlos:  carlos.martinez@uride.edu.ec / Test1234!  (conductor)
  Laura:   laura.gonzalez@uride.edu.ec / Test1234!   (pasajera)
  Andrés:  andres.lopez@uride.edu.ec / Test1234!     (conductor)
  María:   maria.rodriguez@uride.edu.ec / Test1234!  (pasajera)
  Diego:   diego.herrera@uride.edu.ec / Test1234!    (conductor)
  Sofía:   sofia.ramirez@uride.edu.ec / Test1234!    (NO verificada)

📍 Zonas de Ambato: Ficoa, Centro, Miraflores, Huachi Chico, Izamba
🎓 Universidad: UTA — Campus Huachi
    `);

  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
