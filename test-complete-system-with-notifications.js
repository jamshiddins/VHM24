#!/usr/bin/env node

/**
 * VHM24 Complete System Test with Notifications & Audit
 * Комплексное тестирование всей системы включая уведомления и аудит
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Конфигурация тестирования
const config = {
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  testUser: {
    email: 'test@vhm24.com',
    password: 'Test123!',
    name: 'Test User',
    role: 'ADMIN'
  }
};

// Создаем HTTP клиент
const api = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authToken = null;

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Функция для выполнения HTTP запросов с обработкой ошибок
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const requestConfig = {
      method,
      url,
      headers: {
        ...headers,
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      }
    };

    if (data) {
      requestConfig.data = data;
    }

    const response = await api(requestConfig);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Тест аутентификации
async function testAuthentication() {
  log('\n🔐 Тестирование аутентификации...', 'cyan');

  // Попытка входа
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: config.testUser.email,
    password: config.testUser.password
  });

  if (loginResult.success && loginResult.data.data?.token) {
    authToken = loginResult.data.data.token;
    logSuccess('Аутентификация успешна');
    return true;
  } else {
    logWarning('Пользователь не найден, попытка регистрации...');
    
    // Попытка регистрации
    const registerResult = await makeRequest('POST', '/auth/register', config.testUser);
    
    if (registerResult.success) {
      logSuccess('Регистрация успешна');
      
      // Повторная попытка входа
      const secondLoginResult = await makeRequest('POST', '/auth/login', {
        email: config.testUser.email,
        password: config.testUser.password
      });
      
      if (secondLoginResult.success && secondLoginResult.data.data?.token) {
        authToken = secondLoginResult.data.data.token;
        logSuccess('Вход после регистрации успешен');
        return true;
      }
    }
    
    logError('Не удалось аутентифицироваться');
    return false;
  }
}

// Тест системы аудита
async function testAuditSystem() {
  log('\n🔍 Тестирование системы аудита...', 'cyan');

  try {
    // Проверяем доступность сервиса аудита
    const healthResult = await makeRequest('GET', '/audit/health');
    if (!healthResult.success) {
      logWarning('Сервис аудита недоступен');
      return false;
    }
    logSuccess('Сервис аудита доступен');

    // Получаем логи аудита
    const logsResult = await makeRequest('GET', '/audit/logs?limit=10');
    if (logsResult.success) {
      logSuccess(`Получено ${logsResult.data.data?.items?.length || 0} записей аудита`);
    }

    // Получаем незаполненные данные
    const incompleteResult = await makeRequest('GET', '/audit/incomplete-data?limit=5');
    if (incompleteResult.success) {
      logSuccess(`Найдено ${incompleteResult.data.data?.items?.length || 0} незаполненных записей`);
    }

    // Получаем отчеты
    const reportsResult = await makeRequest('GET', '/audit/reports/summary');
    if (reportsResult.success) {
      logSuccess('Отчеты аудита получены');
    }

    return true;
  } catch (error) {
    logError(`Ошибка тестирования аудита: ${error.message}`);
    return false;
  }
}

// Тест системы уведомлений
async function testNotificationSystem() {
  log('\n🔔 Тестирование системы уведомлений...', 'cyan');

  try {
    // Проверяем доступность сервиса уведомлений
    const healthResult = await makeRequest('GET', '/notifications/health');
    if (!healthResult.success) {
      logWarning('Сервис уведомлений недоступен');
      return false;
    }
    logSuccess('Сервис уведомлений доступен');

    // Тестируем отправку уведомления
    const notificationResult = await makeRequest('POST', '/notifications/send', {
      type: 'SYSTEM_ALERT',
      recipients: [config.testUser.email],
      data: {
        alertType: 'TEST_ALERT',
        message: 'Тестовое системное уведомление',
        timestamp: new Date().toISOString()
      }
    });

    if (notificationResult.success) {
      logSuccess('Уведомление отправлено успешно');
    } else {
      logWarning('Не удалось отправить уведомление');
    }

    // Получаем статистику уведомлений
    const statsResult = await makeRequest('GET', '/notifications/stats?period=7d');
    if (statsResult.success) {
      logSuccess('Статистика уведомлений получена');
    }

    // Получаем историю уведомлений
    const historyResult = await makeRequest('GET', '/notifications/history?take=5');
    if (historyResult.success) {
      logSuccess(`История уведомлений: ${historyResult.data.data?.items?.length || 0} записей`);
    }

    return true;
  } catch (error) {
    logError(`Ошибка тестирования уведомлений: ${error.message}`);
    return false;
  }
}

// Тест основных сервисов
async function testCoreServices() {
  log('\n🏗️ Тестирование основных сервисов...', 'cyan');

  const services = [
    { name: 'Machines', endpoint: '/machines' },
    { name: 'Inventory', endpoint: '/inventory' },
    { name: 'Tasks', endpoint: '/tasks' },
    { name: 'Routes', endpoint: '/routes' },
    { name: 'Warehouse', endpoint: '/warehouse' },
    { name: 'Recipes', endpoint: '/recipes' }
  ];

  let successCount = 0;

  for (const service of services) {
    const result = await makeRequest('GET', service.endpoint);
    if (result.success) {
      logSuccess(`${service.name} сервис работает`);
      successCount++;
    } else {
      logError(`${service.name} сервис недоступен (${result.status})`);
    }
  }

  logInfo(`Работающих сервисов: ${successCount}/${services.length}`);
  return successCount === services.length;
}

// Тест создания и управления данными
async function testDataOperations() {
  log('\n📊 Тестирование операций с данными...', 'cyan');

  try {
    // Создаем тестовую машину
    const machineResult = await makeRequest('POST', '/machines', {
      name: 'Test Machine',
      location: {
        address: 'Test Address',
        latitude: 41.2995,
        longitude: 69.2401
      },
      status: 'ONLINE'
    });

    let machineId = null;
    if (machineResult.success) {
      machineId = machineResult.data.data?.id;
      logSuccess('Тестовая машина создана');
    }

    // Создаем тестовую задачу
    const taskResult = await makeRequest('POST', '/tasks', {
      title: 'Test Task',
      description: 'Тестовая задача для проверки системы',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      machineId: machineId
    });

    let taskId = null;
    if (taskResult.success) {
      taskId = taskResult.data.data?.id;
      logSuccess('Тестовая задача создана');
    }

    // Создаем тестовый товар
    const inventoryResult = await makeRequest('POST', '/inventory', {
      name: 'Test Item',
      sku: 'TEST-001',
      quantity: 100,
      unit: 'шт',
      minQuantity: 10,
      price: 1000
    });

    if (inventoryResult.success) {
      logSuccess('Тестовый товар создан');
    }

    // Обновляем задачу
    if (taskId) {
      const updateResult = await makeRequest('PATCH', `/tasks/${taskId}`, {
        status: 'IN_PROGRESS'
      });
      
      if (updateResult.success) {
        logSuccess('Задача обновлена');
      }
    }

    return true;
  } catch (error) {
    logError(`Ошибка операций с данными: ${error.message}`);
    return false;
  }
}

// Тест интеграции между сервисами
async function testServiceIntegration() {
  log('\n🔗 Тестирование интеграции сервисов...', 'cyan');

  try {
    // Тестируем создание маршрута с остановками
    const routeResult = await makeRequest('POST', '/routes', {
      name: 'Test Route',
      description: 'Тестовый маршрут',
      status: 'PLANNED'
    });

    if (routeResult.success) {
      logSuccess('Маршрут создан');
      
      // Получаем список машин для маршрута
      const machinesResult = await makeRequest('GET', '/machines?limit=3');
      if (machinesResult.success && machinesResult.data.data?.length > 0) {
        logSuccess('Машины для маршрута получены');
      }
    }

    // Тестируем создание рецепта
    const recipeResult = await makeRequest('POST', '/recipes', {
      name: 'Test Recipe',
      description: 'Тестовый рецепт',
      ingredients: [
        { name: 'Ingredient 1', quantity: 100, unit: 'г' },
        { name: 'Ingredient 2', quantity: 50, unit: 'мл' }
      ],
      instructions: 'Тестовые инструкции'
    });

    if (recipeResult.success) {
      logSuccess('Рецепт создан');
    }

    return true;
  } catch (error) {
    logError(`Ошибка интеграции сервисов: ${error.message}`);
    return false;
  }
}

// Тест производительности
async function testPerformance() {
  log('\n⚡ Тестирование производительности...', 'cyan');

  const tests = [
    { name: 'Health Check', endpoint: '/health' },
    { name: 'Machines List', endpoint: '/machines?limit=10' },
    { name: 'Tasks List', endpoint: '/tasks?limit=10' },
    { name: 'Audit Logs', endpoint: '/audit/logs?limit=10' }
  ];

  for (const test of tests) {
    const startTime = Date.now();
    const result = await makeRequest('GET', test.endpoint);
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (result.success) {
      if (duration < 1000) {
        logSuccess(`${test.name}: ${duration}ms ✨`);
      } else if (duration < 3000) {
        logWarning(`${test.name}: ${duration}ms ⚠️`);
      } else {
        logError(`${test.name}: ${duration}ms 🐌`);
      }
    } else {
      logError(`${test.name}: FAILED`);
    }
  }

  return true;
}

// Генерация отчета
async function generateReport(results) {
  log('\n📋 Генерация отчета...', 'cyan');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    },
    details: results,
    recommendations: []
  };

  // Добавляем рекомендации
  if (!results.authentication) {
    report.recommendations.push('Настройте аутентификацию и создайте тестового пользователя');
  }
  if (!results.auditSystem) {
    report.recommendations.push('Запустите сервис аудита для полного функционала');
  }
  if (!results.notificationSystem) {
    report.recommendations.push('Настройте сервис уведомлений для алертов');
  }
  if (!results.coreServices) {
    report.recommendations.push('Проверьте запуск всех основных сервисов');
  }

  // Сохраняем отчет
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:', 'bright');
  log(`✅ Пройдено: ${report.summary.passed}`, 'green');
  log(`❌ Провалено: ${report.summary.failed}`, 'red');
  log(`📈 Успешность: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`, 'blue');
  
  if (report.recommendations.length > 0) {
    log('\n💡 Рекомендации:', 'yellow');
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
  }

  log(`\n📄 Подробный отчет сохранен: ${reportPath}`, 'cyan');

  return report;
}

// Основная функция тестирования
async function runTests() {
  log('🚀 Запуск комплексного тестирования VHM24...', 'bright');
  log(`🌐 Базовый URL: ${config.baseURL}`, 'blue');

  const results = {};

  try {
    // Выполняем тесты последовательно
    results.authentication = await testAuthentication();
    results.auditSystem = await testAuditSystem();
    results.notificationSystem = await testNotificationSystem();
    results.coreServices = await testCoreServices();
    results.dataOperations = await testDataOperations();
    results.serviceIntegration = await testServiceIntegration();
    results.performance = await testPerformance();

    // Генерируем отчет
    const report = await generateReport(results);

    // Определяем общий результат
    const overallSuccess = Object.values(results).every(result => result === true);
    
    if (overallSuccess) {
      log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    logError(`Критическая ошибка тестирования: ${error.message}`);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  log('\n👋 Тестирование прервано пользователем', 'yellow');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Необработанная ошибка: ${reason}`);
  process.exit(1);
});

// Запуск тестов
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testAuthentication,
  testAuditSystem,
  testNotificationSystem,
  testCoreServices,
  testDataOperations,
  testServiceIntegration,
  testPerformance
};
