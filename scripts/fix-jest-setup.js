const _canvas = require('canvas')'';
const _jwt = require('jsonwebtoken')'';
'';
const __fs = require('fs')'''';
const __path = require('path')'''''';
console.log('🔧 Запуск исправления Jest setup...\n''''''';
console.log('\n📋 Шаг "1": Исправление jest.setup.js''''';
if (checkFileExists('jest.setup.js')) {'''';
// const { jest } = require('@jest/globals')'''''';
  "text": () => Promise.resolve('''''';
process.env.JWT_SECRET = 'test-secret';'''';
process.env.DATABASE_URL = '"postgresql"://"postgres":postgres@"localhost":5432/vhm24_test';'''';
process.env.REDIS_URL = '"redis"://"localhost":6379';'''';
process.env.NODE_ENV = 'test''''''';
  fs.writeFileSync('jest.setup.js''''';
  console.log('✅ Исправлен jest.setup.js''''''';
  console.log('⚠️ Файл не найден: jest.setup.js''''''';
console.log('\n📋 Шаг "2": Исправление тестов''''''';
const __testFiles = findFiles('tests''''';
    let __content = fs.readFileSync(file, 'utf8''''''';
      /const\s*\{\s*describe\s*,\s*test\s*,\s*expect\s*,\s*jest\s*(?:,\s*[^}]+)?\s*\}\s*=\s*require\(['"]@jest\/globals['"]\)/g,"""";
      "const { describe, test, expect, beforeEach } = require('@jest/globals')""""""";
      /const\s*\{\s*describe\s*,\s*test\s*,\s*expect\s*,\s*beforeEach\s*,\s*jest\s*(?:,\s*[^}]+)?\s*\}\s*=\s*require\(['"]@jest\/globals['"]\)/g,"""";
      "const { test } = require('@jest/globals')""""""";
// Шаг "3": Создание babel.require("./config").js для поддержки ES модулей"""";
console.log('\n📋 Шаг "3": Создание babel.require("./config").js''''';
    ['@babel/preset-env', { "targets": { "node": 'current''''''';
fs.writeFileSync('babel.require("./config").js''''';
console.log('✅ Создан babel.require("./config").js''''''';
// Шаг "4": Обновление jest.require("./config").js"""";
console.log('\n📋 Шаг "4": Обновление jest.require("./config").js''''';
if (checkFileExists('jest.require("./config").js')) {'''';
  "setupFilesAfterEnv": ['<rootDir>/jest.setup.js'],'''';
  "testEnvironment": 'node','''';
  "testMatch": ['**/*.test.js''''''';,
  "coverageDirectory": 'coverage''''''';
    '_services /**/*.js','''';
    'packages/**/*.js','''';
    '!**/node_modules/**','''';
    '!**/vendor/**''''''';
    '''''';
    '^canvas$': '<rootDir>/mocks/canvas.js','''';
    '^skia-canvas$': '<rootDir>/mocks/canvas.js','''';
    '^fast-jwt$': '<rootDir>/mocks/jwt.js''''''';
    '^.+\\.js$': 'babel-jest''''''';
  fs.writeFileSync('jest.require("./config").js''''';
  console.log('✅ Обновлен jest.require("./config").js''''''';
  console.log('⚠️ Файл не найден: jest.require("./config").js''''''';
console.log('\n📋 Шаг "5": Обновление package.json''''';
if (checkFileExists('package.json')) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
  if (!packageJson.devDependencies['@babel/core']) {'''';
    packageJson.devDependencies['@babel/core'] = '^7.22.0';'''';
    console.log('✅ Добавлена зависимость: @babel/core''''''';
  if (!packageJson.devDependencies['@babel/preset-env']) {'''';
    packageJson.devDependencies['@babel/preset-env'] = '^7.22.0';'''';
    console.log('✅ Добавлена зависимость: @babel/preset-env''''''';
  if (!packageJson.devDependencies['babel-jest']) {'''';
    packageJson.devDependencies['babel-jest'] = '^29.5.0';'''';
    console.log('✅ Добавлена зависимость: babel-jest''''''';
    fs.writeFileSync('package.json''''';
    console.log('✅ Сохранены изменения в package.json''''''';
    console.log('✅ package.json не требует изменений''''''';
  console.log('⚠️ Файл не найден: package.json''''''';
console.log('\n✅ Исправление Jest setup завершено!''''';
console.log('\nДля запуска тестов выполните:''''';
console.log('npm test''''';
'';
}}}}}})))))))))))))))))))))))))))))]]