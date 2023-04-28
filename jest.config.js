module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@arasaac/(.*)": "<rootDir>/src/$1"
  },
};