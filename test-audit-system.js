#!/usr/bin/env node

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Тестирование системы аудита VHM24...\n');

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3009';
const TEST_USER_ID = 'test-user-123';
const TEST_SESSION_ID = 'test-session-456';

async function testAuditService() {
  try {
    console.log('📡 Проверка доступности сервиса аудита...');
    
    // Проверка health endpoint
    const healthResponse = await axios.get(`${AUDIT_SERVICE_URL}/health`);
    console.log('✅ Сервис аудита доступен:', healthResponse.data);

    // Тест логирования действия
    console.log('\n📝 Тестирование логирования действия...');
    const logResponse = await axios.post(`${AUDIT_SERVICE_URL}/api/audit/log`, {
      userId: TEST_USER_ID,
      sessionId: TEST_SESSION_ID,
      action: 'CREATE',
      entity: 'TEST_ENTITY',
      entityId: 'test-entity-789',
      description: 'Тестовое создание сущности',
      inputData: { name: 'Test Entity', value: 123 },
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    console.log('✅ Действие залогировано:', logResponse.data);

    // Тест получения логов
    console.log('\n📊 Тестирование получения логов...');
    const logsResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/audit/logs?limit=5`);
    console.log('✅ Логи получены:', logsResponse.data.logs.length, 'записей');

    // Тест статистики активности
    console.log('\n📈 Тестирование статистики активности...');
    const statsResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/audit/stats/activity`);
    console.log('✅ Статистика получена:', statsResponse.data);

    // Тест логирования изменений данных
    console.log('\n🔄 Тестирование логирования изменений данных...');
    const dataChangeResponse = await axios.post(`${AUDIT_SERVICE_URL}/api/audit/log-data-change`, {
      entity: 'TEST_ENTITY',
      entityId: 'test-entity-789',
      oldData: { name: 'Old Name', value: 100 },
      newData: { name: 'New Name', value: 200 },
      action: 'UPDATE'
    }, {
      headers: {
        'x-user-id': TEST_USER_ID
      }
    });
    console.log('✅ Изменения данных залогированы:', dataChangeResponse.data);

    // Тест незаполненных данных
    console.log('\n📋 Тестирование незаполненных данных...');
    const incompleteDataResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/incomplete-data/`);
    console.log('✅ Незаполненные данные получены:', incompleteDataResponse.data.data.length, 'записей');

    // Тест валидации
    console.log('\n✔️ Тестирование валидации...');
    const validationResponse = await axios.post(`${AUDIT_SERVICE_URL}/api/audit/validate`, {
      entity: 'TEST_ENTITY',
      entityId: 'test-entity-789',
      fieldName: 'email',
      fieldValue: 'test@example.com',
      validationType: 'EMAIL'
    }, {
      headers: {
        'x-user-id': TEST_USER_ID
      }
    });
    console.log('✅ Валидация выполнена:', validationResponse.data);

    // Тест отчетов
    console.log('\n📊 Тестирование отчетов...');
    const reportResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/reports/system-activity`);
    console.log('✅ Отчет системной активности получен:', reportResponse.data);

    console.log('\n🎉 Все тесты системы аудита прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании системы аудита:', error.message);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
    }
    process.exit(1);
  }
}

async function testDatabase() {
  try {
    console.log('\n🗄️ Тестирование базы данных...');

    // Проверка подключения к базе данных
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');

    // Проверка существования таблиц аудита
    const auditLogs = await prisma.systemAuditLog.findMany({
      take: 1
    });
    console.log('✅ Таблица SystemAuditLog доступна');

    const incompleteLogs = await prisma.incompleteDataLog.findMany({
      take: 1
    });
    console.log('✅ Таблица IncompleteDataLog доступна');

    const userSessions = await prisma.userSession.findMany({
      take: 1
    });
    console.log('✅ Таблица UserSession доступна');

    const validationLogs = await prisma.dataValidationLog.findMany({
      take: 1
    });
    console.log('✅ Таблица DataValidationLog доступна');

    console.log('✅ Все таблицы аудита доступны');

  } catch (error) {
    console.error('❌ Ошибка при тестировании базы данных:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function testMiddleware() {
  try {
    console.log('\n🔧 Тестирование middleware...');

    const AuditMiddleware = require('./packages/shared/middleware/auditMiddleware');
    const auditMiddleware = new AuditMiddleware();

    // Тест генерации ID сессии
    const sessionId = auditMiddleware.generateSessionId();
    console.log('✅ ID сессии сгенерирован:', sessionId);

    // Тест определения действия из HTTP метода
    const action = auditMiddleware.getActionFromMethod('POST');
    console.log('✅ Действие определено:', action);

    // Тест определения сущности из URL
    const entity = auditMiddleware.getEntityFromUrl('/api/users/123');
    console.log('✅ Сущность определена:', entity);

    // Тест валидации ID
    const isValidId = auditMiddleware.isValidId('123');
    console.log('✅ Валидация ID:', isValidId);

    // Тест очистки чувствительных данных
    const testData = {
      name: 'Test User',
      password: 'secret123',
      email: 'test@example.com'
    };
    const sanitized = auditMiddleware.removeSensitiveFields(testData, ['password']);
    console.log('✅ Данные очищены:', sanitized);

    console.log('✅ Middleware работает корректно');

  } catch (error) {
    console.error('❌ Ошибка при тестировании middleware:', error.message);
    process.exit(1);
  }
}

async function runAllTests() {
  console.log('🚀 Запуск полного тестирования системы аудита VHM24\n');
  
  await testDatabase();
  await testMiddleware();
  await testAuditService();
  
  console.log('\n🎊 Все тесты завершены успешно!');
  console.log('📋 Система аудита готова к использованию');
  
  process.exit(0);
}

// Запуск тестов
runAllTests().catch((error) => {
  console.error('💥 Критическая ошибка при тестировании:', error);
  process.exit(1);
});
