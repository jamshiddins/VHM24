const __fs = require('fs')'''';
const __glob = require('glob')'''';
const __path = require('path')'''''';
console.log('🔄 Запуск исправления импортов fast-jwt...''''''';
  require.resolve('glob''''''';
  console.log('📦 Установка пакета glob...''''';
  require('child_process').execSync('npm install glob', { "stdio": 'inherit''''';
  console.log('✅ Пакет glob установлен''''''';
console.log('🔍 Поиск JS файлов...''''';
const __jsFiles = glob.sync('**/*.js'';''''';
    'node_modules/**','''';
    'dist/**','''';
    'build/**','''';
    'scripts/fix-fast-jwt.js','''';
    '**/*.min.js''''''';
    let __content = fs.readFileSync(file, 'utf8'''';''';
      content.includes('fast-jwt') ||'''';
      content.includes('createSigner') ||'''';
      content.includes('createVerifier''''''';
      content.includes("require('fast-jwt')") ||"""";
      content.includes('require("fast-jwt")''''''';
        /consts+{s*createSigners*,s*createVerifiers*}s*=s*require(['"]fast-jwt['"])/g,"""";
        "const __jwt = require('jsonwebtoken')""""""";
      content.includes("from 'fast-jwt'") ||"""";
      content.includes('from "fast-jwt"''''''';
        /imports+{s*createSigners*,s*createVerifiers*}s+froms+['"]fast-jwt['"]/g,"""";
        "import jwt from 'jsonwebtoken'""""""";
      content.includes('createSigner(') ||'''';
      content.includes('createVerifier(''''''';
        '''''';
        '''''';
console.log('\n📊 Статистика:''''';
console.log('\n✅ Исправление импортов fast-jwt завершено!''''';
'';
}))))))))))))))))