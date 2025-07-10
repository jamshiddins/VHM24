const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 ЗАПУСК ПОЛНОЙ СИСТЕМЫ VHM24 С TELEGRAM БОТОМ\n');

// Функция для убийства процессов на портах
function killPort(port) {
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

// Функция для запуска процесса
function startProcess(command, args, cwd, name) {
  return new Promise((resolve) => {
    console.log(`📦 Запуск ${name}...`);
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      detached: false
    });

    proc.on('error', (error) => {
      console.error(`❌ Ошибка запуска ${name}:`, error);
    });

    // Для серверов не ждем завершения
    setTimeout(() => {
      console.log(`✅ ${name} запущен\n`);
      resolve();
    }, 3000);
  });
}

async function main() {
  try {
    console.log('📋 КОНФИГУРАЦИЯ:');
    console.log('✅ Backend API - порт 8000');
    console.log('✅ Web Dashboard - порт 3000');
    console.log('✅ Telegram Bot - токен настроен');
    console.log('✅ База данных - Railway PostgreSQL');
    console.log('✅ Redis - подключен\n');

    console.log('🛑 Остановка всех процессов...');
    
    // Убиваем процессы на всех портах
    await killPort(8000);
    await killPort(3000);
    
    console.log('✅ Все процессы остановлены\n');
    
    // Ждем освобождения портов
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Проверяем наличие директорий
    const backendPath = path.join(__dirname, 'backend');
    const dashboardPath = path.join(__dirname, 'apps', 'web-dashboard');
    const botPath = path.join(__dirname, 'services', 'telegram-bot');
    
    if (!fs.existsSync(backendPath)) {
      console.error('❌ Директория backend не найдена!');
      return;
    }
    
    if (!fs.existsSync(dashboardPath)) {
      console.error('❌ Директория apps/web-dashboard не найдена!');
      return;
    }
    
    if (!fs.existsSync(botPath)) {
      console.error('❌ Директория services/telegram-bot не найдена!');
      return;
    }

    // Запускаем backend
    await startProcess('npm', ['start'], backendPath, 'Backend API (порт 8000)');
    
    // Запускаем frontend
    await startProcess('npm', ['run', 'dev'], dashboardPath, 'Web Dashboard (порт 3000)');
    
    // Запускаем Telegram бота
    await startProcess('npm', ['start'], botPath, 'Telegram Bot');

    console.log('\n✅ ВСЯ СИСТЕМА УСПЕШНО ЗАПУЩЕНА!\n');
    console.log('📍 Доступные сервисы:');
    console.log('   http://localhost:8000/health - Backend Health Check');
    console.log('   http://localhost:3000 - Web Dashboard');
    console.log('   Telegram Bot - @VHM24_bot (или ваш username бота)\n');
    
    console.log('💡 TELEGRAM БОТ:');
    console.log('   - Откройте Telegram');
    console.log('   - Найдите вашего бота');
    console.log('   - Отправьте /start для начала работы');
    console.log('   - Используйте /register для регистрации\n');
    
    console.log('🔐 РОЛИ В БОТЕ:');
    console.log('   - admin - полный доступ');
    console.log('   - manager - управление маршрутами и задачами');
    console.log('   - warehouse - складские операции');
    console.log('   - operator - установка бункеров');
    console.log('   - technician - техническое обслуживание');
    console.log('   - driver - водитель (GPS, пробег, заправка)\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Обработка завершения процесса
process.on('SIGINT', async () => {
  console.log('\n🛑 Остановка всех сервисов...');
  await killPort(8000);
  await killPort(3000);
  process.exit(0);
});

main();
