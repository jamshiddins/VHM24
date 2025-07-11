const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const axios = require('axios');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      functionality: [],
      performance: [],
      stability: [],
      compatibility: [],
      errors: [],
      warnings: []
    };
    this.serverProcess = null;
    this.baseUrl = 'http://localhost:8000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colorMap = {
      info: colors.blue,
      success: colors.green,
      error: colors.red,
      warning: colors.yellow,
      test: colors.magenta
    };
    console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runAllTests() {
    this.log('🚀 Запуск полного тестирования VHM24', 'test');
    
    try {
      // 1. Тестирование совместимости
      await this.testCompatibility();
      
      // 2. Тестирование функциональности
      await this.testFunctionality();
      
      // 3. Тестирование производительности
      await this.testPerformance();
      
      // 4. Тестирование стабильности
      await this.testStability();
      
      // 5. Генерация отчета
      await this.generateReport();
      
    } catch (error) {
      this.log(`Критическая ошибка тестирования: ${error.message}`, 'error');
      this.results.errors.push({
        test: 'General',
        error: error.message,
        stack: error.stack
      });
    } finally {
      await this.cleanup();
    }
  }

  async testCompatibility() {
    this.log('🔧 Тестирование совместимости...', 'test');
    
    // Проверка Node.js версии
    try {
      const nodeVersion = process.version;
      this.log(`Node.js версия: ${nodeVersion}`, 'info');
      
      if (parseInt(nodeVersion.slice(1)) < 16) {
        this.results.compatibility.push({
          test: 'Node.js Version',
          status: 'FAIL',
          message: `Требуется Node.js >= 16, найдена ${nodeVersion}`
        });
      } else {
        this.results.compatibility.push({
          test: 'Node.js Version',
          status: 'PASS',
          message: `Node.js ${nodeVersion} совместим`
        });
      }
    } catch (error) {
      this.results.errors.push({
        test: 'Node.js Version Check',
        error: error.message
      });
    }

    // Проверка зависимостей
    try {
      this.log('Проверка зависимостей...', 'info');
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      this.results.compatibility.push({
        test: 'Dependencies Check',
        status: 'PASS',
        message: 'Все зависимости установлены корректно'
      });
    } catch (error) {
      this.results.compatibility.push({
        test: 'Dependencies Check',
        status: 'FAIL',
        message: 'Проблемы с зависимостями'
      });
    }

    // Проверка переменных окружения
    try {
      this.log('Проверка переменных окружения...', 'info');
      execSync('npm run check-env', { stdio: 'pipe' });
      this.results.compatibility.push({
        test: 'Environment Variables',
        status: 'PASS',
        message: 'Переменные окружения настроены корректно'
      });
    } catch (error) {
      this.results.compatibility.push({
        test: 'Environment Variables',
        status: 'WARN',
        message: 'Некоторые переменные окружения отсутствуют'
      });
    }

    // Проверка портов
    try {
      this.log('Проверка доступности портов...', 'info');
      const net = require('net');
      const checkPort = (port) => {
        return new Promise((resolve) => {
          const server = net.createServer();
          server.listen(port, () => {
            server.close(() => resolve(true));
          });
          server.on('error', () => resolve(false));
        });
      };

      const port8000Available = await checkPort(8000);
      const port3000Available = await checkPort(3000);

      this.results.compatibility.push({
        test: 'Port Availability',
        status: port8000Available && port3000Available ? 'PASS' : 'WARN',
        message: `Порт 8000: ${port8000Available ? 'доступен' : 'занят'}, Порт 3000: ${port3000Available ? 'доступен' : 'занят'}`
      });
    } catch (error) {
      this.results.errors.push({
        test: 'Port Check',
        error: error.message
      });
    }
  }

  async testFunctionality() {
    this.log('⚙️ Тестирование функциональности...', 'test');
    
    // Запуск backend сервера
    try {
      await this.startBackendServer();
      await this.sleep(3000); // Ждем запуска сервера
      
      // Тест health check
      await this.testHealthCheck();
      
      // Тест API endpoints
      await this.testApiEndpoints();
      
      // Тест базы данных
      await this.testDatabase();
      
      // Тест логирования
      await this.testLogging();
      
    } catch (error) {
      this.results.errors.push({
        test: 'Functionality Tests',
        error: error.message
      });
    }
  }

  async startBackendServer() {
    this.log('Запуск backend сервера...', 'info');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['backend/src/index.js'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('запущен на порту')) {
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        this.log(`Backend stderr: ${data}`, 'warning');
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      // Таймаут на запуск
      setTimeout(() => {
        reject(new Error('Таймаут запуска backend сервера'));
      }, 10000);
    });
  }

  async testHealthCheck() {
    try {
      this.log('Тестирование health check...', 'info');
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.status === 'ok') {
        this.results.functionality.push({
          test: 'Health Check',
          status: 'PASS',
          message: 'Health check работает корректно',
          responseTime: response.headers['x-response-time'] || 'N/A'
        });
      } else {
        this.results.functionality.push({
          test: 'Health Check',
          status: 'FAIL',
          message: 'Health check возвращает некорректный ответ'
        });
      }
    } catch (error) {
      this.results.functionality.push({
        test: 'Health Check',
        status: 'FAIL',
        message: `Health check недоступен: ${error.message}`
      });
    }
  }

  async testApiEndpoints() {
    this.log('Тестирование API endpoints...', 'info');
    
    const endpoints = [
      { path: '/api/v1/auth', method: 'GET', expectedStatus: [404, 405] },
      { path: '/api/v1/users', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/machines', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/tasks', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/inventory', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/recipes', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/dashboard', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/warehouse', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/audit', method: 'GET', expectedStatus: [401, 403, 200] },
      { path: '/api/v1/data-import', method: 'GET', expectedStatus: [401, 403, 200] }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${this.baseUrl}${endpoint.path}`,
          timeout: 5000,
          validateStatus: () => true // Не бросать ошибку на любой статус
        });

        const isExpectedStatus = endpoint.expectedStatus.includes(response.status);
        
        this.results.functionality.push({
          test: `API Endpoint ${endpoint.path}`,
          status: isExpectedStatus ? 'PASS' : 'WARN',
          message: `${endpoint.method} ${endpoint.path} вернул статус ${response.status}`,
          responseTime: response.headers['x-response-time'] || 'N/A'
        });
      } catch (error) {
        this.results.functionality.push({
          test: `API Endpoint ${endpoint.path}`,
          status: 'FAIL',
          message: `Ошибка запроса: ${error.message}`
        });
      }
    }
  }

  async testDatabase() {
    this.log('Тестирование подключения к базе данных...', 'info');
    
    try {
      // Загружаем переменные из .env файла
      require('dotenv').config();
      
      // Проверяем наличие DATABASE_URL
      if (!process.env.DATABASE_URL) {
        this.results.functionality.push({
          test: 'Database Connection',
          status: 'SKIP',
          message: 'DATABASE_URL не настроен'
        });
        return;
      }

      // Простая проверка подключения через Prisma
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      await prisma.$disconnect();
      
      this.results.functionality.push({
        test: 'Database Connection',
        status: 'PASS',
        message: 'Подключение к базе данных успешно'
      });
    } catch (error) {
      this.results.functionality.push({
        test: 'Database Connection',
        status: 'FAIL',
        message: `Ошибка подключения к БД: ${error.message}`
      });
    }
  }

  async testLogging() {
    this.log('Тестирование системы логирования...', 'info');
    
    try {
      const logger = require('./backend/src/utils/logger');
      
      // Проверяем, что logger экспортируется
      if (typeof logger.info === 'function' && typeof logger.error === 'function') {
        this.results.functionality.push({
          test: 'Logging System',
          status: 'PASS',
          message: 'Система логирования работает корректно'
        });
      } else {
        this.results.functionality.push({
          test: 'Logging System',
          status: 'FAIL',
          message: 'Logger не экспортирует необходимые методы'
        });
      }
    } catch (error) {
      this.results.functionality.push({
        test: 'Logging System',
        status: 'FAIL',
        message: `Ошибка загрузки logger: ${error.message}`
      });
    }
  }

  async testPerformance() {
    this.log('📊 Тестирование производительности...', 'test');
    
    // Тест времени отклика health check
    await this.testResponseTime();
    
    // Тест нагрузки
    await this.testLoadCapacity();
    
    // Тест памяти
    await this.testMemoryUsage();
  }

  async testResponseTime() {
    this.log('Тестирование времени отклика...', 'info');
    
    try {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
        const end = Date.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      this.results.performance.push({
        test: 'Response Time',
        status: avgTime < 100 ? 'PASS' : avgTime < 500 ? 'WARN' : 'FAIL',
        message: `Среднее время отклика: ${avgTime.toFixed(2)}ms (мин: ${minTime}ms, макс: ${maxTime}ms)`,
        metrics: { avg: avgTime, min: minTime, max: maxTime }
      });
    } catch (error) {
      this.results.performance.push({
        test: 'Response Time',
        status: 'FAIL',
        message: `Ошибка тестирования времени отклика: ${error.message}`
      });
    }
  }

  async testLoadCapacity() {
    this.log('Тестирование нагрузочной способности...', 'info');
    
    try {
      const concurrentRequests = 20;
      const promises = [];
      
      const start = Date.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.get(`${this.baseUrl}/health`, { timeout: 10000 })
            .catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.all(promises);
      const end = Date.now();
      
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      const totalTime = end - start;
      
      this.results.performance.push({
        test: 'Load Capacity',
        status: successful >= concurrentRequests * 0.9 ? 'PASS' : 'WARN',
        message: `${successful}/${concurrentRequests} запросов успешно за ${totalTime}ms`,
        metrics: { successful, failed, totalTime, concurrentRequests }
      });
    } catch (error) {
      this.results.performance.push({
        test: 'Load Capacity',
        status: 'FAIL',
        message: `Ошибка нагрузочного тестирования: ${error.message}`
      });
    }
  }

  async testMemoryUsage() {
    this.log('Тестирование использования памяти...', 'info');
    
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
      const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
      const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
      
      this.results.performance.push({
        test: 'Memory Usage',
        status: heapUsedMB < 100 ? 'PASS' : heapUsedMB < 200 ? 'WARN' : 'FAIL',
        message: `Heap: ${heapUsedMB}MB/${heapTotalMB}MB, RSS: ${rssMB}MB`,
        metrics: { heapUsed: heapUsedMB, heapTotal: heapTotalMB, rss: rssMB }
      });
    } catch (error) {
      this.results.performance.push({
        test: 'Memory Usage',
        status: 'FAIL',
        message: `Ошибка проверки памяти: ${error.message}`
      });
    }
  }

  async testStability() {
    this.log('🔒 Тестирование стабильности...', 'test');
    
    // Тест устойчивости к ошибкам
    await this.testErrorHandling();
    
    // Тест восстановления
    await this.testRecovery();
    
    // Тест длительной работы
    await this.testLongRunning();
  }

  async testErrorHandling() {
    this.log('Тестирование обработки ошибок...', 'info');
    
    try {
      // Тест несуществующего endpoint
      const response = await axios.get(`${this.baseUrl}/nonexistent`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 404) {
        this.results.stability.push({
          test: 'Error Handling - 404',
          status: 'PASS',
          message: '404 ошибки обрабатываются корректно'
        });
      } else {
        this.results.stability.push({
          test: 'Error Handling - 404',
          status: 'FAIL',
          message: `Ожидался статус 404, получен ${response.status}`
        });
      }
    } catch (error) {
      this.results.stability.push({
        test: 'Error Handling - 404',
        status: 'FAIL',
        message: `Ошибка тестирования 404: ${error.message}`
      });
    }

    try {
      // Тест некорректного JSON
      const response = await axios.post(`${this.baseUrl}/api/v1/auth`, 'invalid json', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status >= 400 && response.status < 500) {
        this.results.stability.push({
          test: 'Error Handling - Invalid JSON',
          status: 'PASS',
          message: 'Некорректный JSON обрабатывается корректно'
        });
      } else {
        this.results.stability.push({
          test: 'Error Handling - Invalid JSON',
          status: 'WARN',
          message: `Неожиданный статус для некорректного JSON: ${response.status}`
        });
      }
    } catch (error) {
      this.results.stability.push({
        test: 'Error Handling - Invalid JSON',
        status: 'FAIL',
        message: `Ошибка тестирования некорректного JSON: ${error.message}`
      });
    }
  }

  async testRecovery() {
    this.log('Тестирование восстановления...', 'info');
    
    try {
      // Проверяем, что сервер все еще отвечает после предыдущих тестов
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        this.results.stability.push({
          test: 'Recovery Test',
          status: 'PASS',
          message: 'Сервер восстанавливается после нагрузки'
        });
      } else {
        this.results.stability.push({
          test: 'Recovery Test',
          status: 'FAIL',
          message: 'Сервер не восстанавливается корректно'
        });
      }
    } catch (error) {
      this.results.stability.push({
        test: 'Recovery Test',
        status: 'FAIL',
        message: `Ошибка тестирования восстановления: ${error.message}`
      });
    }
  }

  async testLongRunning() {
    this.log('Тестирование длительной работы...', 'info');
    
    try {
      // Серия запросов в течение 30 секунд
      const duration = 30000; // 30 секунд
      const interval = 1000; // 1 секунда
      const start = Date.now();
      let successCount = 0;
      let errorCount = 0;
      
      while (Date.now() - start < duration) {
        try {
          await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
          successCount++;
        } catch (error) {
          errorCount++;
        }
        await this.sleep(interval);
      }
      
      const successRate = (successCount / (successCount + errorCount)) * 100;
      
      this.results.stability.push({
        test: 'Long Running Test',
        status: successRate >= 95 ? 'PASS' : successRate >= 80 ? 'WARN' : 'FAIL',
        message: `Успешность за 30 сек: ${successRate.toFixed(1)}% (${successCount}/${successCount + errorCount})`,
        metrics: { successCount, errorCount, successRate, duration }
      });
    } catch (error) {
      this.results.stability.push({
        test: 'Long Running Test',
        status: 'FAIL',
        message: `Ошибка длительного тестирования: ${error.message}`
      });
    }
  }

  async generateReport() {
    this.log('📋 Генерация отчета...', 'test');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0
      },
      results: this.results
    };

    // Подсчет статистики
    const allTests = [
      ...this.results.compatibility,
      ...this.results.functionality,
      ...this.results.performance,
      ...this.results.stability
    ];

    allTests.forEach(test => {
      report.summary.total++;
      switch (test.status) {
        case 'PASS':
          report.summary.passed++;
          break;
        case 'FAIL':
          report.summary.failed++;
          break;
        case 'WARN':
          report.summary.warnings++;
          break;
        case 'SKIP':
          report.summary.skipped++;
          break;
      }
    });

    // Сохранение отчета
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(report, null, 2));
    
    // Вывод результатов
    this.printResults(report);
  }

  printResults(report) {
    console.log('\n' + '='.repeat(80));
    this.log('📊 РЕЗУЛЬТАТЫ КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ', 'test');
    console.log('='.repeat(80));
    
    this.log(`Всего тестов: ${report.summary.total}`, 'info');
    this.log(`Пройдено: ${report.summary.passed}`, 'success');
    this.log(`Провалено: ${report.summary.failed}`, 'error');
    this.log(`Предупреждения: ${report.summary.warnings}`, 'warning');
    this.log(`Пропущено: ${report.summary.skipped}`, 'info');
    
    const successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
    this.log(`Успешность: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
    
    console.log('\n' + '-'.repeat(80));
    
    // Детальные результаты по категориям
    const categories = [
      { name: 'Совместимость', tests: this.results.compatibility },
      { name: 'Функциональность', tests: this.results.functionality },
      { name: 'Производительность', tests: this.results.performance },
      { name: 'Стабильность', tests: this.results.stability }
    ];
    
    categories.forEach(category => {
      if (category.tests.length > 0) {
        this.log(`\n${category.name}:`, 'test');
        category.tests.forEach(test => {
          const statusColor = {
            'PASS': 'success',
            'FAIL': 'error',
            'WARN': 'warning',
            'SKIP': 'info'
          }[test.status];
          this.log(`  ${test.status}: ${test.test} - ${test.message}`, statusColor);
        });
      }
    });
    
    // Ошибки
    if (this.results.errors.length > 0) {
      this.log('\nОшибки:', 'error');
      this.results.errors.forEach(error => {
        this.log(`  ${error.test}: ${error.error}`, 'error');
      });
    }
    
    console.log('\n' + '='.repeat(80));
    this.log('Отчет сохранен в comprehensive-test-report.json', 'info');
  }

  async cleanup() {
    this.log('🧹 Очистка ресурсов...', 'info');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await this.sleep(2000);
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Запуск тестирования
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ComprehensiveTestSuite;
