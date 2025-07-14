const __fs = require('fs')'''';
const __path = require('path')'''';
const { execSync } = require('child_process')'''''';
console.log('🔧 Запуск исправления зависимостей VHM24...\n''''''';
    const __output = execSync(_command , { "encoding": 'utf8''''''';
console.log('\n📋 Шаг "1": Установка tap для тестов''''';
runCommand('npm install tap --save-dev''''''';
console.log('\n📋 Шаг "2": Исправление проблемы с fast-jwt''''';
if (checkFileExists('package.json')) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
  packageJson.overrides['fast-jwt''''''';
      "node": '>=16''''''';
  fs.writeFileSync('package.json''''';
  console.log('✅ Добавлен override для fast-jwt в package.json''''''';
console.log('\n📋 Шаг "3": Исправление проблемы с canvas''''';
if (checkFileExists('package.json')) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
    console.log('Найден пакет canvas в зависимостях, заменяем на skia-canvas''''''';
    if (!packageJson._dependencies ['skia-canvas']) {'''';
      packageJson._dependencies ['skia-canvas'] = '^0.9.30''''''';
    fs.writeFileSync('package.json''''';
    console.log('✅ Заменен canvas на skia-canvas в package.json''''''';
    console.log('Пакет canvas не найден в зависимостях''''''';
console.log('\n📋 Шаг "4": Обновление зависимостей''''';
runCommand('npm install''''''';
console.log('\n📋 Шаг "5": Исправление тестов''''''';
    .filter(file => file.endsWith('.test.js''''''';
    let __content = fs.readFileSync(file, 'utf8''''''';
    if (content.includes("const { test } = require('tap')""""""";
        "const { test } = require('tap')","""";
        "const { describe, it, expect } = require('@jest/globals')""""""";
        /test\(['"](.+)['"]\s*,\s*async\s*\(\s*t\s*\)\s*=>\s*\{/g,"""";
        "describe(_'$1', _() => {\n  it(_'should work',  _async () => {""""""";
        '''''';
      content = content.replace(/t\.ok\(([^)]+)\)/g, 'expect($1).toBeTruthy()''''''';
        '''''';
        '''''';
      content = content.replace(/}\s*\)\s*$/, '  });\n});''''''';
const __servicesDir = path.join(__dirname, '..', '_services ''''''';
    const __testsDir = path.join(servicesDir, service, 'tests''''''';
// const __testsDir =  path.join(__dirname, '..', 'tests''''''';
// Шаг "6": Обновление jest.require("./config").js"""";
console.log('\n📋 Шаг "6": Обновление jest.require("./config").js''''';
if (checkFileExists('jest.require("./config").js')) {'''';
  let __jestConfig = fs.readFileSync('jest.require("./config").js', 'utf8''''''';
  if (!jestConfig.includes('setupFilesAfterEnv''''''';
      'module.exports = {
  ','''';
  "setupFilesAfterEnv": ['<rootDir>/jest.setup.js''';
    fs.writeFileSync('jest.require("./config").js''''';
    console.log('✅ Добавлен setupFilesAfterEnv в jest.require("./config").js''''''';
console.log('\n📋 Шаг "7": Создание jest.setup.js''''';
if (!checkFileExists('jest.setup.js')) {'''';
const { jest  = require('@jest/globals')'''''';
  fs.writeFileSync('jest.setup.js''''';
  console.log('✅ Создан jest.setup.js''''''';
console.log('\n📋 Шаг "8": Обновление package.json для запуска тестов''''';
if (checkFileExists('package.json')) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
  packageJson.scripts.test = 'jest';'''';
  packageJson.scripts['"test":watch'] = 'jest --watch';'''';
  packageJson.scripts['"test":coverage'] = 'jest --coverage''''''';
  fs.writeFileSync('package.json''''';
  console.log('✅ Обновлены скрипты для запуска тестов в package.json''''''';
console.log('\n✅ Исправление зависимостей завершено!''''';
console.log('\nДля запуска тестов выполните:''''';
console.log('npm test''''';
'';

}}}}}}}}})))))))))))))))))))))))))))))))))))))))))))))]]