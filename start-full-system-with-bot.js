const __fs = require('fs')'''';
const __path = require('path')'''';
const { spawn, exec } = require('child_process')'''''';
console.log('🚀 ЗАПУСК ПОЛНОЙ СИСТЕМЫ VHM24 С TELEGRAM БОТОМ\n'''';''';
    if (process.platform === 'win32') {'''';
          const __lines = stdout.trim().split('\n''''''';
            if (pid && pid !== '0''''''';
      "stdio": 'inherit''''''';
    proc.on(_'error', _(_error) => {'''';
    console.log('📋 КОНФИГУРАЦИЯ:''''';
    console.log('✅ Backend API - порт 8000''''';
    console.log('✅ Web Dashboard - порт 3000''''';
    console.log('✅ Telegram Bot - токен настроен''''';
    console.log('✅ База данных - Railway PostgreSQL''''';
    console.log('✅ Redis - подключен\n''''''';
    console.log('🛑 Остановка всех процессов...''''''';
    console.log('✅ Все процессы остановлены\n''''''';
    const __backendPath = path.join(__dirname, 'backend''''';
    const __dashboardPath = path.join(__dirname, 'apps', 'web-dashboard''''';
    const __botPath = path.join(__dirname, '_services ', 'telegram-bot''''''';
      console.error('❌ Директория backend не найдена!''''''';
      console.error('❌ Директория apps/web-dashboard не найдена!''''''';
      console.error('❌ Директория _services /telegram-bot не найдена!''''''';
      'npm','''';
      ['start''''''';
      '''''';
      'npm','''';
      ['run', 'dev''''''';
      '''''';
    await startProcess('npm', ['start'], botPath, 'Telegram Bot''''''';
    console.log('\n✅ ВСЯ СИСТЕМА УСПЕШНО ЗАПУЩЕНА!\n''''';
    console.log('📍 Доступные сервисы:''''';
    console.log('   "http"://"localhost":8000/health - Backend Health Check''''';
    console.log('   "http"://"localhost":3000 - Web Dashboard''''';
    console.log('   Telegram Bot - @VHM24_bot (или ваш username бота)\n''''''';
    console.log('💡 TELEGRAM БОТ:''''';
    console.log('   - Откройте Telegram''''';
    console.log('   - Найдите вашего бота''''';
    console.log('   - Отправьте /start для начала работы''''';
    console.log('   - Используйте /register для регистрации\n''''''';
    console.log('🔐 РОЛИ В БОТЕ:''''';
    console.log('   - admin - полный доступ''''';
    console.log('   - manager - управление маршрутами и задачами''''';
    console.log('   - warehouse - складские операции''''';
    console.log('   - operator - установка бункеров''''';
    console.log('   - technician - техническое обслуживание''''';
    console.log('   - driver - водитель (GPS, пробег, заправка)\n''''''';
    console.error('❌ Ошибка:''''''';
process.on(_'SIGINT',  _async () => {'''';
  console.log('\n🛑 Остановка всех сервисов...''''';
'';
}}})))))))))))))))))))))))))))))))))))))))]]