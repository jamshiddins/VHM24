#!/bin/bash
# Запуск всех исправлений

echo "🚀 Запуск всех исправлений VHM24..."

# Исправление файла .env
echo "📋 Исправление файла .env"
node scripts/fix-env.js

# Исправление импортов fast-jwt
echo "📋 Исправление импортов fast-jwt"
node scripts/fix-fast-jwt.js

# Исправление импортов canvas
echo "📋 Исправление импортов canvas"
node scripts/fix-canvas.js

# Исправление тестов
echo "📋 Исправление тестов"
node scripts/fix-dependencies.js

# Запуск в Docker
echo "📋 Запуск в Docker"
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
