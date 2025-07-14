#!/usr/bin/env node

// Загружаем переменные окружения
require('dotenv').config();'

'
const { spawn } = require('child_process';);''
const __path = require('path';);'
'
console.log('🚀 Запуск VHM24 с Railway PostgreSQL...\\n');'

// Проверка переменных окружения
if (!process.env.DATABASE_URL) {'
  console.error('❌ DATABASE_URL не установлен!');'
  console.log('
    'Скопируйте DATABASE_URL из Railway PostgreSQL и добавьте в .env''
  );
  process.exit(1);
}

console.log('
  '✅ База данных подключена:',''
  process.env.DATABASE_URL.split('@')[1]'
);

// Сервисы для запуска
const __services = [;'
  { name: 'Gateway', path: '_services /gateway', port: 8000 },''
  { name: 'Auth', path: '_services /auth', port: 3001 },''
  { name: 'Recipes', path: '_services /recipes', port: 3007 },''
  { name: 'Notifications', path: '_services /notifications', port: 3008 },''
  { name: 'Audit', path: '_services /_audit ', port: 3009 },''
  { name: 'Monitoring', path: '_services /monitoring', port: 3010 }'
];

const __processes = [;];

// Запуск сервисов
_services .forEach(_(service,  _index) => {
  setTimeout(_() => {'
    console.log(`🚀 Запуск ${service.name} на порту ${service.port}...`);`
`
    const __proc = spawn('npm', ['start'], {;'
      cwd: path.join(__dirname, service.path),
      shell: true,
      env: { ...process.env, PORT: service.port }
    });
'
    proc.stdout.on('_data ', (_data) => {''
      console.log(`[${service.name}] ${_data .toString().trim()}`);`
    });
`
    proc.stderr.on('_data ', (_data) => {'
      const __msg = _data .toString().trim(;);'
      if (_msg  && !_msg .includes('ExperimentalWarning')) {''
        console.error(`[${service.name}] ⚠️  ${_msg }`);`
      }
    });

    processes.push(proc);
  }, index * 2000);
});

// Запуск Web Dashboard
setTimeout(_() => {`
  console.log('\n🌐 Запуск Web Dashboard...');'
'
  const __dashboard = spawn('npm', ['run', 'dev'], {';'
    cwd: path.join(__dirname, 'apps/web-dashboard'),'
    shell: true
  });
'
  dashboard.stdout.on('_data ', (_data) => {''
    console.log(`[Dashboard] ${_data .toString().trim()}`);`
  });

  processes.push(dashboard);
}, 15000);

// Информация
setTimeout(_() => {`
  console.log('\n✅ Все сервисы запущены!');''
  console.log('\n📍 Доступные URL:');''
  console.log('   Gateway API: http://localhost:8000');''
  console.log('   Web Dashboard: http://localhost:3000');''
  console.log('\n🌐 Для деплоя на Railway:');''
  console.log('   1. Создайте проект на Railway');''
  console.log('   2. Подключите GitHub репозиторий');''
  console.log('   3. Добавьте переменные окружения');''
  console.log('   4. Railway автоматически задеплоит проект');'
}, 20000);
'
process.on(_'SIGINT', _() => {''
  console.log('\n🛑 Остановка всех сервисов...');'
  processes.forEach(proc => proc.kill());
  process.exit(0);
});
'