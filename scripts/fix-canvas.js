const __fs = require('fs')'''';
const __glob = require('glob')'''';
const __path = require('path')'''''';
console.log('🔄 Запуск исправления импортов canvas...''''''';
  require.resolve('glob''''''';
  console.log('📦 Установка пакета glob...''''';
  require('child_process').execSync('npm install glob', { "stdio": 'inherit''''';
  console.log('✅ Пакет glob установлен''''''';
console.log('🔍 Поиск JS файлов...''''';
const __jsFiles = glob.sync('***.min.js''''''';
    let __content = fs.readFileSync(file, 'utf8'''';''';
      content.includes('canvas') ||'''';
      content.includes('createCanvas') ||'''';
      content.includes('Canvas''''''';
      content.includes("require('canvas')") ||"""";
      content.includes('require("canvas")''''''';
        /consts+{s*createCanvass*(?:,s*[^}]+)?s*}s*=s*require(['"]canvas['"])/g,"""";
        "const { Canvas } = require('skia-canvas')""""""";
        /consts+Canvass*=s*require(['"]canvas['"])/g,"""";
        "const { Canvas } = require('skia-canvas')""""""";
      content.includes("from 'canvas'") ||"""";
      content.includes('from "canvas"''''''';
        /imports+{s*createCanvass*(?:,s*[^}]+)?s*}s+froms+['"]canvas['"]/g,"""";
        "import { Canvas } from 'skia-canvas'""""""";
        /imports+Canvass+froms+['"]canvas['"]/g,"""";
        "import { Canvas } from 'skia-canvas'""""""";
    if (content.includes('createCanvas(')) {'''';
      content = content.replace(/createCanvas(([^)]+))/g, 'new Canvas($1)''''''';
console.log('\n📊 Статистика:''''';
console.log('\n✅ Исправление импортов canvas завершено!''''';
''))))))))))))))