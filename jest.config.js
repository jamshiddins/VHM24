module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'packages/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  // Увеличиваем таймаут для тестов
  testTimeout: 30000,
  // Игнорируем node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(fast-jwt|canvas|skia-canvas)/)'
  ],
  // Мокаем модули, которые вызывают проблемы
  moduleNameMapper: {
    '^canvas$': '<rootDir>/mocks/canvas.js',
    '^skia-canvas$': '<rootDir>/mocks/canvas.js',
    '^fast-jwt$': '<rootDir>/mocks/jwt.js'
  },
  // Отключаем трансформацию для ускорения тестов
  transform: {}
};
