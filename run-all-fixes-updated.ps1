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
node scripts/fix-dependencies.js

# Запуск в Docker
Write-Host "📋 Запуск в Docker" -ForegroundColor Yellow
# Используем PowerShell для запуска Docker Compose
docker-compose -f docker-compose.compatible.yml down
docker-compose -f docker-compose.compatible.yml up --build
