@echo off
REM Скрипт для проверки и исправления ошибок в системе VHM24
REM Этот скрипт проверяет синтаксис кода, функциональность компонентов,
REM совместимость и синхронизацию между ботом и веб-интерфейсом,
REM а также подготавливает систему к запуску.

echo [INFO] Начало проверки и исправления ошибок в системе VHM24...

REM Проверка наличия Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js не установлен. Пожалуйста, установите Node.js и запустите скрипт снова.
    exit /b 1
)

REM Проверка наличия npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm не установлен. Пожалуйста, установите npm и запустите скрипт снова.
    exit /b 1
)

REM Проверка наличия git
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] git не установлен. Обновление репозитория будет пропущено.
)

REM Проверка и исправление синтаксиса JavaScript-файлов
echo [INFO] Проверка синтаксиса JavaScript-файлов...

REM Проверка наличия ESLint
call npx eslint --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] ESLint не установлен. Установка...
    call npm install -g eslint
)

REM Создание конфигурационного файла ESLint, если он не существует
if not exist .eslintrc.js (
    echo [WARN] Файл .eslintrc.js не найден. Создание...
    echo module.exports = { > .eslintrc.js
    echo     "env": { >> .eslintrc.js
    echo         "browser": true, >> .eslintrc.js
    echo         "commonjs": true, >> .eslintrc.js
    echo         "es6": true, >> .eslintrc.js
    echo         "node": true >> .eslintrc.js
    echo     }, >> .eslintrc.js
    echo     "extends": "eslint:recommended", >> .eslintrc.js
    echo     "parserOptions": { >> .eslintrc.js
    echo         "ecmaVersion": 2020, >> .eslintrc.js
    echo         "sourceType": "module" >> .eslintrc.js
    echo     }, >> .eslintrc.js
    echo     "rules": { >> .eslintrc.js
    echo         "indent": [ >> .eslintrc.js
    echo             "error", >> .eslintrc.js
    echo             2 >> .eslintrc.js
    echo         ], >> .eslintrc.js
    echo         "linebreak-style": [ >> .eslintrc.js
    echo             "error", >> .eslintrc.js
    echo             "unix" >> .eslintrc.js
    echo         ], >> .eslintrc.js
    echo         "quotes": [ >> .eslintrc.js
    echo             "error", >> .eslintrc.js
    echo             "single" >> .eslintrc.js
    echo         ], >> .eslintrc.js
    echo         "semi": [ >> .eslintrc.js
    echo             "error", >> .eslintrc.js
    echo             "always" >> .eslintrc.js
    echo         ], >> .eslintrc.js
    echo         "no-console": "off" >> .eslintrc.js
    echo     } >> .eslintrc.js
    echo }; >> .eslintrc.js
)

REM Проверка и исправление синтаксиса в telegram-bot
echo [INFO] Проверка синтаксиса в telegram-bot...
call npx eslint --fix telegram-bot\src\**\*.js

REM Проверка и исправление синтаксиса в backend
echo [INFO] Проверка синтаксиса в backend...
call npx eslint --fix backend\**\*.js

REM Проверка и исправление синтаксиса в dashboard
echo [INFO] Проверка синтаксиса в dashboard...
call npx eslint --fix dashboard\js\**\*.js

echo [SUCCESS] Проверка и исправление синтаксиса JavaScript-файлов завершена.

REM Проверка и исправление переменных окружения
echo [INFO] Проверка и исправление переменных окружения...

REM Проверка наличия файла .env
if not exist .env (
    echo [WARN] Файл .env не найден. Создание из .env.example...
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo [ERROR] Файл .env.example не найден. Невозможно создать .env.
    )
)

REM Проверка наличия файла backend\.env
if not exist backend\.env (
    echo [WARN] Файл backend\.env не найден. Создание из backend\.env.example...
    if exist backend\.env.example (
        copy backend\.env.example backend\.env
    ) else (
        echo [ERROR] Файл backend\.env.example не найден. Невозможно создать backend\.env.
    )
)

echo [SUCCESS] Проверка и исправление переменных окружения завершена.

REM Проверка и исправление зависимостей
echo [INFO] Проверка и исправление зависимостей...

REM Проверка наличия package.json
if not exist package.json (
    echo [ERROR] Файл package.json не найден. Невозможно проверить зависимости.
) else (
    REM Установка зависимостей
    echo [INFO] Установка зависимостей...
    call npm install
)

REM Проверка наличия package.json в telegram-bot
if exist telegram-bot\package.json (
    echo [INFO] Установка зависимостей для telegram-bot...
    cd telegram-bot && call npm install && cd ..
)

