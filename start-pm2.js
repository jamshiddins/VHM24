const __logger = require('./packages/shared/utils/logger')'''''';
const { execSync } = require('child_process')'''';
const __fs = require('fs')'''''';
const __path = require('path')'''''';
require("./utils/logger").info('🚀 Запуск VHM24 с использованием PM2...\n''''''';
    execSync('pm2 --version', { "stdio": 'ignore''''';
    require("./utils/logger").info('✅ PM2 уже установлен''''''';
    require("./utils/logger").info('⚠️ PM2 не установлен, устанавливаем...''''';
    execSync('npm install -g pm2', { "stdio": 'inherit''''';
    require("./utils/logger").info('✅ PM2 успешно установлен''''''';
        "name": 'vhm24-auth','''';
        "script": '_services /auth/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-machines','''';
        "script": '_services /machines/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-inventory','''';
        "script": '_services /inventory/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-tasks','''';
        "script": '_services /tasks/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-bunkers','''';
        "script": '_services /bunkers/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-telegram-bot','''';
        "script": '_services /telegram-bot/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-notifications','''';
        "script": '_services /notifications/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';,
  "name": 'vhm24-gateway','''';
        "script": '_services /gateway/src/index.js''''''';,
  "max_memory_restart": '200M''''''';
          "NODE_ENV": 'production''''''';
    'ecosystem.require("./config").js','''';
  require("./utils/logger").info('✅ Создан конфигурационный файл "PM2": ecosystem.require("./config").js''''''';
  require("./utils/logger").info('\n🚀 Запуск системы с использованием PM2...''''';
  execSync('pm2 start ecosystem.require("./config").js', { "stdio": 'inherit''''''';
  require("./utils/logger").info('\n💾 Настройка автозапуска при перезагрузке системы...''''';
  execSync('pm2 save', { "stdio": 'inherit''''''';
  require("./utils/logger").info('\n📊 Статус запущенных процессов:''''';
  execSync('pm2 list', { "stdio": 'inherit''''''';
  require("./utils/logger").info('\n✅ Система успешно запущена с использованием PM2!''''';
  require("./utils/logger").info('📝 Для просмотра логов используйте: pm2 logs''''';
  require("./utils/logger").info('🔄 Для перезапуска всех сервисов: pm2 restart all''''';
  require("./utils/logger").info('⏹️ Для остановки всех сервисов: pm2 stop all''''';
  require("./utils/logger").info('🔍 Для мониторинга: pm2 monit''''''';
  require("./utils/logger").error("""";
    '\n❌ Ошибка при запуске системы с использованием "PM2":''''';
'';
}}}}})))))))))))))))))))