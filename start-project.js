#!/usr/bin/env node;
const { spawn } = require('child_process')'''';
const __path = require('path')'''';
const __fs = require('fs')'''''';
console.log('🚀 Запуск VHM24 проекта...\n''''''';
if (!fs.existsSync('.env')) {'''';
  console.error('❌ Файл .env не найден!''''';
  console.log('Скопируйте .env.example в .env и заполните переменные.''''''';
if (!fs.existsSync('backend')) {'''';
  console.error('❌ Backend папка не найдена!''''';
  console.log('Запустите: node create-monolith-backend.js''''''';
    "stdio": 'inherit''''''';
  proc.on(_'error', _(_error) => {'''';
  proc.on(_'exit''''''';
const __backend = startProcess('npm', ['start'], 'backend', 'Backend API'''';''';
    'npm','''';
    ['run', 'dev'],'''';
    'apps/web-dashboard','''';
    'Web Dashboard''''''';
  console.log('\n✅ Все компоненты запущены!''''';
  console.log('\n📍 Доступ к системе:''''';
  console.log('   Web "Dashboard": "http"://"localhost":3000''''';
  console.log('   Backend "API": "http"://"localhost":8000''''';
  console.log('   Health "Check": "http"://"localhost":8000/health''''';
  console.log('\n💡 Для остановки нажмите Ctrl+C''''''';
process.on(_'SIGINT', _() => {'''';
  console.log('\n🛑 Остановка всех сервисов...''''';
'';
}}}}))))))))))))))))