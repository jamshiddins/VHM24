#!/bin/bash
# Запуск проекта в Docker-контейнере с совместимой версией Node.js

echo "🚀 Запуск VHM24 в Docker-контейнере..."

# Остановка и удаление существующих контейнеров
docker-compose -f docker-compose.compatible.yml down

# Сборка и запуск контейнеров
docker-compose -f docker-compose.compatible.yml up --build
