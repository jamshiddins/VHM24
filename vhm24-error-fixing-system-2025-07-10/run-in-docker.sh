#!/bin/bash
# Запуск системы исправления ошибок VHM24 в Docker

echo "🐳 Запуск системы исправления ошибок VHM24 в Docker"

# Создаем образ
docker build -t vhm24-error-fixing-system .

# Запускаем контейнер
docker run -it --rm \
  -v "$(pwd):/app" \
  -w /app \
  vhm24-error-fixing-system \
  npm run fix-all
