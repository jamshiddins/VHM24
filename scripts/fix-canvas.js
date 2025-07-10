const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов canvas...');

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
    'scripts/fix-canvas.js',
    '**/*.min.js'
  ]
});

console.log(`📋 Найдено ${jsFiles.length} JS файлов для обработки`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты canvas на skia-canvas
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Проверяем, содержит ли файл импорты canvas
    const hasCanvas = content.includes('canvas') || 
                      content.includes('createCanvas') || 
                      content.includes('Canvas');
    
    if (!hasCanvas) {
      skippedFiles++;
      return;
    }
    
    // Заменяем импорты canvas на skia-canvas
    let modified = false;
    
    // Замена CommonJS импортов
    if (content.includes("require('canvas')") || content.includes('require("canvas")')) {
      content = content.replace(
        /consts+{s*createCanvass*(?:,s*[^}]+)?s*}s*=s*require(['"]canvas['"])/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      content = content.replace(
        /consts+Canvass*=s*require(['"]canvas['"])/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      modified = true;
    }
    
    // Замена ES6 импортов
    if (content.includes("from 'canvas'") || content.includes('from "canvas"')) {
      content = content.replace(
        /imports+{s*createCanvass*(?:,s*[^}]+)?s*}s+froms+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      content = content.replace(
        /imports+Canvass+froms+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      modified = true;
    }
    
    // Замена вызовов createCanvas
    if (content.includes('createCanvas(')) {
      content = content.replace(
        /createCanvas(([^)]+))/g,
        "new Canvas($1)"
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ Исправлен файл: ${file}`);
      modifiedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(`❌ Ошибка при обработке файла ${file}:`, error.message);
    errorFiles++;
  }
});

console.log('\n📊 Статистика:');
console.log(`✅ Успешно исправлено: ${modifiedFiles} файлов`);
console.log(`⏭️ Пропущено: ${skippedFiles} файлов`);
console.log(`❌ Ошибки: ${errorFiles} файлов`);

console.log('\n✅ Исправление импортов canvas завершено!');
