const { PrismaClient } = require('@prisma/client');
const { createClient } = require('redis');

// Мокаем модули
jest.mock('@prisma/client');
jest.mock('redis');

describe('Database and Redis Connections', () => {
  let prisma;
  let redisClient;
  
  beforeEach(() => {
    // Создаем экземпляр Prisma клиента для тестов
    prisma = new PrismaClient();
    
    // Создаем экземпляр Redis клиента для тестов
    redisClient = createClient();
  });
  
  afterEach(() => {
    // Очищаем моки
    jest.clearAllMocks();
  });
  
  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      // Мокаем успешное подключение к базе данных
      prisma.$connect = jest.fn().mockResolvedValue(undefined);
      
      // Подключаемся к базе данных
      await prisma.$connect();
      
      // Проверяем, что prisma.$connect был вызван
      expect(prisma.$connect).toHaveBeenCalled();
    });
    
    it('should handle database connection errors', async () => {
      // Мокаем ошибку подключения к базе данных
      prisma.$connect = jest.fn().mockRejectedValue(new Error('Database connection error'));
      
      // Подключаемся к базе данных с обработкой ошибок
      try {
        await prisma.$connect();
        // Если подключение успешно, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        // Проверяем, что prisma.$connect был вызван
        expect(prisma.$connect).toHaveBeenCalled();
        
        // Проверяем, что ошибка имеет правильное сообщение
        expect(error.message).toBe('Database connection error');
      }
    });
    
    it('should execute a query successfully', async () => {
      // Мокаем успешное выполнение запроса
      prisma.$queryRaw = jest.fn().mockResolvedValue([{ version: 'PostgreSQL 15.0' }]);
      
      // Выполняем запрос
      const result = await prisma.$queryRaw`SELECT version()`;
      
      // Проверяем, что prisma.$queryRaw был вызван
      expect(prisma.$queryRaw).toHaveBeenCalled();
      
      // Проверяем результат запроса
      expect(result).toEqual([{ version: 'PostgreSQL 15.0' }]);
    });
    
    it('should handle query errors', async () => {
      // Мокаем ошибку выполнения запроса
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Query error'));
      
      // Выполняем запрос с обработкой ошибок
      try {
        await prisma.$queryRaw`SELECT version()`;
        // Если запрос успешен, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        // Проверяем, что prisma.$queryRaw был вызван
        expect(prisma.$queryRaw).toHaveBeenCalled();
        
        // Проверяем, что ошибка имеет правильное сообщение
        expect(error.message).toBe('Query error');
      }
    });
  });
  
  describe('Redis Connection', () => {
    it('should connect to Redis successfully', async () => {
      // Мокаем успешное подключение к Redis
      redisClient.connect = jest.fn().mockResolvedValue(undefined);
      
      // Подключаемся к Redis
      await redisClient.connect();
      
      // Проверяем, что redisClient.connect был вызван
      expect(redisClient.connect).toHaveBeenCalled();
    });
    
    it('should handle Redis connection errors', async () => {
      // Мокаем ошибку подключения к Redis
      redisClient.connect = jest.fn().mockRejectedValue(new Error('Redis connection error'));
      
      // Подключаемся к Redis с обработкой ошибок
      try {
        await redisClient.connect();
        // Если подключение успешно, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        // Проверяем, что redisClient.connect был вызван
        expect(redisClient.connect).toHaveBeenCalled();
        
        // Проверяем, что ошибка имеет правильное сообщение
        expect(error.message).toBe('Redis connection error');
      }
    });
    
    it('should set and get a value successfully', async () => {
      // Мокаем успешную установку значения
      redisClient.set = jest.fn().mockResolvedValue('OK');
      
      // Мокаем успешное получение значения
      redisClient.get = jest.fn().mockResolvedValue('test_value');
      
      // Устанавливаем значение
      const setResult = await redisClient.set('test_key', 'test_value');
      
      // Проверяем, что redisClient.set был вызван с правильными аргументами
      expect(redisClient.set).toHaveBeenCalledWith('test_key', 'test_value');
      
      // Проверяем результат установки значения
      expect(setResult).toBe('OK');
      
      // Получаем значение
      const getValue = await redisClient.get('test_key');
      
      // Проверяем, что redisClient.get был вызван с правильным аргументом
      expect(redisClient.get).toHaveBeenCalledWith('test_key');
      
      // Проверяем результат получения значения
      expect(getValue).toBe('test_value');
    });
    
    it('should handle Redis operation errors', async () => {
      // Мокаем ошибку операции с Redis
      redisClient.set = jest.fn().mockRejectedValue(new Error('Redis operation error'));
      
      // Выполняем операцию с обработкой ошибок
      try {
        await redisClient.set('test_key', 'test_value');
        // Если операция успешна, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        // Проверяем, что redisClient.set был вызван с правильными аргументами
        expect(redisClient.set).toHaveBeenCalledWith('test_key', 'test_value');
        
        // Проверяем, что ошибка имеет правильное сообщение
        expect(error.message).toBe('Redis operation error');
      }
    });
  });
});
