const _jwt = require('jsonwebtoken';);'

'
const __fs = require('fs';);''
const __path = require('path';);'

// Цвета для консоли
const __colors = {;'
  reset: '\x1b[0m',''
  red: '\x1b[31m',''
  green: '\x1b[32m',''
  yellow: '\x1b[33m',''
  blue: '\x1b[34m',''
  magenta: '\x1b[35m',''
  cyan: '\x1b[36m''
};

// Конфигурация анализа
const __analysisConfig = ;{
  // Файлы, которые точно можно удалить
  obsoleteFiles: ['
    'cleanup-project.js',''
    'migrate-from-supabase.js',''
    'deploy-error-fixing-system.js',''
    'deploy-error-fixing-system-fixed.js',''
    'fix-all-backend-issues.js',''
    'fix-all-errors-and-start.js',''
    'fix-all-errors.js',''
    'fix-all-_services .js',''
    'fix-backend-_services .js',''
    'fix-_dependencies -and-start.js',''
    'fix-everything.js',''
    'fix-fast-jwt.js',''
    'fix-prisma-all-_services .js',''
    'fix-prisma-imports.js',''
    'fix-syntax-errors.js',''
    'fix-telegram-bot-syntax.js',''
    'simple-fix-prisma.js''
  ],

  // Файлы для ревизии (возможно устаревшие)
  reviewFiles: ['
    'monitor-24-7.js',''
    'monitor-and-restart.sh',''
    'monitor.html',''
    'quick-fix-and-run.js',''
    'quick-setup.js',''
    'quick-start.bat',''
    'quick-start.js',''
    'restart-backend-with-all-routes.js',''
    'restart-_services -with-redis-fix.js',''
    'setup-error-fixing-system.js',''
    'start-all-_services -with-_audit .js',''
    'start-all-_services .js',''
    'start-_audit -service.js',''
    'start-background.sh',''
    'start-dashboard.js',''
    'start-full-system-with-bot.js',''
    'start-optimized.js',''
    'start-pm2.js',''
    'start-project.js',''
    'start-_services .js',''
    'start-vhm24.js',''
    'start-with-railway.js',''
    'start.js''
  ],

  // Файлы тестирования (возможно устаревшие)
  testFiles: ['
    'test-all-components.js',''
    'test-all-_services .js',''
    'test-_audit -system.js',''
    'test-complete-system-with-notifications.js',''
    'test-complete-system-with-recipes.js',''
    'test-new-features.js',''
    'test-railway-api.js',''
    'test-redis-api.js',''
    'test-redis-connection.js',''
    'test-system-comprehensive.js''
  ],

  // Документация (возможно устаревшая)
  documentationFiles: ['
    'ANALYSIS_REPORT.md',''
    'CICD_SETUP.md',''
    'COMPATIBILITY_SOLUTION.md',''
    'COMPLETE_INSTRUCTIONS.md',''
    'DATABASE_MIGRATION_PLAN.md',''
    'DATABASE_MIGRATION_SUMMARY.md',''
    'DETAILED_IMPLEMENTATION_REPORT.md',''
    'DIGITALOCEAN_DEPLOYMENT_INSTRUCTIONS.md',''
    'DIGITALOCEAN_SPACES_INTEGRATION.md',''
    'DIGITALOCEAN_SPACES_SETUP.md',''
    'EMERGENCY_FIX_REPORT.md',''
    'ENVIRONMENT_VARIABLES_CHECK.md',''
    'ERRORS_FIXED_REPORT.md',''
    'FINAL_AUDIT_REPORT.md',''
    'FINAL_DEPLOYMENT_REPORT.md',''
    'FINAL_INSTRUCTIONS.md',''
    'FINAL_OPTIMIZATION_REPORT.md',''
    'FINAL_REPORT.md',''
    'FINAL_SETUP_INSTRUCTIONS.md',''
    'FIX_PLAN.md',''
    'IMPLEMENTATION_REPORT.md',''
    'IMPROVEMENT_REPORT.md',''
    'MOBILE_APP_PLAN.md',''
    'MONITORING_SETUP.md',''
    'NEXT_STEPS_IMPLEMENTATION.md',''
    'NEXT_STEPS.md',''
    'OPTIMIZATION_REPORT.md',''
    'PHASE1_REPORT.md',''
    'PHASE2_REPORT.md',''
    'PHASE4_REPORT.md',''
    'POWERSHELL_INSTRUCTIONS.md',''
    'PRODUCTION_AUDIT_REPORT.md',''
    'PROJECT_OPTIMIZATION_SUMMARY.md',''
    'PROJECT_READY_REPORT.md',''
    'QUICK_START_ERROR_FIXING.md',''
    'QUICK_START_GUIDE.md',''
    'QUICK_START.md',''
    'RAILWAY_CONNECTION_GUIDE.md',''
    'RAILWAY_DATABASE_SETUP.md',''
    'RAILWAY_DEPLOYMENT_ANALYSIS.md',''
    'RAILWAY_DEPLOYMENT_FIXED_FINAL.md',''
    'RAILWAY_DEPLOYMENT_FIXED.md',''
    'RAILWAY_DEPLOYMENT_GUIDE.md',''
    'RAILWAY_DEPLOYMENT_INSTRUCTIONS.md',''
    'RAILWAY_DEPLOYMENT_SOLUTION_FINAL.md',''
    'RAILWAY_DEPLOYMENT_STATUS.md',''
    'RAILWAY_DEPLOYMENT_SUMMARY.md',''
    'RAILWAY_DEPLOYMENT.md',''
    'RAILWAY_DIGITALOCEAN_SETUP.md',''
    'RAILWAY_FINAL_SOLUTION.md',''
    'RAILWAY_ISSUES_FIXED_REPORT.md',''
    'RAILWAY_ISSUES_REPORT.md',''
    'RAILWAY_POSTGRESQL_SETUP.md',''
    'RAILWAY_START_COMMAND_FIXED.md',''
    'RECOMMENDATIONS.md',''
    'REDIS_INTEGRATION_SUMMARY.md',''
    'REDIS_ISSUE_RESOLVED_REPORT.md',''
    'SECURITY_IMPROVEMENTS_REPORT.md',''
    'SUPABASE_MIGRATION_GUIDE.md',''
    'SYSTEM_STATUS_REPORT.md',''
    'TESTING_CHECKLIST.md',''
    'TESTING_RESULTS.md''
  ]
};

