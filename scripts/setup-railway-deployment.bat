@echo off
REM Скрипт для настройки деплоя в Railway с поддержкой worker и scheduler

echo [INFO] Начало настройки деплоя в Railway...

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

REM Проверка наличия Railway CLI
where railway >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Railway CLI не установлен. Установка...
    call npm install -g @railway/cli
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Не удалось установить Railway CLI. Пожалуйста, установите его вручную и запустите скрипт снова.
        exit /b 1
    )
)

REM Проверка наличия файла railway.json
if not exist railway.json (
    echo [ERROR] Файл railway.json не найден. Пожалуйста, создайте его и запустите скрипт снова.
    exit /b 1
)

REM Проверка наличия файлов worker.js и scheduler.js
if not exist worker.js (
    echo [ERROR] Файл worker.js не найден. Пожалуйста, создайте его и запустите скрипт снова.
    exit /b 1
)

if not exist scheduler.js (
    echo [ERROR] Файл scheduler.js не найден. Пожалуйста, создайте его и запустите скрипт снова.
    exit /b 1
)

REM Проверка наличия зависимостей для worker и scheduler
echo [INFO] Проверка наличия зависимостей для worker и scheduler...

REM Проверка наличия pg
call npm list pg >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Пакет pg не установлен. Установка...
    call npm install pg
)

REM Проверка наличия dotenv
call npm list dotenv >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Пакет dotenv не установлен. Установка...
    call npm install dotenv
)

REM Проверка наличия node-cron
call npm list node-cron >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Пакет node-cron не установлен. Установка...
    call npm install node-cron
)

REM Обновление package.json
echo [INFO] Обновление package.json...

REM Проверка наличия файла package.json
if not exist package.json (
    echo [ERROR] Файл package.json не найден. Пожалуйста, создайте его и запустите скрипт снова.
    exit /b 1
)

REM Добавление скриптов для worker и scheduler в package.json
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.scripts = pkg.scripts || {}; pkg.scripts.worker = 'node worker.js'; pkg.scripts.scheduler = 'node scheduler.js'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

echo [INFO] Файл package.json успешно обновлен.

REM Создание файла .env для Railway
echo [INFO] Создание файла .env для Railway...

REM Проверка наличия файла .env
if not exist .env (
    echo [WARN] Файл .env не найден. Создание...
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendhub > .env
    echo NODE_ENV=production >> .env
    echo PORT=3000 >> .env
)

REM Проверка наличия переменной DATABASE_URL в .env
findstr /C:"DATABASE_URL" .env >nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Переменная DATABASE_URL не найдена в файле .env. Добавление...
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendhub >> .env
)

echo [INFO] Файл .env успешно обновлен.

REM Создание файла Procfile для Railway
echo [INFO] Создание файла Procfile для Railway...

echo web: node start-vendhub-with-sqlite.js > Procfile
echo worker: node worker.js >> Procfile
echo scheduler: node scheduler.js >> Procfile
echo bot: node telegram-bot/src/bot.js >> Procfile

echo [INFO] Файл Procfile успешно создан.

REM Создание файла nixpacks.toml для Railway
echo [INFO] Создание файла nixpacks.toml для Railway...

echo [phases.setup] > nixpacks.toml
echo nixPkgs = ["nodejs", "postgresql"] >> nixpacks.toml
echo. >> nixpacks.toml
echo [phases.install] >> nixpacks.toml
echo cmds = ["npm install"] >> nixpacks.toml
echo. >> nixpacks.toml
echo [phases.build] >> nixpacks.toml
echo cmds = ["npm run build"] >> nixpacks.toml
echo. >> nixpacks.toml
echo [start] >> nixpacks.toml
echo cmd = "node start-vendhub-with-sqlite.js" >> nixpacks.toml

echo [INFO] Файл nixpacks.toml успешно создан.

REM Проверка авторизации в Railway
echo [INFO] Проверка авторизации в Railway...

railway whoami >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Вы не авторизованы в Railway. Пожалуйста, авторизуйтесь с помощью команды 'railway login' и запустите скрипт снова.
    railway login
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Не удалось авторизоваться в Railway. Пожалуйста, авторизуйтесь вручную и запустите скрипт снова.
        exit /b 1
    )
)

REM Проверка наличия проекта в Railway
echo [INFO] Проверка наличия проекта в Railway...

railway list >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] У вас нет проектов в Railway. Создание нового проекта...
    railway init
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Не удалось создать проект в Railway. Пожалуйста, создайте его вручную и запустите скрипт снова.
        exit /b 1
    )
)

REM Настройка переменных окружения в Railway
echo [INFO] Настройка переменных окружения в Railway...

echo [INFO] Для настройки переменных окружения в Railway выполните следующие команды:
echo railway vars set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendhub
echo railway vars set NODE_ENV=production
echo railway vars set PORT=3000
echo railway vars set BOT_TOKEN=your_bot_token

REM Деплой в Railway
echo [INFO] Для деплоя в Railway выполните следующую команду:
echo railway up

echo [SUCCESS] Настройка деплоя в Railway завершена.
echo [INFO] Теперь вы можете выполнить деплой в Railway с помощью команды 'railway up'.
echo [INFO] После деплоя вы можете проверить статус сервисов с помощью команды 'railway status'.
