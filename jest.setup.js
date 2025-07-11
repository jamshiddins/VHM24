// jest.setup.js
// Не импортируем jest, так как он уже доступен глобально
// const { jest } = require('@jest/globals');

// Увеличиваем таймаут для тестов
jest.setTimeout(30000);

// Глобальные моки
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Map()
  })
);

// Мок для process.env
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/vhm24_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';

// Очистка моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
