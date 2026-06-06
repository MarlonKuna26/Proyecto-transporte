// jest.unit.setup.js - Configure environment for unit tests
// Unit tests should NEVER connect to real database - use mocks ONLY
const path = require('path');
const dotenv = require('dotenv');

// Load .env.unit - which does NOT have DB credentials
dotenv.config({ path: path.resolve(__dirname, '.env.unit') });

// Set test environment
process.env.NODE_ENV = 'test';

// Explicitly DISABLE database connection attempts
// If these are undefined, DatabaseConnection won't try to connect
delete process.env.DB_HOST;
delete process.env.DB_PORT;
delete process.env.DB_USER;
delete process.env.DB_PASSWORD;
delete process.env.DB_NAME;

// Ensure JWT secrets are set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_unit_key_12345';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_unit_key_12345';
process.env.EMAIL_DEV_MODE = 'true';

console.log('\n=================================');
console.log('🧪 Unit Test Environment Configuration');
console.log('=================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_HOST: ${process.env.DB_HOST || '❌ NOT SET (tests use mocks)'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || '❌ NOT SET (tests use mocks)'}`);
console.log('✅ Database connection disabled - all DB operations must be mocked');
console.log('=================================\n');

// Mock the database module to prevent any real connections
jest.mock('../src/config/database', () => ({
  DatabaseConnection: {
    getInstance: jest.fn(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    })),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }
}), { virtual: true });
