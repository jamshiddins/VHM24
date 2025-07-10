@echo off
echo 🚀 Запуск VHM24 в Docker-контейнере...

REM Остановка и удаление существующих контейнеров
docker-compose -f docker-compose.compatible.yml down

REM Сборка и запуск контейнеров
docker-compose -f docker-compose.compatible.yml up --build
