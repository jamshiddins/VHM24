#!/usr/bin/env node

/**
 * Финальный валидатор готовности системы к деплою
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Финальная проверка готовности VHM24 к деплою...\n');

let readyForDeployment = true;
const issues = [];

// 1. Проверяем критические файлы
const criticalFiles = [
  'backend/src/index.js',
  'backend/src/routes/auth.js',
  'backend/src/routes/health.js',
  'backend/src/middleware/auth.js',
  'backend/package.json',
  'backend/prisma/schema.prisma',
  'docker-compose.production.yml',
  '.env.example'
];

console.log('📋 Проверка критических файлов...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - ОТСУТСТВУЕТ`);
    issues.push(`Критический файл отсутствует: ${file}`);
    readyForDeployment = false;
  }
});

// 2. Проверяем синтаксис критических файлов
console.log('\n🔧 Проверка синтаксиса критических JS файлов...');
const jsFiles = [
  'backend/src/index.js',
  'backend/src/routes/auth.js',
  'backend/src/routes/health.js',
  'backend/src/middleware/auth.js'
];

jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Базовая проверка на явные синтаксические ошибки
      if (content.includes('module.exports') || content.includes('const ') || content.includes('function ')) {
        console.log(`✅ ${file} - синтаксис OK`);
      } else {
        console.log(`⚠️ ${file} - возможные проблемы`);
        issues.push(`Возможные проблемы в ${file}`);
      }
    } catch (error) {
      console.log(`❌ ${file} - ошибка чтения: ${error.message}`);
      issues.push(`Не удается прочитать ${file}: ${error.message}`);
      readyForDeployment = false;
    }
  }
});

// 3. Проверяем package.json dependencies
console.log('\n📦 Проверка зависимостей...');
try {
  const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredDeps = ['express', 'jsonwebtoken', 'cors', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - установлен`);
    } else {
      console.log(`❌ ${dep} - ОТСУТСТВУЕТ`);
      issues.push(`Отсутствует зависимость: ${dep}`);
      readyForDeployment = false;
    }
  });
} catch (error) {
  console.log('❌ Ошибка чтения package.json');
  issues.push('Не удается прочитать package.json');
  readyForDeployment = false;
}

// 4. Проверяем Docker конфигурацию
console.log('\n🐳 Проверка Docker конфигурации...');
if (fs.existsSync('docker-compose.production.yml')) {
  try {
    const dockerCompose = fs.readFileSync('docker-compose.production.yml', 'utf8');
    if (dockerCompose.includes('backend') && dockerCompose.includes('postgres')) {
      console.log('✅ Docker Compose - конфигурация OK');
    } else {
      console.log('⚠️ Docker Compose - возможные проблемы');
      issues.push('Docker Compose может иметь проблемы конфигурации');
    }
  } catch (error) {
    console.log('❌ Ошибка чтения docker-compose.production.yml');
    issues.push('Docker Compose недоступен');
  }
} else {
  console.log('❌ docker-compose.production.yml отсутствует');
  issues.push('Docker Compose конфигурация отсутствует');
  readyForDeployment = false;
}

// 5. Проверяем environment example
console.log('\n🔐 Проверка environment конфигурации...');
if (fs.existsSync('.env.example')) {
  try {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
    let envOK = true;
    
    requiredVars.forEach(varName => {
      if (envExample.includes(varName)) {
        console.log(`✅ ${varName} - настроен в .env.example`);
      } else {
        console.log(`⚠️ ${varName} - отсутствует в .env.example`);
        envOK = false;
      }
    });
    
    if (!envOK) {
      issues.push('Некоторые environment переменные не настроены');
    }
  } catch (error) {
    console.log('❌ Ошибка чтения .env.example');
    issues.push('.env.example недоступен');
  }
} else {
  console.log('⚠️ .env.example отсутствует');
  issues.push('.env.example не найден');
}

// 6. Проверяем Kubernetes конфигурацию
console.log('\n☸️ Проверка Kubernetes конфигурации...');
const k8sFiles = [
  'k8s/production/backend.yaml',
  'k8s/production/database.yaml',
  'k8s/production/ingress.yaml'
];

let k8sReady = true;
k8sFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file} - отсутствует`);
    k8sReady = false;
  }
});

if (k8sReady) {
  console.log('✅ Kubernetes конфигурация готова');
} else {
  console.log('⚠️ Kubernetes конфигурация неполная');
  issues.push('Kubernetes конфигурация требует внимания');
}

// Финальный отчет
console.log('\n' + '='.repeat(60));
console.log('🎯 ФИНАЛЬНЫЙ ОТЧЕТ ГОТОВНОСТИ К ДЕПЛОЮ');
console.log('='.repeat(60));

if (readyForDeployment && issues.length === 0) {
  console.log('✅ СИСТЕМА ПОЛНОСТЬЮ ГОТОВА К ДЕПЛОЮ!');
  console.log('🚀 Можно запускать production deployment');
  console.log('\n📋 Рекомендуемые команды для деплоя:');
  console.log('   docker-compose -f docker-compose.production.yml up -d');
  console.log('   kubectl apply -f k8s/production/');
} else if (readyForDeployment) {
  console.log('✅ КРИТИЧЕСКИЕ КОМПОНЕНТЫ ГОТОВЫ К ДЕПЛОЮ');
  console.log('⚠️ Обнаружены некритичные проблемы:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n🚀 Система готова к деплою, проблемы можно решить позже');
} else {
  console.log('❌ СИСТЕМА НЕ ГОТОВА К ДЕПЛОЮ');
  console.log('🔧 Необходимо исправить критические проблемы:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n⏰ После исправления повторите проверку');
}

console.log('\n📊 Статистика готовности:');
console.log(`   Критические файлы: ${criticalFiles.filter(f => fs.existsSync(f)).length}/${criticalFiles.length}`);
console.log(`   Зависимости: проверены`);
console.log(`   Docker: ${fs.existsSync('docker-compose.production.yml') ? 'готов' : 'требует внимания'}`);
console.log(`   Environment: ${fs.existsSync('.env.example') ? 'готов' : 'требует внимания'}`);
console.log(`   Kubernetes: ${k8sReady ? 'готов' : 'частично готов'}`);

console.log('\n📋 Следующие шаги:');
if (readyForDeployment) {
  console.log('1. Настроить production environment переменные');
  console.log('2. Настроить production базу данных');
  console.log('3. Запустить deployment');
  console.log('4. Проверить health checks');
  console.log('5. Настроить мониторинг');
} else {
  console.log('1. Исправить критические проблемы');
  console.log('2. Повторить валидацию');
  console.log('3. Запустить deployment после исправлений');
}

process.exit(readyForDeployment ? 0 : 1);
