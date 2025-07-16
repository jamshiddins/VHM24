# Проверка статуса VHM24 в production-окружении

Write-Host "🔍 Проверка статуса VHM24 в production-окружении..."

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

# 3. Проверка запущенных сервисов
Write-Host "🔍 Проверка запущенных сервисов..."

# Проверка API сервиса
$apiProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*api/index.js*" }
if ($apiProcesses) {
    Write-Host "✅ API сервис запущен. Process ID: $($apiProcesses.Id)"
} else {
    Write-Host "❌ API сервис не запущен."
}

# Проверка Worker сервиса
$workerProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*worker/index.js*" }
if ($workerProcesses) {
    Write-Host "✅ Worker сервис запущен. Process ID: $($workerProcesses.Id)"
} else {
    Write-Host "❌ Worker сервис не запущен."
}

# Проверка Scheduler сервиса
$schedulerProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*scheduler/index.js*" }
if ($schedulerProcesses) {
    Write-Host "✅ Scheduler сервис запущен. Process ID: $($schedulerProcesses.Id)"
} else {
    Write-Host "❌ Scheduler сервис не запущен."
}

# 4. Проверка работоспособности API
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
        $health = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5
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
    Write-Host "❌ API недоступен по всем проверенным URL."
}

# 5. Проверка Telegram Webhook
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

# 6. Проверка подключения к Railway
Write-Host "🌐 Проверка подключения к Railway..."
try {
    $railwayStatus = railway status
    Write-Host "✅ Подключение к Railway успешно."
    Write-Host "Статус Railway: $railwayStatus"
} catch {
    Write-Host "❌ Ошибка при выполнении команды 'railway status'. Убедитесь, что Railway CLI установлен."
}

# 7. Проверка логов
Write-Host "📝 Проверка логов..."
$logsDir = "logs"
if (Test-Path $logsDir) {
    $logFiles = Get-ChildItem -Path $logsDir -Filter "*.log"
    if ($logFiles) {
        Write-Host "✅ Найдены лог-файлы:"
        foreach ($logFile in $logFiles) {
            $lastModified = $logFile.LastWriteTime
            $size = $logFile.Length
            Write-Host "  - $($logFile.Name) (Размер: $size байт, Последнее изменение: $lastModified)"
        }
    } else {
        Write-Host "⚠️ Лог-файлы не найдены в папке $logsDir."
    }
} else {
    Write-Host "⚠️ Папка логов $logsDir не найдена."
}

# 8. Завершение
Write-Host "`n🎉 Проверка статуса VHM24 в production-окружении завершена!"
