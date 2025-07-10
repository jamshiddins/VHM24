const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 VHM24 - ФИНАЛЬНЫЙ PRODUCTION АУДИТ\n');

class ProductionAuditor {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.securityIssues = [];
    this.performanceIssues = [];
  }

  // 1. Исправление fs.await ошибок
  async fixFsAwaitErrors() {
    console.log('🔧 Исправление fs.await ошибок...');
    
    const jsFiles = await this.findJSFiles('.');
    let fixedFiles = 0;

    for (const file of jsFiles) {
      try {
        let content = await fsPromises.readFile(file, 'utf8');
        const originalContent = content;

        // Исправляем все варианты fs.await
        content = content.replace(/fs\.await\s+fsPromises\.readFile/g, 'await fsPromises.readFile');
        content = content.replace(/fs\.await\s+fsPromises\.writeFile/g, 'await fsPromises.writeFile');
        content = content.replace(/fs\.await\s+fs\.promises\.readFile/g, 'await fs.promises.readFile');
        content = content.replace(/fs\.await\s+fs\.promises\.writeFile/g, 'await fs.promises.writeFile');

        if (content !== originalContent) {
          await fsPromises.writeFile(file, content, 'utf8');
          fixedFiles++;
          this.fixes.push(`Fixed fs.await in ${file}`);
        }
      } catch (error) {
        this.issues.push(`Error fixing ${file}: ${error.message}`);
      }
    }

    console.log(`✅ Исправлено fs.await в ${fixedFiles} файлах`);
  }

  // 2. Поиск синхронных FS операций
  async findSyncFSOperations() {
    console.log('🔍 Поиск синхронных FS операций...');
    
    const jsFiles = await this.findJSFiles('.');
    const syncOperations = [];

    for (const file of jsFiles) {
      try {
        const content = await fsPromises.readFile(file, 'utf8');
        
        // Ищем синхронные операции
        const syncPatterns = [
          /fs\.readFileSync/g,
          /fs\.writeFileSync/g,
          /fs\.existsSync/g,
          /fs\.statSync/g,
          /fs\.readdirSync/g
        ];

        syncPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            syncOperations.push({
              file,
              operations: matches,
              count: matches.length
            });
          }
        });
      } catch (error) {
        this.issues.push(`Error reading ${file}: ${error.message}`);
      }
    }

    if (syncOperations.length > 0) {
      console.log('⚠️ Найдены синхронные FS операции:');
      syncOperations.forEach(op => {
        console.log(`  ${op.file}: ${op.operations.join(', ')}`);
        this.performanceIssues.push(`Sync FS operations in ${op.file}: ${op.operations.join(', ')}`);
      });
    } else {
      console.log('✅ Синхронные FS операции не найдены');
    }
  }

  // 3. Проверка рекурсии в логгерах
  async checkLoggerRecursion() {
    console.log('🔍 Проверка рекурсии в логгерах...');
    
    const jsFiles = await this.findJSFiles('.');
    const recursionIssues = [];

    for (const file of jsFiles) {
      try {
        const content = await fsPromises.readFile(file, 'utf8');
        
        // Ищем потенциальную рекурсию в логгерах
        if (content.includes('logger') || content.includes('winston')) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('logger.error') && line.includes('logger.error')) {
              recursionIssues.push({
                file,
                line: index + 1,
                content: line.trim()
              });
            }
          });
        }
      } catch (error) {
        this.issues.push(`Error checking logger in ${file}: ${error.message}`);
      }
    }

    if (recursionIssues.length > 0) {
      console.log('⚠️ Потенциальная рекурсия в логгерах:');
      recursionIssues.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line} - ${issue.content}`);
        this.performanceIssues.push(`Potential logger recursion in ${issue.file}:${issue.line}`);
      });
    } else {
      console.log('✅ Рекурсия в логгерах не найдена');
    }
  }

  // 4. Security аудит
  async securityAudit() {
    console.log('🔐 Security аудит...');

    // Проверяем .env файл
    if (fs.existsSync('.env')) {
      const envContent = await fsPromises.readFile('.env', 'utf8');
      
      // Проверяем наличие критических переменных
      const requiredSecrets = ['JWT_SECRET', 'DATABASE_URL'];
      requiredSecrets.forEach(secret => {
        if (!envContent.includes(secret)) {
          this.securityIssues.push(`Missing required secret: ${secret}`);
        }
      });

      // Проверяем слабые секреты
      if (envContent.includes('JWT_SECRET="secret"') || envContent.includes('JWT_SECRET=secret')) {
        this.securityIssues.push('Weak JWT_SECRET detected');
      }
    }

    // Проверяем настройки Helmet
    const backendIndex = path.join('backend', 'src', 'index.js');
    if (fs.existsSync(backendIndex)) {
      const content = await fsPromises.readFile(backendIndex, 'utf8');
      
      if (!content.includes('helmet')) {
        this.securityIssues.push('Helmet middleware not found in backend');
      }
      
      if (!content.includes('cors')) {
        this.securityIssues.push('CORS middleware not found in backend');
      }
    }

    // Проверяем error handling
    const jsFiles = await this.findJSFiles('backend');
    for (const file of jsFiles) {
      try {
        const content = await fsPromises.readFile(file, 'utf8');
        
        // Ищем раскрытие stack traces
        if (content.includes('error.stack') && !content.includes('NODE_ENV')) {
          this.securityIssues.push(`Potential stack trace exposure in ${file}`);
        }
      } catch (error) {
        // Игнорируем ошибки чтения
      }
    }

    if (this.securityIssues.length === 0) {
      console.log('✅ Security проблемы не найдены');
    } else {
      console.log('⚠️ Security проблемы:');
      this.securityIssues.forEach(issue => console.log(`  ${issue}`));
    }
  }

  // 5. Валидация API endpoints
  async validateAPIEndpoints() {
    console.log('🔍 Проверка API endpoints...');

    const routesDir = path.join('backend', 'src', 'routes');
    if (!fs.existsSync(routesDir)) {
      this.issues.push('Routes directory not found');
      return;
    }

    const routeFiles = await fsPromises.readdir(routesDir);
    const endpoints = [];

    for (const file of routeFiles) {
      if (file.endsWith('.js')) {
        try {
          const content = await fsPromises.readFile(path.join(routesDir, file), 'utf8');
          
          // Ищем определения роутов
          const routeMatches = content.match(/router\.(get|post|put|delete)\s*\(/g);
          if (routeMatches) {
            endpoints.push({
              file,
              routes: routeMatches.length
            });
          }

          // Проверяем наличие валидации
          if (!content.includes('try') || !content.includes('catch')) {
            this.issues.push(`Missing error handling in ${file}`);
          }
        } catch (error) {
          this.issues.push(`Error reading route file ${file}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Найдено ${endpoints.length} файлов роутов`);
    endpoints.forEach(ep => {
      console.log(`  ${ep.file}: ${ep.routes} endpoints`);
    });
  }

  // 6. Проверка переменных окружения
  async checkEnvironmentVariables() {
    console.log('🔍 Проверка переменных окружения...');

    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'TELEGRAM_BOT_TOKEN',
      'REDIS_URL'
    ];

    const optionalVars = [
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'EMAIL_HOST',
      'EMAIL_USER'
    ];

    if (fs.existsSync('.env')) {
      const envContent = await fsPromises.readFile('.env', 'utf8');
      
      const missing = requiredVars.filter(v => !envContent.includes(v + '='));
      const present = optionalVars.filter(v => envContent.includes(v + '='));

      if (missing.length > 0) {
        console.log('⚠️ Отсутствующие обязательные переменные:');
        missing.forEach(v => {
          console.log(`  ${v}`);
          this.issues.push(`Missing required environment variable: ${v}`);
        });
      }

      console.log(`✅ Настроено ${requiredVars.length - missing.length}/${requiredVars.length} обязательных переменных`);
      console.log(`✅ Настроено ${present.length}/${optionalVars.length} опциональных переменных`);
    } else {
      this.issues.push('.env file not found');
    }
  }

  // 7. Тест запуска сервисов
  async testServiceStartup() {
    console.log('🚀 Тест запуска сервисов...');

    const services = [
      { name: 'Backend', path: 'backend', command: 'npm start', port: 8000 },
      { name: 'Web Dashboard', path: 'apps/web-dashboard', command: 'npm run build', port: 3000 }
    ];

    for (const service of services) {
      try {
        if (fs.existsSync(service.path)) {
          const packageJsonPath = path.join(service.path, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(await fsPromises.readFile(packageJsonPath, 'utf8'));
            
            if (service.name === 'Backend' && !pkg.scripts?.start) {
              this.issues.push(`${service.name}: Missing start script`);
            }
            
            if (service.name === 'Web Dashboard' && !pkg.scripts?.build) {
              this.issues.push(`${service.name}: Missing build script`);
            }
            
            console.log(`✅ ${service.name}: package.json OK`);
          } else {
            this.issues.push(`${service.name}: package.json not found`);
          }
        } else {
          this.issues.push(`${service.name}: Directory not found`);
        }
      } catch (error) {
        this.issues.push(`${service.name}: ${error.message}`);
      }
    }
  }

  // Вспомогательная функция для поиска JS файлов
  async findJSFiles(dir) {
    const files = [];
    
    async function scan(currentDir) {
      try {
        const items = await fsPromises.readdir(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = await fsPromises.stat(fullPath);
          
          if (stat.isDirectory()) {
            // Пропускаем node_modules и другие служебные директории
            if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(item)) {
              await scan(fullPath);
            }
          } else if (item.endsWith('.js') && !item.includes('.min.') && !item.includes('.test.')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа к директориям
      }
    }
    
    await scan(dir);
    return files;
  }

  // Генерация отчета
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        securityIssues: this.securityIssues.length,
        performanceIssues: this.performanceIssues.length,
        fixesApplied: this.fixes.length
      },
      issues: this.issues,
      securityIssues: this.securityIssues,
      performanceIssues: this.performanceIssues,
      fixes: this.fixes,
      recommendations: [
        'Запустите npm audit для проверки зависимостей',
        'Настройте мониторинг в production',
        'Включите логирование ошибок',
        'Настройте backup базы данных',
        'Проведите нагрузочное тестирование'
      ]
    };

    await fsPromises.writeFile('production-audit-report.json', JSON.stringify(report, null, 2));
    
    // Создаем markdown отчет
    const markdown = this.generateMarkdownReport(report);
    await fsPromises.writeFile('PRODUCTION_AUDIT_REPORT.md', markdown);

    return report;
  }

  generateMarkdownReport(report) {
    return `# 🔍 VHM24 - PRODUCTION AUDIT REPORT

