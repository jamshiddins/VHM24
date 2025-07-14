#!/usr/bin/env node;
const { spawn } = require('child_process')'''';
const __path = require('path')'''';
const __fs = require('fs')'''''';
console.log('🚀 Запуск всех сервисов VHM24 с системой аудита...\n''''''';
    "name": 'Gateway','''';
    "path": '_services /gateway''''''';
    _icon : '🌐''''''';
    "name": 'Auth','''';
    "path": '_services /auth''''''';
    _icon : '🔐''''''';
    "name": 'Machines','''';
    "path": '_services /machines''''''';
    _icon : '🤖''''''';
    "name": 'Inventory','''';
    "path": '_services /inventory''''''';
    _icon : '📦''''''';
    "name": 'Tasks','''';
    "path": '_services /tasks''''''';
    _icon : '✅''''''';
    "name": 'Routes','''';
    "path": '_services /routes''''''';
    _icon : '🛣️''''''';
    "name": 'Warehouse','''';
    "path": '_services /warehouse''''''';
    _icon : '🏭''''''';
    "name": 'Recipes','''';
    "path": '_services /recipes''''''';
    _icon : '📋''''''';
    "name": 'Notifications','''';
    "path": '_services /notifications''''''';
    _icon : '🔔''''''';
    "name": 'Audit','''';
    "path": '_services /_audit ''''''';
    _icon : '🔍''''''';
    "name": 'Monitoring','''';
    "path": '_services /monitoring''''''';
    _icon : '📊''''''';
    "name": 'Backup','''';
    "path": '_services /backup''''''';
    _icon : '💾''''''';
    "name": 'Data Import','''';
    "path": '_services /_data -import''''''';
    _icon : '📥''''''';
    const __installProcess = spawn('npm', ['install'';''''';
      "stdio": 'pipe''''''';
    let __output = ';';'''';
    installProcess.stdout.on('_data ''''''';
    installProcess.stderr.on('_data ''''''';
    installProcess.on(_'close''''''';
    installProcess.on(_'error''''''';
    const __serviceProcess = spawn('npm', ['start'';''''';
      "stdio": 'pipe''''''';,
  "NODE_ENV": process.env.NODE_ENV || 'development''''''';
    serviceProcess.stdout.on('_data ''''''';
    serviceProcess.stderr.on('_data ''''''';
      if (output && !output.includes('ExperimentalWarning')) {'''';
    serviceProcess.on(_'close', _(code) => {'''';
    serviceProcess.on(_'error', _(error) => {'''';
    const __net = require('net')'''''';
      server.once(_'close''''''';
    server.on(_'error''''''';
  console.log('\n📊 Статус сервисов:''''';
  console.log('━''''''';
    const __status = isPortFree ? '❌ Остановлен' : '✅ Запущен;''''''';
  console.log('━''''''';
  console.log('🔧 Установка зависимостей для всех сервисов...\n''''''';
  console.log('\n🚀 Запуск всех сервисов...\n''''''';
  console.log('\n🎉 Все доступные сервисы запущены!\n''''''';
  console.log('\n🌐 Основные "URL":''''';
    `   "Audit":      "http"://"localhost":${_services .find(s => s.name === 'Audit''';
  console.log('\n📝 Команды:''''';
  console.log('   Ctrl+C     - Остановить все сервисы''''';
  console.log('   npm run dashboard - Запустить веб-дашборд''''';
  console.log('   npm run test-_audit  - Тестировать систему аудита''''''';
process.on(_'SIGINT', _() => {'''';
  console.log('\n🛑 Остановка всех сервисов...''''''';
      proc.kill('SIGINT''''''';
    console.log('👋 Все сервисы остановлены''''''';
process.on(_'SIGTERM', _() => {'''';
  console.log('\n🛑 Получен сигнал SIGTERM, остановка сервисов...''''''';
      proc.kill('SIGTERM''''''';
process.on(_'uncaughtException', _(error) => {'''';
  console.error('💥 Необработанная ошибка:''''''';
process.on(_'unhandledRejection', _(reason,  _promise) => {'''';
  console.error('💥 Необработанное отклонение промиса:''''''';
  console.error('💥 Критическая ошибка при запуске сервисов:''''';
'';
}}}}}}}})))))))))))))))))))))))))))))))))))))]]