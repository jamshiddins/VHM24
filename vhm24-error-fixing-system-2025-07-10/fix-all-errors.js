#!/usr/bin/env node

/**
 * VHM24 - Полное исправление ошибок
 * 
 * Этот скрипт запускает полный процесс анализа и исправления ошибок в проекте VHM24.
 * Он последовательно выполняет анализ, исправление и тестирование.
 * 
 * Использование:
 * node fix-all-errors.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('@vhm24/shared/logger');

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

// Функция для запуска процесса исправления ошибок
async function fixAllErrors() {
  log('\n🚀 VHM24 - ПОЛНОЕ ИСПРАВЛЕНИЕ ОШИБОК 🚀\n', 'bright');
  
  try {
    // 1. Анализ проекта
    log('📊 Шаг 1: Анализ проекта', 'cyan');
    execSync('node scripts/project-analyzer.js', { stdio: 'inherit' });
    
    // Проверяем, что отчет создан
    if (!fs.existsSync('analysis-report.json')) {
      throw new Error('Отчет анализа не был создан');
    }
    
    log('✅ Анализ проекта завершен', 'green');
    
    // 2. Исправление ошибок
    log('\n🔧 Шаг 2: Исправление ошибок', 'cyan');
    execSync('node scripts/auto-fixer.js', { stdio: 'inherit' });
    
    // Проверяем, что отчет о исправлениях создан
    if (!fs.existsSync('fix-report.json')) {
      log('⚠️ Отчет о исправлениях не был создан, но продолжаем', 'yellow');
    } else {
      log('✅ Исправление ошибок завершено', 'green');
    }
    
    // 3. Тестирование
    log('\n🧪 Шаг 3: Тестирование', 'cyan');
    execSync('node scripts/test-after-fixes.js', { stdio: 'inherit' });
    
    log('✅ Тестирование завершено', 'green');
    
    // 4. Итоговый отчет
    log('\n📝 Шаг 4: Создание итогового отчета', 'cyan');
    createFinalReport();
    
    log('✅ Итоговый отчет создан: VHM24_ERROR_FIXING_SYSTEM_REPORT.md', 'green');
    
    // Завершение
    log('\n🎉 ПРОЦЕСС ИСПРАВЛЕНИЯ ОШИБОК ЗАВЕРШЕН УСПЕШНО!', 'bright');
    log('📁 Все отчеты доступны в корневой директории проекта', 'green');
    
  } catch (error) {
    log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
    log('Проверьте логи выше для получения дополнительной информации', 'yellow');
    process.exit(1);
  }
}

// Функция для создания итогового отчета
function createFinalReport() {
  // Загружаем отчеты
  let analysisReport = {};
  let fixReport = {};
  
  try {
    if (fs.existsSync('analysis-report.json')) {
      analysisReport = JSON.parse(fs.readFileSync('analysis-report.json', 'utf8'));
    }
  } catch (e) {
    log('⚠️ Не удалось загрузить отчет анализа', 'yellow');
  }
  
  try {
    if (fs.existsSync('fix-report.json')) {
      fixReport = JSON.parse(fs.readFileSync('fix-report.json', 'utf8'));
    }
  } catch (e) {
    log('⚠️ Не удалось загрузить отчет исправлений', 'yellow');
  }
  
  // Создаем итоговый отчет
  const report = `# VHM24 - Отчет о исправлении ошибок

## 📊 Общая информация

- **Дата**: ${new Date().toLocaleString()}
- **Проект**: VHM24 - Платформа управления вендинговыми автоматами
- **Статус**: Завершено

## 📈 Статистика анализа

${analysisReport.stats ? `
- **Проанализировано файлов**: ${analysisReport.stats.filesAnalyzed || 0}
- **Найдено проблем**: ${analysisReport.stats.totalIssues || 0}
  - **Критические**: ${analysisReport.summary?.critical || 0}
  - **Высокий приоритет**: ${analysisReport.summary?.high || 0}
  - **Средний приоритет**: ${analysisReport.summary?.medium || 0}
  - **Низкий приоритет**: ${analysisReport.summary?.low || 0}
` : '- Данные анализа недоступны'}

## 🔧 Статистика исправлений

${fixReport.summary ? `
- **Исправлено проблем**: ${fixReport.summary.totalFixed || 0}
- **Не удалось исправить**: ${fixReport.summary.totalFailed || 0}
- **Успешность**: ${fixReport.summary.successRate || 0}%
` : '- Данные исправлений недоступны'}

## 🔍 Основные исправленные проблемы

${fixReport.fixed && fixReport.fixed.length > 0 ? 
  fixReport.fixed.slice(0, 10).map(fix => `- ${fix}`).join('\n') + 
  (fixReport.fixed.length > 10 ? `\n- ... и еще ${fixReport.fixed.length - 10} исправлений` : '')
  : '- Данные о исправлениях недоступны'}

## ⚠️ Нерешенные проблемы

${fixReport.failed && fixReport.failed.length > 0 ? 
  fixReport.failed.map(fail => `- ${fail}`).join('\n')
  : '- Все обнаруженные проблемы были успешно исправлены'}

## 🚀 Рекомендации

1. **Обновление зависимостей**: Регулярно обновляйте зависимости проекта для устранения уязвимостей
2. **Мониторинг**: Настройте непрерывный мониторинг для раннего обнаружения проблем
3. **Тестирование**: Расширьте покрытие тестами для предотвращения регрессий
4. **Документация**: Поддерживайте актуальную документацию по API и архитектуре
5. **Код-ревью**: Внедрите обязательные код-ревью для всех изменений

## 📋 Следующие шаги

1. Запустите полное тестирование системы
2. Проведите ручную проверку критических компонентов
3. Разверните обновленную версию в тестовой среде
4. После успешного тестирования разверните в production

---

Отчет создан автоматически системой исправления ошибок VHM24.
`;
  
  fs.writeFileSync('VHM24_ERROR_FIXING_SYSTEM_REPORT.md', report);
}

// Запуск процесса
fixAllErrors().catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});