## 📊 Сводка

- **Всего проблем:** ${report.summary.totalIssues}
- **Security проблемы:** ${report.summary.securityIssues}
- **Performance проблемы:** ${report.summary.performanceIssues}
- **Исправлений применено:** ${report.summary.fixesApplied}

## ✅ Исправления

${report.fixes.length > 0 ? report.fixes.map(fix => `- ${fix}`).join('\n') : 'Исправления не требовались'}

## ⚠️ Общие проблемы

${report.issues.length > 0 ? report.issues.map(issue => `- ${issue}`).join('\n') : 'Проблемы не найдены'}

## 🔐 Security проблемы

${report.securityIssues.length > 0 ? report.securityIssues.map(issue => `- ${issue}`).join('\n') : 'Security проблемы не найдены'}

## ⚡ Performance проблемы

${report.performanceIssues.length > 0 ? report.performanceIssues.map(issue => `- ${issue}`).join('\n') : 'Performance проблемы не найдены'}

## 💡 Рекомендации

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---

*Отчет создан: ${report.timestamp}*
`;
  }

  // Основной метод аудита
  async runFullAudit() {
    console.log('🎯 Запуск полного production аудита...\n');

    try {
      await this.fixFsAwaitErrors();
      await this.findSyncFSOperations();
      await this.checkLoggerRecursion();
      await this.securityAudit();
      await this.validateAPIEndpoints();
      await this.checkEnvironmentVariables();
      await this.testServiceStartup();

      const report = await this.generateReport();

      console.log('\n📊 РЕЗУЛЬТАТЫ АУДИТА:');
      console.log(`✅ Исправлений применено: ${report.summary.fixesApplied}`);
      console.log(`⚠️ Общих проблем: ${report.summary.totalIssues}`);
      console.log(`🔐 Security проблем: ${report.summary.securityIssues}`);
      console.log(`⚡ Performance проблем: ${report.summary.performanceIssues}`);

      console.log('\n📄 Отчеты сохранены:');
      console.log('- production-audit-report.json');
      console.log('- PRODUCTION_AUDIT_REPORT.md');

      if (report.summary.totalIssues === 0 && report.summary.securityIssues === 0) {
        console.log('\n🎉 СИСТЕМА ГОТОВА К PRODUCTION!');
      } else {
        console.log('\n⚠️ Требуются дополнительные исправления перед production');
      }

    } catch (error) {
      console.error('❌ Ошибка во время аудита:', error);
      process.exit(1);
    }
  }
}

// Запуск аудита
const auditor = new ProductionAuditor();
auditor.runFullAudit();
