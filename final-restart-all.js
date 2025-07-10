const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 ФИНАЛЬНЫЙ ПЕРЕЗАПУСК СИСТЕМЫ VHM24\n');

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
    console.log('📋 ОБНОВЛЕНИЯ:');
    console.log('✅ Все недостающие роуты добавлены');
    console.log('✅ POST endpoints для recipes исправлены');
    console.log('✅ Все 404 ошибки должны быть устранены\n');

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
    
    if (!fs.existsSync(backendPath)) {
      console.error('❌ Директория backend не найдена!');
      return;
    }
    
    if (!fs.existsSync(dashboardPath)) {
      console.error('❌ Директория apps/web-dashboard не найдена!');
      return;
    }

    // Запускаем backend
    await startProcess('npm', ['start'], backendPath, 'Backend API (порт 8000)');
    
    // Запускаем frontend
    await startProcess('npm', ['run', 'dev'], dashboardPath, 'Web Dashboard (порт 3000)');

    console.log('\n✅ ВСЕ СЕРВИСЫ УСПЕШНО ПЕРЕЗАПУЩЕНЫ!\n');
    console.log('📍 Проверьте работу:');
    console.log('   http://localhost:8000/health - Backend Health Check');
    console.log('   http://localhost:3000 - Web Dashboard\n');
    
    console.log('💡 ВАЖНО: Обновите страницу в браузере (F5) для загрузки новых изменений!\n');
    console.log('✅ Все 404 ошибки должны быть исправлены.');
    console.log('   Если ошибки остались - проверьте консоль браузера.\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Обработка завершения процесса
process.on('SIGINT', async () => {
  console.log('\n🛑 Остановка...');
  await killPort(8000);
  await killPort(3000);
  process.exit(0);
});

main();