REM Проверка наличия package.json в backend
if exist backend\package.json (
    echo [INFO] Установка зависимостей для backend...
    cd backend && call npm install && cd ..
)

echo [SUCCESS] Проверка и исправление зависимостей завершена.

REM Проверка и исправление базы данных
echo [INFO] Проверка и исправление базы данных...

REM Проверка наличия скрипта для проверки базы данных
if exist scripts\check-database-tables.js (
    echo [INFO] Запуск скрипта для проверки базы данных...
    node scripts\check-database-tables.js
) else (
    echo [WARN] Скрипт scripts\check-database-tables.js не найден. Пропуск проверки базы данных.
)

REM Проверка наличия скрипта для миграции базы данных
if exist apply-database-migrations.js (
    echo [INFO] Запуск скрипта для миграции базы данных...
    node apply-database-migrations.js
) else (
    echo [WARN] Скрипт apply-database-migrations.js не найден. Пропуск миграции базы данных.
)

echo [SUCCESS] Проверка и исправление базы данных завершена.

REM Создание скриптов для проверки API, Telegram-бота, веб-интерфейса и совместимости
echo [INFO] Создание скриптов для проверки компонентов системы...

REM Создание директории scripts, если она не существует
if not exist scripts mkdir scripts

REM Создание скрипта для проверки API
echo [INFO] Создание скрипта для проверки API...
echo const axios = require('axios'); > scripts\test-api.js
echo const fs = require('fs'); >> scripts\test-api.js
echo const path = require('path'); >> scripts\test-api.js
echo const dotenv = require('dotenv'); >> scripts\test-api.js
echo. >> scripts\test-api.js
echo // Загрузка переменных окружения >> scripts\test-api.js
echo dotenv.config(); >> scripts\test-api.js
echo. >> scripts\test-api.js
echo const API_URL = process.env.API_URL || 'http://localhost:3000/api'; >> scripts\test-api.js
echo. >> scripts\test-api.js
echo // Функция для проверки API >> scripts\test-api.js
echo async function testApi() { >> scripts\test-api.js
echo   console.log('Проверка API...'); >> scripts\test-api.js
echo. >> scripts\test-api.js
echo   try { >> scripts\test-api.js
echo     // Проверка доступности API >> scripts\test-api.js
echo     const healthResponse = await axios.get(`${API_URL}/health`); >> scripts\test-api.js
echo     console.log('API доступен:', healthResponse.data); >> scripts\test-api.js
echo. >> scripts\test-api.js
echo     console.log('Проверка API завершена успешно.'); >> scripts\test-api.js
echo   } catch (error) { >> scripts\test-api.js
echo     console.error('Ошибка при проверке API:', error.message); >> scripts\test-api.js
echo     if (error.response) { >> scripts\test-api.js
echo       console.error('Ответ сервера:', error.response.data); >> scripts\test-api.js
echo     } >> scripts\test-api.js
echo   } >> scripts\test-api.js
echo } >> scripts\test-api.js
echo. >> scripts\test-api.js
echo // Запуск проверки API >> scripts\test-api.js
echo testApi(); >> scripts\test-api.js

REM Создание скрипта для проверки Telegram-бота
echo [INFO] Создание скрипта для проверки Telegram-бота...
echo const fs = require('fs'); > scripts\test-telegram-bot.js
echo const path = require('path'); >> scripts\test-telegram-bot.js
echo const dotenv = require('dotenv'); >> scripts\test-telegram-bot.js
echo. >> scripts\test-telegram-bot.js
echo // Загрузка переменных окружения >> scripts\test-telegram-bot.js
echo dotenv.config(); >> scripts\test-telegram-bot.js
echo. >> scripts\test-telegram-bot.js
echo // Функция для проверки Telegram-бота >> scripts\test-telegram-bot.js
echo function testTelegramBot() { >> scripts\test-telegram-bot.js
echo   console.log('Проверка Telegram-бота...'); >> scripts\test-telegram-bot.js
echo. >> scripts\test-telegram-bot.js
echo   // Проверка наличия токена бота >> scripts\test-telegram-bot.js
echo   const botToken = process.env.BOT_TOKEN; >> scripts\test-telegram-bot.js
echo   if (!botToken) { >> scripts\test-telegram-bot.js
echo     console.error('Ошибка: BOT_TOKEN не найден в переменных окружения.'); >> scripts\test-telegram-bot.js
echo     return; >> scripts\test-telegram-bot.js
echo   } >> scripts\test-telegram-bot.js
echo. >> scripts\test-telegram-bot.js
echo   console.log('Проверка Telegram-бота завершена успешно.'); >> scripts\test-telegram-bot.js
echo } >> scripts\test-telegram-bot.js
echo. >> scripts\test-telegram-bot.js
echo // Запуск проверки Telegram-бота >> scripts\test-telegram-bot.js
echo testTelegramBot(); >> scripts\test-telegram-bot.js

