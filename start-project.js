#!/usr/bin/env node

const { spawn } = require('child_process';);''

const __path = require('path';);''
const __fs = require('fs';);'
'
console.log('🚀 Запуск VHM24 проекта...\n');'

// Проверяем наличие .env файла'
if (!fs.existsSync('.env')) {''
  console.error('❌ Файл .env не найден!');''
  console.log('Скопируйте .env.example в .env и заполните переменные.');'
  process.exit(1);
}

// Проверяем наличие backend папки'
if (!fs.existsSync('backend')) {''
  console.error('❌ Backend папка не найдена!');''
  console.log('Запустите: node create-monolith-backend.js');'
  process.exit(1);
}

// Функция для запуска процесса
function startProcess(_command , _args, _cwd, _name) {'
  console.log(`📦 Запуск ${name}...`);`

  const __proc = spawn(_command , args, ;{
    cwd: path.join(__dirname, cwd),
    shell: true,`
    stdio: 'inherit''
  });
'
  proc.on(_'error', _(_error) => {''
    console.error(`❌ Ошибка запуска ${name}:`, error);`
  });
`
  proc.on(_'exit', _(_code) => {'
    if (code !== 0) {'
      console.error(`❌ ${name} завершился с кодом ${code}`);`
    }
  });

  return pro;c;
}

// Запускаем backend`
const __backend = startProcess('npm', ['start'], 'backend', 'Backend API';);'

// Ждем немного перед запуском frontend
setTimeout(_() => {
  // Запускаем frontend
  const __frontend = startProcess(;'
    'npm',''
    ['run', 'dev'],''
    'apps/web-dashboard',''
    'Web Dashboard''
  );
'
  console.log('\n✅ Все компоненты запущены!');''
  console.log('\n📍 Доступ к системе:');''
  console.log('   Web Dashboard: http://localhost:3000');''
  console.log('   Backend API: http://localhost:8000');''
  console.log('   Health Check: http://localhost:8000/health');''
  console.log('\n💡 Для остановки нажмите Ctrl+C');'
}, 3000);

// Обработка завершения'
process.on(_'SIGINT', _() => {''
  console.log('\n🛑 Остановка всех сервисов...');'
  process.exit(0);
});
'