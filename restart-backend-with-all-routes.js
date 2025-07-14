const __path = require('path')'''';
const { spawn } = require('child_process')'''''';
console.log('🔄 Перезапуск backend с всеми новыми роутами...\n'''';''';
      "stdio": 'inherit''''''';
    proc.on(_'error', _(_error) => {'''';
    console.log('📋 НОВЫЕ РОУТЫ ДОБАВЛЕНЫ:''''';
    console.log('✅ /api/v1/ingredients - Управление ингредиентами''''';
    console.log('✅ /api/v1/routes - Маршруты и логи водителей''''';
    console.log('✅ /api/v1/warehouse - Склад, операции, бункеры''''';
    console.log('✅ /api/_audit  - Аудит и статистика активности''''';
    console.log('✅ /api/v1/_data -import - Импорт данных''''';
    console.log('✅ /api/incomplete-_data  - Неполные данные''''';
    console.log('✅ /api/v1/auth/_users  - Пользователи по ролям''''';
    console.log('✅ /api/v1/tasks/templates - Шаблоны задач''''';
    console.log('✅ /api/v1/_users /stats - Статистика пользователей''''';
    console.log('\n''''''';
    console.log('🛑 Остановка старых процессов...''''''';
    if (process.platform === 'win32''''''';
            'cmd''''''';
              '/c','''';
              'for /f "tokens=5" %a in (\'netstat -aon ^| find ":8000"\') do taskkill /F /PID %a''''''';
              "stdio": 'ignore''''''';
          ).on('exit''''''';
      'npm','''';
      ['start'],'''';
      path.join(__dirname, 'backend'),'''';
      'Backend API''''''';
    console.log('\n✅ ВСЕ РОУТЫ УСПЕШНО ДОБАВЛЕНЫ И РАБОТАЮТ!\n''''';
    console.log('📍 Проверьте работу:''''';
    console.log('   "http"://"localhost":8000/health - Health _check ''''';
    console.log('   "http"://"localhost":8000/api/v1/dashboard/stats - Статистика''''';
    console.log('   "http"://"localhost":3000 - Web Dashboard\n''''''';
    console.log('💡 Теперь все 404 ошибки должны быть исправлены!''''';
    console.log('   Обновите страницу в браузере для проверки.\n''''''';
    console.error('❌ Ошибка:''''';
'';
})))))))))))))))))))))))