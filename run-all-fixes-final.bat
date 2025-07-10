@echo off
echo 🚀 Запуск всех исправлений VHM24...

REM Исправление файла .env
echo 📋 Исправление файла .env
node scripts/fix-env.js

REM Исправление импортов fast-jwt
echo 📋 Исправление импортов fast-jwt
node scripts/fix-fast-jwt.js

REM Исправление импортов canvas
echo 📋 Исправление импортов canvas
node scripts/fix-canvas.js

REM Исправление тестов
echo 📋 Исправление тестов
node scripts/fix-tests.js

REM Запуск тестов
echo 📋 Запуск тестов
npm test

REM Запуск в Docker
echo 📋 Запуск в Docker
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
