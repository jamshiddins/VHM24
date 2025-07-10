#!/usr/bin/env node

/**
 * VHM24 - Настройка системы исправления ошибок
 * 
 * Этот скрипт устанавливает необходимые зависимости и настраивает систему исправления ошибок.
 * 
 * Использование:
 * node setup-error-fixing-system.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Функция для форматированного вывода
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Функция для проверки наличия директории
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`✅ Создана директория: ${dir}`, 'green');
  }
}

// Функция для настройки системы
async function setupSystem() {
  log('\n🚀 VHM24 - НАСТРОЙКА СИСТЕМЫ ИСПРАВЛЕНИЯ ОШИБОК 🚀\n', 'bright');
  
  try {
    // 1. Проверка наличия необходимых директорий
    log('📁 Проверка структуры директорий...', 'cyan');
    
    const requiredDirs = [
      'scripts',
      'packages/shared/logger'
    ];
    
    requiredDirs.forEach(dir => {
      ensureDirectoryExists(dir);
    });
    
    log('✅ Структура директорий проверена', 'green');
    
    // 2. Проверка наличия необходимых файлов
    log('\n📄 Проверка наличия необходимых файлов...', 'cyan');
    
    const requiredFiles = [
      'scripts/project-analyzer.js',
      'scripts/auto-fixer.js',
      'scripts/test-after-fixes.js',
      'fix-all-errors.js',
      'packages/shared/logger/index.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      log('❌ Отсутствуют следующие файлы:', 'red');
      missingFiles.forEach(file => log(`  - ${file}`, 'red'));
      throw new Error('Отсутствуют необходимые файлы');
    }
    
    log('✅ Все необходимые файлы присутствуют', 'green');
    
    // 3. Установка зависимостей
    log('\n📦 Установка зависимостей...', 'cyan');
    
    const dependencies = [
      'glob@10.3.10',
      'node-fetch@3.3.2',
      'tap@18.5.0',
      'pino@8.16.0',
      'fastify@4.24.0',
      '@fastify/jwt@7.2.4'
    ];
    
    try {
      log('Установка глобальных зависимостей...', 'blue');
      execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
      log('✅ Глобальные зависимости установлены', 'green');
    } catch (e) {
      log('⚠️ Не удалось установить глобальные зависимости', 'yellow');
      log('Попытка установки локальных зависимостей...', 'blue');
      
      // Создаем package.json если его нет
      if (!fs.existsSync('package.json')) {
        const packageJson = {
          name: 'vhm24-error-fixing-system',
          version: '1.0.0',
          description: 'Система исправления ошибок для проекта VHM24',
          main: 'fix-all-errors.js',
          scripts: {
            'analyze': 'node scripts/project-analyzer.js',
            'fix': 'node scripts/auto-fixer.js',
            'test-fixes': 'node scripts/test-after-fixes.js',
            'fix-all': 'node fix-all-errors.js',
            'setup': 'node setup-error-fixing-system.js'
          },
          dependencies: {},
          author: 'VHM24 Team',
          license: 'MIT'
        };
        
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        log('✅ Создан package.json', 'green');
      }
      
      // Устанавливаем зависимости локально
      execSync(`npm install --save ${dependencies.join(' ')}`, { stdio: 'inherit' });
      log('✅ Локальные зависимости установлены', 'green');
    }
    
    // 4. Создание .env файла если его нет
    log('\n🔧 Настройка переменных окружения...', 'cyan');
    
    if (!fs.existsSync('.env')) {
      const envContent = `# Переменные окружения для VHM24
NODE_ENV=development
LOG_LEVEL=INFO
JWT_SECRET=vhm24-development-secret
JWT_EXPIRES_IN=1h
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vhm24
REDIS_URL=redis://localhost:6379
`;
      
      fs.writeFileSync('.env', envContent);
      log('✅ Создан файл .env с настройками по умолчанию', 'green');
    } else {
      log('✅ Файл .env уже существует', 'green');
    }
    
    // 5. Создание чеклиста
    log('\n📋 Создание чеклиста...', 'cyan');
    
    const checklistContent = `# VHM24 Fix Checklist

## 1. Анализ
- [ ] Запустить project-analyzer.js
- [ ] Изучить ANALYSIS_REPORT.md
- [ ] Создать план исправлений

## 2. Автоматические исправления
- [ ] Запустить auto-fixer.js
- [ ] Проверить fix-report.json
- [ ] Протестировать базовую функциональность

## 3. Ручные исправления (если требуется)
- [ ] Исправить failed issues из отчета
- [ ] Добавить недостающие компоненты
- [ ] Обновить документацию

## 4. Тестирование
- [ ] Запустить test-after-fixes.js
- [ ] Проверить все health endpoints
- [ ] Протестировать API с Postman/curl

## 5. Финальная проверка
- [ ] Код соответствует стандартам
- [ ] Все тесты проходят
- [ ] Docker образы собираются
- [ ] CI/CD pipeline работает

## 6. Документация
- [ ] README.md обновлен
- [ ] API документация создана
- [ ] Deployment guide написан
`;
    
    fs.writeFileSync('VHM24_FIX_CHECKLIST.md', checklistContent);
    log('✅ Создан чеклист VHM24_FIX_CHECKLIST.md', 'green');
    
    // 6. Создание краткого руководства
    log('\n📚 Создание краткого руководства...', 'cyan');
    
    const quickStartContent = `# VHM24 - Краткое руководство по исправлению ошибок

## Установка

\`\`\`bash
# Установка зависимостей и настройка системы
node setup-error-fixing-system.js
\`\`\`

## Использование

### Полный процесс

\`\`\`bash
# Запуск полного процесса анализа, исправления и тестирования
node fix-all-errors.js
\`\`\`

### Пошаговый процесс

\`\`\`bash
# 1. Анализ проекта
node scripts/project-analyzer.js

# 2. Исправление ошибок
node scripts/auto-fixer.js

# 3. Тестирование
node scripts/test-after-fixes.js
\`\`\`

## Отчеты

- \`analysis-report.json\` - Детальный отчет анализа в формате JSON
- \`ANALYSIS_REPORT.md\` - Отчет анализа в формате Markdown
- \`fix-report.json\` - Отчет о исправлениях в формате JSON
- \`VHM24_ERROR_FIXING_SYSTEM_REPORT.md\` - Итоговый отчет

## Чеклист

Используйте \`VHM24_FIX_CHECKLIST.md\` для отслеживания прогресса.
`;
    
    fs.writeFileSync('QUICK_START_ERROR_FIXING.md', quickStartContent);
    log('✅ Создано краткое руководство QUICK_START_ERROR_FIXING.md', 'green');
    
    // Завершение
    log('\n🎉 НАСТРОЙКА СИСТЕМЫ ИСПРАВЛЕНИЯ ОШИБОК ЗАВЕРШЕНА УСПЕШНО!', 'bright');
    log('📋 Для начала работы используйте команду: node fix-all-errors.js', 'green');
    
  } catch (error) {
    log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
    log('Проверьте логи выше для получения дополнительной информации', 'yellow');
    process.exit(1);
  }
}

// Запуск настройки
setupSystem().catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});
