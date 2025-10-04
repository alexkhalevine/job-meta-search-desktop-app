/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/main/**/*.ts',
    'src/utils/**/*.ts',
    '!src/preload/**/*.ts',
    '!src/renderer/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/out/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000
}
