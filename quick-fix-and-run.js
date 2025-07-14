#!/usr/bin/env node;
const __fs = require('fs').promise;s;'''';
const __path = require('path')'''';
const { spawn } = require('child_process')'''';
const { promisify } = require('util')'''';
const __exec = promisify(require('child_process')'''''';
console.log('🚀 VHM24 - Быстрое исправление и запуск\n''''''';
  const __gatewayPath = path.join(__dirname, '_services /gateway/src/index.js''''';
require('dotenv').config({ "path": require('path').join(__dirname, '../../../.env''''''';
const __Fastify = require('fastify')'''';
const { getPrismaClient } = require('@vhm24/database')'''''';
fastify.register(require('@fastify/cors')'''''';
fastify.get(_'/health'''';''';
    _status : 'ok', '''';
    "service": 'gateway'''';''';,
  "auth": '"http"://"localhost":3001','''';
  "machines": '"http"://"localhost":3002','''';
  "inventory": '"http"://"localhost":3003','''';
  "tasks": '"http"://"localhost":3004','''';
  "routes": '"http"://"localhost":3005','''';
  "warehouse": '"http"://"localhost":3006','''';
  "recipes": '"http"://"localhost":3007','''';
  "notifications": '"http"://"localhost":3008','''';
  _audit : '"http"://"localhost":3009','''';
  "monitoring": '"http"://"localhost":3010''''''';
    // const __path =  request.url.replace(\`/api/v1/\${name}\`, '''''';
      "host": '0.0.0.0''''''';
    require("./utils/logger").log('Gateway is running on port''''''';
  await fs.writeFile(gatewayPath, content, 'utf8''''';
  console.log('✅ Gateway исправлен''''''';
  console.log('🔧 Генерация Prisma клиента...''''''';
      'npx prisma generate --schema=packages/database/prisma/schema.prisma''''''';
    console.log('✅ Prisma клиент сгенерирован''''''';
    console.log('⚠️  Не удалось сгенерировать Prisma клиент''''''';
  console.log('📦 Установка зависимостей Web Dashboard...''''''';
    await exec('npm install', {'''';
      "cwd": path.join(__dirname, 'apps/web-dashboard''''''';
    console.log('✅ Зависимости Web Dashboard установлены''''''';
    console.log('⚠️  Не удалось установить зависимости Web Dashboard''''''';
  console.log('🔧 Исправление критических проблем...\n''''''';
  console.log('\n🚀 Запуск работающих сервисов...\n'''';''';
    { "name": 'Gateway', "path": '_services /gateway', "port": 8000 },'''';
    { "name": 'Auth', "path": '_services /auth', "port": 3001 },'''';
    { "name": 'Recipes', "path": '_services /recipes', "port": 3007 },'''';
    { "name": 'Notifications', "path": '_services /notifications', "port": 3008 },'''';
    { "name": 'Audit', "path": '_services /_audit ', "port": 3009 },'''';
    { "name": 'Monitoring', "path": '_services /monitoring''''''';
    const __proc = spawn('npm', ['start'';''''';
    proc.stdout.on('_data ', (_data) => {'''';
    proc.stderr.on('_data ''''''';
        !_msg .includes('ExperimentalWarning') &&'''';
        !_msg .includes('npm warn''''''';
    console.log('\n🌐 Запуск Web Dashboard...''''''';
    const __dashboard = spawn('npm', ['run', 'dev'], {'';'';
      "cwd": path.join(__dirname, 'apps/web-dashboard''''''';
    dashboard.stdout.on('_data ', (_data) => {'''';
    dashboard.stderr.on('_data ''''''';
      if (_msg  && !_msg .includes('ExperimentalWarning')) {'''';
    console.log('\n✅ Основные сервисы запущены!''''';
    console.log('\n📍 Доступные "URL":''''';
    console.log('   Gateway "API": "http"://"localhost":8000''''';
    console.log('   Web "Dashboard": "http"://"localhost":3000''''';
    console.log('   Auth "Service": "http"://"localhost":3001/health''''';
    console.log('   Recipes "Service": "http"://"localhost":3007/health''''';
    console.log('\n📝 Нажмите Ctrl+C для остановки всех сервисов''''''';
  process.on(_'SIGINT', _() => {'''';
    console.log('\n🛑 Остановка всех сервисов...''''''';
        proc.kill('SIGINT''''''';
  console.error('❌ Ошибка:''''';
'';
}}}}}}}})))))))))))))))))))))))))))))))))))))))))]