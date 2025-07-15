// Загрузка переменных окружения из .env.test
require('dotenv').config({ path: '.env.test' });

// Глобальные настройки для всех тестов
jest.setTimeout(30000); // Увеличиваем таймаут для тестов до 30 секунд

// Мокаем консоль для уменьшения вывода в тестах
global.console = {
  ...console,
  // Отключаем вывод логов в тестах, но оставляем ошибки
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  // Оставляем вывод ошибок
  error: console.error,
};

// Функция для очистки всех моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});

// Глобальная функция для ожидания
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Мок для Redis
jest.mock('redis', () => {
  const redisMock = {
    createClient: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      publish: jest.fn().mockResolvedValue(1),
      subscribe: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      info: jest.fn().mockResolvedValue('redis_version:7.0.0'),
    }),
  };
  return redisMock;
});

// Мок для Prisma
jest.mock('@prisma/client', () => {
  const prismaMock = {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([{ version: 'PostgreSQL 15.0' }]),
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      task: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      machine: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    })),
  };
  return prismaMock;
});

// Мок для Telegraf
jest.mock('telegraf', () => {
  const telegrafMock = {
    Telegraf: jest.fn().mockImplementation(() => ({
      launch: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      telegram: {
        setWebhook: jest.fn().mockResolvedValue(true),
        getWebhookInfo: jest.fn().mockResolvedValue({}),
      },
      use: jest.fn(),
      command: jest.fn(),
      action: jest.fn(),
      hears: jest.fn(),
      on: jest.fn(),
    })),
    Markup: {
      inlineKeyboard: jest.fn().mockReturnValue({}),
    },
    session: jest.fn(),
    Scenes: {
      Stage: jest.fn().mockImplementation(() => ({
        register: jest.fn(),
      })),
      BaseScene: jest.fn().mockImplementation(() => ({
        enter: jest.fn(),
        leave: jest.fn(),
        command: jest.fn(),
        action: jest.fn(),
        hears: jest.fn(),
        on: jest.fn(),
      })),
    },
  };
  return telegrafMock;
});