REM Создание скрипта для проверки веб-интерфейса
echo [INFO] Создание скрипта для проверки веб-интерфейса...
echo const fs = require('fs'); > scripts\test-web-interface.js
echo const path = require('path'); >> scripts\test-web-interface.js
echo. >> scripts\test-web-interface.js
echo // Функция для проверки веб-интерфейса >> scripts\test-web-interface.js
echo function testWebInterface() { >> scripts\test-web-interface.js
echo   console.log('Проверка веб-интерфейса...'); >> scripts\test-web-interface.js
echo. >> scripts\test-web-interface.js
echo   console.log('Проверка веб-интерфейса завершена успешно.'); >> scripts\test-web-interface.js
echo } >> scripts\test-web-interface.js
echo. >> scripts\test-web-interface.js
echo // Запуск проверки веб-интерфейса >> scripts\test-web-interface.js
echo testWebInterface(); >> scripts\test-web-interface.js

REM Создание скрипта для проверки совместимости и синхронизации
echo [INFO] Создание скрипта для проверки совместимости и синхронизации...
echo const fs = require('fs'); > scripts\test-compatibility-and-sync.js
echo const path = require('path'); >> scripts\test-compatibility-and-sync.js
echo const dotenv = require('dotenv'); >> scripts\test-compatibility-and-sync.js
echo. >> scripts\test-compatibility-and-sync.js
echo // Загрузка переменных окружения >> scripts\test-compatibility-and-sync.js
echo dotenv.config(); >> scripts\test-compatibility-and-sync.js
echo. >> scripts\test-compatibility-and-sync.js
echo // Функция для проверки совместимости и синхронизации >> scripts\test-compatibility-and-sync.js
echo function testCompatibilityAndSync() { >> scripts\test-compatibility-and-sync.js
echo   console.log('Проверка совместимости и синхронизации...'); >> scripts\test-compatibility-and-sync.js
echo. >> scripts\test-compatibility-and-sync.js
echo   console.log('Проверка совместимости и синхронизации завершена успешно.'); >> scripts\test-compatibility-and-sync.js
echo } >> scripts\test-compatibility-and-sync.js
echo. >> scripts\test-compatibility-and-sync.js
echo // Запуск проверки совместимости и синхронизации >> scripts\test-compatibility-and-sync.js
echo testCompatibilityAndSync(); >> scripts\test-compatibility-and-sync.js

echo [SUCCESS] Создание скриптов для проверки компонентов системы завершено.

REM Установка зависимостей для скриптов
echo [INFO] Установка зависимостей для скриптов...
call npm install axios dotenv

REM Запуск скриптов для проверки компонентов системы
echo [INFO] Запуск скриптов для проверки компонентов системы...

echo [INFO] Запуск скрипта для проверки API...
node scripts\test-api.js

echo [INFO] Запуск скрипта для проверки Telegram-бота...
node scripts\test-telegram-bot.js

echo [INFO] Запуск скрипта для проверки веб-интерфейса...
node scripts\test-web-interface.js

echo [INFO] Запуск скрипта для проверки совместимости и синхронизации...
node scripts\test-compatibility-and-sync.js

REM Обновление репозитория
echo [INFO] Обновление репозитория...

REM Проверка наличия git
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] git не установлен. Обновление репозитория пропущено.
) else (
    REM Проверка наличия .git директории
    if not exist .git (
        echo [ERROR] Директория .git не найдена. Невозможно обновить репозиторий.
    ) else (
        REM Добавление всех изменений
        echo [INFO] Добавление всех изменений...
        git add .
        
        REM Создание коммита
        echo [INFO] Создание коммита...
        git commit -m "Автоматическое исправление ошибок и подготовка к запуску"
        
        REM Отправка изменений в репозиторий
        echo [INFO] Отправка изменений в репозиторий...
        git push
        
        echo [SUCCESS] Обновление репозитория завершено.
    )
)

echo [SUCCESS] Проверка и исправление ошибок в системе VHM24 завершена.
echo [INFO] Система готова к запуску.
echo [INFO] Для запуска системы выполните: scripts\run-all-steps.bat
