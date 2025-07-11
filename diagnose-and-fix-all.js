const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./packages/shared/utils/logger');
require('dotenv').config();

/**
 * VHM24 Complete Diagnosis and Auto-Fix System
 * Проверяет и исправляет все проблемы автоматически
 */
class VHM24DiagnosisAndFix {
  constructor() {
    this.fixes = [];
    this.issues = [];
    this.log('🔧 VHM24 Diagnosis and Auto-Fix System', 'info');
  }

  log(message, level = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Tashkent',
      hour12: false
    });
    
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
    logger.info(`[${timestamp}] ${message}`);
  }

  async runFullDiagnosis() {
    this.log('🚀 Запуск полной диагностики и исправления проблем VHM24', 'info');
    
    try {
      // 1. Проверка и исправление зависимостей
      await this.checkAndInstallDependencies();
      
      // 2. Проверка конфигурации Redis
      await this.checkAndFixRedis();
      
      // 3. Проверка локальных URL для тестирования
      await this.checkAndFixLocalUrls();
      
      // 4. Проверка структуры проекта
      await this.checkProjectStructure();
      
      // 5. Проверка конфигураций сервисов
      await this.checkServiceConfigurations();
      
      // 6. Установка недостающих пакетов
      await this.installMissingPackages();
      
      // 7. Генерация отчета
      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Критическая ошибка: ${error.message}`, 'error');
      this.issues.push(`Критическая ошибка: ${error.message}`);
    }
  }

  async checkAndInstallDependencies() {
    this.log('\n📦 Проверка и установка зависимостей...', 'info');
    
    const requiredDeps = [
      'pg', 'redis', 'aws-sdk', 'axios', 'dotenv', 'winston'
    ];
    
    // Читаем package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installedDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const missingDeps = requiredDeps.filter(dep => !installedDeps[dep]);
    
    if (missingDeps.length > 0) {
      this.log(`🔧 Устанавливаем недостающие зависимости: ${missingDeps.join(', ')}`, 'warning');
      try {
        execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
        this.fixes.push(`Установлены зависимости: ${missingDeps.join(', ')}`);
        this.log('✅ Зависимости установлены', 'success');
      } catch (error) {
        this.issues.push(`Ошибка установки зависимостей: ${error.message}`);
        this.log(`❌ Ошибка установки: ${error.message}`, 'error');
      }
    } else {
      this.log('✅ Все основные зависимости установлены', 'success');
    }
  }

  async checkAndFixRedis() {
    this.log('\n🔴 Диагностика Redis...', 'info');
    
    try {
      // Проверяем URL Redis
      const redisUrl = process.env.REDIS_URL;
      this.log(`📍 Redis URL: ${redisUrl?.substring(0, 50)}...`, 'info');
      
      if (!redisUrl) {
        this.issues.push('REDIS_URL не установлен');
        return;
      }
      
      // Пытаемся подключиться с разными настройками
      const redis = require('redis');
      
      // Вариант 1: Стандартное подключение
      try {
        this.log('🔍 Попытка подключения к Redis (стандартно)...', 'info');
        const client = redis.createClient({
          url: redisUrl,
          socket: {
            tls: true,
            rejectUnauthorized: false,
            connectTimeout: 10000,
            commandTimeout: 5000
          }
        });
        
        await client.connect();
        await client.ping();
        this.log('✅ Redis подключение работает', 'success');
        await client.disconnect();
        return;
      } catch (error) {
        this.log(`❌ Стандартное подключение к Redis: ${error.message}`, 'error');
      }
      
      // Вариант 2: Без TLS
      try {
        this.log('🔍 Попытка подключения к Redis (без TLS)...', 'info');
        const client = redis.createClient({
          url: redisUrl.replace('rediss://', 'redis://'),
          socket: {
            connectTimeout: 10000,
            commandTimeout: 5000
          }
        });
        
        await client.connect();
        await client.ping();
        this.log('✅ Redis подключение работает (без TLS)', 'success');
        await client.disconnect();
        
        // Обновляем .env файл
        this.updateEnvFile('REDIS_URL', redisUrl.replace('rediss://', 'redis://'));
        this.fixes.push('Исправлен REDIS_URL (удален TLS)');
        return;
      } catch (error) {
        this.log(`❌ Подключение без TLS: ${error.message}`, 'error');
      }
      
      // Вариант 3: Простой режим
      try {
        this.log('🔍 Попытка подключения к Redis (простой режим)...', 'info');
        const client = redis.createClient({
          url: redisUrl,
          socket: {
            tls: false,
            connectTimeout: 15000,
            commandTimeout: 10000,
            keepAlive: false
          },
          retryStrategy: () => false
        });
        
        await client.connect();
        await client.ping();
        this.log('✅ Redis подключение работает (простой режим)', 'success');
        await client.disconnect();
        return;
      } catch (error) {
        this.log(`❌ Простой режим: ${error.message}`, 'error');
      }
      
      this.issues.push(`Redis недоступен: все варианты подключения неудачны`);
      
    } catch (error) {
      this.issues.push(`Ошибка диагностики Redis: ${error.message}`);
      this.log(`❌ Ошибка диагностики Redis: ${error.message}`, 'error');
    }
  }

  async checkAndFixLocalUrls() {
    this.log('\n🌐 Проверка и исправление URL для локального тестирования...', 'info');
    
    // Создаем локальные URL для тестирования
    const localApiUrl = 'http://localhost:8000';
    const localFrontendUrl = 'http://localhost:3000';
    
    // Обновляем .env файл для локального тестирования
    this.updateEnvFile('LOCAL_API_URL', localApiUrl);
    this.updateEnvFile('LOCAL_FRONTEND_URL', localFrontendUrl);
    
    // Проверяем, запущены ли локальные сервисы
    try {
      const axios = require('axios');
      await axios.get(`${localApiUrl}/health`, { timeout: 1000 });
      this.log('✅ Локальный API сервер работает', 'success');
    } catch (error) {
      this.log('⚠️ Локальный API сервер не запущен', 'warning');
      this.issues.push('Локальный API сервер не запущен (ожидаемо для тестирования)');
    }
    
    this.fixes.push('Добавлены локальные URL для тестирования');
  }

  async checkProjectStructure() {
    this.log('\n📁 Проверка структуры проекта...', 'info');
    
    const requiredDirs = [
      'packages/shared/utils',
      'services',
      'backend',
      'apps',
      'logs'
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        this.log(`🔧 Создаем директорию: ${dir}`, 'warning');
        fs.mkdirSync(dir, { recursive: true });
        this.fixes.push(`Создана директория: ${dir}`);
      } else {
        this.log(`✅ Директория существует: ${dir}`, 'success');
      }
    }
  }

  async checkServiceConfigurations() {
    this.log('\n⚙️ Проверка конфигураций сервисов...', 'info');
    
    // Проверяем ecosystem.config.js для PM2
    if (!fs.existsSync('ecosystem.config.js')) {
      this.log('🔧 Создаем ecosystem.config.js для PM2...', 'warning');
      const pm2Config = {
        apps: [{
          name: 'vhm24-main',
          script: 'backend/src/index.js',
          instances: 1,
          autorestart: true,
          watch: false,
          max_memory_restart: '1G',
          env: {
            NODE_ENV: 'development'
          },
          env_production: {
            NODE_ENV: 'production'
          }
        }]
      };
      
      fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
      this.fixes.push('Создан ecosystem.config.js для PM2');
    }
    
    // Проверяем docker-compose.yml
    if (!fs.existsSync('docker-compose.yml')) {
      this.log('🔧 Создаем базовый docker-compose.yml...', 'warning');
      const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
`;
      
      fs.writeFileSync('docker-compose.yml', dockerCompose);
      this.fixes.push('Создан базовый docker-compose.yml');
    }
  }

  async installMissingPackages() {
    this.log('\n📦 Установка дополнительных пакетов...', 'info');
    
    const devDeps = [
      '@types/node',
      'typescript',
      'nodemon',
      'jest'
    ];
    
    try {
      this.log('🔧 Устанавливаем dev зависимости...', 'warning');
      execSync(`npm install -D ${devDeps.join(' ')}`, { stdio: 'inherit' });
      this.fixes.push(`Установлены dev зависимости: ${devDeps.join(', ')}`);
    } catch (error) {
      this.log(`⚠️ Некоторые dev зависимости не установлены: ${error.message}`, 'warning');
    }
  }

  updateEnvFile(key, value) {
    try {
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
      }
      
      const lines = envContent.split('\n');
      const keyIndex = lines.findIndex(line => line.startsWith(`${key}=`));
      
      if (keyIndex !== -1) {
        lines[keyIndex] = `${key}=${value}`;
      } else {
        lines.push(`${key}=${value}`);
      }
      
      fs.writeFileSync('.env', lines.join('\n'));
      this.log(`✅ Обновлен .env: ${key}`, 'success');
    } catch (error) {
      this.log(`❌ Ошибка обновления .env: ${error.message}`, 'error');
    }
  }

  generateReport() {
    this.log('\n📊 Генерация отчета о диагностике и исправлениях...', 'info');
    
    const report = `# VHM24 Diagnosis and Fix Report

## 📅 Дата: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}

## ✅ Примененные исправления (${this.fixes.length}):

${this.fixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n')}

## ⚠️ Обнаруженные проблемы (${this.issues.length}):

${this.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

## 💡 Рекомендации:

1. Запустите повторное тестирование: \`node VHM24_COMPLETE_TESTING_SYSTEM.js\`
2. Для локального тестирования запустите сервер: \`npm run dev\`
3. Проверьте Redis подключение отдельно: \`node test-redis-connection.js\`
4. Для production убедитесь, что все домены настроены

## 🚀 Следующие шаги:

1. Перезапустите тестирование
2. При необходимости запустите локальные сервисы
3. Проверьте Railway настройки для production

---

*Отчет сгенерирован автоматически системой диагностики VHM24*
`;

    fs.writeFileSync('VHM24_DIAGNOSIS_REPORT.md', report);
    
    this.log('\n' + '='.repeat(80), 'info');
    this.log('📊 ОТЧЕТ О ДИАГНОСТИКЕ И ИСПРАВЛЕНИЯХ', 'info');
    this.log('='.repeat(80), 'info');
    this.log(`✅ Применено исправлений: ${this.fixes.length}`, 'success');
    this.log(`⚠️ Найдено проблем: ${this.issues.length}`, this.issues.length > 0 ? 'warning' : 'success');
    this.log('📄 Отчет сохранен: VHM24_DIAGNOSIS_REPORT.md', 'info');
    this.log('='.repeat(80), 'info');
    
    if (this.fixes.length > 0) {
      this.log('\n✨ Исправления применены! Запустите повторное тестирование.', 'success');
    }
  }
}

// Запуск диагностики
const diagnostics = new VHM24DiagnosisAndFix();
diagnostics.runFullDiagnosis().catch(error => {
  console.error('Критическая ошибка диагностики:', error);
});
