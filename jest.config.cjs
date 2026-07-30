module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  testTimeout: 15000,
  moduleNameMapper: {
    '\\.(css|less|scss|sass|png|jpg|jpeg|gif|svg)$': '<rootDir>/src/test/fileMock.ts'
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
      useESM: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};
