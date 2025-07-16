# Деплой VHM24 в Railway

Write-Host "🚀 Деплой VHM24 в Railway..."

# 1. Проверка переменных окружения
Write-Host "🔍 Проверка переменных окружения..."
$envPath = ".env"

if (!(Test-Path $envPath)) {
    Write-Error "❌ Файл $envPath не найден. Убедитесь, что он существует в корне проекта."
    exit 1
}

# 2. Загрузка переменных в сессию
Write-Host "✅ Загрузка переменных из $envPath..."
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$") {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# 3. Проверка подключения к Railway
Write-Host "🌐 Проверка подключения к Railway..."
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

# 4. Обновление переменных окружения в Railway
Write-Host "🔄 Обновление переменных окружения в Railway..."
try {
    & "$PSScriptRoot\update-railway-env.ps1"
    Write-Host "✅ Переменные окружения в Railway обновлены."
} catch {
    Write-Error "❌ Ошибка при обновлении переменных окружения в Railway: $_"
    exit 1
}

# 5. Деплой проекта в Railway
Write-Host "🚀 Деплой проекта в Railway..."
try {
    railway up
    Write-Host "✅ Проект успешно задеплоен в Railway."
} catch {
    Write-Error "❌ Ошибка при деплое проекта в Railway: $_"
    exit 1
}

# 6. Проверка статуса деплоя
Write-Host "🔍 Проверка статуса деплоя..."
try {
    $deployStatus = railway status
    Write-Host "✅ Статус деплоя: $deployStatus"
} catch {
    Write-Error "❌ Ошибка при проверке статуса деплоя: $_"
    exit 1
}

# 7. Получение URL проекта
Write-Host "🔍 Получение URL проекта..."
try {
    $projectUrl = [System.Environment]::GetEnvironmentVariable("RAILWAY_PUBLIC_URL")
    if ($projectUrl) {
        Write-Host "✅ URL проекта: $projectUrl"
    } else {
        Write-Host "⚠️ URL проекта не найден в переменных окружения."
    }
} catch {
    Write-Error "❌ Ошибка при получении URL проекта: $_"
    exit 1
}

# 8. Проверка работоспособности API
Write-Host "🔍 Проверка работоспособности API..."
$apiUrl = [System.Environment]::GetEnvironmentVariable("API_URL")
$baseUrl = $apiUrl -replace "/api/v1$", ""
$healthUrls = @(
    "$baseUrl/health",
    "$baseUrl/api/health",
    "$apiUrl/health"
)

$healthCheckSuccess = $false
foreach ($url in $healthUrls) {
    Write-Host "Проверка API по URL: $url"
    try {
        $health = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 10
        if ($health.StatusCode -eq 200) {
            Write-Host "✅ API доступен по URL: $url"
            Write-Host "Ответ: $($health.Content)"
            $healthCheckSuccess = $true
            break
        }
    } catch {
        Write-Host "❌ API недоступен по URL: $url"
    }
}

if (-not $healthCheckSuccess) {
    Write-Host "⚠️ API недоступен по всем проверенным URL. Возможно, деплой еще не завершен или есть проблемы с API."
} else {
    Write-Host "✅ API работает корректно."
}

# 9. Проверка Telegram Webhook
Write-Host "📡 Проверка Telegram Webhook..."
$webhookUrl = [System.Environment]::GetEnvironmentVariable("WEBHOOK_URL")
$botToken = [System.Environment]::GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")

try {
    $check = Invoke-WebRequest -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo" -UseBasicParsing
    Write-Host "✅ Telegram Webhook подключен."
    Write-Host "Ответ: $($check.Content)"
} catch {
    Write-Host "❌ Telegram Webhook не работает. Проверьте токен или URL."
}

# 10. Завершение
Write-Host "`n🎉 Деплой VHM24 в Railway завершен!"
Write-Host "📊 API: $apiUrl"
Write-Host "🤖 Telegram Bot: @$([System.Environment]::GetEnvironmentVariable('TELEGRAM_BOT_TOKEN').Split(':')[0])"
Write-Host "☁️ DigitalOcean Spaces: $([System.Environment]::GetEnvironmentVariable('S3_BUCKET_NAME')).$([System.Environment]::GetEnvironmentVariable('S3_REGION')).digitaloceanspaces.com"
Write-Host "`n📝 Для проверки статуса проекта используйте команду 'railway status'"
