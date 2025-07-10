#!/bin/bash
# Запуск всех исправлений

echo "🚀 Запуск всех исправлений VHM24..."

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
./run-in-docker.sh
