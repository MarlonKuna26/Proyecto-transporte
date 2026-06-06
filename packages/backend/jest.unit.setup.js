// jest.unit.setup.js - Configure environment for unit tests
// Unit tests should NOT connect to real database - use mocks instead
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5434';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '182004';
process.env.DB_NAME = process.env.DB_NAME || 'u_ride_esp';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_unit';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_unit';
process.env.EMAIL_DEV_MODE = process.env.EMAIL_DEV_MODE || 'true';

console.log('\n=================================');
console.log('🧪 Unit Test Environment Configuration');
console.log('=================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log('⚠️  NOTE: Unit tests should use mocks, not real DB connection');
console.log('=================================\n');
