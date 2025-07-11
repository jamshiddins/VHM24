const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения из .env файла
require('dotenv').config();

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

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    debug: colors.magenta,
    header: colors.cyan
  };
  console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Конфигурация переменных окружения
const ENV_CONFIG = {
  // Критически важные переменные (обязательные для production)
  critical: {
    DATABASE_URL: {
      description: 'PostgreSQL connection URL',
      pattern: /^postgresql:\/\/.+/,
      example: 'postgresql://user:pass@host:port/db'
    },
    JWT_SECRET: {
      description: 'JWT signing secret',
      minLength: 32,
      example: 'your-super-secret-jwt-key-64-characters-or-more'
    },
    NODE_ENV: {
      description: 'Application environment',
      allowedValues: ['development', 'production', 'test'],
      example: 'production'
    }
  },

  // Важные переменные (рекомендуемые для production)
  important: {
    REDIS_URL: {
      description: 'Redis connection URL',
      pattern: /^redis:\/\/.+/,
      example: 'redis://user:pass@host:port'
    },
    TELEGRAM_BOT_TOKEN: {
      description: 'Telegram bot token',
      pattern: /^\d+:[A-Za-z0-9_-]+$/,
      example: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
    },
    API_URL: {
      description: 'Main API URL',
      pattern: /^https?:\/\/.+/,
      example: 'https://your-app.up.railway.app/api/v1'
    }
  },

  // Опциональные переменные
  optional: {
    S3_ACCESS_KEY: {
      description: 'DigitalOcean Spaces access key',
      example: 'your-digitalocean-spaces-access-key'
    },
    S3_SECRET_KEY: {
      description: 'DigitalOcean Spaces secret key',
      example: 'your-digitalocean-spaces-secret-key'
    },
    S3_BUCKET: {
      description: 'DigitalOcean Spaces bucket name',
      example: 'your-unique-bucket-name'
    },
    EMAIL_USER: {
      description: 'SMTP email username',
      pattern: /^.+@.+\..+$/,
      example: 'your-email@gmail.com'
    },
    EMAIL_PASS: {
      description: 'SMTP email password',
      example: 'your-app-password'
    }
  },

  // Переменные для локальной разработки
  development: {
    AUTH_PORT: { description: 'Auth service port', default: '3001' },
    MACHINES_PORT: { description: 'Machines service port', default: '3002' },
    INVENTORY_PORT: { description: 'Inventory service port', default: '3003' },
    TASKS_PORT: { description: 'Tasks service port', default: '3004' },
    WAREHOUSE_PORT: { description: 'Warehouse service port', default: '3006' },
    RECIPES_PORT: { description: 'Recipes service port', default: '3007' }
  }
};

