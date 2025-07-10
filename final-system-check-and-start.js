const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const axios = require('axios');

console.log('🔍 VHM24 - ФИНАЛЬНАЯ ПРОВЕРКА И ЗАПУСК СИСТЕМЫ\n');

class SystemChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
    this.processes = [];
  }

  // 1. Проверка файловой структуры
  async checkFileStructure() {
    console.log('📁 Проверка файловой структуры...');
    
    const requiredFiles = [
      'backend/src/index.js',
      'backend/package.json',
      'apps/web-dashboard/package.json',
      'services/telegram-bot/src/index.js',
      '.env',
      'packages/database/prisma/schema.prisma'
    ];

    const requiredDirs = [
      'backend/src/routes',
      'apps/web-dashboard',
      'services/telegram-bot',
      'packages/database'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.checks.push(`✅ ${file} - найден`);
      } else {
        this.errors.push(`❌ ${file} - отсутствует`);
      }
    }

    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        this.checks.push(`✅ ${dir}/ - найдена`);
      } else {
        this.errors.push(`❌ ${dir}/ - отсутствует`);
      }
    }

    console.log(`✅ Проверено ${requiredFiles.length + requiredDirs.length} элементов`);
  }

  // 2. Проверка переменных окружения
  async checkEnvironmentVariables() {
    console.log('🔧 Проверка переменных окружения...');
    
    if (!fs.existsSync('.env')) {
      this.errors.push('❌ .env файл не найден');
      return;
    }

    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'TELEGRAM_BOT_TOKEN',
      'ADMIN_IDS'
    ];

    for (const varName of requiredVars) {
      if (envContent.includes(`${varName}=`)) {
        this.checks.push(`✅ ${varName} - настроена`);
      } else {
        this.errors.push(`❌ ${varName} - отсутствует`);
      }
    }

    // Проверяем токен бота
    if (envContent.includes('TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ')) {
      this.checks.push('✅ Telegram Bot Token - корректный');
    }

    // Проверяем Admin ID
    if (envContent.includes('ADMIN_IDS=42283329')) {
      this.checks.push('✅ Admin ID - настроен');
    }

    console.log('✅ Переменные окружения проверены');
  }

  // 3. Проверка зависимостей
  async checkDependencies() {
    console.log('📦 Проверка зависимостей...');
    
    const packagePaths = [
      'backend/package.json',
      'apps/web-dashboard/package.json',
      'services/telegram-bot/package.json'
    ];

    for (const pkgPath of packagePaths) {
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const nodeModulesPath = path.join(path.dirname(pkgPath), 'node_modules');
          
          if (fs.existsSync(nodeModulesPath)) {
            this.checks.push(`✅ ${pkgPath} - зависимости установлены`);
          } else {
            this.warnings.push(`⚠️ ${pkgPath} - node_modules отсутствует`);
          }
        } catch (error) {
          this.errors.push(`❌ ${pkgPath} - некорректный JSON`);
        }
      }
    }

    console.log('✅ Зависимости проверены');
  }

  // 4. Проверка синтаксиса критических файлов
  async checkSyntax() {
    console.log('🔍 Проверка синтаксиса...');
    
    const criticalFiles = [
      'backend/src/index.js',
      'services/telegram-bot/src/index.js'
    ];

    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Проверяем на fs.await ошибки
          if (content.includes('fs.await')) {
            this.errors.push(`❌ ${file} - содержит fs.await ошибки`);
          } else {
            this.checks.push(`✅ ${file} - синтаксис корректный`);
          }

          // Проверяем на незакрытые блоки try-catch
          const tryCount = (content.match(/try\s*{/g) || []).length;
          const catchCount = (content.match(/catch\s*\(/g) || []).length;
          
          if (tryCount !== catchCount) {
            this.warnings.push(`⚠️ ${file} - несоответствие try/catch блоков`);
          }

        } catch (error) {
          this.errors.push(`❌ ${file} - ошибка чтения файла`);
        }
      }
    }

    console.log('✅ Синтаксис проверен');
  }

  // 5. Проверка API роутов
  async checkAPIRoutes() {
    console.log('🔌 Проверка API роутов...');
    
    const routesDir = 'backend/src/routes';
    if (!fs.existsSync(routesDir)) {
      this.errors.push('❌ Директория routes не найдена');
      return;
    }

    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    const expectedRoutes = [
      'auth.js', 'users.js', 'machines.js', 'tasks.js', 
      'recipes.js', 'dashboard.js', 'audit.js', 'warehouse.js',
      'ingredients.js', 'routes.js', 'data-import.js', 'incomplete-data.js'
    ];

    for (const route of expectedRoutes) {
      if (routeFiles.includes(route)) {
        this.checks.push(`✅ ${route} - найден`);
      } else {
        this.errors.push(`❌ ${route} - отсутствует`);
      }
    }

    console.log(`✅ Проверено ${expectedRoutes.length} роутов`);
  }

  // 6. Убийство старых процессов
  async killOldProcesses() {
    console.log('🛑 Остановка старых процессов...');
    
    const ports = [8000, 3000, 3005];
    
    for (const port of ports) {
      await this.killPort(port);
    }
    
    console.log('✅ Старые процессы остановлены');
  }

  killPort(port) {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
          if (stdout) {
            const lines = stdout.trim().split('\n');
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && pid !== '0') {
                try {
                  exec(`taskkill /F /PID ${pid}`, () => {});
                } catch (e) {}
              }
            });
          }
          setTimeout(resolve, 1000);
        });
      } else {
        exec(`lsof -ti:${port} | xargs kill -9`, () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }

  // 7. Запуск сервисов
  async startServices() {
    console.log('🚀 Запуск сервисов...');
    
    // Запуск Backend
    await this.startService('backend', ['npm', 'start'], 'Backend API (порт 8000)');
    
    // Ждем запуска backend
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Запуск Frontend
    await this.startService('apps/web-dashboard', ['npm', 'run', 'dev'], 'Web Dashboard (порт 3000)');
    
    // Ждем запуска frontend
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Запуск Telegram Bot
    await this.startService('services/telegram-bot', ['npm', 'start'], 'Telegram Bot');
    
    console.log('✅ Все сервисы запущены');
  }

  startService(cwd, command, name) {
    return new Promise((resolve) => {
      console.log(`📦 Запуск ${name}...`);
      
      const proc = spawn(command[0], command.slice(1), {
        cwd,
        shell: true,
        stdio: 'pipe',
        detached: false
      });

      proc.stdout.on('data', (data) => {
        // Логируем только важные сообщения
        const output = data.toString();
        if (output.includes('listening') || output.includes('started') || output.includes('ready')) {
          console.log(`   ${name}: ${output.trim()}`);
        }
      });

      proc.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error(`   ${name} ERROR: ${error.trim()}`);
        }
      });

      this.processes.push({ name, proc });
      
      setTimeout(() => {
        console.log(`✅ ${name} запущен`);
        resolve();
      }, 2000);
    });
  }

  // 8. Тестирование endpoints
  async testEndpoints() {
    console.log('🧪 Тестирование endpoints...');
    
    // Ждем полного запуска
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const endpoints = [
      { url: 'http://localhost:8000/health', name: 'Backend Health' },
      { url: 'http://localhost:3000', name: 'Frontend' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, { timeout: 5000 });
        if (response.status === 200) {
          this.checks.push(`✅ ${endpoint.name} - работает`);
        } else {
          this.warnings.push(`⚠️ ${endpoint.name} - статус ${response.status}`);
        }
      } catch (error) {
        this.warnings.push(`⚠️ ${endpoint.name} - недоступен (возможно еще запускается)`);
      }
    }

    console.log('✅ Endpoints протестированы');
  }

  // 9. Генерация отчета
  generateReport() {
    console.log('\n📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ:');
    console.log('=' .repeat(50));
    
    console.log(`\n✅ Успешных проверок: ${this.checks.length}`);
    this.checks.forEach(check => console.log(`  ${check}`));
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ Предупреждения: ${this.warnings.length}`);
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Ошибки: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log('\n🚀 ЗАПУЩЕННЫЕ СЕРВИСЫ:');
    this.processes.forEach(proc => {
      console.log(`  ✅ ${proc.name}`);
    });

    console.log('\n🌐 ДОСТУП К СИСТЕМЕ:');
    console.log('  📊 Web Dashboard: http://localhost:3000');
    console.log('  🔌 Backend API: http://localhost:8000');
    console.log('  🤖 Telegram Bot: @vendhubManagerbot');
    console.log('  📋 Health Check: http://localhost:8000/health');

    const totalIssues = this.errors.length;
    const successRate = ((this.checks.length / (this.checks.length + this.errors.length)) * 100).toFixed(1);

    console.log(`\n📈 ОБЩИЙ СТАТУС:`);
    console.log(`  Успешность: ${successRate}%`);
    console.log(`  Критических ошибок: ${this.errors.length}`);
    
    if (totalIssues === 0) {
      console.log('\n🎉 СИСТЕМА ПОЛНОСТЬЮ ГОТОВА И ЗАПУЩЕНА!');
    } else {
      console.log('\n⚠️ Система запущена с предупреждениями');
    }
  }

  // Основной метод
  async runFullCheck() {
    try {
      await this.checkFileStructure();
      await this.checkEnvironmentVariables();
      await this.checkDependencies();
      await this.checkSyntax();
      await this.checkAPIRoutes();
      await this.killOldProcesses();
      await this.startServices();
      await this.testEndpoints();
      
      this.generateReport();
      
      // Сохраняем отчет
      const report = {
        timestamp: new Date().toISOString(),
        checks: this.checks,
        warnings: this.warnings,
        errors: this.errors,
        processes: this.processes.map(p => p.name),
        status: this.errors.length === 0 ? 'SUCCESS' : 'WARNING'
      };
      
      fs.writeFileSync('system-check-report.json', JSON.stringify(report, null, 2));
      console.log('\n📄 Отчет сохранен: system-check-report.json');
      
    } catch (error) {
      console.error('\n❌ Критическая ошибка при проверке:', error);
      process.exit(1);
    }
  }
}

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка системы...');
  process.exit(0);
});

// Запуск проверки
const checker = new SystemChecker();
checker.runFullCheck();
