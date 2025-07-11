#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Исправление синтаксических ошибок во всех сервисах...\n');

const fixes = [
  {
    service: 'gateway',
    file: 'src/index.js',
    line: 9,
    issue: 'missing ) after argument list',
    fix: async content => {
      // Найти строку с ошибкой и исправить
      const lines = content.split('\n');
      // Ищем паттерн с try-catch блоком
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          // Проверяем предыдущую строку на отсутствие закрывающей скобки
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'machines',
    file: 'src/index.js',
    line: 9,
    issue: 'missing ) after argument list',
    fix: async content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'inventory',
    file: 'src/index.js',
    line: 8,
    issue: 'missing ) after argument list',
    fix: async content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'tasks',
    file: 'src/index.js',
    line: 8,
    issue: 'missing ) after argument list',
    fix: async content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'routes',
    file: 'src/index.js',
    line: 233,
    issue: 'Missing initializer in const declaration',
    fix: async content => {
      // Исправить const patchroutes:idSchema = {
      return content.replace(
        /const patchroutes:idSchema = {/g,
        'const patchRoutesIdSchema = {'
      );
    }
  },
  {
    service: 'warehouse',
    file: 'src/index.js',
    line: 8,
    issue: 'missing ) after argument list',
    fix: async content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'data-import',
    file: 'src/index.js',
    line: 10,
    issue: 'missing ) after argument list',
    fix: async content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} catch (error) {') && i > 0) {
          if (
            !lines[i - 1].trim().endsWith(');') &&
            !lines[i - 1].trim().endsWith(')')
          ) {
            lines[i - 1] = lines[i - 1] + ')';
          }
        }
      }
      return lines.join('\n');
    }
  },
  {
    service: 'recipes',
    file: 'src/index.js',
    issue: 'logger.info is not a function',
    fix: async content => {
      // Добавить определение logger в начало файла если его нет
      if (!content.includes('const logger = require')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        // Найти место после require statements
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes('require(') ||
            lines[i].includes('const fastify')
          ) {
            insertIndex = i + 1;
          } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            break;
          }
        }

        lines.splice(insertIndex, 0, 'const logger = console;');
        return lines.join('\n');
      }
      return content
        .replace(/logger\.info/g, 'console.log')
        .replace(/logger\.error/g, 'console.error');
    }
  },
  {
    service: 'notifications',
    file: 'src/index.js',
    issue: 'logger is not defined',
    fix: async content => {
      if (!content.includes('const logger = require')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes('require(') ||
            lines[i].includes('const fastify')
          ) {
            insertIndex = i + 1;
          } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            break;
          }
        }

        lines.splice(insertIndex, 0, 'const logger = console;');
        return lines.join('\n');
      }
      return content;
    }
  },
  {
    service: 'audit',
    file: 'src/index.js',
    issue: 'logger is not defined',
    fix: async content => {
      if (!content.includes('const logger = require')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes('require(') ||
            lines[i].includes('const fastify')
          ) {
            insertIndex = i + 1;
          } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            break;
          }
        }

        lines.splice(insertIndex, 0, 'const logger = console;');
        return lines.join('\n');
      }
      return content;
    }
  },
  {
    service: 'monitoring',
    file: 'src/index.js',
    issue: 'logger is not defined',
    fix: async content => {
      if (!content.includes('const logger = require')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes('require(') ||
            lines[i].includes('const fastify')
          ) {
            insertIndex = i + 1;
          } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            break;
          }
        }

        lines.splice(insertIndex, 0, 'const logger = console;');
        return lines.join('\n');
      }
      return content;
    }
  },
  {
    service: 'backup',
    file: 'src/index.js',
    issue: 'logger is not defined',
    fix: async content => {
      if (!content.includes('const logger = require')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes('require(') ||
            lines[i].includes('const fastify')
          ) {
            insertIndex = i + 1;
          } else if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            break;
          }
        }

        lines.splice(insertIndex, 0, 'const logger = console;');
        return lines.join('\n');
      }
      return content;
    }
  },
  {
    service: 'auth',
    file: 'src/index.js',
    issue: 'logger.error is not a function',
    fix: async content => {
      // Заменить logger.error на console.error
      return content
        .replace(/logger\.error/g, 'console.error')
        .replace(/logger\.info/g, 'console.log');
    }
  }
];

async function fixService(fix) {
  try {
    const filePath = path.join(__dirname, 'services', fix.service, fix.file);

    // Проверить существование файла
    try {
      await fs.access(filePath);
    } catch {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }

    // Прочитать содержимое файла
    let content = await fs.readFile(filePath, 'utf8');

    // Применить исправление
    const fixedContent = await fix.fix(content);

    // Записать исправленное содержимое
    await fs.writeFile(filePath, fixedContent, 'utf8');

    console.log(`✅ Исправлен ${fix.service}/${fix.file} - ${fix.issue}`);
  } catch (error) {
    console.error(`❌ Ошибка при исправлении ${fix.service}: ${error.message}`);
  }
}

async function fixAllServices() {
  console.log('🔍 Начинаю исправление синтаксических ошибок...\n');

  // Исправить все сервисы
  for (const fix of fixes) {
    await fixService(fix);
  }

  console.log('\n✅ Все исправления применены!');
  console.log('\n📝 Теперь запустите сервисы командой:');
  console.log('   node start-all-services-with-audit.js');
}

// Запуск
fixAllServices().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
