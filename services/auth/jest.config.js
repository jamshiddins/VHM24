/**
 * Jest Configuration for VHM24 Auth Service
 * Production-ready тестовая конфигурация
 */

module.exports = {
  // Тестовая среда
  testEnvironment: 'node',
  
  // Паттерны для поиска тестов
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Игнорируемые папки
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Покрытие кода
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Файлы для анализа покрытия
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Пороги покрытия
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Настройка для работы с ES modules и CommonJS
  transform: {},
  extensionsToTreatAsEsm: [],
  
  // Моки и setup
  setupFilesAfterEnv: [],
  
  // Таймауты
  testTimeout: 10000,
  
  // Очистка моков между тестами
  clearMocks: true,
  restoreMocks: true,
  
  // Подробный вывод
  verbose: true,
  
  // Остановка на первой ошибке в CI
  bail: process.env.CI ? 1 : 0,
  
  // Параллельное выполнение
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Глобальные переменные для тестов
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};
