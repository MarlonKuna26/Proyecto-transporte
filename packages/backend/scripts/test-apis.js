/**
 * Test script — Prueba todas las APIs del sistema U-Ride
 * Ejecutar: node packages/backend/scripts/test-apis.js
 */

const http = require('http');

const BASE = 'http://localhost:3002/api/v1';
let TOKEN = '';
let USER_ID = '';
let RIDE_ID = '';
let REQUEST_ID = '';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (TOKEN) options.headers['Authorization'] = `Bearer ${TOKEN}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(icon, label, result, details = '') {
  const status = result.status < 300 ? '✅' : '❌';
  const extra = details || (typeof result.body === 'object' ? (result.body.message || result.body.error || '') : '');
  console.log(`  ${status} ${icon} ${label} [${result.status}] ${extra}`);
  return result;
}

async function runTests() {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('  🧪 TEST SUITE — U-Ride API (u_ride_esp)');
  console.log('══════════════════════════════════════════════════');
  
  let passed = 0, failed = 0;
  const test = (ok) => ok ? passed++ : failed++;

  // =================== AUTH ===================
  console.log('\n🔐 AUTH MODULE');
  
  // Login con usuario NO verificado (debe fallar)
  let r = await request('POST', '/auth/login', { email: 'sofia.ramirez@uride.edu.ec', password: 'Test1234!' });
  log('🚫', 'Login NO verificado', r);
  test(r.status === 401);

  // Login con Carlos (verificado)
  r = await request('POST', '/auth/login', { email: 'carlos.martinez@uride.edu.ec', password: 'Test1234!' });
  log('🔑', 'Login Carlos', r, r.body?.data?.user?.name || '');
  test(r.status === 200 && r.body?.success);
  TOKEN = r.body?.data?.accessToken || r.body?.data?.token || '';
  USER_ID = r.body?.data?.user?.userId || r.body?.data?.user?.id || '';
  console.log(`     → Token: ${TOKEN.substring(0, 20)}...`);
  console.log(`     → UserId: ${USER_ID}`);

  // GET /auth/me
  r = await request('GET', '/auth/me');
  log('👤', 'GET /auth/me', r, r.body?.data?.email || '');
  test(r.status === 200);

  // Login Admin
  r = await request('POST', '/auth/login', { email: 'admin@uride.edu.ec', password: 'Test1234!' });
  log('👑', 'Login Admin', r, r.body?.data?.user?.name || '');
  test(r.status === 200);
  const ADMIN_TOKEN = r.body?.data?.accessToken || r.body?.data?.token || '';

  // =================== USERS ===================
  console.log('\n👥 USERS MODULE');
  
  // Profile
  r = await request('GET', '/users/profile');
  log('📝', 'GET /users/profile', r, r.body?.data?.career || r.body?.data?.carrera || '');
  test(r.status === 200);

  // Vehicles
  r = await request('GET', '/users/vehicles');
  log('🚗', 'GET /users/vehicles', r, `${(r.body?.data || []).length} vehículos`);
  test(r.status === 200 && (r.body?.data || []).length > 0);

  // =================== RIDES ===================
  console.log('\n🛣️  RIDES MODULE');
  
  // List rides
  r = await request('GET', '/rides?status=PUBLISHED');
  log('📋', 'GET /rides (PUBLISHED)', r, `${(r.body?.data || []).length} viajes`);
  test(r.status === 200 && (r.body?.data || []).length > 0);
  
  if (r.body?.data?.length > 0) {
    RIDE_ID = r.body.data[0].id;
    console.log(`     → Primer viaje: ${r.body.data[0].originZone} → ${r.body.data[0].destinationZone}`);
  }

  // Get ride by ID
  if (RIDE_ID) {
    r = await request('GET', `/rides/${RIDE_ID}`);
    log('🔍', `GET /rides/${RIDE_ID.substring(0,8)}...`, r, r.body?.data?.originZone || '');
    test(r.status === 200);
  }

  // My rides
  r = await request('GET', '/rides/my-rides');
  log('📋', 'GET /rides/my-rides', r, `${(r.body?.data || []).length} viajes míos`);
  test(r.status === 200);

  // =================== RIDE REQUESTS ===================
  console.log('\n📨 RIDE REQUESTS MODULE');
  
  // My requests as passenger
  r = await request('GET', '/ride-requests/my-requests');
  log('📨', 'GET my-requests', r, `${(r.body?.data || []).length} solicitudes`);
  test(r.status === 200);

  // Requests for a ride (as driver of ride[0])  
  if (RIDE_ID) {
    r = await request('GET', `/ride-requests/ride/${RIDE_ID}`);
    log('📋', 'GET ride requests', r, `${(r.body?.data || []).length} solicitudes del viaje`);
    test(r.status === 200);
  }

  // =================== RATINGS ===================
  console.log('\n⭐ RATINGS MODULE');
  
  r = await request('GET', `/ratings/user/${USER_ID}`);
  log('⭐', 'GET ratings/user', r, `avg=${r.body?.data?.average || 'N/A'}, count=${r.body?.data?.count || 0}`);
  test(r.status === 200);

  // =================== PAYMENTS ===================
  console.log('\n💰 PAYMENTS MODULE');
  
  r = await request('GET', '/payments/my-payments');
  log('📤', 'GET my-payments', r, `${(r.body?.data || []).length} pagos enviados`);
  test(r.status === 200);

  r = await request('GET', '/payments/received');
  log('📥', 'GET payments/received', r, `${(r.body?.data || []).length} pagos recibidos`);
  test(r.status === 200);

  r = await request('GET', '/payments/summary');
  log('📊', 'GET payments/summary', r, `Sent: $${r.body?.data?.sent?.monto_total || 0}, Received: $${r.body?.data?.received?.monto_total || 0}`);
  test(r.status === 200);

  // =================== TRACKING ===================
  console.log('\n📡 TRACKING MODULE');

  // Find the in-progress ride
  r = await request('GET', '/rides?status=IN_PROGRESS');
  const inProgressRide = (r.body?.data || [])[0];
  if (inProgressRide) {
    // Get current tracking
    r = await request('GET', `/tracking/${inProgressRide.id}/current`);
    log('📍', 'GET tracking/current', r, r.body?.data ? `lat=${r.body.data.latitud_actual}` : 'No data');
    test(r.status === 200);

    // Get tracking history
    r = await request('GET', `/tracking/${inProgressRide.id}/history`);
    log('📜', 'GET tracking/history', r, `${(r.body?.data || []).length} puntos`);
    test(r.status === 200 && (r.body?.data || []).length > 0);

    // Get events
    r = await request('GET', `/tracking/${inProgressRide.id}/events`);
    log('📋', 'GET tracking/events', r, `${(r.body?.data || []).length} eventos`);
    test(r.status === 200);
  } else {
    console.log('  ⚠️  No hay viaje en progreso para probar tracking');
  }

  // =================== SECURITY RULES ===================
  console.log('\n🔒 SECURITY RULES MODULE');
  
  r = await request('GET', '/security-rules');
  log('🔒', 'GET security-rules', r, `${(r.body?.data || []).length} reglas`);
  test(r.status === 200 && (r.body?.data || []).length > 0);

  // =================== ADMIN ===================
  console.log('\n⚙️  ADMIN MODULE');
  
  // Save current token, use admin token
  const savedToken = TOKEN;
  TOKEN = ADMIN_TOKEN;

  r = await request('GET', '/admin/stats');
  log('📊', 'GET admin/stats', r, `users=${r.body?.data?.users?.total || 0}, rides=${r.body?.data?.rides?.total || 0}`);
  test(r.status === 200 && r.body?.data?.users);

  r = await request('GET', '/admin/users');
  log('👥', 'GET admin/users', r, `${(r.body?.data || []).length} usuarios`);
  test(r.status === 200 && (r.body?.data || []).length > 0);

  // Restore Carlos token
  TOKEN = savedToken;

  // =================== REPORTS ===================
  console.log('\n🚩 REPORTS MODULE');
  
  TOKEN = ADMIN_TOKEN;
  r = await request('GET', '/reports');
  log('🚩', 'GET reports', r, `${(r.body?.data || []).length} reportes`);
  test(r.status === 200);
  TOKEN = savedToken;

  // =================== REGISTER FLOW ===================
  console.log('\n🆕 REGISTER + VERIFY FLOW');
  
  TOKEN = '';
  const testEmail = `test.${Date.now()}@uride.edu.ec`;
  r = await request('POST', '/auth/register', { email: testEmail, name: 'Test User', password: 'Test1234!' });
  log('📝', 'POST register', r, r.body?.data?.verificationCode ? `code=${r.body.data.verificationCode}` : '');
  test(r.status === 201 && r.body?.success);
  
  const code = r.body?.data?.verificationCode;
  if (code) {
    r = await request('POST', '/auth/verify-email', { email: testEmail, code });
    log('✅', 'POST verify-email', r, r.body?.data?.message || '');
    test(r.status === 200 && r.body?.success);

    // Login with new user
    r = await request('POST', '/auth/login', { email: testEmail, password: 'Test1234!' });
    log('🔑', 'Login new user', r, r.body?.data?.user?.name || '');
    test(r.status === 200 && r.body?.success);
  }

  // =================== SUMMARY ===================
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  📊 RESULTADOS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`  ${failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}`);
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
