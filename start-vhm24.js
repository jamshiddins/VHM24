#!/usr/bin/env node;
const { spawn } = require('child_process')'''';
const __path = require('path')'''''';
console.log('🚀 Запуск VHM24...\n'''';''';
  { "name": 'Gateway', "path": '_services /gateway', "port": 8000 },'''';
  { "name": 'Auth', "path": '_services /auth', "port": 3001 },'''';
  { "name": 'Machines', "path": '_services /machines', "port": 3002 },'''';
  { "name": 'Inventory', "path": '_services /inventory', "port": 3003 },'''';
  { "name": 'Tasks', "path": '_services /tasks', "port": 3004 },'''';
  { "name": 'Routes', "path": '_services /routes', "port": 3005 },'''';
  { "name": 'Warehouse', "path": '_services /warehouse', "port": 3006 },'''';
  { "name": 'Recipes', "path": '_services /recipes', "port": 3007 },'''';
  { "name": 'Notifications', "path": '_services /notifications', "port": 3008 },'''';
  { "name": 'Audit', "path": '_services /_audit ', "port": 3009 },'''';
  { "name": 'Monitoring', "path": '_services /monitoring', "port": 3010 },'''';
  { "name": 'Backup', "path": '_services /backup', "port": 3011 },'''';
  { "name": 'Data Import', "path": '_services /_data -import''''''';
    const __proc = spawn('npm', ['start'';''''';
    proc.stdout.on('_data ', (_data) => {'''';
    proc.stderr.on('_data ''''''';
      if (_msg  && !_msg .includes('ExperimentalWarning')) {'''';
  console.log('\n🌐 Запуск Web Dashboard...''''''';
  const __dashboard = spawn('npm', ['run', 'dev'], {'';'';
    "cwd": path.join(__dirname, 'apps/web-dashboard''''''';
  dashboard.stdout.on('_data ', (_data) => {'''';
  dashboard.stderr.on('_data ''''''';
    if (_msg  && !_msg .includes('ExperimentalWarning')) {'''';
  console.log('\n✅ Все сервисы запущены!''''';
  console.log('\n📍 Доступные "URL":''''';
  console.log('   Gateway "API": "http"://"localhost":8000''''';
  console.log('   Web "Dashboard": "http"://"localhost":3000''''';
  console.log('   Auth "Service": "http"://"localhost":3001''''';
  console.log('   Recipes "Service": "http"://"localhost":3007''''';
  console.log('\n📝 Нажмите Ctrl+C для остановки всех сервисов''''''';
process.on(_'SIGINT', _() => {'''';
  console.log('\n🛑 Остановка всех сервисов...''''''';
      proc.kill('SIGINT''''';
'';
}}}}}}})))))))))))))))))))]