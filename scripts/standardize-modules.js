const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск стандартизации модульной системы (CommonJS)...\n');

// Проверка наличия glob
try {
  require.resolve('glob');
} catch (e) {
  console.log('📦 Установка пакета glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('✅ Пакет glob установлен');
}

// Находим все JS файлы в проекте
console.log('🔍 Поиск JS файлов...');
const jsFiles = glob.sync('**/*.js', {
  ignore: [
    'node_modules/**', 
    'dist/**', 
    'build/**', 
    'scripts/standardize-modules.js',
    '**/*.min.js'
  ]
});

console.log(`📋 Найдено ${jsFiles.length} JS файлов для обработки`);

// Счетчики для статистики
let convertedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Конвертируем ES6 импорты/экспорты в CommonJS
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;
    
    // Проверяем, содержит ли файл ES6 импорты/экспорты
    const hasES6Imports = /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"]/g.test(content);
    const hasES6Exports = /export\s+(?:default\s+\w+|const|let|var|function|class)/g.test(content);
    
    if (!hasES6Imports && !hasES6Exports) {
      skippedFiles++;
      return;
    }
    
    // Заменяем import на require
    content = content.replace(
      /import\s+(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
      (match, imports, source) => {
        modified = true;
        if (imports.startsWith('{') && imports.endsWith('}')) {
          // Деструктуризация: import { a, b } from 'module'
          const items = imports.slice(1, -1).split(',').map(item => item.trim());
          return `const { ${items.join(', ')} } = require('${source}')`;
        } else if (imports.startsWith('*')) {
          // Импорт всего модуля: import * as name from 'module'
          const name = imports.replace(/\*\s+as\s+/, '').trim();
          return `const ${name} = require('${source}')`;
        } else {
          // Простой импорт: import name from 'module'
          return `const ${imports} = require('${source}')`;
        }
      }
    );
    
    // Заменяем export default на module.exports
    content = content.replace(
      /export\s+default\s+(\w+)/g,
      (match, name) => {
        modified = true;
        return `module.exports = ${name}`;
      }
    );
    
    // Заменяем именованные экспорты
    const namedExports = [];
    content = content.replace(
      /export\s+(const|let|var|function|class)\s+(\w+)/g,
      (match, type, name) => {
        modified = true;
        namedExports.push(name);
        return `${type} ${name}`;
      }
    );
    
    // Добавляем module.exports для именованных экспортов
    if (namedExports.length > 0) {
      modified = true;
      // Проверяем, есть ли уже module.exports в файле
      if (content.includes('module.exports =')) {
        // Если есть, добавляем именованные экспорты к существующему module.exports
        content = content.replace(
          /module\.exports\s*=\s*([^;]+)/,
          (match, exports) => {
            // Если exports это объект, добавляем свойства
            if (exports.trim().startsWith('{') && exports.trim().endsWith('}')) {
              const objectContent = exports.trim().slice(1, -1).trim();
              const properties = objectContent ? objectContent.split(',').map(p => p.trim()) : [];
              properties.push(...namedExports);
              return `module.exports = { ${properties.join(', ')} }`;
            } else {
              // Если exports это не объект, создаем новый объект
              return `module.exports = { ${exports.trim()}, ${namedExports.join(', ')} }`;
            }
          }
        );
      } else {
        // Если нет, добавляем новый module.exports
        content += `\nmodule.exports = { ${namedExports.join(', ')} };\n`;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ Стандартизирован файл: ${file}`);
      convertedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(`❌ Ошибка при обработке файла ${file}:`, error.message);
    errorFiles++;
  }
});

console.log('\n📊 Статистика:');
console.log(`✅ Успешно конвертировано: ${convertedFiles} файлов`);
console.log(`⏭️ Пропущено: ${skippedFiles} файлов`);
console.log(`❌ Ошибки: ${errorFiles} файлов`);

console.log('\n✅ Стандартизация модульной системы завершена!');
