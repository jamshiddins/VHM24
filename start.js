/**
 * EMERGENCY PRODUCTION START SCRIPT - SIMPLIFIED FOR RAILWAY
 * Максимально простой запуск без сложной диагностики
 */

const path = require('path');
const fs = require('fs');

console.log('🚨 EMERGENCY START - VHM24 Production');
console.log('Node Version:', process.version);
console.log('Current Dir:', process.cwd());
console.log('PORT:', process.env.PORT || 'NOT SET');

// Проверяем критические переменные
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ CRITICAL: Missing env vars:', missing);
  process.exit(1);
}

// Проверяем структуру файлов
const backendMain = path.join(__dirname, 'backend', 'src', 'index.js');
if (!fs.existsSync(backendMain)) {
  console.error('❌ CRITICAL: backend/src/index.js not found');
  process.exit(1);
}

console.log('✅ Environment check passed');
console.log('✅ File structure check passed');

// Меняем директорию на backend и запускаем
try {
  process.chdir(path.join(__dirname, 'backend'));
  console.log('✅ Changed to backend directory');
  
  // Запускаем основное приложение
  require('./src/index.js');
  
} catch (error) {
  console.error('❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
