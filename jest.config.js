module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/simple-tests.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/services/',
    '/packages/',
    'tests/auth/',
    'tests/data-import/',
    'tests/gateway/',
    'tests/inventory/',
    'tests/machines/',
    'tests/monitoring/',
    'tests/notifications/',
    'tests/routes/',
    'tests/tasks/',
    'tests/telegram-bot/',
    'tests/warehouse/'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/src/utils/logger.js',
    'check-env.js',
    'scripts/cleanup-analysis.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.test.js'
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
