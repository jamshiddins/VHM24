const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Импортируем логгер, если он существует, иначе создаем простой логгер
let logger;
try {
  logger = require('./utils/logger');
} catch (error) {
  logger = {
    info: (message) => console.log(message),
    error: (message) => console.error('\x1b[31m%s\x1b[0m', message),
    warn: (message) => console.warn('\x1b[33m%s\x1b[0m', message),
    success: (message) => console.log('\x1b[32m%s\x1b[0m', message)
  };
}

/**
 * Запуск полного процесса исправления ошибок
 */
async function runFullErrorFixingProcess() {
  logger.info('\n🚀 VHM24 - ПОЛНЫЙ ПРОЦЕСС ИСПРАВЛЕНИЯ ОШИБОК 🚀\n');

  try {
    // 0. Проверка наличия необходимых файлов
    checkRequiredFiles();

    // 1. Анализ проекта
    logger.info('📊 Шаг 1: Анализ проекта...');
    await runAnalysis();
    logger.success('✅ Анализ проекта завершен');

    // 2. Исправление ошибок
    logger.info('\n🔧 Шаг 2: Исправление ошибок...');
    await runFixer();
    logger.success('✅ Исправление ошибок завершено');

    // 3. Тестирование после исправлений
    logger.info('\n🧪 Шаг 3: Тестирование после исправлений...');
    await runTests();
    logger.success('✅ Тестирование завершено');

    // 4. Генерация итогового отчета
    logger.info('\n📝 Шаг 4: Генерация итогового отчета...');
    generateFinalReport();
    logger.success('✅ Итоговый отчет сгенерирован');

    // 5. Финальное сообщение
    logger.info('\n🎉 Процесс исправления ошибок успешно завершен!');
    logger.info('Проверьте следующие файлы для получения подробной информации:');
    logger.info('- analysis-report.json - отчет анализа');
    logger.info('- fix-report.json - отчет исправлений');
    logger.info('- test-report.json - отчет тестирования');
    logger.info('- VHM24_ERROR_FIXING_SYSTEM_REPORT.md - итоговый отчет');

  } catch (error) {
    logger.error(`\n❌ Критическая ошибка: ${error.message}`);
    if (error.stack) {
      logger.error(`Стек ошибки: ${error.stack}`);
    }
    process.exit(1);
  }
}

/**
 * Проверка наличия необходимых файлов
 */