class EnvironmentChecker {
  constructor() {
    this.results = {
      critical: { passed: 0, failed: 0, issues: [] },
      important: { passed: 0, failed: 0, issues: [] },
      optional: { passed: 0, failed: 0, issues: [] },
      development: { passed: 0, failed: 0, issues: [] },
      security: { passed: 0, failed: 0, issues: [] }
    };
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  checkVariable(name, config, category) {
    const value = process.env[name];
    const result = {
      name,
      category,
      status: 'PASS',
      message: '',
      value: value ? this.maskSensitive(name, value) : undefined
    };

    // Проверка наличия переменной
    if (!value) {
      result.status = 'FAIL';
      result.message = `Missing required variable: ${config.description}`;
      if (config.example) {
        result.message += ` (example: ${config.example})`;
      }
      this.results[category].failed++;
      this.results[category].issues.push(result);
      return result;
    }

    // Проверка паттерна
    if (config.pattern && !config.pattern.test(value)) {
      result.status = 'FAIL';
      result.message = `Invalid format for ${name}: ${config.description}`;
      if (config.example) {
        result.message += ` (example: ${config.example})`;
      }
      this.results[category].failed++;
      this.results[category].issues.push(result);
      return result;
    }

    // Проверка минимальной длины
    if (config.minLength && value.length < config.minLength) {
      result.status = 'FAIL';
      result.message = `${name} too short (minimum ${config.minLength} characters)`;
      this.results[category].failed++;
      this.results[category].issues.push(result);
      return result;
    }

    // Проверка допустимых значений
    if (config.allowedValues && !config.allowedValues.includes(value)) {
      result.status = 'FAIL';
      result.message = `Invalid value for ${name}. Allowed: ${config.allowedValues.join(', ')}`;
      this.results[category].failed++;
      this.results[category].issues.push(result);
      return result;
    }

    // Переменная прошла все проверки
    result.status = 'PASS';
    result.message = `✅ ${config.description}`;
    this.results[category].passed++;
    return result;
  }

  maskSensitive(name, value) {
    const sensitiveVars = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY'];
    if (sensitiveVars.some(keyword => name.includes(keyword))) {
      if (value.length <= 8) {
        return '***';
      }
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }
    return value;
  }

  checkSecurity() {
    log('🔒 Проверка безопасности переменных окружения...', 'header');

    const securityChecks = [
      {
        name: 'JWT_SECRET_STRENGTH',
        check: () => {
          const secret = process.env.JWT_SECRET;
          if (!secret) return { status: 'FAIL', message: 'JWT_SECRET not set' };
          if (secret.includes('dev-') || secret.includes('development')) {
            return { status: 'FAIL', message: 'Using development JWT secret in production' };
          }
          if (secret.length < 64) {
            return { status: 'WARN', message: 'JWT secret should be at least 64 characters' };
          }
          return { status: 'PASS', message: 'JWT secret is strong' };
        }
      },
      {
        name: 'TELEGRAM_TOKEN_VALIDITY',
        check: () => {
          const token = process.env.TELEGRAM_BOT_TOKEN;
          if (!token) return { status: 'SKIP', message: 'Telegram token not set' };
          if (token.includes('dev-') || token === 'dev-telegram-token-change-in-production') {
            return { status: 'FAIL', message: 'Using development Telegram token' };
          }
          return { status: 'PASS', message: 'Telegram token appears valid' };
        }
      },
      {
        name: 'S3_CREDENTIALS_VALIDITY',
        check: () => {
          const accessKey = process.env.S3_ACCESS_KEY;
          const secretKey = process.env.S3_SECRET_KEY;
          if (!accessKey || !secretKey) return { status: 'SKIP', message: 'S3 credentials not set' };
          if (accessKey.includes('dev-') || secretKey.includes('dev-')) {
            return { status: 'FAIL', message: 'Using development S3 credentials' };
          }
          return { status: 'PASS', message: 'S3 credentials appear valid' };
        }
      },
      {
        name: 'EMAIL_CREDENTIALS_VALIDITY',
        check: () => {
          const user = process.env.EMAIL_USER;
          const pass = process.env.EMAIL_PASS;
          if (!user || !pass) return { status: 'SKIP', message: 'Email credentials not set' };
          if (user.includes('dev-') || pass.includes('dev-')) {
            return { status: 'FAIL', message: 'Using development email credentials' };
          }
          return { status: 'PASS', message: 'Email credentials appear valid' };
        }
      }
    ];

    securityChecks.forEach(check => {
      const result = check.check();
      if (result.status === 'PASS') {
        log(`✅ ${check.name}: ${result.message}`, 'success');
        this.results.security.passed++;
      } else if (result.status === 'FAIL') {
        log(`❌ ${check.name}: ${result.message}`, 'error');
        this.results.security.failed++;
        this.results.security.issues.push({
          name: check.name,
          status: 'FAIL',
          message: result.message
        });
      } else if (result.status === 'WARN') {
        log(`⚠️ ${check.name}: ${result.message}`, 'warning');
      } else {
        log(`⏭️ ${check.name}: ${result.message}`, 'debug');
      }
    });
  }

  checkCategory(categoryName, variables) {
    log(`\n📋 Проверка ${categoryName} переменных...`, 'header');
    
    Object.entries(variables).forEach(([name, config]) => {
      const result = this.checkVariable(name, config, categoryName);
      
      if (result.status === 'PASS') {
        log(`✅ ${name}: ${result.message}`, 'success');
      } else {
        log(`❌ ${name}: ${result.message}`, 'error');
      }
    });
  }

  generateReport() {
    log('\n📊 Генерация отчета о проверке переменных окружения...', 'header');
    
    console.log('\n' + '='.repeat(80));
    log('📋 РЕЗУЛЬТАТЫ ПРОВЕРКИ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ', 'header');
    console.log('='.repeat(80));

    const categories = ['critical', 'important', 'optional', 'development', 'security'];
    let totalPassed = 0;
    let totalFailed = 0;

    categories.forEach(category => {
      const result = this.results[category];
      totalPassed += result.passed;
      totalFailed += result.failed;

      const categoryName = {
        critical: 'Критически важные',
        important: 'Важные',
        optional: 'Опциональные',
        development: 'Для разработки',
        security: 'Безопасность'
      }[category];

      if (result.passed > 0 || result.failed > 0) {
        log(`\n${categoryName}: ${result.passed} ✅ / ${result.failed} ❌`, 'info');
        
        if (result.issues.length > 0) {
          result.issues.forEach(issue => {
            log(`  ❌ ${issue.name}: ${issue.message}`, 'error');
          });
        }
      }
    });

    console.log('\n' + '-'.repeat(80));
    
    const totalChecks = totalPassed + totalFailed;
    const successRate = totalChecks > 0 ? ((totalPassed / totalChecks) * 100).toFixed(1) : 0;
    
    log(`Всего проверок: ${totalChecks}`, 'info');
    log(`Прошли: ${totalPassed}`, 'success');
    log(`Не прошли: ${totalFailed}`, totalFailed > 0 ? 'error' : 'info');
    log(`Готовность: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');

    // Сохранение отчета
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      summary: {
        total: totalChecks,
        passed: totalPassed,
        failed: totalFailed,
        successRate: parseFloat(successRate)
      },
      categories: this.results
    };

    fs.writeFileSync('env-check-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    log('Отчет сохранен в env-check-report.json', 'info');
    
    if (successRate >= 90) {
      log('🎉 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ НАСТРОЕНЫ КОРРЕКТНО!', 'success');
    } else if (successRate >= 70) {
      log('⚠️ ТРЕБУЕТСЯ НАСТРОЙКА НЕКОТОРЫХ ПЕРЕМЕННЫХ', 'warning');
    } else {
      log('❌ ТРЕБУЕТСЯ СЕРЬЕЗНАЯ НАСТРОЙКА ПЕРЕМЕННЫХ', 'error');
    }

    return successRate >= 90;
  }

  checkAll() {
    log('🔍 Запуск полной проверки переменных окружения VHM24', 'header');
    log(`Режим: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, 'info');
    
    // Проверка критически важных переменных
    this.checkCategory('critical', ENV_CONFIG.critical);
    
    // Проверка важных переменных
    this.checkCategory('important', ENV_CONFIG.important);
    
    // Проверка опциональных переменных
    this.checkCategory('optional', ENV_CONFIG.optional);
    
    // Проверка переменных для разработки (только в dev режиме)
    if (!this.isProduction) {
      this.checkCategory('development', ENV_CONFIG.development);
    }
    
    // Проверка безопасности
    this.checkSecurity();
    
    // Генерация отчета
    return this.generateReport();
  }
}

// Запуск проверки
if (require.main === module) {
  const checker = new EnvironmentChecker();
  const success = checker.checkAll();
  process.exit(success ? 0 : 1);
}

module.exports = EnvironmentChecker;
