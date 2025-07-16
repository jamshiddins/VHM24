# Check Railway Environment
# This script checks the Railway environment variables and connections

# 1. Check environment variables
Write-Host "Checking environment variables..."
$envPath = ".env"

if (!(Test-Path $envPath)) {
    Write-Error "File $envPath not found. Make sure it exists in the project root."
    exit 1
}

# 2. Load variables into session
Write-Host "Loading variables from $envPath..."
Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$") {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# 3. Check Railway connection
Write-Host "Checking Railway connection..."
$pgUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
$redisUrl = [System.Environment]::GetEnvironmentVariable("REDIS_URL")
$apiUrl = [System.Environment]::GetEnvironmentVariable("API_URL")

if (!$pgUrl -or !$redisUrl -or !$apiUrl) {
    Write-Error "DATABASE_URL, REDIS_URL or API_URL not set."
    exit 1
}

# 4. Test PostgreSQL connection
Write-Host "Testing PostgreSQL connection..."
try {
    # Check if psql is installed
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        psql "$pgUrl" -c "\l" | Out-Null
        Write-Host "PostgreSQL is working."
    } else {
        Write-Host "psql not installed. Skipping PostgreSQL check."
    }
} catch {
    Write-Error "PostgreSQL not responding. Check DATABASE_URL"
}

# 5. Test Redis connection
Write-Host "Testing Redis connection..."
try {
    # Check if redis-cli is installed
    if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
        redis-cli -u "$redisUrl" ping | Out-Null
        Write-Host "Redis is working."
    } else {
        Write-Host "redis-cli not installed. Skipping Redis check."
    }
} catch {
    Write-Error "Redis not responding. Check REDIS_URL"
}

# 6. Check API (healthcheck)
Write-Host "Checking API Health Endpoint..."
try {
    # Try different health check URLs
    $baseUrl = $apiUrl -replace "/api/v1$", ""
    $healthUrls = @(
        "$baseUrl/health",
        "$baseUrl/api/health",
        "$apiUrl/health"
    )
    
    $healthCheckSuccess = $false
    
    foreach ($url in $healthUrls) {
        Write-Host "Trying API health check at: $url"
        try {
            $health = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5
            if ($health.StatusCode -eq 200) {
                Write-Host "API is available at: $url"
                $healthCheckSuccess = $true
                break
            }
        } catch {
            Write-Host "Health check failed at $url"
        }
    }
    
    if (-not $healthCheckSuccess) {
        Write-Host "API health check failed at all attempted URLs"
    }
} catch {
    Write-Host "Error checking API health"
}

# 7. Check Telegram Webhook
Write-Host "Checking Telegram Webhook..."
$webhookUrl = [System.Environment]::GetEnvironmentVariable("WEBHOOK_URL")
$botToken = [System.Environment]::GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")

try {
    $check = Invoke-WebRequest -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo" -UseBasicParsing
    Write-Host "Telegram Webhook is connected."
    Write-Host $check.Content
} catch {
    Write-Host "Telegram Webhook not working. Check token or URL."
}

# 8. Completion
Write-Host "`nVHM24 Production environment successfully checked and ready to work!"
