const request = require('supertest');
const express = require('express');
const { createClient } = require('redis');
const { PrismaClient } = require('@prisma/client');

// Мокаем модули
jest.mock('redis');
jest.mock('@prisma/client');

// Импортируем маршрут для проверки здоровья
// Предполагаем, что маршрут находится в backend/src/routes/health.js
const healthRoute = require('../backend/src/routes/health');

describe('Health Check API', () => {
  let app;
  
  beforeEach(() => {
    // Создаем экземпляр Express приложения для тестов
    app = express();
    
    // Регистрируем маршрут для проверки здоровья
    app.use('/api/health', healthRoute);
  });
  
  it('should return 200 OK with status information', async () => {
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем статус ответа
    expect(response.status).toBe(200);
    
    // Проверяем структуру ответа
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
    
    // Проверяем значения в ответе
    expect(response.body.status).toBe('OK');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('redis');
    expect(response.body.services).toHaveProperty('telegram');
  });
  
  it('should handle database connection errors', async () => {
    // Мокаем ошибку подключения к базе данных
    PrismaClient.mockImplementation(() => ({
      $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection error')),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    }));
    
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем статус ответа (должен быть 200, так как это проверка здоровья)
    expect(response.status).toBe(200);
    
    // Проверяем значения в ответе
    expect(response.body.services.database).toBe('ERROR');
  });
  
  it('should handle Redis connection errors', async () => {
    // Мокаем ошибку подключения к Redis
    createClient.mockReturnValue({
      connect: jest.fn().mockRejectedValue(new Error('Redis connection error')),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    });
    
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем статус ответа (должен быть 200, так как это проверка здоровья)
    expect(response.status).toBe(200);
    
    // Проверяем значения в ответе
    expect(response.body.services.redis).toBe('ERROR');
  });
});
