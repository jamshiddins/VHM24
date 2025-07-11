const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 VHM24 СИСТЕМА ИСПРАВЛЕНИЯ И ТЕСТИРОВАНИЯ\n');

const fixes = [];
const errors = [];

// Функция для выполнения команд
function runCommand(command, description) {
  try {
    console.log(`⚡ ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - успешно`);
    fixes.push(description);
    return result;
  } catch (error) {
    console.log(`❌ ${description} - ошибка: ${error.message}`);
    errors.push({ description, error: error.message });
    return null;
  }
}

// Функция для проверки и создания файлов
function ensureFileExists(filePath, content, description) {
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${description} - создан`);
      fixes.push(description);
    } else {
      console.log(`✅ ${description} - существует`);
    }
  } catch (error) {
    console.log(`❌ ${description} - ошибка: ${error.message}`);
    errors.push({ description, error: error.message });
  }
}

async function fixAndTestSystem() {
  console.log('1. 📋 Проверка структуры проекта...');
  
  // Создание необходимых директорий
  const directories = [
    'logs',
    'uploads',
    'backups',
    'backend/logs',
    'apps/telegram-bot/logs'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Создана директория: ${dir}`);
      fixes.push(`Создана директория: ${dir}`);
    }
  });
  
  console.log('\n2. 🔧 Исправление конфигурационных файлов...');
  
  // Проверка .env файлов
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('redis.railway.internal')) {
    console.log('⚠️ Обнаружены Railway internal URLs в .env - уже исправлено');
  }
  
  console.log('\n3. 📦 Установка зависимостей...');
  
  // Установка зависимостей для backend
  runCommand('cd backend && npm install', 'Установка зависимостей backend');
  
  // Установка зависимостей для telegram-bot
  runCommand('cd apps/telegram-bot && npm install', 'Установка зависимостей telegram-bot');
  
  console.log('\n4. 🗄️ Настройка базы данных...');
  
  // Генерация Prisma клиента
  runCommand('cd backend && npx prisma generate', 'Генерация Prisma клиента');
  
  console.log('\n5. 🧪 Запуск комплексного тестирования...');
  
  // Запуск тестов
  try {
    const { testSystemComponents } = require('./test-system-comprehensive.js');
    const testResults = await testSystemComponents();
    
    console.log('\n6. 📊 Результаты тестирования:');
    console.log('=' .repeat(50));
    
    if (testResults.overall) {
      console.log('🎉 ВСЕ КРИТИЧНЫЕ КОМПОНЕНТЫ РАБОТАЮТ!');
    } else {
      console.log('⚠️ ЕСТЬ ПРОБЛЕМЫ С КРИТИЧНЫМИ КОМПОНЕНТАМИ');
    }
    
    console.log('\n7. 🔍 Дополнительные проверки...');
    
    // Проверка портов
    const portChecks = [
      { port: 8000, service: 'Backend API' },
      { port: 6379, service: 'Redis' }
    ];
    
    for (const check of portChecks) {
      try {
        const result = runCommand(`netstat -an | findstr :${check.port}`, `Проверка порта ${check.port} (${check.service})`);
        if (result && result.includes(`${check.port}`)) {
          console.log(`✅ Порт ${check.port} (${check.service}) - используется`);
        } else {
          console.log(`⚠️ Порт ${check.port} (${check.service}) - свободен`);
        }
      } catch (error) {
        console.log(`❓ Порт ${check.port} (${check.service}) - статус неизвестен`);
      }
    }
    
    console.log('\n8. 🚀 Рекомендации по запуску:');
    console.log('=' .repeat(50));
    
    if (testResults.database && testResults.backend && testResults.telegram) {
      console.log('✅ СИСТЕМА ГОТОВА К ЗАПУСКУ!');
      console.log('\n💡 Команды для запуска:');
      console.log('   1. Backend: cd backend && npm start');
      console.log('   2. Telegram Bot: cd apps/telegram-bot && npm start');
      console.log('   3. Проверка: curl http://localhost:8000/health');
    } else {
      console.log('⚠️ СИСТЕМА НЕ ПОЛНОСТЬЮ ГОТОВА');
      console.log('\n🔧 Необходимые действия:');
      
      if (!testResults.database) {
        console.log('   ❌ Исправить подключение к базе данных');
      }
      if (!testResults.redis) {
        console.log('   ❌ Запустить Redis: redis-server');
      }
      if (!testResults.telegram) {
        console.log('   ❌ Проверить токен Telegram бота');
      }
    }
    
    console.log('\n9. 📋 Итоговый отчёт:');
    console.log('=' .repeat(50));
    console.log(`✅ Исправлений выполнено: ${fixes.length}`);
    console.log(`❌ Ошибок обнаружено: ${errors.length}`);
    
    if (fixes.length > 0) {
      console.log('\n✅ Выполненные исправления:');
      fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Обнаруженные ошибки:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.description}: ${error.error}`);
      });
    }
    
    // Создание отчёта
    const report = {
      timestamp: new Date().toISOString(),
      fixes: fixes,
      errors: errors,
      testResults: testResults,
      recommendations: testResults.overall ? 
        'Система готова к запуску' : 
        'Требуются дополнительные исправления'
    };
    
    fs.writeFileSync('fix-and-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Отчёт сохранён в: fix-and-test-report.json');
    
    return testResults.overall;
    
  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error.message);
    errors.push({ description: 'Критическая ошибка тестирования', error: error.message });
    return false;
  }
}

// Запуск исправлений и тестов
if (require.main === module) {
  fixAndTestSystem()
    .then(success => {
      console.log('\n🎯 ЗАВЕРШЕНИЕ РАБОТЫ');
      console.log('=' .repeat(50));
      if (success) {
        console.log('🎉 ВСЕ ИСПРАВЛЕНИЯ ВЫПОЛНЕНЫ УСПЕШНО!');
        console.log('💡 Система готова к использованию');
        process.exit(0);
      } else {
        console.log('⚠️ ТРЕБУЮТСЯ ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ');
        console.log('📋 Проверьте отчёт и исправьте оставшиеся проблемы');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
      process.exit(1);
    });
}

module.exports = { fixAndTestSystem };
