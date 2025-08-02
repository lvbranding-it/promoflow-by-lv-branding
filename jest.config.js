module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\.(ts|tsx)$' : ['babel-jest', { presets: [['@babel/preset-env', {targets: {node: 'current'}}], '@babel/preset-typescript', ['@babel/preset-react', {runtime: 'automatic'}]] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
    '/.next/'
  ],
};