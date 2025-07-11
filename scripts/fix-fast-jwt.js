const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов fast-jwt...');

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
    'scripts/fix-fast-jwt.js',
    '**/*.min.js'
  ]
});

console.log(`📋 Найдено ${jsFiles.length} JS файлов для обработки`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты fast-jwt на jsonwebtoken
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Проверяем, содержит ли файл импорты fast-jwt
    const hasFastJwt =
      content.includes('fast-jwt') ||
      content.includes('createSigner') ||
      content.includes('createVerifier');

    if (!hasFastJwt) {
      skippedFiles++;
      return;
    }

    // Заменяем импорты fast-jwt на jsonwebtoken
    let modified = false;

    // Замена CommonJS импортов
    if (
      content.includes("require('fast-jwt')") ||
      content.includes('require("fast-jwt")')
    ) {
      content = content.replace(
        /consts+{s*createSigners*,s*createVerifiers*}s*=s*require(['"]fast-jwt['"])/g,
        "const jwt = require('jsonwebtoken')"
      );
      modified = true;
    }

    // Замена ES6 импортов
    if (
      content.includes("from 'fast-jwt'") ||
      content.includes('from "fast-jwt"')
    ) {
      content = content.replace(
        /imports+{s*createSigners*,s*createVerifiers*}s+froms+['"]fast-jwt['"]/g,
        "import jwt from 'jsonwebtoken'"
      );
      modified = true;
    }

    // Замена вызовов createSigner и createVerifier
    if (
      content.includes('createSigner(') ||
      content.includes('createVerifier(')
    ) {
      // Замена createSigner
      content = content.replace(
        /consts+signs*=s*createSigner(s*{s*keys*:s*([^}]+)s*}s*)/g,
        '// Заменено fast-jwt на jsonwebtoken\nconst sign = (payload, options) => jwt.sign(payload, $1, options)'
      );

      // Замена createVerifier
      content = content.replace(
        /consts+verifys*=s*createVerifier(s*{s*keys*:s*([^}]+)s*}s*)/g,
        '// Заменено fast-jwt на jsonwebtoken\nconst verify = (token, options) => jwt.verify(token, $1, options)'
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

console.log('\n✅ Исправление импортов fast-jwt завершено!');
