const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Конфигурация сервисов
const services = [
  { name: 'auth', port: 8000, color: '\x1b[31m' },        // Красный
  { name: 'inventory', port: 8001, color: '\x1b[32m' },   // Зеленый
  { name: 'machines', port: 8002, color: '\x1b[33m' },    // Желтый
  { name: 'warehouse', port: 8003, color: '\x1b[34m' },   // Синий
  { name: 'tasks', port: 8004, color: '\x1b[35m' },       // Пурпурный
  { name: 'data-import', port: 3009, color: '\x1b[36m' }, // Голубой
  { name: 'gateway', port: 3000, color: '\x1b[37m' }      // Белый
];

// Константы
const RESET_COLOR = '\x1b[0m';
const LOG_PREFIX = '🚀 VHM24';
const ERROR_PREFIX = '❌ VHM24';
const SUCCESS_PREFIX = '✅ VHM24';
const WARNING_PREFIX = '⚠️ VHM24';

// Запуск скрипта emergency-fix.js для исправления критических ошибок
console.log(`${LOG_PREFIX} Запуск emergency-fix.js для исправления критических ошибок...`);
try {
  execSync('node scripts/emergency-fix.js', { stdio: 'inherit' });
  console.log(`${SUCCESS_PREFIX} Скрипт emergency-fix.js успешно выполнен`);
} catch (error) {
  console.error(`${ERROR_PREFIX} Ошибка при выполнении emergency-fix.js: ${error.message}`);
}

// Освобождение портов перед запуском сервисов
console.log(`${LOG_PREFIX} Освобождение портов...`);
try {
  execSync('node scripts/kill-ports.js', { stdio: 'inherit' });
  console.log(`${SUCCESS_PREFIX} Порты успешно освобождены`);
} catch (error) {
  console.error(`${ERROR_PREFIX} Ошибка при освобождении портов: ${error.message}`);
}

// Проверка наличия .env файла
if (!fs.existsSync('.env')) {
  console.log(`${WARNING_PREFIX} Файл .env не найден, создаем из .env.example...`);
  try {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      console.log(`${SUCCESS_PREFIX} Файл .env создан из .env.example`);
    } else {
      console.error(`${ERROR_PREFIX} Файл .env.example не найден`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${ERROR_PREFIX} Ошибка при создании .env файла: ${error.message}`);
    process.exit(1);
  }
}

// Проверка переменных окружения
console.log(`${LOG_PREFIX} Проверка переменных окружения...`);
try {
  execSync('node scripts/check-env.js', { stdio: 'inherit' });
  console.log(`${SUCCESS_PREFIX} Переменные окружения проверены`);
} catch (error) {
  console.error(`${ERROR_PREFIX} Ошибка при проверке переменных окружения: ${error.message}`);
}

// Функция для запуска сервиса
function startService(service) {
  const { name, port, color } = service;
  const servicePath = path.join('services', name);
  
  console.log(`${LOG_PREFIX} Запуск сервиса ${color}${name}${RESET_COLOR} на порту ${port}...`);
  
  // Проверка наличия директории сервиса
  if (!fs.existsSync(servicePath)) {
    console.error(`${ERROR_PREFIX} Директория сервиса ${name} не найдена`);
    return null;
  }
  
  // Проверка наличия package.json
  const packageJsonPath = path.join(servicePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`${ERROR_PREFIX} Файл package.json для сервиса ${name} не найден`);
    return null;
  }
  
  // Запуск сервиса напрямую через node
  const indexPath = path.join('src', 'index.js');
  const absoluteIndexPath = path.join(servicePath, 'src', 'index.js');
  
  // Проверяем наличие файла index.js
  if (!fs.existsSync(absoluteIndexPath)) {
    console.error(`${ERROR_PREFIX} Файл index.js для сервиса ${name} не найден по пути ${absoluteIndexPath}`);
    return null;
  }
  
  // Запускаем сервис
  const serviceProcess = spawn('node', [indexPath], {
    cwd: servicePath,
    env: { ...process.env, PORT: port.toString() },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Обработка вывода
  serviceProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}]${RESET_COLOR} ${line}`);
      }
    });
  });
  
  serviceProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${color}[${name}]${RESET_COLOR} ${line}`);
      }
    });
  });
  
  // Обработка завершения процесса
  serviceProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`${ERROR_PREFIX} Сервис ${color}${name}${RESET_COLOR} завершился с кодом ${code}`);
    } else {
      console.log(`${SUCCESS_PREFIX} Сервис ${color}${name}${RESET_COLOR} завершил работу`);
    }
  });
  
  return serviceProcess;
}

// Запуск всех сервисов
console.log(`${LOG_PREFIX} Запуск всех сервисов...`);
const serviceProcesses = services.map(service => startService(service));

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log(`\n${LOG_PREFIX} Получен сигнал SIGINT, завершение работы...`);
  serviceProcesses.forEach(process => {
    if (process) {
      process.kill('SIGINT');
    }
  });
});

process.on('SIGTERM', () => {
  console.log(`\n${LOG_PREFIX} Получен сигнал SIGTERM, завершение работы...`);
  serviceProcesses.forEach(process => {
    if (process) {
      process.kill('SIGTERM');
    }
  });
});

// Интерактивное управление
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Команды управления ===');
console.log('q - выход');
console.log('r <service> - перезапуск сервиса');
console.log('s - статус всех сервисов');
console.log('h - помощь');
console.log('========================\n');

rl.on('line', (input) => {
  const args = input.trim().split(' ');
  const command = args[0];
  
  switch (command) {
    case 'q':
      console.log(`${LOG_PREFIX} Завершение работы...`);
      serviceProcesses.forEach(process => {
        if (process) {
          process.kill('SIGINT');
        }
      });
      rl.close();
      break;
      
    case 'r':
      if (args[1]) {
        const serviceName = args[1];
        const serviceIndex = services.findIndex(s => s.name === serviceName);
        
        if (serviceIndex !== -1) {
          console.log(`${LOG_PREFIX} Перезапуск сервиса ${services[serviceIndex].color}${serviceName}${RESET_COLOR}...`);
          
          if (serviceProcesses[serviceIndex]) {
            serviceProcesses[serviceIndex].kill('SIGINT');
          }
          
          serviceProcesses[serviceIndex] = startService(services[serviceIndex]);
        } else {
          console.error(`${ERROR_PREFIX} Сервис ${serviceName} не найден`);
        }
      } else {
        console.error(`${ERROR_PREFIX} Не указано имя сервиса для перезапуска`);
      }
      break;
      
    case 's':
      console.log(`${LOG_PREFIX} Статус сервисов:`);
      services.forEach((service, index) => {
        const process = serviceProcesses[index];
        const status = process && !process.killed ? 'Запущен' : 'Остановлен';
        console.log(`${service.color}${service.name}${RESET_COLOR}: ${status} (порт ${service.port})`);
      });
      break;
      
    case 'h':
      console.log('\n=== Команды управления ===');
      console.log('q - выход');
      console.log('r <service> - перезапуск сервиса');
      console.log('s - статус всех сервисов');
      console.log('h - помощь');
      console.log('========================\n');
      break;
      
    default:
      console.log(`${WARNING_PREFIX} Неизвестная команда: ${command}`);
      break;
  }
});

rl.on('close', () => {
  console.log(`${LOG_PREFIX} Выход`);
  process.exit(0);
});
