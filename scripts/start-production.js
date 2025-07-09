// Production starter for Railway deployment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting VHM24 in production mode on Railway...');

// Проверка переменных окружения
try {
  require('./check-env');
} catch (error) {
  console.error('❌ Environment check failed:', error.message);
  process.exit(1);
}

// Определяем какой сервис запускать на основе Railway переменных
const SERVICE = process.env.RAILWAY_SERVICE_NAME || 
               process.env.SERVICE_NAME || 
               detectServiceFromPath() ||
               'gateway';

console.log(`🎯 Detected service: ${SERVICE}`);

const serviceMap = {
  'gateway': { path: 'services/gateway', port: 8000, public: true },
  'auth': { path: 'services/auth', port: 3001, public: false },
  'machines': { path: 'services/machines', port: 3002, public: false },
  'inventory': { path: 'services/inventory', port: 3003, public: false },
  'tasks': { path: 'services/tasks', port: 3004, public: false },
  'telegram-bot': { path: 'services/telegram-bot', port: 3005, public: false },
  'notifications': { path: 'services/notifications', port: 3006, public: false },
  'audit': { path: 'services/audit', port: 3007, public: false },
  'data-import': { path: 'services/data-import', port: 3008, public: false },
  'backup': { path: 'services/backup', port: 3009, public: false },
  'monitoring': { path: 'services/monitoring', port: 3010, public: false },
  'routes': { path: 'services/routes', port: 3011, public: false },
  'warehouse': { path: 'services/warehouse', port: 3012, public: false },
  'recipes': { path: 'services/recipes', port: 3013, public: false },
  'bunkers': { path: 'services/bunkers', port: 3014, public: false }
};

const service = serviceMap[SERVICE];

if (!service) {
  console.error(`❌ Unknown service: ${SERVICE}`);
  console.log('Available services:', Object.keys(serviceMap).join(', '));
  process.exit(1);
}

// Проверяем существование сервиса
if (!fs.existsSync(service.path)) {
  console.error(`❌ Service path not found: ${service.path}`);
  process.exit(1);
}

// Устанавливаем PORT для Railway
process.env.PORT = process.env.PORT || service.port.toString();

console.log(`🚀 Starting ${SERVICE} service...`);
console.log(`📁 Path: ${service.path}`);
console.log(`🌐 Port: ${process.env.PORT}`);
console.log(`🔓 Public: ${service.public ? 'Yes' : 'No'}`);

// Устанавливаем дополнительные переменные для сервиса
process.env.SERVICE_NAME = SERVICE;
process.env.SERVICE_PATH = service.path;

// Запускаем сервис
const child = spawn('npm', ['start'], {
  cwd: service.path,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('❌ Failed to start service:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`🛑 Service ${SERVICE} exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

function detectServiceFromPath() {
  // Пытаемся определить сервис из текущего пути или переменных Railway
  const cwd = process.cwd();
  const servicePath = cwd.split(path.sep).find(part => 
    Object.keys(serviceMap).includes(part)
  );
  
  return servicePath || null;
}