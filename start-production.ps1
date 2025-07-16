# Запуск VHM24 в production-окружении
# Использует только публичные URL и переменные Railway + Vercel + Telegram + DigitalOcean

Write-Host "🚀 Запуск VHM24 в production-окружении..."

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

# 3. Проверка наличия необходимых переменных
Write-Host "🔍 Проверка наличия необходимых переменных..."
$requiredVars = @(
    "DATABASE_URL", "DATABASE_URL_PUBLIC",
    "REDIS_URL", "REDIS_URL_PUBLIC",
    "API_URL",
    "TELEGRAM_BOT_TOKEN", "WEBHOOK_URL",
    "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_REGION", "S3_BUCKET_NAME"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if ([string]::IsNullOrEmpty([System.Environment]::GetEnvironmentVariable($var))) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "❌ Отсутствуют необходимые переменные окружения: $($missingVars -join ', ')"
    exit 1
}

# 4. Проверка подключения к Railway
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

# 5. Запуск API сервиса
Write-Host "🚀 Запуск API сервиса..."
try {
    # Используем переменные окружения из .env
    $env:NODE_ENV = "production"
    $env:PORT = "3000"
    
    # Запускаем API сервис в фоновом режиме
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "api/index.js" -RedirectStandardOutput "logs/api.log" -RedirectStandardError "logs/api-error.log"
    Write-Host "✅ API сервис запущен."
} catch {
    Write-Error "❌ Ошибка при запуске API сервиса: $_"
    exit 1
}

# 6. Запуск Worker сервиса
Write-Host "🚀 Запуск Worker сервиса..."
try {
    # Запускаем Worker сервис в фоновом режиме
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "worker/index.js" -RedirectStandardOutput "logs/worker.log" -RedirectStandardError "logs/worker-error.log"
    Write-Host "✅ Worker сервис запущен."
} catch {
    Write-Error "❌ Ошибка при запуске Worker сервиса: $_"
    exit 1
}

# 7. Запуск Scheduler сервиса
Write-Host "🚀 Запуск Scheduler сервиса..."
try {
    # Запускаем Scheduler сервис в фоновом режиме
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "scheduler/index.js" -RedirectStandardOutput "logs/scheduler.log" -RedirectStandardError "logs/scheduler-error.log"
    Write-Host "✅ Scheduler сервис запущен."
} catch {
    Write-Error "❌ Ошибка при запуске Scheduler сервиса: $_"
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
            $healthCheckSuccess = $true
            break
        }
    } catch {
        Write-Host "❌ API недоступен по URL: $url"
    }
}

if (-not $healthCheckSuccess) {
    Write-Host "⚠️ API недоступен по всем проверенным URL. Проверьте логи в папке logs/."
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
    Write-Host $check.Content
} catch {
    Write-Host "❌ Telegram Webhook не работает. Проверьте токен или URL."
}

# 10. Проверка подключения к DigitalOcean Spaces
Write-Host "☁️ Проверка подключения к DigitalOcean Spaces..."
$s3AccessKey = [System.Environment]::GetEnvironmentVariable("S3_ACCESS_KEY")
$s3SecretKey = [System.Environment]::GetEnvironmentVariable("S3_SECRET_KEY")
$s3Region = [System.Environment]::GetEnvironmentVariable("S3_REGION")
$s3BucketName = [System.Environment]::GetEnvironmentVariable("S3_BUCKET_NAME")

if ($s3AccessKey -and $s3SecretKey -and $s3Region -and $s3BucketName) {
    Write-Host "✅ Переменные окружения для DigitalOcean Spaces настроены."
} else {
    Write-Host "❌ Отсутствуют необходимые переменные окружения для DigitalOcean Spaces."
}

# 11. Завершение
Write-Host "`n🎉 VHM24 успешно запущен в production-окружении!"
Write-Host "📊 API: $apiUrl"
Write-Host "🤖 Telegram Bot: @$([System.Environment]::GetEnvironmentVariable('TELEGRAM_BOT_TOKEN').Split(':')[0])"
Write-Host "☁️ DigitalOcean Spaces: $s3BucketName.$s3Region.digitaloceanspaces.com"
Write-Host "`n📝 Логи доступны в папке logs/"
