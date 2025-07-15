#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Загрузка переменных из .env файла
console.log('Загрузка переменных окружения из .env файла...');
const envPath = '.env';

if (!fs.existsSync(envPath)) {
  console.error('❌ Файл .env не найден!');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Загрузка переменных в Railway
console.log('Загрузка переменных в Railway...');
console.log(`Найдено ${Object.keys(envConfig).length} переменных для загрузки.`);

let successCount = 0;
let errorCount = 0;

for (const key in envConfig) {
  const value = envConfig[key];
  
  try {
    console.log(`Загрузка ${key}...`);
    execSync(`railway variables --set "${key}=${value}"`, { stdio: 'inherit' });
    successCount++;
  } catch (error) {
    console.error(`❌ Ошибка при загрузке ${key}: ${error.message}`);
    errorCount++;
  }
}

console.log('\n===== РЕЗУЛЬТАТ =====');
console.log(`✅ Успешно загружено: ${successCount} переменных`);
if (errorCount > 0) {
  console.log(`❌ Ошибок: ${errorCount}`);
}
console.log('=====================');
