# Обновление переменных окружения в Railway

Write-Host "🔄 Обновление переменных окружения в Railway..."

# 1. Проверка переменных окружения
Write-Host "🔍 Проверка переменных окружения..."
$envPath = ".env"

if (!(Test-Path $envPath)) {
    Write-Error "❌ Файл $envPath не найден. Убедитесь, что он существует в корне проекта."
    exit 1
}

# 2. Загрузка переменных в сессию
Write-Host "✅ Загрузка переменных из $envPath..."
$envVars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$") {
        $envVars[$matches[1]] = $matches[2]
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

# 4. Получение текущих переменных окружения из Railway
Write-Host "🔍 Получение текущих переменных окружения из Railway..."
try {
    $railwayVars = railway variables
    Write-Host "✅ Текущие переменные окружения в Railway получены."
} catch {
    Write-Error "❌ Ошибка при получении переменных окружения из Railway."
    exit 1
}

# 5. Обновление переменных окружения в Railway
Write-Host "🔄 Обновление переменных окружения в Railway..."

# Список переменных, которые нужно обновить
$varsToUpdate = @(
    "DATABASE_URL",
    "DATABASE_URL_PUBLIC",
    "REDIS_URL",
    "REDIS_URL_PUBLIC",
    "API_URL",
    "TELEGRAM_BOT_TOKEN",
    "WEBHOOK_URL",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_REGION",
    "S3_BUCKET_NAME",
    "S3_BACKUP_BUCKET",
    "S3_ENDPOINT",
    "S3_UPLOAD_URL",
    "S3_BACKUP_URL",
    "JWT_SECRET",
    "NODE_ENV",
    "PORT",
    "CORS_ORIGIN",
    "LOG_LEVEL",
    "ADMIN_IDS"
)

foreach ($var in $varsToUpdate) {
    if ($envVars.ContainsKey($var)) {
        Write-Host "🔄 Обновление переменной $var..."
        try {
            $value = $envVars[$var]
            $command = "railway variables set $var=""$value"""
            Invoke-Expression $command
            Write-Host "✅ Переменная $var успешно обновлена."
        } catch {
            Write-Host "❌ Ошибка при обновлении переменной $var"
        }
    } else {
        Write-Host "⚠️ Переменная $var не найдена в файле $envPath."
    }
}

# 6. Проверка обновления переменных окружения
Write-Host "🔍 Проверка обновления переменных окружения..."
try {
    $updatedRailwayVars = railway variables
    Write-Host "✅ Обновленные переменные окружения в Railway получены."
    
    # Сравнение переменных
    foreach ($var in $varsToUpdate) {
        if ($envVars.ContainsKey($var)) {
            if ($updatedRailwayVars -match "$var=") {
                Write-Host "✅ Переменная $var успешно обновлена в Railway."
            } else {
                Write-Host "⚠️ Переменная $var не найдена в Railway."
            }
        }
    }
} catch {
    Write-Host "❌ Ошибка при получении обновленных переменных окружения из Railway."
}

# 7. Завершение
Write-Host "`n🎉 Обновление переменных окружения в Railway завершено!"
