# PowerShell скрипт для запуска всех исправлений

Write-Host "🚀 Запуск всех исправлений VHM24..." -ForegroundColor Cyan

# Исправление файла .env
Write-Host "📋 Исправление файла .env" -ForegroundColor Yellow
node scripts/fix-env.js

# Исправление импортов fast-jwt
Write-Host "📋 Исправление импортов fast-jwt" -ForegroundColor Yellow
node scripts/fix-fast-jwt.js

# Исправление импортов canvas
Write-Host "📋 Исправление импортов canvas" -ForegroundColor Yellow
node scripts/fix-canvas.js

# Исправление тестов
Write-Host "📋 Исправление тестов" -ForegroundColor Yellow
node scripts/fix-tests.js

# Исправление Jest setup
Write-Host "📋 Исправление Jest setup" -ForegroundColor Yellow
node scripts/fix-jest-setup.js

# Установка зависимостей для тестов
Write-Host "📋 Установка зависимостей для тестов" -ForegroundColor Yellow
npm install --save-dev @babel/core @babel/preset-env babel-jest

# Запуск тестов
Write-Host "📋 Запуск тестов" -ForegroundColor Yellow
npm test

# Запуск в Docker
Write-Host "📋 Запуск в Docker" -ForegroundColor Yellow
# Используем PowerShell для запуска Docker Compose
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
