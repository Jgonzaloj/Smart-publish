module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['**/src/**/*.spec.ts', '**/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/e2e/'],
  clearMocks: true,
  forceExit: true,
  detectOpenHandles: false
};
