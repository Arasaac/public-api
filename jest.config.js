module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  moduleNameMapper: {
    "@arasaac/(.*)": "<rootDir>/src/$1"
  },
};
