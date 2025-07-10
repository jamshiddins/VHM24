#!/bin/bash
# Запуск проекта в Docker-контейнере

echo "🚀 Запуск VHM24 в Docker-контейнере..."

# Исправление файла .env
echo "📋 Исправление файла .env"
node scripts/fix-env.js

# Остановка и удаление существующих контейнеров
echo "📋 Остановка существующих контейнеров..."
docker-compose -f docker-compose.compatible.yml down

# Сборка и запуск контейнеров
echo "📋 Сборка и запуск контейнеров..."
docker-compose -f docker-compose.compatible.yml up --build
