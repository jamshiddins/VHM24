# Деплой исправленных файлов в Railway

Write-Host "🚀 Деплой исправленных файлов в Railway..."

# 1. Проверка подключения к Railway
Write-Host "🔍 Проверка подключения к Railway..."
try {
    $railwayStatus = railway status
    if ($railwayStatus -match "Error") {
        Write-Error "❌ Ошибка подключения к Railway. Выполните 'railway login'."
        exit 1
    }
    Write-Host "✅ Подключение к Railway успешно."
} catch {
    Write-Error "❌ Ошибка при выполнении команды 'railway status'. Убедитесь, что Railway CLI установлен."
    exit 1
}

# 2. Создание временной директории для деплоя
Write-Host "📁 Создание временной директории для деплоя..."
$tempDir = "railway-deploy-temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null
New-Item -ItemType Directory -Path "$tempDir/api" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/worker" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/scheduler" | Out-Null
Write-Host "✅ Временная директория создана: $tempDir"

# 3. Копирование необходимых файлов
Write-Host "📋 Копирование необходимых файлов..."
Copy-Item -Path ".env" -Destination "$tempDir/.env"
Copy-Item -Path "api/index.js" -Destination "$tempDir/api/index.js"
Copy-Item -Path "worker/index.js" -Destination "$tempDir/worker/index.js"
Copy-Item -Path "scheduler/index.js" -Destination "$tempDir/scheduler/index.js"
Copy-Item -Path "package.json" -Destination "$tempDir/package.json"
Copy-Item -Path "railway.json" -Destination "$tempDir/railway.json"
Copy-Item -Path "railway.toml" -Destination "$tempDir/railway.toml" -ErrorAction SilentlyContinue
Write-Host "✅ Файлы скопированы во временную директорию."

# 4. Создание файла README.md с описанием изменений
Write-Host "📝 Создание файла README.md с описанием изменений..."
$readmeContent = @"
# VHM24 Railway Deployment

## Исправления для работы в Railway

### 1. Исправлено подключение к базе данных PostgreSQL

В файле `api/index.js` исправлено подключение к базе данных PostgreSQL в Railway:
- Добавлена проверка на запуск в Railway
- Заменен хост `postgres.railway.internal` на `postgres` для внутреннего подключения

### 2. Исправлено подключение к Redis

В файлах `worker/index.js` и `scheduler/index.js` исправлено подключение к Redis в Railway:
- Добавлена проверка на запуск в Railway
- Заменен хост `redis.railway.internal` на `redis` для внутреннего подключения

### 3. Оптимизированы ENV файлы

- `.env` - главный файл со всеми общими переменными
- `.env.production`, `.env.development`, `.env.test` - содержат только переопределения
- `.env.api`, `.env.worker`, `.env.scheduler` - содержат только специфичные переменные

## Дата деплоя

$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

Set-Content -Path "$tempDir/README.md" -Value $readmeContent
Write-Host "✅ Файл README.md создан."

# 5. Деплой в Railway
Write-Host "🚀 Деплой в Railway..."
$currentLocation = Get-Location
Set-Location -Path $tempDir
try {
    railway up
    Write-Host "✅ Деплой в Railway успешно выполнен."
}
catch {
    Write-Error "❌ Ошибка при деплое в Railway: $_"
    Set-Location -Path $currentLocation
    exit 1
}
Set-Location -Path $currentLocation

# 6. Проверка статуса деплоя
Write-Host "🔍 Проверка статуса деплоя..."
try {
    $deployStatus = railway status
    Write-Host "✅ Статус деплоя: $deployStatus"
} catch {
    Write-Error "❌ Ошибка при проверке статуса деплоя: $_"
    exit 1
}

# 7. Очистка временной директории
Write-Host "🧹 Очистка временной директории..."
Remove-Item -Recurse -Force $tempDir
Write-Host "✅ Временная директория удалена."

# 8. Завершение
Write-Host "`n🎉 Деплой исправленных файлов в Railway завершен!"
Write-Host "📝 Для проверки статуса проекта используйте команду 'railway status'"
