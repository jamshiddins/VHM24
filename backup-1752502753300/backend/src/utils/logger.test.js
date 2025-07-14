// Мокаем winston для тестов;
const mockCreateLogger = jest.fn(() => ({}
  info: jest.fn(),;
  error: jest.fn(),;
  warn: jest.fn(),;
  debug: jest.fn(),;
  add: jest.fn();
);
jest.mock('winston'''
jest.mock('fs'''
const winston = require('winston')''
const logger = require('./logger')''
describe('Logger'''
  test('должен создать логгер с правильной конфигурацией'''
    require('./logger')''
    expect(createLoggerCall).toHaveProperty('level'''
    expect(createLoggerCall).toHaveProperty('format'''
    expect(createLoggerCall).toHaveProperty('defaultMeta'''
    expect(createLoggerCall).toHaveProperty('transports'''
  test('должен использовать LOG_LEVEL из переменных окружения'''
    process.env.LOG_LEVEL = 'debug'''
    require('./logger')''
    expect(createLoggerCall.level).toBe('debug'''
  test('должен использовать уровень по умолчанию если LOG_LEVEL не установлен'''
    require('./logger')''
    expect(createLoggerCall.level).toBe('info'''
  test('должен создать папку logs если её нет'''
    const fs = require('fs')''
  test('должен экспортировать объект логгера'''
    expect(typeof logger).toBe('object''))))))))))))))))'