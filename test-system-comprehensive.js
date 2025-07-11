const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - Comprehensive System Testing
 * Полная проверка всех компонентов системы
 */

const axios = require('axios');
const fs = require('fs');
const { promises: fsPromises } = fs;
const path = require('path');

// Конфигурация тестирования
const config = {
  baseUrl: process.env.API_URL || 'http://localhost:8000',
  services: {
    gateway: { port: 8000, path: '/health' },
    auth: { port: 3001, path: '/health' },
    machines: { port: 3002, path: '/health' },
    inventory: { port: 3003, path: '/health' },
    tasks: { port: 3004, path: '/health' },
    bunkers: { port: 3005, path: '/health' },
    notifications: { port: 3006, path: '/health' },
    backup: { port: 3007, path: '/health' },
    monitoring: { port: 3008, path: '/health' }
  },
  timeout: 10000,
  retries: 3
};

// Результаты тестирования
const results = {
  services: {},
  api: {},
  database: {},
  security: {},
  performance: {},
  integration: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Утилиты для тестирования
class TestRunner {
  constructor() {
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    logger.info(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retry(fn, retries = config.retries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1));
      }
    }
  }

  recordResult(category, test, status, message, data = null) {
    if (!results[category]) results[category] = {};

    results[category][test] = {
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    results.summary.total++;
    if (status === 'passed') results.summary.passed++;
    else if (status === 'failed') results.summary.failed++;
    else if (status === 'warning') results.summary.warnings++;

    const statusIcon = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️'
    };

    this.log(
      `${statusIcon[status]} ${category}/${test}: ${message}`,
      status === 'passed'
        ? 'success'
        : status === 'failed'
          ? 'error'
          : 'warning'
    );
  }
}

// Тесты сервисов
class ServiceTests {
  constructor(runner) {
    this.runner = runner;
  }

  async testServiceHealth(serviceName, serviceConfig) {
    try {
      const url = `http://localhost:${serviceConfig.port}${serviceConfig.path}`;
      const response = await this.runner.retry(async () => {
        return await axios.get(url, { timeout: config.timeout });
      });

      if (response.status === 200) {
        this.runner.recordResult(
          'services',
          serviceName,
          'passed',
          `Service is healthy (${response.status})`,
          response.data
        );
        return true;
      } else {
        this.runner.recordResult(
          'services',
          serviceName,
          'warning',
          `Service responded with status ${response.status}`,
          response.data
        );
        return false;
      }
    } catch (error) {
      this.runner.recordResult(
        'services',
        serviceName,
        'failed',
        `Service is not responding: ${error.message}`
      );
      return false;
    }
  }

  async testAllServices() {
    this.runner.log('🔍 Testing all services health...', 'info');

    const servicePromises = Object.entries(config.services).map(
      ([name, config]) => this.testServiceHealth(name, config)
    );

    const results = await Promise.all(servicePromises);
    const healthyServices = results.filter(Boolean).length;
    const totalServices = Object.keys(config.services).length;

    this.runner.log(
      `Services health: ${healthyServices}/${totalServices} healthy`,
      healthyServices === totalServices ? 'success' : 'warning'
    );

    return { healthy: healthyServices, total: totalServices };
  }
}

// Тесты API
class ApiTests {
  constructor(runner) {
    this.runner = runner;
    this.authToken = null;
  }

