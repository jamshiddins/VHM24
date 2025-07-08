#!/usr/bin/env node

/**
 * Скрипт для настройки переменных окружения в Railway
 * Использование: node setup-railway-env.js
 */

const readline = require('readline');
const { execSync } = require('child_process');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🚀 VHM24 Railway Environment Setup\n');
  
  // Проверяем установлен ли Railway CLI
  try {
    execSync('railway --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Railway CLI не установлен!');
    console.log('Установите его командой: npm install -g @railway/cli');
    console.log('Или следуйте инструкциям: https://docs.railway.app/develop/cli');
    process.exit(1);
  }
  
  console.log('✅ Railway CLI обнаружен\n');
  
  // Генерируем JWT секрет
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  console.log('🔐 Сгенерирован JWT_SECRET:', jwtSecret);
  
  // Собираем информацию от пользователя
  console.log('\n📝 Введите данные из Supabase Dashboard:\n');
  
  const supabaseUrl = await question('SUPABASE_URL (например: https://xxxxx.supabase.co): ');
  const supabaseAnonKey = await question('SUPABASE_ANON_KEY (начинается с eyJ...): ');
  const databaseUrl = await question('DATABASE_URL (postgresql://...): ');
  
  console.log('\n📱 Telegram Bot (опционально, нажмите Enter чтобы пропустить):');
  const telegramToken = await question('TELEGRAM_BOT_TOKEN: ');
  
  // Формируем переменные
  const envVars = {
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    NODE_ENV: 'production',
    GATEWAY_PORT: '8000',
    AUTH_PORT: '3001',
    MACHINES_PORT: '3002',
    INVENTORY_PORT: '3003',
    TASKS_PORT: '3004',
    BUNKERS_PORT: '3005'
  };
  
  if (telegramToken) {
    envVars.TELEGRAM_BOT_TOKEN = telegramToken;
    envVars.TELEGRAM_WEBHOOK_URL = 'https://vhm24-production.up.railway.app/webhook';
  }
  
  console.log('\n🔧 Устанавливаем переменные в Railway...\n');
  
  // Устанавливаем переменные
  for (const [key, value] of Object.entries(envVars)) {
    try {
      console.log(`Setting ${key}...`);
      execSync(`railway variables set ${key}="${value}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Ошибка при установке ${key}:`, error.message);
    }
  }
  
  console.log('\n✅ Переменные окружения установлены!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Сделайте commit изменений:');
  console.log('   git add .');
  console.log('   git commit -m "Configure Railway deployment"');
  console.log('   git push');
  console.log('\n2. Railway автоматически передеплоит приложение');
  console.log('\n3. Проверьте работу:');
  console.log('   curl https://vhm24-production.up.railway.app/health');
  console.log('   curl https://vhm24-production.up.railway.app/api/v1/test-db');
  
  rl.close();
}

main().catch(error => {
  console.error('Ошибка:', error);
  rl.close();
  process.exit(1);
});
