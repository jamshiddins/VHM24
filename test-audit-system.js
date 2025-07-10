const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

logger.info('🔍 Тестирование системы аудита VHM24...\n');

const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:3009';
const TEST_USER_ID = 'test-user-123';
const TEST_SESSION_ID = 'test-session-456';

async function testAuditService() {
  try {
    logger.info('📡 Проверка доступности сервиса аудита...');
    
    // Проверка health endpoint
    const healthResponse = await axios.get(`${AUDIT_SERVICE_URL}/health`);
    logger.info('✅ Сервис аудита доступен:', healthResponse.data);

    // Тест логирования действия
    logger.info('\n📝 Тестирование логирования действия...');
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
    logger.info('✅ Действие залогировано:', logResponse.data);

    // Тест получения логов
    logger.info('\n📊 Тестирование получения логов...');
    const logsResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/audit/logs?limit=5`);
    logger.info('✅ Логи получены:', logsResponse.data.logs.length, 'записей');

    // Тест статистики активности
    logger.info('\n📈 Тестирование статистики активности...');
    const statsResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/audit/stats/activity`);
    logger.info('✅ Статистика получена:', statsResponse.data);

    // Тест логирования изменений данных
    logger.info('\n🔄 Тестирование логирования изменений данных...');
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
    logger.info('✅ Изменения данных залогированы:', dataChangeResponse.data);

    // Тест незаполненных данных
    logger.info('\n📋 Тестирование незаполненных данных...');
    const incompleteDataResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/incomplete-data/`);
    logger.info('✅ Незаполненные данные получены:', incompleteDataResponse.data.data.length, 'записей');

    // Тест валидации
    logger.info('\n✔️ Тестирование валидации...');
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
    logger.info('✅ Валидация выполнена:', validationResponse.data);

    // Тест отчетов
    logger.info('\n📊 Тестирование отчетов...');
    const reportResponse = await axios.get(`${AUDIT_SERVICE_URL}/api/reports/system-activity`);
    logger.info('✅ Отчет системной активности получен:', reportResponse.data);

    logger.info('\n🎉 Все тесты системы аудита прошли успешно!');

  } catch (error) {
    logger.error('❌ Ошибка при тестировании системы аудита:', error.message);
    if (error.response) {
      logger.error('Статус:', error.response.status);
      logger.error('Данные:', error.response.data);
    }
    process.exit(1);
  }
}

async function testDatabase() {
  try {
    logger.info('\n🗄️ Тестирование базы данных...');

    // Проверка подключения к базе данных
    await prisma.$connect();
    logger.info('✅ Подключение к базе данных установлено');

    // Проверка существования таблиц аудита
    const auditLogs = await prisma.systemAuditLog.findMany({
      take: 1
    });
    logger.info('✅ Таблица SystemAuditLog доступна');

    const incompleteLogs = await prisma.incompleteDataLog.findMany({
      take: 1
    });
    logger.info('✅ Таблица IncompleteDataLog доступна');

    const userSessions = await prisma.userSession.findMany({
      take: 1
    });
    logger.info('✅ Таблица UserSession доступна');

    const validationLogs = await prisma.dataValidationLog.findMany({
      take: 1
    });
    logger.info('✅ Таблица DataValidationLog доступна');

    logger.info('✅ Все таблицы аудита доступны');

  } catch (error) {
    logger.error('❌ Ошибка при тестировании базы данных:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function testMiddleware() {
  try {
    logger.info('\n🔧 Тестирование middleware...');

    const AuditMiddleware = require('./packages/shared/middleware/auditMiddleware');
    const auditMiddleware = new AuditMiddleware();

    // Тест генерации ID сессии
    const sessionId = auditMiddleware.generateSessionId();
    logger.info('✅ ID сессии сгенерирован:', sessionId);

    // Тест определения действия из HTTP метода
    const action = auditMiddleware.getActionFromMethod('POST');
    logger.info('✅ Действие определено:', action);

    // Тест определения сущности из URL
    const entity = auditMiddleware.getEntityFromUrl('/api/users/123');
    logger.info('✅ Сущность определена:', entity);

    // Тест валидации ID
    const isValidId = auditMiddleware.isValidId('123');
    logger.info('✅ Валидация ID:', isValidId);

    // Тест очистки чувствительных данных
    const testData = {
      name: 'Test User',
      password: '${process.env.PASSWORD_117}',
      email: 'test@example.com'
    };
    const sanitized = auditMiddleware.removeSensitiveFields(testData, ['password']);
    logger.info('✅ Данные очищены:', sanitized);

    logger.info('✅ Middleware работает корректно');

  } catch (error) {
    logger.error('❌ Ошибка при тестировании middleware:', error.message);
    process.exit(1);
  }
}

async function runAllTests() {
  logger.info('🚀 Запуск полного тестирования системы аудита VHM24\n');
  
  await testDatabase();
  await testMiddleware();
  await testAuditService();
  
  logger.info('\n🎊 Все тесты завершены успешно!');
  logger.info('📋 Система аудита готова к использованию');
  
  process.exit(0);
}

// Запуск тестов
runAllTests().catch((error) => {
  logger.error('💥 Критическая ошибка при тестировании:', error);
  process.exit(1);
});
