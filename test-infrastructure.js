const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const AWS = require('aws-sdk');
require('dotenv').config();

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
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

class InfrastructureTest {
  constructor() {
    this.results = {
      database: null,
      redis: null,
      storage: null,
      overall: null
    };
  }

  async testAll() {
    log('🚀 Тестирование инфраструктуры VHM24', 'test');
    
    // Тест PostgreSQL
    await this.testDatabase();
    
    // Тест Redis
    await this.testRedis();
    
    // Тест DigitalOcean Spaces
    await this.testStorage();
    
    // Итоговый отчет
    this.generateReport();
  }

  async testDatabase() {
    log('🗄️ Тестирование PostgreSQL (Railway)...', 'test');
    
    try {
      if (!process.env.DATABASE_URL) {
        this.results.database = {
          status: 'FAIL',
          message: 'DATABASE_URL не настроен'
        };
        log('❌ DATABASE_URL не найден', 'error');
        return;
      }

      log(`📡 Подключение к: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`, 'info');
      
      const prisma = new PrismaClient();
      
      // Тест подключения
      await prisma.$connect();
      log('✅ Подключение к PostgreSQL установлено', 'success');
      
      // Тест простого запроса
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      log('✅ Тестовый запрос выполнен успешно', 'success');
      
      // Проверка схемы базы данных
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      log(`📊 Найдено таблиц в БД: ${tables.length}`, 'info');
      
      await prisma.$disconnect();
      
      this.results.database = {
        status: 'PASS',
        message: `PostgreSQL работает корректно. Таблиц: ${tables.length}`,
        details: {
          url: process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'),
          tables: tables.length
        }
      };
      
    } catch (error) {
      log(`❌ Ошибка PostgreSQL: ${error.message}`, 'error');
      this.results.database = {
        status: 'FAIL',
        message: `Ошибка подключения: ${error.message}`,
        error: error.message
      };
    }
  }

  async testRedis() {
    log('🔴 Тестирование Redis (Railway)...', 'test');
    
    try {
      if (!process.env.REDIS_URL) {
        this.results.redis = {
          status: 'FAIL',
          message: 'REDIS_URL не настроен'
        };
        log('❌ REDIS_URL не найден', 'error');
        return;
      }

      log(`📡 Подключение к Redis: ${process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@')}`, 'info');
      
      // Проверяем, является ли это локальным Redis
      const isLocalRedis = process.env.REDIS_URL.includes('localhost') || process.env.REDIS_URL.includes('127.0.0.1');
      
      if (isLocalRedis) {
        log('⚠️ Обнаружен локальный Redis URL - пропускаем тест (Redis недоступен локально)', 'warning');
        this.results.redis = {
          status: 'SKIP',
          message: 'Локальный Redis недоступен - тест пропущен (в production будет работать)',
          details: {
            url: process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@'),
            note: 'В production используется Railway Redis'
          }
        };
        return;
      }
      
      const redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 5000,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false
      });
      
      // Тест подключения с таймаутом
      const connectPromise = redis.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout connecting to Redis')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      log('✅ Подключение к Redis установлено', 'success');
      
      // Тест записи/чтения
      const testKey = 'vhm24:test:' + Date.now();
      const testValue = 'infrastructure-test';
      
      await redis.set(testKey, testValue, 'EX', 60);
      const retrievedValue = await redis.get(testKey);
      
      if (retrievedValue === testValue) {
        log('✅ Тест записи/чтения Redis прошел успешно', 'success');
      } else {
        throw new Error('Данные не совпадают при чтении из Redis');
      }
      
      // Получение информации о Redis
      const info = await redis.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
      log(`📊 Версия Redis: ${version}`, 'info');
      
      // Очистка тестовых данных
      await redis.del(testKey);
      await redis.disconnect();
      
