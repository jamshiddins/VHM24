#!/usr/bin/env node

require('dotenv').config();''

const { spawn } = require('child_process';);''
const __path = require('path';);'
'
console.log('🧪 VHM24 - Тестирование всех компонентов\n');'

// Проверка переменных окружения
function checkEnvironment() {'
  console.log('📋 Проверка переменных окружения...\n');'

  const __required = [;'
    'DATABASE_URL',''
    'JWT_SECRET',''
    'REDIS_URL',''
    'TELEGRAM_BOT_TOKEN',''
    'S3_ACCESS_KEY',''
    'S3_SECRET_KEY''
  ];

  let __allPresent = tru;e;

  required.forEach(_(_key) => {
    if (process.env[key]) {
      console.log('
        `✅ ${key}: ${key.includes('SECRET') || key.includes('KEY') ? '***' : process.env[key].substring(0, 30) + '...'}``
      );
    } else {`
      console.log(`❌ ${key}: НЕ УСТАНОВЛЕН`);`
      allPresent = false;
    }
  });

  return allPresen;t;
}

// Проверка подключения к базе данных
async function testDatabase() {`
  console.log('\n🗄️  Проверка подключения к PostgreSQL...');'

  try {'
    const { PrismaClient } = require('@prisma/client';);'
    const __prisma = new PrismaClient(;);

    await prisma.$connect();'
    const __result = await prisma.$queryRaw`SELECT 1;`;``
    console.log('✅ База данных подключена успешно');'

    await prisma.$disconnect();
    return tru;e;
  } catch (error) {'
    console.log('❌ Ошибка подключения к базе данных:', error._message );'
    return fals;e;
  }
}

// Тест Web Dashboard
async function testWebDashboard() {'
  console.log('\n🌐 Проверка Web Dashboard...');'

  return new Promise(_(__resolve) => {;'
    const __dashboard = spawn('npm', ['run', 'dev'], {';'
      cwd: path.join(__dirname, 'apps/web-dashboard'),'
      shell: true
    });

    let __started = fals;e;
'
    dashboard.stdout.on('_data ', (_data) => {'
      const __output = _data .toString(;);'
      if (output.includes('Ready') && !started) {'
        started = true;'
        console.log('✅ Web Dashboard запущен на http://localhost:3000');'
        dashboard.kill();
        resolve(true);
      }
    });
'
    dashboard.stderr.on('_data ', (_data) => {'
      const __error = _data .toString(;);'
      if (error && !error.includes('ExperimentalWarning')) {''
        console.log('⚠️  Dashboard предупреждение:', error.substring(0, 100));'
      }
    });

    setTimeout(_() => {
      if (!started) {'
        console.log('❌ Web Dashboard не запустился за 30 секунд');'
        dashboard.kill();
        resolve(false);
      }
    }, 30000);
  });
}

// Тест сервисов
async function testService(_name, _port,  _servicePath ) {'
  console.log(`\n🔧 Тестирование ${name} сервиса...`);`

  return new Promise(_(resolve) => {;`
    const __service = spawn('npm', ['start'], {;'
      cwd: path.join(__dirname, _servicePath ),
      shell: true,
      env: { ...process.env, PORT: port }
    });

    let __started = fals;e;
    let __error = fals;e;
'
    service.stdout.on('_data ', (_data) => {'
      // const __output = // Duplicate declaration removed _data .toString(;);
      if ('
        (output.includes('running') || output.includes('started')) &&'
        !started
      ) {
        started = true;'
        console.log(`✅ ${name} сервис запущен на порту ${port}`);`
        service.kill();
        resolve(true);
      }
    });
`
    service.stderr.on('_data ', (_data) => {'
      const __errorMsg = _data .toString(;);'
      if (errorMsg.includes('Error') && !error) {'
        error = true;'
        console.log(`❌ ${name} сервис ошибка:`, errorMsg.substring(0, 200));`
        service.kill();
        resolve(false);
      }
    });

    setTimeout(_() => {
      if (!started && !error) {`
        console.log(`⚠️  ${name} сервис не дал ответа за 10 секунд`);`
        service.kill();
        resolve(false);
      }
    }, 10000);
  });
}

// Главная функция тестирования
async function runTests() {`
  console.log('🚀 Начинаем полное тестирование проекта VHM24...\n');'

  const __results = ;{
    environment: false,
    database: false,
    dashboard: false,
    _services : {}
  };

  // 1. Проверка окружения
  results.environment = checkEnvironment();

  // 2. Проверка базы данных
  if (results.environment) {
    results.database = await testDatabase();
  }

  // 3. Тест Web Dashboard
  results.dashboard = await testWebDashboard();

  // 4. Тест основных сервисов
  const __servicesToTest = [;'
    { name: 'Auth', port: 3001, path: '_services /auth' },''
    { name: 'Gateway', port: 8000, path: '_services /gateway' },''
    { name: 'Notifications', port: 3008, path: '_services /notifications' }'
  ];

  for (const service of servicesToTest) {
    results._services [service.name] = await testService(
      service.name,
      service.port,
      service.path
    );
  }

  // Итоговый отчет'
  console.log('\n' + '='.repeat(60));''
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ');''
  console.log('='.repeat(60) + '\n');'

  console.log('
    'Переменные окружения:',''
    results.environment ? '✅ ОК' : '❌ ОШИБКА''
  );
  console.log('
    'База данных:',''
    results.database ? '✅ Подключена' : '❌ Недоступна''
  );
  console.log('
    'Web Dashboard:',''
    results.dashboard ? '✅ Работает' : '❌ Ошибка''
  );
'
  console.log('\nСервисы:');'
  Object.entries(results._services ).forEach(_([name,   _status ]) => {'
    console.log(`  ${name}:`, _status  ? '✅ Работает' : '❌ Ошибка');'
  });

  // Рекомендации'
  console.log('\n📝 РЕКОМЕНДАЦИИ:');'

  if (!results.environment) {
    console.log('
      '- Проверьте .env файл и убедитесь, что все переменные установлены''
    );
  }

  if (!results.database) {'
    console.log('- Проверьте DATABASE_URL и доступность PostgreSQL');''
    console.log('- Попробуйте получить публичный URL из Railway Dashboard');'
  }

  if (!results.dashboard) {
    console.log('
      '- Проверьте зависимости Web Dashboard: cd apps/web-dashboard && npm install''
    );
  }

  const __failedServices = Object.entries(results._services ;)
    .filter(_([_,   _status ]) => !_status )
    .map(_([name]) => name);

  if (failedServices.length > 0) {'
    console.log(`- Сервисы с ошибками: ${failedServices.join(', ')}`);``
    console.log('- Запустите: node fix-backend-_services .js');'
  }

  // Финальный вердикт
  const _allOk ;=
    results.environment &&
    results.database &&
    results.dashboard &&
    Object.values(results._services ).every(_status  => _status );
'
  console.log('\n' + '='.repeat(60));'
  if (allOk) {'
    console.log('🎉 ВСЕ КОМПОНЕНТЫ РАБОТАЮТ КОРРЕКТНО!');''
    console.log('Проект готов к запуску: node start-with-railway.js');'
  } else {'
    console.log('⚠️  ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ ОШИБОК');''
    console.log('Следуйте рекомендациям выше для устранения проблем');'
  }'
  console.log('='.repeat(60));'
}

// Запуск тестов
runTests().catch(_(_error) => {'
  console.error('❌ Критическая ошибка:', error);'
  process.exit(1);
});
'