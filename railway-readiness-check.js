#!/usr/bin/env node

/**
 * VHM24 Railway Readiness Check
 * Проверяет готовность проекта к деплою на Railway
 */

const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения
try {
  require('dotenv').config();
} catch (error) {
  console.log('⚠️  dotenv not available, using environment variables');
}

console.log('🔍 VHM24 Railway Readiness Check');
console.log('================================\n');

let allChecksPass = true;
const issues = [];
const warnings = [];

// Функция для проверки
function check(name, condition, errorMsg, warningMsg = null) {
  if (condition) {
    console.log(`✅ ${name}`);
    return true;
  } else {
    console.log(`❌ ${name}`);
    if (warningMsg) {
      warnings.push(`⚠️  ${name}: ${warningMsg}`);
    } else {
      issues.push(`❌ ${name}: ${errorMsg}`);
      allChecksPass = false;
    }
    return false;
  }
}

// 1. Проверка файлов
console.log('📁 File Structure Check:');
check('package.json exists', fs.existsSync('package.json'), 'package.json not found');
check('railway-start-final.js exists', fs.existsSync('railway-start-final.js'), 'railway-start-final.js not found');
check('nixpacks.toml exists', fs.existsSync('nixpacks.toml'), 'nixpacks.toml not found');
check('.railwayignore exists', fs.existsSync('.railwayignore'), '.railwayignore not found');
check('railway.json exists', fs.existsSync('railway.json'), 'railway.json not found');

// 2. Проверка Prisma
console.log('\n🗄️  Database Check:');
const schemaPath = 'packages/database/prisma/schema.prisma';
check('Prisma schema exists', fs.existsSync(schemaPath), 'Prisma schema not found');

// 3. Проверка переменных окружения
console.log('\n🔐 Environment Variables Check:');

// Критические переменные
const criticalVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'ADMIN_IDS'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  check(`${varName} is set`, !!value, `${varName} is required for Railway deployment`);
  
  // Дополнительные проверки
  if (varName === 'JWT_SECRET' && value) {
    check(`${varName} is secure`, value.length >= 32, `${varName} should be at least 32 characters long`);
    check(`${varName} is not default`, !value.includes('change-this'), `${varName} should be changed from default value`, 'Using default JWT secret is not secure for production');
  }
  
  if (varName === 'DATABASE_URL' && value) {
    check(`${varName} is Railway PostgreSQL`, value.includes('railway') || value.includes('postgres'), `${varName} should be Railway PostgreSQL URL`);
  }
  
  if (varName === 'TELEGRAM_BOT_TOKEN' && value) {
    check(`${varName} format is valid`, value.includes(':'), `${varName} should be in format: XXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`);
  }
});

// Опциональные но рекомендуемые переменные
console.log('\n🔧 Optional Variables Check:');
const optionalVars = [
  'REDIS_URL',
  'NODE_ENV',
  'ALLOWED_ORIGINS'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  check(`${varName} is set`, !!value, `${varName} is recommended but not required`, `${varName} not set - using defaults`);
});

// 4. Проверка package.json
console.log('\n📦 Package.json Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  check('start script exists', !!packageJson.scripts?.start, 'start script not found in package.json');
  check('start script points to railway-start-final.js', 
    packageJson.scripts?.start === 'node railway-start-final.js', 
    'start script should be "node railway-start-final.js"');
  
  check('Node.js version specified', !!packageJson.engines?.node, 'Node.js version not specified in engines');
  check('npm version specified', !!packageJson.engines?.npm, 'npm version not specified in engines');
  
} catch (error) {
  issues.push('❌ Failed to parse package.json');
  allChecksPass = false;
}

// 5. Проверка nixpacks.toml
console.log('\n🚂 Nixpacks Configuration Check:');
try {
  const nixpacksContent = fs.readFileSync('nixpacks.toml', 'utf8');
  
  check('nixpacks.toml has start command', nixpacksContent.includes('[start]'), 'start section not found in nixpacks.toml');
  check('start command is npm start', nixpacksContent.includes('cmd = "npm start"'), 'start command should be "npm start"');
  check('Node.js setup configured', nixpacksContent.includes('nodejs'), 'Node.js not configured in nixpacks.toml');
  
} catch (error) {
  issues.push('❌ Failed to read nixpacks.toml');
  allChecksPass = false;
}

// 6. Проверка сервисов
console.log('\n🚀 Services Check:');
const services = [
  'services/auth/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/bunkers/src/index.js',
  'services/notifications/src/index.js',
  'services/telegram-bot/src/index.js'
];

services.forEach(servicePath => {
  const serviceName = servicePath.split('/')[1];
  check(`${serviceName} service exists`, fs.existsSync(servicePath), `${servicePath} not found`);
});

// 7. Проверка зависимостей
console.log('\n📚 Dependencies Check:');
check('node_modules exists', fs.existsSync('node_modules'), 'Dependencies not installed - run npm install');

// Результаты
console.log('\n' + '='.repeat(50));
console.log('📊 READINESS REPORT');
console.log('='.repeat(50));

if (allChecksPass && issues.length === 0) {
  console.log('🎉 ✅ ALL CHECKS PASSED!');
  console.log('🚂 Project is ready for Railway deployment!');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings (non-critical):');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Ready for Railway deployment"');
  console.log('3. git push origin main');
  console.log('4. Railway will automatically deploy');
  
} else {
  console.log('❌ DEPLOYMENT NOT READY');
  console.log('\n🔧 Issues to fix:');
  issues.forEach(issue => console.log(issue));
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('\n📝 Please fix the issues above before deploying to Railway.');
}

console.log('\n📞 For help, check:');
console.log('- RAILWAY_FINAL_SOLUTION.md');
console.log('- ENVIRONMENT_VARIABLES_CHECK.md');
console.log('- Railway logs: railway logs');

process.exit(allChecksPass ? 0 : 1);
