module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testMatch: ['<rootDir>/test/**/*.test.ts?(x)'],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
    ],
    rootDir: './',
  };