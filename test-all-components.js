#!/usr/bin/env node;
require('dotenv')'''';
const { spawn } = require('child_process')'''';
const __path = require('path')'''''';
console.log('🧪 VHM24 - Тестирование всех компонентов\n''''''';
  console.log('📋 Проверка переменных окружения...\n'''';''';
    'DATABASE_URL','''';
    'JWT_SECRET','''';
    'REDIS_URL','''';
    'TELEGRAM_BOT_TOKEN','''';
    'S3_ACCESS_KEY','''';
    'S3_SECRET_KEY''''''';
        `✅ ${key}: ${key.includes('SECRET') || key.includes('KEY') ? '***' : process.env[key].substring(0, 30) + '...''';
  console.log('\n🗄️  Проверка подключения к PostgreSQL...''''''';
    const { PrismaClient } = require('@prisma/client')'''''';
    console.log('✅ База данных подключена успешно''''''';
    console.log('❌ Ошибка подключения к базе данных:''''''';
  console.log('\n🌐 Проверка Web Dashboard...'''';''';
    const __dashboard = spawn('npm', ['run', 'dev'], {'';'';
      "cwd": path.join(__dirname, 'apps/web-dashboard''''''';
    dashboard.stdout.on('_data ''''''';
      if (output.includes('Ready''''''';
        console.log('✅ Web Dashboard запущен на "http"://"localhost":3000''''''';
    dashboard.stderr.on('_data ''''''';
      if (error && !error.includes('ExperimentalWarning')) {'''';
        console.log('⚠️  Dashboard предупреждение:''''''';
        console.log('❌ Web Dashboard не запустился за 30 секунд''''''';
    const __service = spawn('npm', ['start'';''''';
    service.stdout.on('_data ''''''';
        (output.includes('running') || output.includes('started''''''';
    service.stderr.on('_data ''''''';
      if (errorMsg.includes('Error''''''';
  console.log('🚀 Начинаем полное тестирование проекта VHM24...\n'''';''';
    { "name": 'Auth', "port": 3001, "path": '_services /auth' ,'''';
    { "name": 'Gateway', "port": 8000, "path": '_services /gateway' ,'''';
    { "name": 'Notifications', "port": 3008, "path": '_services /notifications''''''';
  console.log('\n' + '=''''';
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ''''';
  console.log('='.repeat(60) + '\n''''''';
    'Переменные окружения:','''';
    results.environment ? '✅ ОК' : '❌ ОШИБКА''''''';
    'База данных:','''';
    results.database ? '✅ Подключена' : '❌ Недоступна''''''';
    'Web "Dashboard":','''';
    results.dashboard ? '✅ Работает' : '❌ Ошибка''''''';
  console.log('\nСервисы:''''''';
    console.log(`  ${"name":`, _status  ? '✅ Работает' : '❌ Ошибка''''''';
  console.log('\n📝 РЕКОМЕНДАЦИИ:''''''';
      '- Проверьте .env файл и убедитесь, что все переменные установлены''''''';
    console.log('- Проверьте DATABASE_URL и доступность PostgreSQL''''';
    console.log('- Попробуйте получить публичный URL из Railway Dashboard''''''';
      '- Проверьте зависимости Web "Dashboard": cd apps/web-dashboard && npm install''''''';
    console.log(`- Сервисы с ошибками: ${failedServices.join(', ''';
    console.log('- Запустите: node fix-backend-_services .js''''''';
  console.log('\n' + '=''''''';
    console.log('🎉 ВСЕ КОМПОНЕНТЫ РАБОТАЮТ КОРРЕКТНО!''''';
    console.log('Проект готов к запуску: node start-with-railway.js''''''';
    console.log('⚠️  ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ ОШИБОК''''';
    console.log('Следуйте рекомендациям выше для устранения проблем''''''';
  console.log('=''''''';
  console.error('❌ Критическая ошибка:''''';
'';
}}}}}}}})))))))))))))))))))))))))))))))))))))))))]