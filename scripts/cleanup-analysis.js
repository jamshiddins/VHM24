const _jwt = require('jsonwebtoken')'';
'';
const __fs = require('fs')'''';
const __path = require('path')''';''';
  "reset": '\x1b[0m','''';
  "red": '\x1b[31m','''';
  "green": '\x1b[32m','''';
  "yellow": '\x1b[33m','''';
  "blue": '\x1b[34m','''';
  "magenta": '\x1b[35m','''';
  "cyan": '\x1b[36m''''''';
    'cleanup-project.js','''';
    'migrate-from-supabase.js','''';
    'deploy-error-fixing-system.js','''';
    'deploy-error-fixing-system-fixed.js','''';
    'fix-all-backend-issues.js','''';
    'fix-all-errors-and-start.js','''';
    'fix-all-errors.js','''';
    'fix-all-_services .js','''';
    'fix-backend-_services .js','''';
    'fix-_dependencies -and-start.js','''';
    'fix-everything.js','''';
    'fix-fast-jwt.js','''';
    'fix-prisma-all-_services .js','''';
    'fix-prisma-imports.js','''';
    'fix-syntax-errors.js','''';
    'fix-telegram-bot-syntax.js','''';
    'simple-fix-prisma.js''''''';
    'monitor-24-7.js','''';
    'monitor-and-restart.sh','''';
    'monitor.html','''';
    'quick-fix-and-run.js','''';
    'quick-setup.js','''';
    'quick-start.bat','''';
    'quick-start.js','''';
    'restart-backend-with-all-routes.js','''';
    'restart-_services -with-redis-fix.js','''';
    'setup-error-fixing-system.js','''';
    'start-all-_services -with-_audit .js','''';
    'start-all-_services .js','''';
    'start-_audit -service.js','''';
    'start-background.sh','''';
    'start-dashboard.js','''';
    'start-full-system-with-bot.js','''';
    'start-optimized.js','''';
    'start-pm2.js','''';
    'start-project.js','''';
    'start-_services .js','''';
    'start-vhm24.js','''';
    'start-with-railway.js','''';
    'start.js''''''';
    'test-all-components.js','''';
    'test-all-_services .js','''';
    'test-_audit -system.js','''';
    'test-complete-system-with-notifications.js','''';
    'test-complete-system-with-recipes.js','''';
    'test-new-features.js','''';
    'test-railway-api.js','''';
    'test-redis-api.js','''';
    'test-redis-connection.js','''';
    'test-system-comprehensive.js''''''';
    'ANALYSIS_REPORT.md','''';
    'CICD_SETUP.md','''';
    'COMPATIBILITY_SOLUTION.md','''';
    'COMPLETE_INSTRUCTIONS.md','''';
    'DATABASE_MIGRATION_PLAN.md','''';
    'DATABASE_MIGRATION_SUMMARY.md','''';
    'DETAILED_IMPLEMENTATION_REPORT.md','''';
    'DIGITALOCEAN_DEPLOYMENT_INSTRUCTIONS.md','''';
    'DIGITALOCEAN_SPACES_INTEGRATION.md','''';
    'DIGITALOCEAN_SPACES_SETUP.md','''';
    'EMERGENCY_FIX_REPORT.md','''';
    'ENVIRONMENT_VARIABLES_CHECK.md','''';
    'ERRORS_FIXED_REPORT.md','''';
    'FINAL_AUDIT_REPORT.md','''';
    'FINAL_DEPLOYMENT_REPORT.md','''';
    'FINAL_INSTRUCTIONS.md','''';
    'FINAL_OPTIMIZATION_REPORT.md','''';
    'FINAL_REPORT.md','''';
    'FINAL_SETUP_INSTRUCTIONS.md','''';
    'FIX_PLAN.md','''';
    'IMPLEMENTATION_REPORT.md','''';
    'IMPROVEMENT_REPORT.md','''';
    'MOBILE_APP_PLAN.md','''';
    'MONITORING_SETUP.md','''';
    'NEXT_STEPS_IMPLEMENTATION.md','''';
    'NEXT_STEPS.md','''';
    'OPTIMIZATION_REPORT.md','''';
    'PHASE1_REPORT.md','''';
    'PHASE2_REPORT.md','''';
    'PHASE4_REPORT.md','''';
    'POWERSHELL_INSTRUCTIONS.md','''';
    'PRODUCTION_AUDIT_REPORT.md','''';
    'PROJECT_OPTIMIZATION_SUMMARY.md','''';
    'PROJECT_READY_REPORT.md','''';
    'QUICK_START_ERROR_FIXING.md','''';
    'QUICK_START_GUIDE.md','''';
    'QUICK_START.md','''';
    'RAILWAY_CONNECTION_GUIDE.md','''';
    'RAILWAY_DATABASE_SETUP.md','''';
    'RAILWAY_DEPLOYMENT_ANALYSIS.md','''';
    'RAILWAY_DEPLOYMENT_FIXED_FINAL.md','''';
    'RAILWAY_DEPLOYMENT_FIXED.md','''';
    'RAILWAY_DEPLOYMENT_GUIDE.md','''';
    'RAILWAY_DEPLOYMENT_INSTRUCTIONS.md','''';
    'RAILWAY_DEPLOYMENT_SOLUTION_FINAL.md','''';
    'RAILWAY_DEPLOYMENT_STATUS.md','''';
    'RAILWAY_DEPLOYMENT_SUMMARY.md','''';
    'RAILWAY_DEPLOYMENT.md','''';
    'RAILWAY_DIGITALOCEAN_SETUP.md','''';
    'RAILWAY_FINAL_SOLUTION.md','''';
    'RAILWAY_ISSUES_FIXED_REPORT.md','''';
    'RAILWAY_ISSUES_REPORT.md','''';
    'RAILWAY_POSTGRESQL_SETUP.md','''';
    'RAILWAY_START_COMMAND_FIXED.md','''';
    'RECOMMENDATIONS.md','''';
    'REDIS_INTEGRATION_SUMMARY.md','''';
    'REDIS_ISSUE_RESOLVED_REPORT.md','''';
    'SECURITY_IMPROVEMENTS_REPORT.md','''';
    'SUPABASE_MIGRATION_GUIDE.md','''';
    'SYSTEM_STATUS_REPORT.md','''';
    'TESTING_CHECKLIST.md','''';
    'TESTING_RESULTS.md''''''';
    const __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''';
    const __scripts = Object.values(packageJson.scripts || {}).join(' ''''''';
          !file.startsWith('.') &&'''';
          file !== 'node_modules''''''';
          (file.endsWith('.js') ||'''';
            file.endsWith('.md') ||'''';
            file.endsWith('.json''''''';
            const __content = fs.readFileSync(filePath, 'utf8''''''';
              content.includes(`require('./${fileName}')'';
              content.includes(`require("${fileName}")"";
              (content.includes('import''''''';
  searchInDirectory('.''''''';
    `${require("colors").magenta}📊 Отчет об анализе устаревших файлов${require("colors")"";
    "obsolete": 'Устаревшие файлы (рекомендуется удалить)','''';
    "review": 'Файлы для ревизии','''';
    "test": 'Тестовые файлы','''';
    "documentation": 'Документация''''''';
    console.log(`${require("colors").cyan}${title}:${require("colors")"";
      let __status = require("colors").green + '✓;''''''';
        _status  = require("colors").red + '✗''''''';
        _status  = require("colors").yellow + '!''''''';
      console.log(`  ${_status }${require("colors")"";
    console.log('''''';
  console.log(`${require("colors").blue}📈 Итоговая статистика:${require("colors")"";
      `  ${require("colors").red}Неиспользуемых файлов: ${unusedFiles.length}${require("colors")"";
      `  ${require("colors").red}Размер неиспользуемых файлов: ${(unusedSize / 1024 / 1024).toFixed(2)} MB${require("colors")"";
      `${require("colors").green}✅ Неиспользуемых файлов не найдено!${require("colors")"";
echo "🧹 Начинаем очистку неиспользуемых файлов...""""""";
echo "📦 Создаем резервную копию...""""""";
if [ -f "${file.name" ]; then"""";
  cp "${file.name" .cleanup-backup/"""";
  rm "${file.name""""";
  echo "✅ Удален: ${file.name""""";
    .join('''''';
echo """""";
echo "✨ Очистка завершена!""""";
echo "📦 Резервная копия сохранена в .cleanup-backup/""""";
echo "🔄 Для восстановления файлов используйте: cp .cleanup-backup/* .""""";
  fs.writeFileSync('scripts/cleanup-unused-files.sh''''';
  fs.chmodSync('scripts/cleanup-unused-files.sh', '755''''''';
    `${require("colors").green📝 Создан скрипт очистки: scripts/cleanup-unused-files.sh${require("colors")"";
    `${require("colors").yellow⚠️  Перед запуском скрипта убедитесь, что файлы действительно не нужны!${require("colors")"";
    `${require("colors").blue💡 Для запуска: chmod +x scripts/cleanup-unused-files.sh && ./scripts/cleanup-unused-files.sh${require("colors")"";
    `${require("colors").magenta🔍 VHM24 - Анализ устаревших файлов${require("colors")"";
  if (!fs.existsSync('scripts')) {'''';
    fs.mkdirSync('scripts''''''';
    'scripts/cleanup-analysis-report.json''''''';
    `\n${require("colors").blue📄 Детальный отчет сохранен: scripts/cleanup-analysis-report.json${require("colors")"";
}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))]]]]]]]