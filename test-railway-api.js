const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

/**
 * Тестирование VHM24 API на Railway
 * Использование: node test-railway-api.js
 */

const https = require('https');

const API_URL = 'https://vhm24-production.up.railway.app';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Функция для выполнения HTTP запроса
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Тесты
async function runTests() {
  logger.info(`${colors.blue}🧪 Тестирование VHM24 API на Railway${colors.reset}\n`);
  logger.info(`URL: ${API_URL}\n`);
  
  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      check: (res) => res.status === 200 && res.data.status === 'ok'
    },
    {
      name: 'Database Connection',
      path: '/api/v1/test-db',
      check: (res) => res.status === 200 && res.data.success === true
    },
    {
      name: 'Auth Service',
      path: '/api/v1/auth/health',
      check: (res) => res.status === 200
    },
    {
      name: 'Machines Service',
      path: '/api/v1/machines',
      check: (res) => res.status === 200 || res.status === 401 // 401 если требует авторизацию
    },
    {
      name: 'Inventory Service',
      path: '/api/v1/inventory',
      check: (res) => res.status === 200 || res.status === 401
    },
    {
      name: 'Tasks Service',
      path: '/api/v1/tasks',
      check: (res) => res.status === 200 || res.status === 401
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      logger.info(`Testing: ${test.name}...`);
      const result = await makeRequest(test.path);
      
      if (test.check(result)) {
        logger.info(`${colors.green}✅ ${test.name} - PASSED${colors.reset}`);
        if (result.data) {
          logger.info(`   Response: ${JSON.stringify(result.data, null, 2).split('\n').join('\n   ')}`);
        }
        passed++;
      } else {
        logger.info(`${colors.red}❌ ${test.name} - FAILED${colors.reset}`);
        logger.info(`   Status: ${result.status}`);
        logger.info(`   Response: ${JSON.stringify(result.data, null, 2).split('\n').join('\n   ')}`);
        failed++;
      }
    } catch (error) {
      logger.info(`${colors.red}❌ ${test.name} - ERROR${colors.reset}`);
      logger.info(`   Error: ${error.message}`);
      failed++;
    }
    
    logger.info('');
  }
  
  // Итоги
  logger.info(`${colors.blue}📊 Результаты тестирования:${colors.reset}`);
  logger.info(`${colors.green}Passed: ${passed}${colors.reset}`);
  logger.info(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  // Рекомендации
  if (failed > 0) {
    logger.info(`\n${colors.yellow}💡 Рекомендации:${colors.reset}`);
    
    const healthResult = await makeRequest('/health').catch(() => null);
    if (healthResult && healthResult.data) {
      // Проверяем статус БД
      if (healthResult.data.dbStatus !== 'connected') {
        logger.info('1. База данных не подключена - проверьте DATABASE_URL в Railway Variables');
      }
      
      // Проверяем сервисы
      const offlineServices = Object.entries(healthResult.data.services || {})
        .filter(([_, status]) => status !== 'ok')
        .map(([name]) => name);
        
      if (offlineServices.length > 0) {
        logger.info(`2. Сервисы offline: ${offlineServices.join(', ')}`);
        logger.info('   Проверьте логи: railway logs');
      }
    } else {
      logger.info('1. API Gateway не отвечает - проверьте деплой и логи');
    }
    
    logger.info('\nИспользуйте команду: railway logs -f');
  } else {
    logger.info(`\n${colors.green}🎉 Все тесты пройдены успешно!${colors.reset}`);
    logger.info('API готов к использованию.');
  }
}

// Запуск тестов
runTests().catch(error => {
  logger.error(`${colors.red}Критическая ошибка:${colors.reset}`, error);
  process.exit(1);
});
