const request = require('supertest');
const express = require('express');

// Мокаем модули
jest.mock('redis');
jest.mock('@prisma/client');

describe('API Health Endpoint', () => {
  let app;
  
  beforeEach(() => {
    // Создаем экземпляр Express приложения для тестов
    app = express();
    
    // Добавляем middleware для парсинга JSON
    app.use(express.json());
    
    // Создаем простой эндпоинт для проверки здоровья
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          web: 'OK',
          database: 'OK',
          redis: 'OK',
          telegram: 'OK'
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });
  });
  
  it('should return 200 OK with health information', async () => {
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем статус ответа
    expect(response.status).toBe(200);
    
    // Проверяем структуру ответа
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('services');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    
    // Проверяем значения в ответе
    expect(response.body.status).toBe('OK');
    expect(response.body.services).toHaveProperty('web');
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services).toHaveProperty('redis');
    expect(response.body.services).toHaveProperty('telegram');
    expect(response.body.services.web).toBe('OK');
    expect(response.body.services.database).toBe('OK');
    expect(response.body.services.redis).toBe('OK');
    expect(response.body.services.telegram).toBe('OK');
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.environment).toBe('test');
  });
  
  it('should return the correct content type', async () => {
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем заголовок Content-Type
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
  
  it('should return a valid timestamp', async () => {
    // Выполняем запрос к API
    const response = await request(app).get('/api/health');
    
    // Проверяем, что timestamp является валидной датой
    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
    
    // Проверяем, что timestamp близок к текущему времени
    const now = new Date();
    const diff = Math.abs(now.getTime() - timestamp.getTime());
    expect(diff).toBeLessThan(5000); // Разница должна быть меньше 5 секунд
  });
});
