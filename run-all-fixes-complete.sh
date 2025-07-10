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
node scripts/fix-tests.js

# Исправление Jest setup
echo "📋 Исправление Jest setup"
node scripts/fix-jest-setup.js

# Установка зависимостей для тестов
echo "📋 Установка зависимостей для тестов"
npm install --save-dev @babel/core @babel/preset-env babel-jest

# Запуск тестов
echo "📋 Запуск тестов"
npm test

# Запуск в Docker
echo "📋 Запуск в Docker"
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
