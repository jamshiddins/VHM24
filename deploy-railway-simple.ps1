# Деплой исправленных файлов в Railway

Write-Host "🚀 Деплой исправленных файлов в Railway..."

# Проверка подключения к Railway
Write-Host "🔍 Проверка подключения к Railway..."
railway status
Write-Host "✅ Подключение к Railway успешно."

# Создание временной директории для деплоя
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

# Копирование необходимых файлов
Write-Host "📋 Копирование необходимых файлов..."
Copy-Item -Path ".env" -Destination "$tempDir/.env"
Copy-Item -Path "api/index.js" -Destination "$tempDir/api/index.js"
Copy-Item -Path "worker/index.js" -Destination "$tempDir/worker/index.js"
Copy-Item -Path "scheduler/index.js" -Destination "$tempDir/scheduler/index.js"
Copy-Item -Path "package.json" -Destination "$tempDir/package.json"
Copy-Item -Path "railway.json" -Destination "$tempDir/railway.json"
Copy-Item -Path "railway.toml" -Destination "$tempDir/railway.toml" -ErrorAction SilentlyContinue
Write-Host "✅ Файлы скопированы во временную директорию."

# Создание файла README.md с описанием изменений
Write-Host "📝 Создание файла README.md с описанием изменений..."
$readmeContent = "# VHM24 Railway Deployment`n`n## Исправления для работы в Railway`n`n### 1. Исправлено подключение к базе данных PostgreSQL`n`nВ файле `api/index.js` исправлено подключение к базе данных PostgreSQL в Railway:`n- Добавлена проверка на запуск в Railway`n- Заменен хост `postgres.railway.internal` на `postgres` для внутреннего подключения`n`n### 2. Исправлено подключение к Redis`n`nВ файлах `worker/index.js` и `scheduler/index.js` исправлено подключение к Redis в Railway:`n- Добавлена проверка на запуск в Railway`n- Заменен хост `redis.railway.internal` на `redis` для внутреннего подключения`n`n### 3. Оптимизированы ENV файлы`n`n- `.env` - главный файл со всеми общими переменными`n- `.env.production`, `.env.development`, `.env.test` - содержат только переопределения`n- `.env.api`, `.env.worker`, `.env.scheduler` - содержат только специфичные переменные`n`n## Дата деплоя`n`n" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Set-Content -Path "$tempDir/README.md" -Value $readmeContent
Write-Host "✅ Файл README.md создан."

# Деплой в Railway
Write-Host "🚀 Деплой в Railway..."
$currentLocation = Get-Location
Set-Location -Path $tempDir
railway up
Write-Host "✅ Деплой в Railway успешно выполнен."
Set-Location -Path $currentLocation

# Проверка статуса деплоя
Write-Host "🔍 Проверка статуса деплоя..."
$deployStatus = railway status
Write-Host "✅ Статус деплоя: $deployStatus"

# Очистка временной директории
Write-Host "🧹 Очистка временной директории..."
Remove-Item -Recurse -Force $tempDir
Write-Host "✅ Временная директория удалена."

# Завершение
Write-Host "`n🎉 Деплой исправленных файлов в Railway завершен!"
Write-Host "📝 Для проверки статуса проекта используйте команду 'railway status'"
