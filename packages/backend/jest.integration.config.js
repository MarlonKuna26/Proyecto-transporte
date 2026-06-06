module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1'
  },
  testEnvironmentOptions: {},
  globalSetup: undefined,
  setupFiles: [],
  globals: {
    'process.env': {
      DB_HOST: 'u-ride-db',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: '182004',
      DB_NAME: 'u_ride_esp',
      NODE_ENV: 'test',
      JWT_SECRET: 'test_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
      EMAIL_DEV_MODE: 'true'
    }
  }
};