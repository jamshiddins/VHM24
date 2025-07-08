@echo off
echo 🚀 Настройка новой архитектуры базы данных VHM24
echo ================================================

REM Переход в директорию database
cd packages\database

echo 📦 Установка зависимостей...
call npm install

echo 🔧 Генерация Prisma клиентов...
call npm run generate:all

echo ✅ Настройка завершена!
echo.
echo Следующие шаги:
echo 1. Обновите DATABASE_URL в .env или Railway Variables
echo 2. Запустите миграции: npm run migrate:dev:all
echo 3. Обновите импорты в сервисах
echo.
echo Пример использования:
echo const { getAuthClient } = require('@vhm24/database');
echo const prisma = getAuthClient();

cd ..\..
pause
