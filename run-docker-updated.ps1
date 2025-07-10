# PowerShell скрипт для запуска проекта в Docker

Write-Host "🚀 Запуск VHM24 в Docker-контейнере..." -ForegroundColor Cyan

# Исправление файла .env
Write-Host "📋 Исправление файла .env" -ForegroundColor Yellow
node scripts/fix-env.js

# Остановка и удаление существующих контейнеров
Write-Host "📋 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose -f docker-compose.compatible.yml down

# Сборка и запуск контейнеров
Write-Host "📋 Сборка и запуск контейнеров..." -ForegroundColor Yellow
docker-compose -f docker-compose.compatible.yml up --build
