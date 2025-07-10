const logger = require('@vhm24/shared/logger');

const { execSync } = require('child_process');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

class ProjectTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tests: {
        dependencies: {},
        services: {},
        api: {},
        database: {},
        infrastructure: {},
        security: {}
      }
    };
  }

  async runAllTests() {
    logger.info('🧪 Запуск комплексного тестирования VHM24...\n');
    
    try {
      // 1. Проверка зависимостей
      await this.testDependencies();
      
      // 2. Проверка инфраструктуры
      await this.testInfrastructure();
      
      // 3. Проверка базы данных
      await this.testDatabase();
      
      // 4. Проверка сервисов
      await this.testServices();
      
      // 5. Проверка безопасности
      await this.testSecurity();
      
      // 6. Сохранение результатов
      this.saveResults();
      
    } catch (error) {
      logger.error('❌ Error during testing:', error.message);
      this.results.error = error.message;
      this.saveResults();
    }
  }

  async testDependencies() {
    logger.info('📦 Проверка зависимостей...');
    
    try {
      // Проверка npm
      const npmVersion = execSync('npm --version', { stdio: 'pipe' }).toString().trim();
      this.results.tests.dependencies.npm = { version: npmVersion, status: 'OK' };
      
      // Проверка Node.js
      const nodeVersion = execSync('node --version', { stdio: 'pipe' }).toString().trim();
      this.results.tests.dependencies.node = { version: nodeVersion, status: 'OK' };
      
      // Проверка уязвимостей
      try {
        const audit = execSync('npm audit --json', { stdio: 'pipe' });
        const auditData = JSON.parse(audit.toString());
        this.results.tests.dependencies.vulnerabilities = {
          total: auditData.metadata?.vulnerabilities?.total || 0,
          high: auditData.metadata?.vulnerabilities?.high || 0,
          critical: auditData.metadata?.vulnerabilities?.critical || 0
        };
      } catch (e) {
        this.results.tests.dependencies.vulnerabilities = 'Audit check failed';
      }
      
      // Проверка outdated пакетов
      try {
        const outdated = execSync('npm outdated --json', { stdio: 'pipe' });
        this.results.tests.dependencies.outdated = JSON.parse(outdated.toString());
      } catch (e) {
        this.results.tests.dependencies.outdated = {};
      }
      
      // Проверка package.json в сервисах
      const services = fs.readdirSync('services');
      this.results.tests.dependencies.services = {};
      
      services.forEach(service => {
        const pkgPath = path.join('services', service, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(await fsPromises.readFile(pkgPath, 'utf8'));
          this.results.tests.dependencies.services[service] = {
            hasPackageJson: true,
            hasStartScript: !!(pkg.scripts && (pkg.scripts.start || pkg.scripts.dev)),
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {})
          };
        } else {
          this.results.tests.dependencies.services[service] = {
            hasPackageJson: false
          };
        }
      });
      
    } catch (error) {
      this.results.tests.dependencies.error = error.message;
    }
  }

  async testInfrastructure() {
    logger.info('🏗️ Проверка инфраструктуры...');
    
    // Docker
    try {
      const dockerVersion = execSync('docker --version', { stdio: 'pipe' }).toString().trim();
      this.results.tests.infrastructure.docker = { 
        version: dockerVersion, 
        status: 'Installed' 
      };
      
      // Проверка контейнеров
      try {
        const containers = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' })
          .toString().split('\n').filter(Boolean);
        this.results.tests.infrastructure.containers = containers;
      } catch (e) {
        this.results.tests.infrastructure.containers = [];
      }
    } catch (e) {
      this.results.tests.infrastructure.docker = { status: 'Not installed' };
    }
    
    // Проверка файловой структуры
    const requiredDirs = ['services', 'packages', 'apps'];
    this.results.tests.infrastructure.directories = {};
    
    requiredDirs.forEach(dir => {
      this.results.tests.infrastructure.directories[dir] = fs.existsSync(dir);
    });
    
    // Проверка конфигурационных файлов
    const configFiles = [
      'package.json',
      'docker-compose.yml',
      '.env',
      'nixpacks.toml',
      'railway.json'
    ];
    
    this.results.tests.infrastructure.configFiles = {};
    configFiles.forEach(file => {
      this.results.tests.infrastructure.configFiles[file] = fs.existsSync(file);
    });
  }

  async testDatabase() {
    logger.info('🗄️ Проверка базы данных...');
    
    try {
      // Проверка Prisma
      const prismaSchemaPath = 'packages/database/prisma/schema.prisma';
      this.results.tests.database.prismaSchema = fs.existsSync(prismaSchemaPath);
      
      if (this.results.tests.database.prismaSchema) {
        const schema = await fsPromises.readFile(prismaSchemaPath, 'utf8');
        const models = schema.match(/model\s+(\w+)/g) || [];
        this.results.tests.database.models = models.map(m => m.replace('model ', ''));
      }
      
      // Проверка переменных окружения для БД
      if (fs.existsSync('.env')) {
        const env = await fsPromises.readFile('.env', 'utf8');
        this.results.tests.database.hasConnectionString = env.includes('DATABASE_URL');
        this.results.tests.database.hasRedisUrl = env.includes('REDIS_URL');
      }
      
      // Попытка подключения к БД (если возможно)
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        this.results.tests.database.connection = 'OK';
        
        // Проверка таблиц
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        this.results.tests.database.tables = tables.map(t => t.table_name);
        
        await prisma.$disconnect();
      } catch (error) {
        this.results.tests.database.connection = `Failed: ${error.message}`;
      }
      
    } catch (error) {
      this.results.tests.database.error = error.message;
    }
  }

  async testServices() {
    logger.info('🔧 Проверка сервисов...');
    
    const services = [
      { name: 'Gateway', port: 8000, path: 'services/gateway' },
      { name: 'Auth', port: 3001, path: 'services/auth' },
      { name: 'Machines', port: 3002, path: 'services/machines' },
      { name: 'Inventory', port: 3003, path: 'services/inventory' },
      { name: 'Tasks', port: 3004, path: 'services/tasks' },
      { name: 'Telegram Bot', port: 3005, path: 'services/telegram-bot' },
      { name: 'Notifications', port: 3006, path: 'services/notifications' }
    ];
    
    this.results.tests.services = {};
    
    for (const service of services) {
      const serviceResult = {
        exists: fs.existsSync(service.path),
        hasPackageJson: fs.existsSync(path.join(service.path, 'package.json')),
        hasIndex: fs.existsSync(path.join(service.path, 'src', 'index.js')),
        port: service.port,
        status: 'Unknown'
      };
      
      // Проверка содержимого index.js
      const indexPath = path.join(service.path, 'src', 'index.js');
      if (fs.existsSync(indexPath)) {
        const content = await fsPromises.readFile(indexPath, 'utf8');
        serviceResult.hasHealthCheck = content.includes('/health');
        serviceResult.hasPortConfig = content.includes('process.env.PORT');
        serviceResult.usesFastify = content.includes('fastify');
        serviceResult.usesPrisma = content.includes('prisma');
      }
      
      // Попытка проверки доступности (без запуска)
      try {
        const response = await this.checkPort(service.port);
        serviceResult.status = response ? 'Running' : 'Down';
      } catch (error) {
        serviceResult.status = 'Down';
      }
      
      this.results.tests.services[service.name] = serviceResult;
    }
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, 'localhost');
    });
  }

  async testSecurity() {
    logger.info('🔒 Проверка безопасности...');
    
    try {
      // Проверка .env файла
      if (fs.existsSync('.env')) {
        const env = await fsPromises.readFile('.env', 'utf8');
        this.results.tests.security.hasJwtSecret = env.includes('JWT_SECRET');
        this.results.tests.security.hasStrongJwtSecret = env.includes('JWT_SECRET') && 
          env.match(/JWT_SECRET=.{32,}/);
      }
      
      // Проверка на hardcoded секреты в коде
      const securityIssues = [];
      const services = fs.readdirSync('services');
      
      services.forEach(service => {
        const servicePath = path.join('services', service, 'src');
        if (fs.existsSync(servicePath)) {
          const files = this.getAllJsFiles(servicePath);
          files.forEach(file => {
            const content = await fsPromises.readFile(file, 'utf8');
            
            // Поиск потенциальных проблем безопасности
            if (content.includes('password') && content.includes('=') && content.includes('"')) {
              securityIssues.push(`${file}: Potential hardcoded password`);
            }
            
            if (content.includes('secret') && content.includes('=') && content.includes('"')) {
              securityIssues.push(`${file}: Potential hardcoded secret`);
            }
            
            if (content.includes('api_key') && content.includes('=') && content.includes('"')) {
              securityIssues.push(`${file}: Potential hardcoded API key`);
            }
          });
        }
      });
      
      this.results.tests.security.issues = securityIssues;
      
      // Проверка CORS настроек
      const gatewayPath = 'services/gateway/src/index.js';
      if (fs.existsSync(gatewayPath)) {
        const content = await fsPromises.readFile(gatewayPath, 'utf8');
        this.results.tests.security.hasCors = content.includes('cors');
        this.results.tests.security.corsWildcard = content.includes('origin: "*"');
      }
      
    } catch (error) {
      this.results.tests.security.error = error.message;
    }
  }

  getAllJsFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    }
    
    traverse(dir);
    return files;
  }

  saveResults() {
    const filename = `test-results-${Date.now()}.json`;
    await fsPromises.writeFile(filename, JSON.stringify(this.results, null, 2));
    
    logger.info('\n📊 Результаты тестирования:');
    logger.info(`✅ Сохранено в: ${filename}`);
    
    // Вывод summary
    logger.info('\n📈 Summary:');
    
    // Сервисы
    const servicesTotal = Object.keys(this.results.tests.services).length;
    const servicesExist = Object.values(this.results.tests.services)
      .filter(s => s.exists).length;
    logger.info(`- Сервисы: ${servicesExist}/${servicesTotal} существуют`);
    
    // Зависимости
    if (this.results.tests.dependencies.vulnerabilities) {
      const vuln = this.results.tests.dependencies.vulnerabilities;
      if (typeof vuln === 'object') {
        logger.info(`- Уязвимости: ${vuln.total} (критических: ${vuln.critical})`);
      }
    }
    
    // База данных
    if (this.results.tests.database.connection) {
      logger.info(`- База данных: ${this.results.tests.database.connection}`);
    }
    
    // Безопасность
    if (this.results.tests.security.issues) {
      logger.info(`- Проблемы безопасности: ${this.results.tests.security.issues.length}`);
    }
    
    // Рекомендации
    logger.info('\n💡 Рекомендации:');
    this.generateRecommendations();
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Проверка сервисов
    Object.entries(this.results.tests.services).forEach(([name, service]) => {
      if (!service.exists) {
        recommendations.push(`Сервис ${name} не найден`);
      } else if (!service.hasPackageJson) {
        recommendations.push(`Добавить package.json для сервиса ${name}`);
      } else if (!service.hasHealthCheck) {
        recommendations.push(`Добавить health check для сервиса ${name}`);
      } else if (!service.hasPortConfig) {
        recommendations.push(`Исправить конфигурацию портов для сервиса ${name}`);
      }
    });
    
    // Проверка безопасности
    if (this.results.tests.security.issues && this.results.tests.security.issues.length > 0) {
      recommendations.push('Исправить проблемы безопасности в коде');
    }
    
    if (!this.results.tests.security.hasJwtSecret) {
      recommendations.push('Добавить JWT_SECRET в переменные окружения');
    }
    
    if (!this.results.tests.security.hasStrongJwtSecret) {
      recommendations.push('Использовать более сильный JWT_SECRET (минимум 32 символа)');
    }
    
    // Проверка базы данных
    if (this.results.tests.database.connection && 
        this.results.tests.database.connection.includes('Failed')) {
      recommendations.push('Исправить подключение к базе данных');
    }
    
    // Проверка уязвимостей
    if (this.results.tests.dependencies.vulnerabilities && 
        typeof this.results.tests.dependencies.vulnerabilities === 'object' &&
        this.results.tests.dependencies.vulnerabilities.critical > 0) {
      recommendations.push('Исправить критические уязвимости в зависимостях');
    }
    
    recommendations.forEach((rec, index) => {
      logger.info(`  ${index + 1}. ${rec}`);
    });
    
    if (recommendations.length === 0) {
      logger.info('  ✅ Критических проблем не обнаружено');
    }
  }
}

// Запуск тестов
const tester = new ProjectTester();
tester.runAllTests().catch(console.error);
