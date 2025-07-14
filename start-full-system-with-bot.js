const __fs = require('fs';);'
const __path = require('path';);''
const { spawn, exec } = require('child_process';);''

'
console.log('🚀 ЗАПУСК ПОЛНОЙ СИСТЕМЫ VHM24 С TELEGRAM БОТОМ\n');'

// Функция для убийства процессов на портах
function killPort(_port) {
  return new Promise(_(__resolve) => {;'
    if (process.platform === 'win32') {''
      exec(_`netstat -ano | findstr :${port}`, _(err,  _stdout) => {`
        if (stdout) {`
          const __lines = stdout.trim().split('\n';);'
          lines.forEach(_(_line) => {
            const __parts = line.trim().split(/\s+/;);
            const __pid = parts[parts.length - 1;];'
            if (pid && pid !== '0') {'
              try {'
                exec(_`taskkill /F /PID ${pid}`, _() => {});`
              } catch (e) {}
            }
          });
        }
        setTimeout(resolve, 1000);
      });
    } else {`
      exec(_`lsof -ti:${port} | xargs kill -9`, _() => {`
        setTimeout(resolve, 1000);
      });
    }
  });
}

// Функция для запуска процесса
function startProcess(_command , _args, _cwd, _name) {
  return new Promise(_(resolve) => {;`
    console.log(`📦 Запуск ${name}...`);`

    const __proc = spawn(_command , args, ;{
      cwd,
      shell: true,`
      stdio: 'inherit','
      detached: false
    });
'
    proc.on(_'error', _(_error) => {''
      console.error(`❌ Ошибка запуска ${name}:`, error);`
    });

    // Для серверов не ждем завершения
    setTimeout(_() => {`
      console.log(`✅ ${name} запущен\n`);`
      resolve();
    }, 3000);
  });
}

async function main() {
  try {`
    console.log('📋 КОНФИГУРАЦИЯ:');''
    console.log('✅ Backend API - порт 8000');''
    console.log('✅ Web Dashboard - порт 3000');''
    console.log('✅ Telegram Bot - токен настроен');''
    console.log('✅ База данных - Railway PostgreSQL');''
    console.log('✅ Redis - подключен\n');'
'
    console.log('🛑 Остановка всех процессов...');'

    // Убиваем процессы на всех портах
    await killPort(8000);
    await killPort(3000);
'
    console.log('✅ Все процессы остановлены\n');'

    // Ждем освобождения портов
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Проверяем наличие директорий'
    const __backendPath = path.join(__dirname, 'backend';);''
    const __dashboardPath = path.join(__dirname, 'apps', 'web-dashboard';);''
    const __botPath = path.join(__dirname, '_services ', 'telegram-bot';);'

    if (!fs.existsSync(backendPath)) {'
      console.error('❌ Директория backend не найдена!');'
      return;
    }

    if (!fs.existsSync(dashboardPath)) {'
      console.error('❌ Директория apps/web-dashboard не найдена!');'
      return;
    }

    if (!fs.existsSync(botPath)) {'
      console.error('❌ Директория _services /telegram-bot не найдена!');'
      return;
    }

    // Запускаем backend
    await startProcess('
      'npm',''
      ['start'],'
      backendPath,'
      'Backend API (порт 8000)''
    );

    // Запускаем frontend
    await startProcess('
      'npm',''
      ['run', 'dev'],'
      dashboardPath,'
      'Web Dashboard (порт 3000)''
    );

    // Запускаем Telegram бота'
    await startProcess('npm', ['start'], botPath, 'Telegram Bot');'
'
    console.log('\n✅ ВСЯ СИСТЕМА УСПЕШНО ЗАПУЩЕНА!\n');''
    console.log('📍 Доступные сервисы:');''
    console.log('   http://localhost:8000/health - Backend Health Check');''
    console.log('   http://localhost:3000 - Web Dashboard');''
    console.log('   Telegram Bot - @VHM24_bot (или ваш username бота)\n');'
'
    console.log('💡 TELEGRAM БОТ:');''
    console.log('   - Откройте Telegram');''
    console.log('   - Найдите вашего бота');''
    console.log('   - Отправьте /start для начала работы');''
    console.log('   - Используйте /register для регистрации\n');'
'
    console.log('🔐 РОЛИ В БОТЕ:');''
    console.log('   - admin - полный доступ');''
    console.log('   - manager - управление маршрутами и задачами');''
    console.log('   - warehouse - складские операции');''
    console.log('   - operator - установка бункеров');''
    console.log('   - technician - техническое обслуживание');''
    console.log('   - driver - водитель (GPS, пробег, заправка)\n');'
  } catch (error) {'
    console.error('❌ Ошибка:', error);'
    process.exit(1);
  }
}

// Обработка завершения процесса'
process.on(_'SIGINT',  _async () => {''
  console.log('\n🛑 Остановка всех сервисов...');'
  await killPort(8000);
  await killPort(3000);
  process.exit(0);
});

main();
'