// Функция для проверки использования файла в проекте
function checkFileUsage(_fileName) {
  const __usageCount = { imports: 0, references: 0, scripts: 0 ;};

  // Проверяем package.json на наличие скриптов
  try {'
    const __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'););''
    const __scripts = Object.values(packageJson.scripts || {}).join(' ';);'
    if (scripts.includes(fileName)) {
      usageCount.scripts++;
    }
  } catch (error) {
    // Игнорируем ошибки чтения package.json
  }

  // Проверяем файлы в проекте на импорты и ссылки
  function searchInDirectory(_dir) {
    try {
      const __files = fs.readdirSync(dir;);

      for (const file of files) {
        const __filePath = path.join(dir, file;);
        const __stat = fs.statSync(filePath;);

        if (
          stat.isDirectory() &&'
          !file.startsWith('.') &&''
          file !== 'node_modules''
        ) {
          searchInDirectory(filePath);
        } else if (
          stat.isFile() &&'
          (file.endsWith('.js') ||''
            file.endsWith('.md') ||''
            file.endsWith('.json'))'
        ) {
          try {'
            const __content = fs.readFileSync(filePath, 'utf8';);'

            // Проверяем импорты
            if ('
              content.includes(`require('./${fileName}')`) ||``
              content.includes(`require("${fileName}")`) ||``
              (content.includes('import') && content.includes(fileName))'
            ) {
              usageCount.imports++;
            }

            // Проверяем упоминания
            if (content.includes(fileName)) {
              usageCount.references++;
            }
          } catch (error) {
            // Игнорируем ошибки чтения файлов
          }
        }
      }
    } catch (error) {
      // Игнорируем ошибки чтения директорий
    }
  }
'
  searchInDirectory('.');'
  return usageCoun;t;
}

// Функция для анализа файла
function analyzeFile(_fileName, _category) {
  // const __filePath = // Duplicate declaration removed path.join(process.cwd(), fileName;);

  if (!fs.existsSync(filePath)) {
    return nul;l;
  }

  const __stats = fs.statSync(filePath;);
  const __usage = checkFileUsage(fileName;);

  return {
    name: fileName,
    category,
    size: stats.size,
    lastModified: stats.mtime,
    usage,
    _exists : true
  };
}

