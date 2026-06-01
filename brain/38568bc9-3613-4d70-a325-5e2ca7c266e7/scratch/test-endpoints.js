const jwt = require('c:/Users/ASUS/OneDrive/Escritorio/Proyecto-transporte/packages/backend/node_modules/jsonwebtoken');

// Generate token for a user
const secret = 'local-dev-super-secret-key';
const payload = { userId: '74152a65-10e2-4376-8877-1ccd38654dbf', email: 'test@example.com', role: 'STUDENT' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('JWT Token:', token);

const fs = require('fs');
let logContent = '';
function log(msg, ...args) {
  const line = msg + ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
  console.log(line);
  logContent += line + '\n';
}

async function test() {
  log('Testing passengers endpoint...');
  const res1 = await fetch('http://localhost:3002/api/v1/ride-requests/ride/d126bb75-8162-49ec-be02-8469345aa944/passengers', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  log('Status code:', res1.status);
  const data1 = await res1.json();
  log('Response body:', data1);

  // Test profile endpoint
  log('\nTesting profile endpoint...');
  const res2 = await fetch('http://localhost:3002/api/v1/users/profile/74152a65-10e2-4376-8877-1ccd38654dbf', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  log('Status code:', res2.status);
  const data2 = await res2.json();
  log('Response body:', data2);

  fs.writeFileSync('C:/Users/ASUS/OneDrive/Escritorio/Proyecto-transporte/brain/38568bc9-3613-4d70-a325-5e2ca7c266e7/scratch/test-output.txt', logContent);
}

test().catch(console.error);
