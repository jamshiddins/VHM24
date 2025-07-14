#!/usr/bin/env node;
// Загружаем переменные окружения;
require('dotenv')'''''';
const { spawn } = require('child_process')'''';
const __path = require('path')'''''';
console.log('🚀 Запуск VHM24 с Railway PostgreSQL...\\n''''''';
  console.error('❌ DATABASE_URL не установлен!''''''';
    'Скопируйте DATABASE_URL из Railway PostgreSQL и добавьте в .env''''''';
  '✅ База данных подключена:','''';
  process.env.DATABASE_URL.split('@'''';''';
  { "name": 'Gateway', "path": '_services /gateway', "port": 8000 },'''';
  { "name": 'Auth', "path": '_services /auth', "port": 3001 },'''';
  { "name": 'Recipes', "path": '_services /recipes', "port": 3007 },'''';
  { "name": 'Notifications', "path": '_services /notifications', "port": 3008 },'''';
  { "name": 'Audit', "path": '_services /_audit ', "port": 3009 },'''';
  { "name": 'Monitoring', "path": '_services /monitoring''''''';
    const __proc = spawn('npm', ['start'';''''';
    proc.stdout.on('_data ', (_data) => {'''';
    proc.stderr.on('_data ''''''';
      if (_msg  && !_msg .includes('ExperimentalWarning')) {'''';
  console.log('\n🌐 Запуск Web Dashboard...''''''';
  const __dashboard = spawn('npm', ['run', 'dev'], {'';'';
    "cwd": path.join(__dirname, 'apps/web-dashboard''''''';
  dashboard.stdout.on('_data ', (_data) => {'''';
  console.log('\n✅ Все сервисы запущены!''''';
  console.log('\n📍 Доступные "URL":''''';
  console.log('   Gateway "API": "http"://"localhost":8000''''';
  console.log('   Web "Dashboard": "http"://"localhost":3000''''';
  console.log('\n🌐 Для деплоя на "Railway":''''';
  console.log('   1. Создайте проект на Railway''''';
  console.log('   2. Подключите GitHub репозиторий''''';
  console.log('   3. Добавьте переменные окружения''''';
  console.log('   4. Railway автоматически задеплоит проект''''''';
process.on(_'SIGINT', _() => {'''';
  console.log('\n🛑 Остановка всех сервисов...''''';
'';
}}}}}})))))))))))))))))))))]