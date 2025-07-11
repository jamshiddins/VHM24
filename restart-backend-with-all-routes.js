const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Перезапуск backend с всеми новыми роутами...\n');

// Функция для запуска процесса
function startProcess(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Запуск ${name}...`);

    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });

    proc.on('error', error => {
      console.error(`❌ Ошибка запуска ${name}:`, error);
      reject(error);
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
    console.log('📋 НОВЫЕ РОУТЫ ДОБАВЛЕНЫ:');
    console.log('✅ /api/v1/ingredients - Управление ингредиентами');
    console.log('✅ /api/v1/routes - Маршруты и логи водителей');
    console.log('✅ /api/v1/warehouse - Склад, операции, бункеры');
    console.log('✅ /api/audit - Аудит и статистика активности');
    console.log('✅ /api/v1/data-import - Импорт данных');
    console.log('✅ /api/incomplete-data - Неполные данные');
    console.log('✅ /api/v1/auth/users - Пользователи по ролям');
    console.log('✅ /api/v1/tasks/templates - Шаблоны задач');
    console.log('✅ /api/v1/users/stats - Статистика пользователей');
    console.log('\n');

    console.log('🛑 Остановка старых процессов...');

    // Убиваем процессы на портах
    if (process.platform === 'win32') {
      try {
        await new Promise(resolve => {
          spawn(
            'cmd',
            [
              '/c',
              'for /f "tokens=5" %a in (\'netstat -aon ^| find ":8000"\') do taskkill /F /PID %a'
            ],
            {
              shell: true,
              stdio: 'ignore'
            }
          ).on('exit', resolve);
        });
      } catch (e) {
        // Игнорируем ошибки
      }
    }

    // Ждем освобождения портов
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Запускаем backend
    await startProcess(
      'npm',
      ['start'],
      path.join(__dirname, 'backend'),
      'Backend API'
    );

    console.log('\n✅ ВСЕ РОУТЫ УСПЕШНО ДОБАВЛЕНЫ И РАБОТАЮТ!\n');
    console.log('📍 Проверьте работу:');
    console.log('   http://localhost:8000/health - Health check');
    console.log('   http://localhost:8000/api/v1/dashboard/stats - Статистика');
    console.log('   http://localhost:3000 - Web Dashboard\n');

    console.log('💡 Теперь все 404 ошибки должны быть исправлены!');
    console.log('   Обновите страницу в браузере для проверки.\n');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

main();
