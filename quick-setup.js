const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

logger.info('🚀 VHM24 Quick Setup & Start');
logger.info('============================\n');

// Функция для выполнения команды
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    logger.info(`📋 ${description}...`);
    
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('warning')) {
        logger.error(`⚠️  Warning: ${stderr}`);
      }
      
      if (stdout) {
        logger.info(stdout);
      }
      
      logger.info(`✅ ${description} completed\n`);
      resolve();
    });
  });
}

// Проверка файлов
function checkFiles() {
  logger.info('🔍 Checking project files...');
  
  const requiredFiles = [
    '.env',
    'package.json',
    'start.js',
    'packages/database/prisma/schema.prisma'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logger.info('❌ Missing required files:');
    missingFiles.forEach(file => logger.info(`   - ${file}`));
    return false;
  }
  
  logger.info('✅ All required files present\n');
  return true;
}

// Проверка переменных окружения
function checkEnvironment() {
  logger.info('🔍 Checking environment variables...');
  
  const envContent = await fsPromises.readFile('.env', 'utf8');
  const hasValidTelegramToken = envContent.includes('TELEGRAM_BOT_TOKEN=') && 
                                !envContent.includes('your-telegram-bot-token');
  
  if (!hasValidTelegramToken) {
    logger.info('⚠️  Telegram bot token not configured properly');
    logger.info('   Please update TELEGRAM_BOT_TOKEN in .env file\n');
  } else {
    logger.info('✅ Telegram bot token configured\n');
  }
  
  return hasValidTelegramToken;
}

// Основная функция
async function main() {
  try {
    // Проверяем файлы
    if (!checkFiles()) {
      logger.info('❌ Setup failed: Missing required files');
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
    
    logger.info('🎉 Setup completed successfully!');
    logger.info('=====================================\n');
    
    if (envOk) {
      logger.info('🚀 Starting VHM24 Platform...\n');
      
      // Запускаем проект
      const startProcess = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
      });
      
      startProcess.on('close', (code) => {
        logger.info(`\n📊 Process exited with code ${code}`);
      });
      
      startProcess.on('error', (error) => {
        logger.error(`❌ Failed to start: ${error.message}`);
      });
      
    } else {
      logger.info('⚠️  Please configure environment variables in .env file before starting');
      logger.info('   Then run: npm start');
    }
    
  } catch (error) {
    logger.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGINT', () => {
  logger.info('\n🛑 Setup interrupted');
  process.exit(0);
});

// Запускаем
main();
