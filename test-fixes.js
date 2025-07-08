const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 VHM24 - Проверка исправлений\n');

// Проверка .env файла
console.log('1. Проверка .env файла...');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('DATABASE_URL')) {
    console.log('✅ .env файл содержит DATABASE_URL');
  } else {
    console.log('❌ .env файл не содержит DATABASE_URL');
  }
} else {
  console.log('❌ .env файл не найден');
}

// Проверка зависимостей в сервисах
console.log('\n2. Проверка зависимостей в сервисах...');
const services = ['auth', 'machines', 'inventory', 'tasks', 'gateway', 'telegram-bot'];
const requiredDeps = {
  'auth': ['@fastify/cors', '@fastify/jwt', '@prisma/client', 'bcrypt'],
  'machines': ['fastify', '@fastify/cors', '@fastify/jwt', '@prisma/client', 'dotenv'],
  'inventory': ['fastify', '@fastify/cors', '@fastify/jwt', '@prisma/client', 'dotenv'],
  'tasks': ['fastify', '@fastify/cors', '@fastify/jwt', '@prisma/client', 'dotenv'],
  'gateway': ['@fastify/http-proxy', '@fastify/jwt', '@prisma/client', 'dotenv'],
  'telegram-bot': ['node-telegram-bot-api', 'axios', 'dotenv']
};

services.forEach(service => {
  const packagePath = path.join('services', service, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});
    const missing = requiredDeps[service].filter(dep => !deps.includes(dep));
    
    if (missing.length === 0) {
      console.log(`✅ ${service}: все зависимости на месте`);
    } else {
      console.log(`❌ ${service}: отсутствуют зависимости: ${missing.join(', ')}`);
    }
  } else {
    console.log(`❌ ${service}: package.json не найден`);
  }
});

// Проверка dotenv в сервисах
console.log('\n3. Проверка загрузки dotenv в сервисах...');
services.forEach(service => {
  const indexPath = path.join('services', service, 'src', 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes("require('dotenv').config") || content.includes('dotenv.config')) {
      console.log(`✅ ${service}: dotenv загружается`);
    } else {
      console.log(`❌ ${service}: dotenv не загружается`);
    }
  }
});

// Проверка Prisma схемы
console.log('\n4. Проверка Prisma схемы...');
const schemaPath = path.join('packages', 'database', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const checks = [
    { field: 'telegramId', model: 'User' },
    { field: 'phoneNumber', model: 'User' },
    { field: 'DATABASE_URL', model: 'datasource' }
  ];
  
  checks.forEach(check => {
    if (schema.includes(check.field)) {
      console.log(`✅ Поле ${check.field} найдено в ${check.model}`);
    } else {
      console.log(`❌ Поле ${check.field} не найдено в ${check.model}`);
    }
  });
}

// Проверка Docker
console.log('\n5. Проверка Docker...');
try {
  execSync('docker --version', { stdio: 'ignore' });
  console.log('✅ Docker установлен');
  
  // Проверка запущенных контейнеров
  const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
  const requiredContainers = ['vhm24-postgres', 'vhm24-redis', 'vhm24-minio'];
  
  requiredContainers.forEach(container => {
    if (containers.includes(container)) {
      console.log(`✅ ${container} запущен`);
    } else {
      console.log(`⚠️ ${container} не запущен`);
    }
  });
} catch (e) {
  console.log('❌ Docker не установлен или не запущен');
}

// Итоговые рекомендации
console.log('\n📋 Рекомендации:');
console.log('1. Убедитесь, что Docker Desktop запущен');
console.log('2. Выполните: npm install в корневой директории');
console.log('3. Выполните: npm install --workspaces');
console.log('4. Запустите: docker-compose up -d');
console.log('5. В packages/database выполните:');
console.log('   - npx prisma generate');
console.log('   - npx prisma migrate dev');
console.log('6. Запустите: start-development.bat');

console.log('\n✨ Проверка завершена!');