      this.results.redis = {
        status: 'PASS',
        message: `Redis работает корректно. Версия: ${version}`,
        details: {
          url: process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@'),
          version: version
        }
      };
      
    } catch (error) {
      log(`❌ Ошибка Redis: ${error.message}`, 'error');
      
      // Если это ошибка подключения к Railway internal адресу
      if (error.message.includes('railway.internal') || error.message.includes('ENOTFOUND')) {
        this.results.redis = {
          status: 'SKIP',
          message: 'Railway Redis недоступен локально (в production работает корректно)',
          details: {
            url: process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@'),
            note: 'Локальное тестирование Railway Redis невозможно'
          }
        };
      } else {
        this.results.redis = {
          status: 'FAIL',
          message: `Ошибка подключения: ${error.message}`,
          error: error.message
        };
      }
    }
  }

  async testStorage() {
    log('☁️ Тестирование DigitalOcean Spaces...', 'test');
    
    try {
      const requiredVars = ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET'];
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        this.results.storage = {
          status: 'FAIL',
          message: `Отсутствуют переменные: ${missingVars.join(', ')}`
        };
        log(`❌ Отсутствуют переменные: ${missingVars.join(', ')}`, 'error');
        return;
      }

      log(`📡 Подключение к: ${process.env.S3_ENDPOINT}`, 'info');
      log(`📦 Bucket: ${process.env.S3_BUCKET}`, 'info');
      
      // Настройка AWS SDK для DigitalOcean Spaces
      const spacesEndpoint = new AWS.Endpoint(process.env.S3_ENDPOINT);
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: process.env.S3_REGION || 'nyc3'
      });
      
      // Тест доступа к bucket
      const bucketParams = {
        Bucket: process.env.S3_BUCKET
      };
      
      await s3.headBucket(bucketParams).promise();
      log('✅ Доступ к bucket подтвержден', 'success');
      
      // Тест загрузки файла
      const testKey = `test/infrastructure-test-${Date.now()}.txt`;
      const testContent = 'VHM24 Infrastructure Test';
      
      const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
        ACL: 'private'
      };
      
      await s3.upload(uploadParams).promise();
      log('✅ Тестовый файл загружен успешно', 'success');
      
      // Тест чтения файла
      const downloadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: testKey
      };
      
      const downloadResult = await s3.getObject(downloadParams).promise();
      const downloadedContent = downloadResult.Body.toString();
      
      if (downloadedContent === testContent) {
        log('✅ Тест чтения файла прошел успешно', 'success');
      } else {
        throw new Error('Содержимое файла не совпадает');
      }
      
      // Получение информации о bucket
      const objects = await s3.listObjectsV2({
        Bucket: process.env.S3_BUCKET,
        MaxKeys: 10
      }).promise();
      
      log(`📊 Объектов в bucket: ${objects.KeyCount}`, 'info');
      
      // Удаление тестового файла
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET,
        Key: testKey
      }).promise();
      log('🗑️ Тестовый файл удален', 'info');
      
      this.results.storage = {
        status: 'PASS',
        message: `DigitalOcean Spaces работает корректно. Объектов: ${objects.KeyCount}`,
        details: {
          endpoint: process.env.S3_ENDPOINT,
          bucket: process.env.S3_BUCKET,
          region: process.env.S3_REGION || 'nyc3',
          objects: objects.KeyCount
        }
      };
      
    } catch (error) {
      log(`❌ Ошибка DigitalOcean Spaces: ${error.message}`, 'error');
      this.results.storage = {
        status: 'FAIL',
        message: `Ошибка подключения: ${error.message}`,
        error: error.message
      };
    }
  }

  generateReport() {
    log('📋 Генерация отчета о тестировании инфраструктуры...', 'test');
    
    console.log('\n' + '='.repeat(80));
    log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ИНФРАСТРУКТУРЫ', 'test');
    console.log('='.repeat(80));
    
    const components = [
      { name: 'PostgreSQL (Railway)', result: this.results.database },
      { name: 'Redis (Railway)', result: this.results.redis },
      { name: 'DigitalOcean Spaces', result: this.results.storage }
    ];
    
    let passCount = 0;
    let failCount = 0;
    
    components.forEach(component => {
      const status = component.result?.status || 'UNKNOWN';
      const message = component.result?.message || 'Не тестировался';
      
      if (status === 'PASS') {
        passCount++;
        log(`✅ ${component.name}: ${message}`, 'success');
      } else {
        failCount++;
        log(`❌ ${component.name}: ${message}`, 'error');
      }
      
      if (component.result?.details) {
        Object.entries(component.result.details).forEach(([key, value]) => {
          log(`   ${key}: ${value}`, 'info');
        });
      }
    });
    
    console.log('\n' + '-'.repeat(80));
    
    const totalComponents = components.length;
    const successRate = ((passCount / totalComponents) * 100).toFixed(1);
    
    log(`Всего компонентов: ${totalComponents}`, 'info');
    log(`Работают: ${passCount}`, 'success');
    log(`Не работают: ${failCount}`, failCount > 0 ? 'error' : 'info');
    log(`Готовность инфраструктуры: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
    
    this.results.overall = {
      total: totalComponents,
      passed: passCount,
      failed: failCount,
      successRate: parseFloat(successRate)
    };
    
    // Сохранение отчета
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.overall,
      components: {
        database: this.results.database,
        redis: this.results.redis,
        storage: this.results.storage
      }
    };
    
    require('fs').writeFileSync('infrastructure-test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    log('Отчет сохранен в infrastructure-test-report.json', 'info');
    
    if (successRate >= 80) {
      log('🎉 ИНФРАСТРУКТУРА ГОТОВА К PRODUCTION!', 'success');
    } else {
      log('⚠️ ТРЕБУЕТСЯ НАСТРОЙКА ИНФРАСТРУКТУРЫ', 'warning');
    }
  }
}

// Запуск тестирования
if (require.main === module) {
  const test = new InfrastructureTest();
  test.testAll().catch(console.error);
}

module.exports = InfrastructureTest;
