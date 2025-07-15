#!/usr/bin/env node
/**
 * Скрипт для очистки проекта от ненужных файлов
 * Запускается командой: npm run cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Создание интерфейса для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для выполнения команды и возврата результата
function executeCommand(command) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    return null;
  }
}

// Функция для рекурсивного поиска файлов
function findFiles(dir, pattern, excludeDirs = []) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Пропускаем исключенные директории
        if (excludeDirs.includes(file) || excludeDirs.includes(filePath)) {
          continue;
        }
        
        // Рекурсивный поиск в поддиректориях
        results = results.concat(findFiles(filePath, pattern, excludeDirs));
      } else if (pattern.test(file)) {
        results.push(filePath);
      }
    }
  } catch (error) {
    log(`Ошибка при поиске файлов в ${dir}: ${error.message}`, 'error');
  }
  
  return results;
}

// Функция для удаления файлов
function removeFiles(files) {
  let removedCount = 0;
  
  for (const file of files) {
    try {
      fs.unlinkSync(file);
      log(`Удален файл: ${file}`, 'success');
      removedCount++;
    } catch (error) {
      log(`Ошибка при удалении файла ${file}: ${error.message}`, 'error');
    }
  }
  
  return removedCount;
}

// Функция для удаления пустых директорий
function removeEmptyDirs(dir, excludeDirs = []) {
  let removedCount = 0;
  
  try {
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Пропускаем исключенные директории
        if (excludeDirs.includes(file) || excludeDirs.includes(filePath)) {
          continue;
        }
        
        // Рекурсивное удаление пустых поддиректорий
        removedCount += removeEmptyDirs(filePath, excludeDirs);
        
        // Проверка, пуста ли директория после удаления поддиректорий
        const contents = fs.readdirSync(filePath);
        if (contents.length === 0) {
          fs.rmdirSync(filePath);
          log(`Удалена пустая директория: ${filePath}`, 'success');
          removedCount++;
        }
      }
    }
  } catch (error) {
    log(`Ошибка при удалении пустых директорий в ${dir}: ${error.message}`, 'error');
  }
  
  return removedCount;
}

// Функция для очистки проекта
async function cleanupProject() {
  log('=== ОЧИСТКА ПРОЕКТА ===', 'title');
  
  // Директории, которые не нужно очищать
  const excludeDirs = [
    'node_modules',
    '.git',
    'backend/prisma/migrations',
    'backend/src',
    'apps/telegram-bot/src',
    'apps/web-dashboard/app',
    'apps/web-dashboard/components',
    'apps/web-dashboard/lib',
    'packages/shared/utils'
  ];
  
  // Шаблоны файлов для удаления
  const filePatterns = [
    // Временные файлы
    /\.DS_Store$/,
    /\.log$/,
    /\.bak$/,
    /\.tmp$/,
    /\.old$/,
    /debug\./,
    /\.cache$/,
    
    // Дублирующиеся отчеты и документация
    /ANALYSIS_REPORT\.md$/,
    /analysis-report\.json$/,
    /audit_report\.md$/,
    /audit-autofix\.js$/,
    /auto-deploy-and-git-update\.js$/,
    /BUG_FIXES_REPORT\.md$/,
    /COMPATIBILITY_SOLUTION\.md$/,
    /COMPLETE_FIXES_REPORT\.md$/,
    /COMPLETE_INSTRUCTIONS\.md$/,
    /COMPREHENSIVE_SYSTEM_TEST_REPORT\.md$/,
    /COMPREHENSIVE_TESTING_COMPLETE\.md$/,
    /comprehensive-autofix\.js$/,
    /comprehensive-fix-report\.json$/,
    /comprehensive-system-test-and-db-check\.js$/,
    /comprehensive-test-report\.json$/,
    /comprehensive-test\.js$/,
    /connection-test-results\.json$/,
    /CONSERVATIVE_FIX_REPORT\.md$/,
    /CRITICAL_FIXES_COMPLETE\.md$/,
    /DATABASE_MIGRATION_PLAN\.md$/,
    /DATABASE_MIGRATION_SUMMARY\.md$/,
    /deep-analysis-report-\d+\.json$/,
    /deploy-and-setup\.js$/,
    /deploy-production\.sh$/,
    /deploy-railway\.js$/,
    /deploy-to-production\.js$/,
    /deploy-to-railway-complete\.js$/,
    /deploy-to-railway-online\.js$/,
    /deploy-to-railway-with-env-check\.js$/,
    /deploy-to-railway\.js$/,
    /deploy-to-vercel\.js$/,
    /deployment_checklist\.md$/,
    /DEPLOYMENT_READINESS_REPORT\.md$/,
    /deployment-ready-fixer\.js$/,
    /DETAILED_IMPLEMENTATION_REPORT\.md$/,
    /diagnose-and-fix-all\.js$/,
    /direct-mass-fixer\.js$/,
    /EMERGENCY_FIX_REPORT\.md$/,
    /emergency-server\.js$/,
    /ENV_AUDIT_COMPLETE_REPORT\.md$/,
    /env-check-report\.json$/,
    /ENVIRONMENT_VARIABLES_CHECK\.md$/,
    /ENVIRONMENT_VARIABLES\.md$/,
    /ERRORS_FIXED_REPORT\.md$/,
    /extract-railway-database-url-fixed\.js$/,
    /extract-railway-database-url\.js$/,
    /FINAL_AUDIT_COMPLETE_REPORT\.md$/,
    /FINAL_AUDIT_REPORT\.md$/,
    /FINAL_BUG_FIXES_SUMMARY\.md$/,
    /FINAL_COMPREHENSIVE_AUDIT_REPORT\.md$/,
    /FINAL_COMPREHENSIVE_TESTING_REPORT\.md$/,
    /FINAL_DEPLOYMENT_REPORT\.md$/,
    /FINAL_DEPLOYMENT_SUMMARY\.md$/,
    /FINAL_INFRASTRUCTURE_STATUS\.md$/,
    /FINAL_INSTRUCTIONS\.md$/,
    /FINAL_OPTIMIZATION_REPORT\.md$/,
    /FINAL_PRODUCTION_READY\.md$/,
    /FINAL_REPORT\.md$/,
    /FINAL_SETUP_INSTRUCTIONS\.md$/,
    /FINAL_VHM24_AUDIT_COMPLETE\.md$/,
    /final-cleanup\.js$/,
    /final-deployment-validator\.js$/,
    /final-error-eliminator\.js$/,
    /final-system-check\.js$/,
    /findHardcodedVariables_fixed\.js$/,
    /FIX_PLAN\.md$/,
    /fix_report\.md$/,
    /fix-all-critical-errors-final\.js$/,
    /fix-and-test-report\.json$/,
    /fix-api-connections\.js$/,
    /fix-critical-issues\.js$/,
    /fix-database-url-complete\.js$/,
    /fix-env-and-start-system\.js$/,
    /fix-prisma-critical-final\.js$/,
    /fix-prisma-final-errors\.js$/,
    /fix-prisma-relations-final\.js$/,
    /fix-prisma-schema-critical-errors\.js$/,
    /fix-prisma-schema-duplicates\.js$/,
    /fix-prisma-schema-errors\.js$/,
    /fix-prisma-schema-final\.js$/,
    /fix-prisma-ultimate-final\.js$/,
    /fix-railway-package\.js$/,
    /fix-railway-package\.sh$/,
    /fix-report\.json$/,
    /fix-roles-and-api\.js$/,
    /fix-telegram-bot-and-api\.js$/,
    /get-railway-database-complete\.js$/,
    /get-railway-database-info-fixed\.js$/,
    /get-railway-database-info-working\.js$/,
    /get-railway-database-info\.js$/,
    /get-railway-database-url-final\.js$/,
    /git-update-commands\.md$/,
    /health-monitor\.js$/,
    /implement-vendhub-complete-database\.js$/,
    /IMPLEMENTATION_REPORT\.md$/,
    /IMPROVEMENT_REPORT\.md$/,
    /INFRASTRUCTURE_ANALYSIS_REPORT\.md$/,
    /infrastructure-test-report\.json$/,
    /monitor-24-7\.js$/,
    /monitor-and-restart\.sh$/,
    /monitor\.html$/,
    /monitoring\.js$/,
    /optimizeBuild_fixed\.js$/,
    /OPTIMIZATION_REPORT\.md$/,
    /PHASE1_REPORT\.md$/,
    /PHASE2_REPORT\.md$/,
    /PHASE4_REPORT\.md$/,
    /PRODUCTION_AUDIT_REPORT\.md$/,
    /PRODUCTION_READY_REPORT\.md$/,
    /production-audit-report\.json$/,
    /production-ready-fixer\.js$/,
    /production-test\.js$/,
    /PROJECT_OPTIMIZATION_SUMMARY\.md$/,
    /PROJECT_READY_REPORT\.md$/,
    /quick-fix-and-run\.js$/,
    /quick-mass-fixer\.js$/,
    /railway-cleanup-and-optimize\.js$/,
    /railway-compatibility-report\.json$/,
    /railway-conservative-error-fixer\.js$/,
    /railway-critical-problem-solver\.js$/,
    /railway-final-fix\.js$/,
    /railway-final-production-configurator\.js$/,
    /railway-production-secrets\.env$/,
    /railway-production-setup\.js$/,
    /railway-start-simple\.js$/,
    /railway-test-complete\.js$/,
    /railway-test-results\.json$/,
    /railway-ultimate-deployment-solver\.js$/,
    
    // Резервные копии файлов
    /\.prisma\.backup$/,
    /\.prisma\.backup-\d+$/,
    /backup-\d+\//,
    /backup\.json$/
  ];
  
  // Поиск файлов для удаления
  log('Поиск файлов для удаления...', 'info');
  
  let filesToRemove = [];
  
  for (const pattern of filePatterns) {
    const files = findFiles('.', pattern, excludeDirs);
    filesToRemove = filesToRemove.concat(files);
  }
  
  // Вывод списка файлов для удаления
  if (filesToRemove.length > 0) {
    log(`Найдено ${filesToRemove.length} файлов для удаления:`, 'info');
    
    for (const file of filesToRemove) {
      log(`- ${file}`, 'info');
    }
    
    // Запрос подтверждения удаления
    await new Promise((resolve) => {
      rl.question('Удалить эти файлы? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          const removedCount = removeFiles(filesToRemove);
          log(`Удалено ${removedCount} файлов`, 'success');
        } else {
          log('Удаление файлов отменено', 'warning');
        }
        
        resolve();
      });
    });
  } else {
    log('Файлы для удаления не найдены', 'info');
  }
  
  // Удаление пустых директорий
  log('Поиск пустых директорий...', 'info');
  
  await new Promise((resolve) => {
    rl.question('Удалить пустые директории? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        const removedCount = removeEmptyDirs('.', excludeDirs);
        log(`Удалено ${removedCount} пустых директорий`, 'success');
      } else {
        log('Удаление пустых директорий отменено', 'warning');
      }
      
      resolve();
    });
  });
  
  // Очистка кэша npm
  await new Promise((resolve) => {
    rl.question('Очистить кэш npm? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        executeCommand('npm cache clean --force');
        log('Кэш npm очищен', 'success');
      } else {
        log('Очистка кэша npm отменена', 'warning');
      }
      
      resolve();
    });
  });
  
  // Вывод итогового результата
  log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
  log('✅ Очистка проекта завершена', 'success');
  
  rl.close();
}

// Запуск скрипта
cleanupProject().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