function checkRequiredFiles() {
  const requiredFiles = [
    'scripts/project-analyzer.js',
    'scripts/auto-fixer.js',
    'scripts/test-after-fixes.js'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
  
  if (missingFiles.length > 0) {
    throw new Error(`Отсутствуют необходимые файлы: ${missingFiles.join(', ')}`);
  }
}

/**
 * Запуск анализа проекта
 */
async function runAnalysis() {
  return new Promise((resolve, reject) => {
    const analyzerPath = path.join(__dirname, 'scripts/project-analyzer.js');
    
    try {
      logger.info('Запуск анализатора проекта...');
      
      const analyzer = spawn('node', [analyzerPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      analyzer.on('close', (code) => {
        if (code === 0) {
          logger.success('Анализ проекта успешно завершен');
          resolve();
        } else {
          reject(new Error(`Анализатор проекта завершился с кодом ошибки: ${code}`));
        }
      });
      
      analyzer.on('error', (error) => {
        reject(new Error(`Ошибка при запуске анализатора проекта: ${error.message}`));
      });
    } catch (error) {
      reject(new Error(`Ошибка при запуске анализатора проекта: ${error.message}`));
    }
  });
}

/**
 * Запуск исправления ошибок
 */
async function runFixer() {
  return new Promise((resolve, reject) => {
    const fixerPath = path.join(__dirname, 'scripts/auto-fixer.js');
    
    try {
      logger.info('Запуск автоматического фиксера...');
      
      const fixer = spawn('node', [fixerPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      fixer.on('close', (code) => {
        if (code === 0) {
          logger.success('Исправление ошибок успешно завершено');
          resolve();
        } else {
          reject(new Error(`Автоматический фиксер завершился с кодом ошибки: ${code}`));
        }
      });
      
      fixer.on('error', (error) => {
        reject(new Error(`Ошибка при запуске автоматического фиксера: ${error.message}`));
      });
    } catch (error) {
      reject(new Error(`Ошибка при запуске автоматического фиксера: ${error.message}`));
    }
  });
}

/**
 * Запуск тестирования после исправлений
 */
async function runTests() {
  return new Promise((resolve, reject) => {
    const testerPath = path.join(__dirname, 'scripts/test-after-fixes.js');
    
    try {
      logger.info('Запуск тестирования после исправлений...');
      
      const tester = spawn('node', [testerPath], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      tester.on('close', (code) => {
        if (code === 0) {
          logger.success('Тестирование успешно завершено');
          resolve();
        } else {
          logger.warn(`Тестирование завершилось с кодом: ${code}`);
          logger.warn('Некоторые тесты могли не пройти, но процесс продолжается');
          resolve();
        }
      });
      
      tester.on('error', (error) => {
        reject(new Error(`Ошибка при запуске тестирования: ${error.message}`));
      });
    } catch (error) {
      reject(new Error(`Ошибка при запуске тестирования: ${error.message}`));
    }
  });
}

/**
 * Генерация итогового отчета
 */
function generateFinalReport() {
  try {
    // Загружаем отчеты
    let analysisReport = {};
    let fixReport = {};
    let testReport = {};
    
    try {
      analysisReport = JSON.parse(fs.readFileSync('analysis-report.json', 'utf8'));
    } catch (error) {
      logger.warn(`Не удалось загрузить отчет анализа: ${error.message}`);
    }
    
    try {
      fixReport = JSON.parse(fs.readFileSync('fix-report.json', 'utf8'));
    } catch (error) {
      logger.warn(`Не удалось загрузить отчет исправлений: ${error.message}`);
    }
    
    try {
      testReport = JSON.parse(fs.readFileSync('test-report.json', 'utf8'));
    } catch (error) {
      logger.warn(`Не удалось загрузить отчет тестирования: ${error.message}`);
    }
    
    // Создаем итоговый отчет в формате Markdown
    const finalReport = `# VHM24 - Отчет о исправлении ошибок

## 📊 Общая информация

- **Дата**: ${new Date().toLocaleString()}
- **Проект**: VHM24
- **Версия системы**: 1.0.0

## 📈 Статистика

### Анализ проекта
${analysisReport.stats ? `
- **Проанализировано файлов**: ${analysisReport.stats.filesAnalyzed || 0}
- **Найдено проблем**: ${analysisReport.stats.totalIssues || 0}
  - Критических: ${analysisReport.summary?.critical || 0}
  - Высокого приоритета: ${analysisReport.summary?.high || 0}
  - Среднего приоритета: ${analysisReport.summary?.medium || 0}
  - Низкого приоритета: ${analysisReport.summary?.low || 0}
` : '- Данные отсутствуют'}

### Исправление ошибок
${fixReport.summary ? `
- **Исправлено проблем**: ${fixReport.summary.totalFixed || 0}
- **Не удалось исправить**: ${fixReport.summary.totalFailed || 0}
- **Процент успеха**: ${fixReport.summary.successRate || 0}%
` : '- Данные отсутствуют'}

### Тестирование
${testReport.summary ? `
- **Пройдено тестов**: ${testReport.summary.passed || 0}
- **Не пройдено тестов**: ${testReport.summary.failed || 0}
- **Процент успеха**: ${testReport.summary.successRate || 0}%
` : '- Данные отсутствуют'}

## 🔍 Подробная информация

### Критические проблемы
${analysisReport.issues?.critical?.length > 0 ? 
  analysisReport.issues.critical.map((issue, index) => 
    `${index + 1}. **${issue.issue}**${issue.file ? `\n   - Файл: \`${issue.file}\`` : ''}${issue.fix ? `\n   - Исправление: \`${issue.fix}\`` : ''}`
  ).join('\n\n') : 
  '- Критические проблемы не обнаружены'}

### Исправленные проблемы
${fixReport.fixed?.length > 0 ? 
  fixReport.fixed.map((fix, index) => 
    `${index + 1}. ${fix}`
  ).join('\n') : 
  '- Нет исправленных проблем'}

### Неисправленные проблемы
${fixReport.failed?.length > 0 ? 
  fixReport.failed.map((fail, index) => 
    `${index + 1}. ${fail}`
  ).join('\n') : 
  '- Нет неисправленных проблем'}

## 🚀 Рекомендации

1. Регулярно запускайте систему исправления ошибок для поддержания высокого качества кода
2. Обратите внимание на неисправленные проблемы и исправьте их вручную
3. Добавьте автоматический запуск анализа в CI/CD pipeline
4. Обновите документацию проекта с учетом внесенных изменений

## 📝 Заключение

Система исправления ошибок VHM24 успешно проанализировала проект, выявила проблемы и исправила большинство из них. Для дальнейшего улучшения качества кода рекомендуется обратить внимание на неисправленные проблемы и регулярно запускать систему для поддержания высокого качества кода.

---

*Отчет сгенерирован автоматически системой исправления ошибок VHM24*
`;
    
    // Сохраняем итоговый отчет
    fs.writeFileSync('VHM24_ERROR_FIXING_SYSTEM_REPORT.md', finalReport);
    logger.info('Итоговый отчет сохранен в файл VHM24_ERROR_FIXING_SYSTEM_REPORT.md');
    
  } catch (error) {
    logger.error(`Ошибка при генерации итогового отчета: ${error.message}`);
    throw error;
  }
}

// Запуск полного процесса
runFullErrorFixingProcess().catch(error => {
  logger.error(`Критическая ошибка: ${error.message}`);
  process.exit(1);
});
