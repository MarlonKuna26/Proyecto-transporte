module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1'
  },

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  setupFilesAfterEnv: ['<rootDir>/jest.unit.setup.js'],

  moduleDirectories: ['node_modules', 'src'],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'clover'],

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};