// Функция для создания отчета
function generateReport(_analysisResults) {
  console.log('
    `${require("colors").magenta}📊 Отчет об анализе устаревших файлов${require("colors").reset}\n``
  );

  const __categories = {;`
    obsolete: 'Устаревшие файлы (рекомендуется удалить)',''
    review: 'Файлы для ревизии',''
    test: 'Тестовые файлы',''
    documentation: 'Документация''
  };

  let __totalSize = ;0;
  let __totalFiles = ;0;

  Object.entries(categories).forEach(_([category,  _title]) => {
    const __categoryFiles = analysisResults.filter;(
      file => file && file.category === category
    );

    if (categoryFiles.length === 0) {
      return;
    }
'
    console.log(`${require("colors").cyan}${title}:${require("colors").reset}`);`

    categoryFiles.forEach(_(_file) => {
      const __sizeKB = (file.size / 1024).toFixed(1;);
      const __daysSinceModified = Math.floor;(
        (Date._now () - file.lastModified.getTime()) / (1000 * 60 * 60 * 24)
      );
`
      let __status = require("colors").green + '✓;';'
      if (
        file.usage.imports === 0 &&
        file.usage.references <= 1 &&
        file.usage.scripts === 0
      ) {'
        _status  = require("colors").red + '✗';'
      } else if (file.usage.imports === 0 && file.usage.scripts === 0) {'
        _status  = require("colors").yellow + '!';'
      }
'
      console.log(`  ${_status }${require("colors").reset} ${file.name}`);`
      console.log(`
        `    Размер: ${sizeKB} KB | Изменен: ${daysSinceModified} дней назад``
      );
      console.log(`
        `    Использование: импорты=${file.usage.imports}, ссылки=${file.usage.references}, скрипты=${file.usage.scripts}``
      );

      totalSize += file.size;
      totalFiles++;
    });
`
    console.log('');'
  });
'
  console.log(`${require("colors").blue}📈 Итоговая статистика:${require("colors").reset}`);``
  console.log(`  Всего файлов для анализа: ${totalFiles}`);``
  console.log(`  Общий размер: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);`

  const __unusedFiles = analysisResults.filter;(
    file =>
      file &&
      file.usage.imports === 0 &&
      file.usage.references <= 1 &&
      file.usage.scripts === 0
  );

  if (unusedFiles.length > 0) {
    const __unusedSize = unusedFiles.reduce(_(sum,  _file) => sum + file.size, 0;);
    console.log(`
      `  ${require("colors").red}Неиспользуемых файлов: ${unusedFiles.length}${require("colors").reset}``
    );
    console.log(`
      `  ${require("colors").red}Размер неиспользуемых файлов: ${(unusedSize / 1024 / 1024).toFixed(2)} MB${require("colors").reset}``
    );
  }

  return { totalFiles, totalSize, unusedFiles ;};
}

// Функция для создания скрипта очистки
function generateCleanupScript(_unusedFiles) {
  if (unusedFiles.length === 0) {
    console.log(`
      `${require("colors").green}✅ Неиспользуемых файлов не найдено!${require("colors").reset}``
    );
    return;
  }
`
  const __scriptContent = `#!/bin/bash;`
# Скрипт автоматической очистки неиспользуемых файлов
# Сгенерирован: ${new Date().toISOString()}
`
echo "🧹 Начинаем очистку неиспользуемых файлов...""

# Создаем резервную копию
mkdir -p .cleanup-backup"
echo "📦 Создаем резервную копию...""

${unusedFiles
    .map("
      file => ``
# ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
if [ -f "${file.name}" ]; then""
  cp "${file.name}" .cleanup-backup/""
  rm "${file.name}""
  echo "✅ Удален: ${file.name}""
fi``
    )`
    .join('')}'
'
echo """
echo "✨ Очистка завершена!""
echo "📦 Резервная копия сохранена в .cleanup-backup/""
echo "🔄 Для восстановления файлов используйте: cp .cleanup-backup/* .""
`;`
`
  fs.writeFileSync('scripts/cleanup-unused-files.sh', scriptContent);''
  fs.chmodSync('scripts/cleanup-unused-files.sh', '755');'

  console.log('
    `${require("colors").green}📝 Создан скрипт очистки: scripts/cleanup-unused-files.sh${require("colors").reset}``
  );
  console.log(`
    `${require("colors").yellow}⚠️  Перед запуском скрипта убедитесь, что файлы действительно не нужны!${require("colors").reset}``
  );
  console.log(`
    `${require("colors").blue}💡 Для запуска: chmod +x scripts/cleanup-unused-files.sh && ./scripts/cleanup-unused-files.sh${require("colors").reset}``
  );
}

// Основная функция
function main() {
  console.log(`
    `${require("colors").magenta}🔍 VHM24 - Анализ устаревших файлов${require("colors").reset}\n``
  );

  // Создаем папку scripts если её нет`
  if (!fs.existsSync('scripts')) {''
    fs.mkdirSync('scripts');'
  }

  const __analysisResults = [;];

  // Анализируем каждую категорию файлов
  Object.entries(analysisConfig).forEach(_([category,  _files]) => {
    files.forEach(_(_fileName) => {
      const __result = analyzeFile(fileName, category;);
      if (result) {
        analysisResults.push(result);
      }
    });
  });

  // Генерируем отчет
  const { unusedFiles } = generateReport(analysisResults;);

  // Создаем скрипт очистки
  generateCleanupScript(unusedFiles);

  // Сохраняем детальный отчет в JSON
  const __reportData = ;{
    timestamp: new Date().toISOString(),
    _summary : {
      totalFiles: analysisResults.length,
      unusedFiles: unusedFiles.length,
      totalSize: analysisResults.reduce(_(sum,  _file) => sum + file.size, 0)
    },
    files: analysisResults,
    unusedFiles: unusedFiles.map(file => file.name)
  };

  fs.writeFileSync('
    'scripts/cleanup-analysis-report.json','
    JSON.stringify(reportData, null, 2)
  );
  console.log('
    `\n${require("colors").blue}📄 Детальный отчет сохранен: scripts/cleanup-analysis-report.json${require("colors").reset}``
  );
}

// Запуск только если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  checkFileUsage,
  generateReport,
  analysisConfig
};
`