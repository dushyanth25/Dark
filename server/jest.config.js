module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],
  coverageReporters: ['lcov', 'text', 'html', 'json-summary'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  collectCoverage: true,
  coverageThreshold: {
  global: {
    statements: 30,
    branches: 25,
    functions: 30,
    lines: 30,
  },
},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {},
};
