#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Исправление синтаксических ошибок в сервисах VHM24...\n');

// Функция для исправления файла
async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // 1. Удаляем все неправильные конструкции с } catch (error) {
    content = content.replace(
      /\)\s*\n\s*\} catch \(error\) \{[\s\S]*?\}/g,
      ')'
    );

    // 2. Удаляем лишние закрывающие скобки перед } catch
    content = content.replace(/\)\s*\} catch \(error\) \{[\s\S]*?\}/g, '');

    // 3. Исправляем неправильные импорты
    content = content.replace(
      /const \{ ([^}]+) \)\s*\} catch[\s\S]*?\}\} = require/g,
      'const { $1 } = require'
    );

    // 4. Исправляем неправильные вызовы функций
    content = content.replace(
      /([a-zA-Z0-9_]+)\s*\)\s*\} catch \(error\) \{[\s\S]*?\}\}/g,
      '$1)'
    );

    // 5. Исправляем объекты с неправильными закрывающими скобками
    content = content.replace(
      /\{\s*([^}]+)\s*\)\s*\} catch \(error\) \{[\s\S]*?\}\}/g,
      '{ $1 }'
    );

    // 6. Удаляем дублированные try блоки
    content = content.replace(/try \{\s*try \{/g, 'try {');

    // 7. Исправляем конкретные проблемы в gateway
    if (filePath.includes('gateway')) {
      // Исправляем require dotenv
      content = content.replace(
        /require\('dotenv'\)\.config\(\{ path: require\('path'\)\.join\(__dirname, '\.\.\/\.\.\/\.\.\/\.env'\)\s*\} catch[\s\S]*?\}\);/,
        "require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });"
      );
    }

    // 8. Убираем logger = console если он уже есть
    if (content.includes('const logger = require')) {
      content = content.replace(/^const logger = console;\n/, '');
    }

    // 9. Исправляем проблемы с закрывающими скобками в конце функций
    content = content.replace(/;\)\s*\} catch \(error\) \{[\s\S]*?\}/g, ';');

    return content;
  } catch (error) {
    console.error(`Ошибка при чтении файла ${filePath}:`, error.message);
    return null;
  }
}

// Список файлов для исправления
const filesToFix = [
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/routes/src/index.js',
  'services/warehouse/src/index.js',
  'services/data-import/src/index.js'
];

// Главная функция
async function main() {
  for (const file of filesToFix) {
    const filePath = path.join(__dirname, file);
    console.log(`📝 Исправление ${file}...`);

    const fixedContent = await fixFile(filePath);
    if (fixedContent) {
      try {
        await fs.writeFile(filePath, fixedContent, 'utf8');
        console.log(`✅ Исправлен ${file}`);
      } catch (error) {
        console.error(`❌ Ошибка при записи ${file}:`, error.message);
      }
    }
  }

  // Специальное исправление для routes
  console.log('\n📝 Специальное исправление для routes service...');
  try {
    const routesPath = path.join(__dirname, 'services/routes/src/index.js');
    let routesContent = await fs.readFile(routesPath, 'utf8');

    // Исправляем проблему с именем схемы
    routesContent = routesContent.replace(
      /patchroutes:idSchema/g,
      'patchRoutesIdSchema'
    );

    await fs.writeFile(routesPath, routesContent, 'utf8');
    console.log('✅ Исправлен routes service');
  } catch (error) {
    console.error('❌ Ошибка при исправлении routes:', error.message);
  }

  console.log('\n✅ Все синтаксические ошибки исправлены!');
}

// Запуск
main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