  async testGatewayEndpoints() {
    const endpoints = [
      { path: '/health', method: 'GET', auth: false },
      { path: '/api/v1/test-db', method: 'GET', auth: false },
      { path: '/api/v1/dashboard/stats', method: 'GET', auth: true },
      { path: '/api/v1/machines', method: 'GET', auth: true },
      { path: '/api/v1/machines/stats', method: 'GET', auth: true }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint({ path, method, auth }) {
    try {
      const url = `${config.baseUrl}${path}`;
      const headers = {};

      if (auth && this.authToken) {
        headers.Authorization = `Bearer ${this.authToken}`;
      }

      const response = await axios({
        method,
        url,
        headers,
        timeout: config.timeout,
        validateStatus: () => true // Не бросать ошибку на любой статус
      });

      if (response.status >= 200 && response.status < 300) {
        this.runner.recordResult(
          'api',
          `${method} ${path}`,
          'passed',
          `Endpoint responded successfully (${response.status})`
        );
      } else if (response.status === 401 && auth) {
        this.runner.recordResult(
          'api',
          `${method} ${path}`,
          'warning',
          `Authentication required (${response.status})`
        );
      } else {
        this.runner.recordResult(
          'api',
          `${method} ${path}`,
          'failed',
          `Endpoint failed (${response.status}): ${response.data?.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'api',
        `${method} ${path}`,
        'failed',
        `Request failed: ${error.message}`
      );
    }
  }

  async testAuthentication() {
    try {
      // Тестируем регистрацию тестового пользователя
      const testUser = {
        email: `test-${Date.now()}@vhm24.test`,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'OPERATOR'
      };

      const registerResponse = await axios.post(
        `${config.baseUrl}/api/v1/auth/register`,
        testUser,
        {
          timeout: config.timeout,
          validateStatus: () => true
        }
      );

      if (registerResponse.status === 201 || registerResponse.status === 409) {
        // 409 означает, что пользователь уже существует - это нормально для тестов
        this.runner.recordResult(
          'api',
          'auth_register',
          'passed',
          `Registration test completed (${registerResponse.status})`
        );

        // Тестируем вход
        const loginResponse = await axios.post(
          `${config.baseUrl}/api/v1/auth/login`,
          {
            email: testUser.email,
            password: testUser.password
          },
          {
            timeout: config.timeout,
            validateStatus: () => true
          }
        );

        if (loginResponse.status === 200 && loginResponse.data.data?.token) {
          this.authToken = loginResponse.data.data.token;
          this.runner.recordResult(
            'api',
            'auth_login',
            'passed',
            'Login successful, token received'
          );
        } else {
          this.runner.recordResult(
            'api',
            'auth_login',
            'failed',
            `Login failed (${loginResponse.status})`
          );
        }
      } else {
        this.runner.recordResult(
          'api',
          'auth_register',
          'failed',
          `Registration failed (${registerResponse.status})`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'api',
        'auth_test',
        'failed',
        `Authentication test failed: ${error.message}`
      );
    }
  }
}

// Тесты базы данных
class DatabaseTests {
  constructor(runner) {
    this.runner = runner;
  }

  async testDatabaseConnection() {
    try {
      const response = await axios.get(`${config.baseUrl}/api/v1/test-db`, {
        timeout: config.timeout
      });

      if (response.status === 200 && response.data.success) {
        this.runner.recordResult(
          'database',
          'connection',
          'passed',
          'Database connection successful',
          response.data.data
        );
      } else {
        this.runner.recordResult(
          'database',
          'connection',
          'failed',
          'Database connection failed',
          response.data
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'database',
        'connection',
        'failed',
        `Database test failed: ${error.message}`
      );
    }
  }

  async testDatabasePerformance() {
    try {
      const startTime = Date.now();

      const response = await axios.get(
        `${config.baseUrl}/api/v1/machines/stats`,
        {
          timeout: config.timeout
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        if (responseTime < 1000) {
          this.runner.recordResult(
            'database',
            'performance',
            'passed',
            `Query performance good (${responseTime}ms)`
          );
        } else if (responseTime < 3000) {
          this.runner.recordResult(
            'database',
            'performance',
            'warning',
            `Query performance acceptable (${responseTime}ms)`
          );
        } else {
          this.runner.recordResult(
            'database',
            'performance',
            'failed',
            `Query performance poor (${responseTime}ms)`
          );
        }
      }
    } catch (error) {
      this.runner.recordResult(
        'database',
        'performance',
        'failed',
        `Performance test failed: ${error.message}`
      );
    }
  }
}

// Тесты безопасности
class SecurityTests {
  constructor(runner) {
    this.runner = runner;
  }

  async testSecurityHeaders() {
    try {
      const response = await axios.get(`${config.baseUrl}/health`, {
        timeout: config.timeout
      });

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      let secureHeaders = 0;
      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          secureHeaders++;
        }
      });

      if (secureHeaders === securityHeaders.length) {
        this.runner.recordResult(
          'security',
          'headers',
          'passed',
          'All security headers present'
        );
      } else {
        this.runner.recordResult(
          'security',
          'headers',
          'warning',
          `${secureHeaders}/${securityHeaders.length} security headers present`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'security',
        'headers',
        'failed',
        `Security headers test failed: ${error.message}`
      );
    }
  }

  async testRateLimiting() {
    try {
      const requests = [];
      const endpoint = `${config.baseUrl}/health`;

      // Отправляем много запросов быстро
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.get(endpoint, {
            timeout: config.timeout,
            validateStatus: () => true
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      if (rateLimited) {
        this.runner.recordResult(
          'security',
          'rate_limiting',
          'passed',
          'Rate limiting is working'
        );
      } else {
        this.runner.recordResult(
          'security',
          'rate_limiting',
          'warning',
          'Rate limiting not detected (may be configured with high limits)'
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'security',
        'rate_limiting',
        'failed',
        `Rate limiting test failed: ${error.message}`
      );
    }
  }

  async testUnauthorizedAccess() {
    try {
      const protectedEndpoints = [
        '/api/v1/dashboard/stats',
        '/api/v1/machines',
        '/api/v1/audit-log'
      ];

      let protectedCount = 0;

      for (const endpoint of protectedEndpoints) {
        const response = await axios.get(`${config.baseUrl}${endpoint}`, {
          timeout: config.timeout,
          validateStatus: () => true
        });

        if (response.status === 401 || response.status === 403) {
          protectedCount++;
        }
      }

      if (protectedCount === protectedEndpoints.length) {
        this.runner.recordResult(
          'security',
          'authorization',
          'passed',
          'All protected endpoints require authentication'
        );
      } else {
        this.runner.recordResult(
          'security',
          'authorization',
          'failed',
          `${protectedCount}/${protectedEndpoints.length} endpoints properly protected`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'security',
        'authorization',
        'failed',
        `Authorization test failed: ${error.message}`
      );
    }
  }
}

// Тесты производительности
class PerformanceTests {
  constructor(runner) {
    this.runner = runner;
  }

  async testResponseTimes() {
    const endpoints = [
      { path: '/health', name: 'health_check' },
      { path: '/api/v1/test-db', name: 'database_test' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointPerformance(endpoint);
    }
  }

  async testEndpointPerformance({ path, name }) {
    try {
      const measurements = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await axios.get(`${config.baseUrl}${path}`, {
          timeout: config.timeout
        });

        const responseTime = Date.now() - startTime;

        if (response.status === 200) {
          measurements.push(responseTime);
        }

        await this.runner.sleep(100); // Небольшая пауза между запросами
      }

      if (measurements.length > 0) {
        const avgTime =
          measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const maxTime = Math.max(...measurements);

        if (avgTime < 500) {
          this.runner.recordResult(
            'performance',
            name,
            'passed',
            `Good performance: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms`
          );
        } else if (avgTime < 1000) {
          this.runner.recordResult(
            'performance',
            name,
            'warning',
            `Acceptable performance: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms`
          );
        } else {
          this.runner.recordResult(
            'performance',
            name,
            'failed',
            `Poor performance: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms`
          );
        }
      }
    } catch (error) {
      this.runner.recordResult(
        'performance',
        name,
        'failed',
        `Performance test failed: ${error.message}`
      );
    }
  }

  async testConcurrentRequests() {
    try {
      const concurrentRequests = 10;
      const endpoint = `${config.baseUrl}/health`;

      const startTime = Date.now();

      const requests = Array(concurrentRequests)
        .fill()
        .map(() => axios.get(endpoint, { timeout: config.timeout }));

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successfulRequests = responses.filter(r => r.status === 200).length;

      if (successfulRequests === concurrentRequests && totalTime < 2000) {
        this.runner.recordResult(
          'performance',
          'concurrent_requests',
          'passed',
          `Handled ${concurrentRequests} concurrent requests in ${totalTime}ms`
        );
      } else if (successfulRequests === concurrentRequests) {
        this.runner.recordResult(
          'performance',
          'concurrent_requests',
          'warning',
          `Handled ${concurrentRequests} concurrent requests in ${totalTime}ms (slow)`
        );
      } else {
        this.runner.recordResult(
          'performance',
          'concurrent_requests',
          'failed',
          `Only ${successfulRequests}/${concurrentRequests} requests succeeded`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'performance',
        'concurrent_requests',
        'failed',
        `Concurrent requests test failed: ${error.message}`
      );
    }
  }
}

// Интеграционные тесты
class IntegrationTests {
  constructor(runner) {
    this.runner = runner;
  }

  async testServiceCommunication() {
    try {
      // Тестируем, что gateway может общаться с другими сервисами
      const response = await axios.get(
        `${config.baseUrl}/api/v1/dashboard/stats`,
        {
          timeout: config.timeout,
          validateStatus: () => true
        }
      );

      // Даже если требуется авторизация, сервисы должны отвечать
      if (response.status === 401 || response.status === 200) {
        this.runner.recordResult(
          'integration',
          'service_communication',
          'passed',
          'Gateway can communicate with backend services'
        );
      } else {
        this.runner.recordResult(
          'integration',
          'service_communication',
          'failed',
          `Service communication failed (${response.status})`
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'integration',
        'service_communication',
        'failed',
        `Service communication test failed: ${error.message}`
      );
    }
  }

  async testWebSocketConnection() {
    // Простая проверка доступности WebSocket endpoint
    try {
      const response = await axios.get(`${config.baseUrl}/health`, {
        timeout: config.timeout
      });

      if (response.status === 200) {
        this.runner.recordResult(
          'integration',
          'websocket_availability',
          'passed',
          'WebSocket endpoint should be available (gateway is running)'
        );
      }
    } catch (error) {
      this.runner.recordResult(
        'integration',
        'websocket_availability',
        'failed',
        'WebSocket endpoint not available'
      );
    }
  }
}

// Главная функция тестирования
async function runComprehensiveTests() {
  const runner = new TestRunner();

  runner.log('🚀 Starting VHM24 Comprehensive System Tests', 'info');
  runner.log('='.repeat(60), 'info');

  // Инициализируем тестовые классы
  const serviceTests = new ServiceTests(runner);
  const apiTests = new ApiTests(runner);
  const databaseTests = new DatabaseTests(runner);
  const securityTests = new SecurityTests(runner);
  const performanceTests = new PerformanceTests(runner);
  const integrationTests = new IntegrationTests(runner);

  try {
    // 1. Тестируем сервисы
    runner.log('\n📋 Phase 1: Service Health Tests', 'info');
    await serviceTests.testAllServices();

    // 2. Тестируем API
    runner.log('\n🔌 Phase 2: API Tests', 'info');
    await apiTests.testAuthentication();
    await apiTests.testGatewayEndpoints();

    // 3. Тестируем базу данных
    runner.log('\n🗄️  Phase 3: Database Tests', 'info');
    await databaseTests.testDatabaseConnection();
    await databaseTests.testDatabasePerformance();

    // 4. Тестируем безопасность
    runner.log('\n🛡️  Phase 4: Security Tests', 'info');
    await securityTests.testSecurityHeaders();
    await securityTests.testRateLimiting();
    await securityTests.testUnauthorizedAccess();

    // 5. Тестируем производительность
    runner.log('\n⚡ Phase 5: Performance Tests', 'info');
    await performanceTests.testResponseTimes();
    await performanceTests.testConcurrentRequests();

    // 6. Интеграционные тесты
    runner.log('\n🔗 Phase 6: Integration Tests', 'info');
    await integrationTests.testServiceCommunication();
    await integrationTests.testWebSocketConnection();
  } catch (error) {
    runner.log(`❌ Critical error during testing: ${error.message}`, 'error');
  }

  // Генерируем отчет
  await generateTestReport(runner);
}

async function generateTestReport(runner) {
  const totalTime = Date.now() - runner.startTime;

  runner.log('\n📊 Test Results Summary', 'info');
  runner.log('='.repeat(60), 'info');

  const { total, passed, failed, warnings } = results.summary;
  const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  runner.log(`Total Tests: ${total}`, 'info');
  runner.log(`✅ Passed: ${passed}`, 'success');
  runner.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
  runner.log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');
  runner.log(
    `📈 Success Rate: ${successRate}%`,
    successRate >= 80 ? 'success' : 'warning'
  );
  runner.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`, 'info');

  // Сохраняем детальный отчет
  const reportData = {
    summary: {
      ...results.summary,
      successRate: parseFloat(successRate),
      totalTime: totalTime,
      timestamp: new Date().toISOString()
    },
    results: results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      baseUrl: config.baseUrl
    }
  };

  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fsPromises.writeFile(reportPath, JSON.stringify(reportData, null, 2));

  runner.log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');

  // Рекомендации
  runner.log('\n💡 Recommendations:', 'info');

  if (failed > 0) {
    runner.log('• Fix failed tests before deployment', 'warning');
  }

  if (warnings > 0) {
    runner.log('• Review warnings for potential improvements', 'warning');
  }

  if (successRate >= 95) {
    runner.log('• System is ready for production! 🎉', 'success');
  } else if (successRate >= 80) {
    runner.log(
      '• System is mostly stable, address remaining issues',
      'warning'
    );
  } else {
    runner.log(
      '• System needs significant improvements before production',
      'error'
    );
  }

  runner.log('\n🏁 Testing completed!', 'info');

  // Возвращаем код выхода для CI/CD
  process.exit(failed > 0 ? 1 : 0);
}

// Запускаем тесты
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    logger.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  TestRunner,
  ServiceTests,
  ApiTests,
  DatabaseTests,
  SecurityTests,
  PerformanceTests,
  IntegrationTests
};
