#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 VHM24 Quick Setup & Start');
console.log('============================\n');

// Функция для выполнения команды
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}...`);
    
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('warning')) {
        console.error(`⚠️  Warning: ${stderr}`);
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      console.log(`✅ ${description} completed\n`);
      resolve();
    });
  });
}

// Проверка файлов
function checkFiles() {
  console.log('🔍 Checking project files...');
  
  const requiredFiles = [
    '.env',
    'package.json',
    'start.js',
    'packages/database/prisma/schema.prisma'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ All required files present\n');
  return true;
}

// Проверка переменных окружения
function checkEnvironment() {
  console.log('🔍 Checking environment variables...');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasValidTelegramToken = envContent.includes('TELEGRAM_BOT_TOKEN=') && 
                                !envContent.includes('your-telegram-bot-token');
  
  if (!hasValidTelegramToken) {
    console.log('⚠️  Telegram bot token not configured properly');
    console.log('   Please update TELEGRAM_BOT_TOKEN in .env file\n');
  } else {
    console.log('✅ Telegram bot token configured\n');
  }
  
  return hasValidTelegramToken;
}

// Основная функция
async function main() {
  try {
    // Проверяем файлы
    if (!checkFiles()) {
      console.log('❌ Setup failed: Missing required files');
      process.exit(1);
    }
    
    // Проверяем окружение
    const envOk = checkEnvironment();
    
    // Устанавливаем зависимости
    await runCommand('npm install', 'Installing dependencies');
    
    // Устанавливаем зависимости для workspaces
    await runCommand('npm install --workspaces --if-present', 'Installing workspace dependencies');
    
    // Генерируем Prisma клиент
    await runCommand('cd packages/database && npx prisma generate', 'Generating Prisma client');
    
    console.log('🎉 Setup completed successfully!');
    console.log('=====================================\n');
    
    if (envOk) {
      console.log('🚀 Starting VHM24 Platform...\n');
      
      // Запускаем проект
      const startProcess = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
      });
      
      startProcess.on('close', (code) => {
        console.log(`\n📊 Process exited with code ${code}`);
      });
      
      startProcess.on('error', (error) => {
        console.error(`❌ Failed to start: ${error.message}`);
      });
      
    } else {
      console.log('⚠️  Please configure environment variables in .env file before starting');
      console.log('   Then run: npm start');
    }
    
  } catch (error) {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGINT', () => {
  console.log('\n🛑 Setup interrupted');
  process.exit(0);
});

// Запускаем
main();
