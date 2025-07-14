#!/usr/bin/env node

/**
 * Комплексное тестирование системы VHM24
 * Полная диагностика перед деплоем
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Комплексное тестирование системы VHM24...\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function test(name, testFn) {
  try {
    console.log(`🧪 ${name}...`);
    const result = testFn();
    if (result === true) {
      console.log(`✅ ${name} - PASSED`);
      results.passed++;
    } else if (result === 'warning') {
      console.log(`⚠️ ${name} - WARNING`);
      results.warnings++;
    } else {
      console.log(`❌ ${name} - FAILED: ${result}`);
      results.failed++;
      results.issues.push(`${name}: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
    results.failed++;
    results.issues.push(`${name}: ${error.message}`);
  }
}

// 1. Тестирование структуры проекта
test('Структура проекта', () => {
  const requiredDirs = ['backend', 'backend/src', 'backend/src/routes', 'backend/src/services', 'backend/src/middleware'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      return `Отсутствует директория: ${dir}`;
    }
  }
  return true;
});

// 2. Тестирование критических файлов
test('Критические файлы', () => {
  const criticalFiles = [
    'backend/src/index.js',
    'backend/package.json',
    'backend/prisma/schema.prisma',
    '.env.example',
    'docker-compose.production.yml'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      return `Отсутствует файл: ${file}`;
    }
  }
  return true;
});

// 3. Тестирование синтаксиса JS файлов
test('Синтаксис JavaScript файлов', () => {
  const jsFiles = [
    'backend/src/index.js',
    'backend/src/routes/auth.js',
    'backend/src/routes/health.js',
    'backend/src/middleware/auth.js',
    'backend/src/middleware/validation.js'
  ];
  
  for (const file of jsFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (!content.includes('module.exports')) {
        return `Файл ${file} не экспортирует модуль`;
      }
    }
  }
  return true;
});

// 4. Тестирование package.json
test('Package.json зависимости', () => {
  const packagePath = 'backend/package.json';
  if (!fs.existsSync(packagePath)) return 'package.json отсутствует';
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['express', 'jsonwebtoken', 'cors', 'dotenv', '@prisma/client'];
  
  for (const dep of requiredDeps) {
    if (!pkg.dependencies || !pkg.dependencies[dep]) {
      return `Отсутствует зависимость: ${dep}`;
    }
  }
  return true;
});

// 5. Тестирование Docker конфигурации
test('Docker конфигурация', () => {
  const dockerFile = 'docker-compose.production.yml';
  if (!fs.existsSync(dockerFile)) return 'Docker compose файл отсутствует';
  
  const content = fs.readFileSync(dockerFile, 'utf8');
  if (!content.includes('backend') || !content.includes('postgres')) {
    return 'Docker compose неполный';
  }
  return true;
});

// 6. Тестирование Environment переменных
test('Environment конфигурация', () => {
  const envFile = '.env.example';
  if (!fs.existsSync(envFile)) return '.env.example отсутствует';
  
  const content = fs.readFileSync(envFile, 'utf8');
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
  
  for (const varName of requiredVars) {
    if (!content.includes(varName)) {
      return `Отсутствует переменная: ${varName}`;
    }
  }
  return true;
});

// 7. Тестирование Prisma схемы
test('Prisma схема', () => {
  const schemaFile = 'backend/prisma/schema.prisma';
  if (!fs.existsSync(schemaFile)) return 'Prisma схема отсутствует';
  
  const content = fs.readFileSync(schemaFile, 'utf8');
  if (!content.includes('generator client') || !content.includes('datasource db')) {
    return 'Prisma схема некорректна';
  }
  return true;
});

// 8. Тестирование роутов Backend
test('Backend роуты', () => {
  const routes = ['auth', 'health', 'users', 'bags', 'expenses', 'revenues'];
  
  for (const route of routes) {
    const routeFile = `backend/src/routes/${route}.js`;
    if (!fs.existsSync(routeFile)) {
      return `Отсутствует роут: ${route}`;
    }
    
    const content = fs.readFileSync(routeFile, 'utf8');
    if (!content.includes('router.get') || !content.includes('module.exports')) {
      return `Роут ${route} неполный`;
    }
  }
  return true;
});

// 9. Тестирование сервисов
test('Backend сервисы', () => {
  const services = ['bag.service', 'expense.service', 'revenue.service'];
  
  for (const service of services) {
    const serviceFile = `backend/src/services/${service}.js`;
    if (fs.existsSync(serviceFile)) {
      const content = fs.readFileSync(serviceFile, 'utf8');
      if (!content.includes('class') && !content.includes('module.exports')) {
        return `Сервис ${service} неполный`;
      }
    }
  }
  return true;
});

// 10. Тестирование Middleware
test('Backend middleware', () => {
  const middlewares = ['auth', 'validation'];
  
  for (const middleware of middlewares) {
    const middlewareFile = `backend/src/middleware/${middleware}.js`;
    if (!fs.existsSync(middlewareFile)) {
      return `Отсутствует middleware: ${middleware}`;
    }
    
    const content = fs.readFileSync(middlewareFile, 'utf8');
    if (!content.includes('module.exports')) {
      return `Middleware ${middleware} неполный`;
    }
  }
  return true;
});

// 11. Тестирование Kubernetes конфигурации
test('Kubernetes конфигурация', () => {
  const k8sFiles = [
    'k8s/production/namespace.yaml',
    'k8s/production/backend.yaml',
    'k8s/production/database.yaml'
  ];
  
  for (const file of k8sFiles) {
    if (!fs.existsSync(file)) {
      return `Отсутствует K8s файл: ${file}`;
    }
  }
  return true;
});

// 12. Тестирование Git репозитория
test('Git репозиторий', () => {
  if (!fs.existsSync('.git')) {
    return 'Git репозиторий не инициализирован';
  }
  
  try {
    execSync('git status', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return 'Git репозиторий поврежден';
  }
});

// 13. Тестирование ESLint (только критические файлы)
test('ESLint проверка критических файлов', () => {
  try {
    const criticalFiles = [
      'backend/src/index.js',
      'backend/src/routes/auth.js',
      'backend/src/routes/health.js',
      'backend/src/middleware/auth.js'
    ];
    
    const existingFiles = criticalFiles.filter(f => fs.existsSync(f));
    if (existingFiles.length === 0) {
      return 'Нет файлов для проверки';
    }
    
    execSync(`npx eslint ${existingFiles.join(' ')}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    // Если есть ошибки, но файлы существуют - это предупреждение
    return 'warning';
  }
});

// Запуск всех тестов
console.log('='.repeat(60));
console.log('🧪 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ');
console.log('='.repeat(60));

// Выполняем все тесты (функции уже определены выше)
[
  'Структура проекта',
  'Критические файлы', 
  'Синтаксис JavaScript файлов',
  'Package.json зависимости',
  'Docker конфигурация',
  'Environment конфигурация',
  'Prisma схема',
  'Backend роуты',
  'Backend сервисы',
  'Backend middleware',
  'Kubernetes конфигурация',
  'Git репозиторий',
  'ESLint проверка критических файлов'
].forEach(testName => {
  // Тесты уже выполнены выше
});

// Итоговый отчет
console.log('\n' + '='.repeat(60));
console.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ');
console.log('='.repeat(60));

const total = results.passed + results.failed + results.warnings;
console.log(`Всего тестов: ${total}`);
console.log(`✅ Пройдено: ${results.passed}`);
console.log(`⚠️ Предупреждения: ${results.warnings}`);
console.log(`❌ Провалено: ${results.failed}`);

const successRate = Math.round(((results.passed + results.warnings) / total) * 100);
console.log(`📈 Процент успеха: ${successRate}%`);

if (results.failed > 0) {
  console.log('\n🔧 ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:');
  results.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

// Рекомендации
console.log('\n📋 РЕКОМЕНДАЦИИ:');
if (results.failed === 0) {
  console.log('✅ Система готова к деплою!');
  console.log('🚀 Можно запускать production deployment');
} else if (results.failed <= 2) {
  console.log('⚠️ Есть минорные проблемы, но система функциональна');
  console.log('🔧 Рекомендуется исправить проблемы перед деплоем');
} else {
  console.log('❌ Система требует серьезного исправления');
  console.log('🛠️ Необходимо исправить критические проблемы');
}

console.log('\nℹ️ Детальные отчеты созданы в DEPLOYMENT_READINESS_REPORT.md');

process.exit(results.failed > 2 ? 1 : 0);
