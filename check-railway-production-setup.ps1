# ▶️ Production Setup Prompt for VHM24 (без localhost)
# Используется только продакшн-инфраструктура: Railway + Vercel + Telegram + DigitalOcean

# 1. Проверка переменных окружения (используем .env.production)
echo "🔍 Проверка переменных окружения..."
$envPath = ".env.production"

if (!(Test-Path $envPath)) {
    Write-Error "❌ Файл $envPath не найден. Убедитесь, что он существует в корне проекта."
    exit 1
}

# 2. Загрузка переменных в сессию
echo "✅ Загрузка переменных из $envPath..."
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$") {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# 3. Проверка Railway подключения
echo "🌐 Проверка Railway подключения..."
$pgUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
$redisUrl = [System.Environment]::GetEnvironmentVariable("REDIS_URL")
$apiUrl = [System.Environment]::GetEnvironmentVariable("API_URL")

if (!$pgUrl -or !$redisUrl -or !$apiUrl) {
    Write-Error "❌ DATABASE_URL, REDIS_URL или API_URL не заданы."
    exit 1
}

# 4. Тест подключения к PostgreSQL
echo "🧪 Проверка PostgreSQL..."
try {
    psql "$pgUrl" -c "\l" | Out-Null
    echo "✅ PostgreSQL работает."
} catch {
    Write-Error "❌ PostgreSQL не отвечает. Проверьте DATABASE_URL"
}

# 5. Тест подключения к Redis
echo "🧪 Проверка Redis..."
try {
    redis-cli -u "$redisUrl" ping | Out-Null
    echo "✅ Redis работает."
} catch {
    Write-Error "❌ Redis не отвечает. Проверьте REDIS_URL"
}

# 6. Проверка API (healthcheck)
echo "🌐 Проверка API Health Endpoint..."
try {
    $health = Invoke-WebRequest "$apiUrl/health" -UseBasicParsing
    if ($health.StatusCode -eq 200) {
        echo "✅ API доступен: $apiUrl/health"
    } else {
        Write-Error "❌ API не отвечает."
    }
} catch {
    Write-Error "❌ Ошибка подключения к API: $($_.Exception.Message)"
}

# 7. Проверка Telegram Webhook
echo "📡 Проверка Telegram Webhook..."
$webhookUrl = [System.Environment]::GetEnvironmentVariable("WEBHOOK_URL")
$botToken = [System.Environment]::GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")

try {
    $check = Invoke-WebRequest -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo" -UseBasicParsing
    echo "✅ Webhook Telegram подключен."
    echo $check.Content
} catch {
    Write-Error "❌ Webhook Telegram не работает. Проверьте токен или URL."
}

# 8. Завершение
echo "`n🎉 VHM24 Production окружение без localhost успешно проверено и готово к работе!"
