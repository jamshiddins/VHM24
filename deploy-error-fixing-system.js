#!/usr/bin/env node

/**
 * VHM24 - Деплой системы исправления ошибок
 *
 * Этот скрипт выполняет деплой системы исправления ошибок VHM24.
 * Он копирует все необходимые файлы в нужные директории и настраивает систему.
 *
 * Использование:
 * node deploy-error-fixing-system.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Функция для запроса подтверждения
function confirm(message) {
  return new Promise(resolve => {
    rl.question(`${colors.yellow}${message} (y/n): ${colors.reset}`, answer => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`✅ Создана директория: ${dir}`, 'green');
  }
}

// Функция для копирования файла
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    log(`✅ Скопирован файл: ${destination}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Ошибка при копировании файла ${source}: ${error.message}`, 'red');
    return false;
  }
}

// Функция для деплоя системы
async function deploySystem() {
  log('\n🚀 VHM24 - ДЕПЛОЙ СИСТЕМЫ ИСПРАВЛЕНИЯ ОШИБОК 🚀\n', 'bright');

  // Проверяем наличие необходимых файлов
  const requiredFiles = [
    'scripts/project-analyzer.js',
    'scripts/auto-fixer.js',
    'scripts/test-after-fixes.js',
    'fix-all-errors.js',
    'setup-error-fixing-system.js',
    'VHM24_FIX_CHECKLIST.md',
    'VHM24_ERROR_FIXING_SYSTEM.md',
    'QUICK_START_ERROR_FIXING.md',
    'VHM24_ERROR_FIXING_EXAMPLES.md',
    'packages/shared/logger/index.js'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    log('❌ Отсутствуют следующие файлы:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));

    const continueAnyway = await confirm(
      'Продолжить несмотря на отсутствие файлов?'
    );
    if (!continueAnyway) {
      log('\n🛑 Деплой отменен.', 'yellow');
      rl.close();
      return;
    }
  }

  // Создаем директорию для деплоя
  const deployDir = path.join(process.cwd(), 'deploy');
  ensureDirectoryExists(deployDir);

  // Создаем структуру директорий
  const directories = ['scripts', 'packages/shared/logger', 'docs'];

  directories.forEach(dir => {
    ensureDirectoryExists(path.join(deployDir, dir));
  });

  // Копируем файлы
  const filesToCopy = [
    {
      source: 'scripts/project-analyzer.js',
      destination: 'deploy/scripts/project-analyzer.js'
    },
    {
      source: 'scripts/auto-fixer.js',
      destination: 'deploy/scripts/auto-fixer.js'
    },
    {
      source: 'scripts/test-after-fixes.js',
      destination: 'deploy/scripts/test-after-fixes.js'
    },
    { source: 'fix-all-errors.js', destination: 'deploy/fix-all-errors.js' },
    {
      source: 'setup-error-fixing-system.js',
      destination: 'deploy/setup-error-fixing-system.js'
    },
    {
      source: 'VHM24_FIX_CHECKLIST.md',
      destination: 'deploy/docs/VHM24_FIX_CHECKLIST.md'
    },
    {
      source: 'VHM24_ERROR_FIXING_SYSTEM.md',
      destination: 'deploy/docs/VHM24_ERROR_FIXING_SYSTEM.md'
    },
    {
      source: 'QUICK_START_ERROR_FIXING.md',
      destination: 'deploy/docs/QUICK_START_ERROR_FIXING.md'
    },
    {
      source: 'VHM24_ERROR_FIXING_EXAMPLES.md',
      destination: 'deploy/docs/VHM24_ERROR_FIXING_EXAMPLES.md'
    },
    {
      source: 'packages/shared/logger/index.js',
      destination: 'deploy/packages/shared/logger/index.js'
    }
  ];

  let allCopied = true;

  filesToCopy.forEach(({ source, destination }) => {
    if (fs.existsSync(source)) {
      const copied = copyFile(source, destination);
      if (!copied) {
        allCopied = false;
      }
    } else {
      log(`❌ Исходный файл не найден: ${source}`, 'red');
      allCopied = false;
    }
  });

  // Создаем package.json для деплоя
  const packageJson = {
    name: 'vhm24-error-fixing-system',
    version: '1.0.0',
    description: 'Система исправления ошибок для проекта VHM24',
    main: 'fix-all-errors.js',
    scripts: {
      analyze: 'node scripts/project-analyzer.js',
      fix: 'node scripts/auto-fixer.js',
      'test-fixes': 'node scripts/test-after-fixes.js',
      'fix-all': 'node fix-all-errors.js',
      setup: 'node setup-error-fixing-system.js'
    },
    dependencies: {
      glob: '^10.3.10',
      'node-fetch': '^3.3.2',
      tap: '^18.5.0',
      pino: '^8.16.0',
      fastify: '^4.24.0',
      '@fastify/jwt': '^7.2.4'
    },
    author: 'VHM24 Team',
    license: 'MIT'
  };

  fs.writeFileSync(
    path.join(deployDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  log('✅ Создан package.json', 'green');

  // Создаем README.md для деплоя
  const readme = `# VHM24 Система исправления ошибок

## Обзор

Эта система предназначена для автоматического анализа и исправления ошибок в проекте VHM24.

## Установка

\`\`\`bash
npm install
npm run setup
\`\`\`

## Использование

\`\`\`bash
# Полный процесс
npm run fix-all

# Пошаговый процесс
npm run analyze   # Анализ проекта
npm run fix       # Исправление проблем
npm run test-fixes # Тестирование
\`\`\`

## Документация

Подробная документация доступна в директории \`docs\`.
`;

  fs.writeFileSync(path.join(deployDir, 'README.md'), readme);
  log('✅ Создан README.md', 'green');

  // Создаем .gitignore для деплоя
  const gitignore = `node_modules/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage/
dist/
build/
.idea/
.vscode/
*.sublime-project
*.sublime-workspace
.project
.classpath
.c9/
*.launch
.settings/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.vercel
.next/
out/
backup.json
analysis-report.json
fix-report.json
`;

  fs.writeFileSync(path.join(deployDir, '.gitignore'), gitignore);
  log('✅ Создан .gitignore', 'green');

  // Создаем архив (без использования внешних команд)
  try {
    log('\n📦 Создание архива...', 'cyan');

    const archiveName = `vhm24-error-fixing-system-${new Date().toISOString().split('T')[0]}`;

    // Создаем директорию для архива, если она не существует
    const archiveDir = path.join(process.cwd(), archiveName);
    ensureDirectoryExists(archiveDir);

    // Копируем все файлы из deploy в архивную директорию
    const copyDirRecursive = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });

      entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          ensureDirectoryExists(destPath);
          copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    };

    copyDirRecursive(deployDir, archiveDir);

    log(`\n✅ Архив создан: ${archiveName}`, 'green');
    log(`📁 Путь к архиву: ${archiveDir}`, 'green');
  } catch (error) {
    log(`\n❌ Ошибка при создании архива: ${error.message}`, 'red');
  }

  // Завершение
  if (allCopied) {
    log('\n🎉 ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!', 'bright');
    log(`📁 Все файлы скопированы в директорию: ${deployDir}`, 'green');
  } else {
    log('\n⚠️ ДЕПЛОЙ ЗАВЕРШЕН С ОШИБКАМИ!', 'yellow');
    log('Некоторые файлы не были скопированы. Проверьте логи выше.', 'yellow');
  }

  rl.close();
}

// Запуск деплоя
deploySystem().catch(error => {
  log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
  rl.close();
});
