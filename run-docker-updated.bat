@echo off
echo 🚀 Запуск VHM24 в Docker-контейнере...

REM Исправление файла .env
echo 📋 Исправление файла .env
node scripts/fix-env.js

REM Остановка и удаление существующих контейнеров
echo 📋 Остановка существующих контейнеров...
docker-compose -f docker-compose.compatible.yml down

REM Сборка и запуск контейнеров
echo 📋 Сборка и запуск контейнеров...
docker-compose -f docker-compose.compatible.yml up --build
