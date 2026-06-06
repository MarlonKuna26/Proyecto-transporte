// jest.integration.setup.js - Versión flexible
// Tomar variables de entorno, o usar defaults que coincidan con docker-compose
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5434';      // Coincide con docker-compose
process.env.DB_USER = process.env.DB_USER || 'postgres';   // Coincide con docker-compose
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '182004';
process.env.DB_NAME = process.env.DB_NAME || 'u_ride_esp'; // Coincide con docker-compose
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.EMAIL_DEV_MODE = process.env.EMAIL_DEV_MODE || 'true';

// Log para debugging
console.log('\n=================================');
console.log('🧪 Test Environment Configuration');
console.log('=================================');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PASSWORD: ${'*'.repeat(process.env.DB_PASSWORD?.length || 0)}`);
console.log('=================================\n');