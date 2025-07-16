# Остановка VHM24 в production-окружении

Write-Host "🛑 Остановка VHM24 в production-окружении..."

# 1. Остановка API сервиса
Write-Host "🛑 Остановка API сервиса..."
try {
    $apiProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*api/index.js*" }
    if ($apiProcesses) {
        foreach ($process in $apiProcesses) {
            Stop-Process -Id $process.Id -Force
        }
        Write-Host "✅ API сервис остановлен."
    } else {
        Write-Host "⚠️ API сервис не запущен."
    }
} catch {
    Write-Error "❌ Ошибка при остановке API сервиса: $_"
}

# 2. Остановка Worker сервиса
Write-Host "🛑 Остановка Worker сервиса..."
try {
    $workerProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*worker/index.js*" }
    if ($workerProcesses) {
        foreach ($process in $workerProcesses) {
            Stop-Process -Id $process.Id -Force
        }
        Write-Host "✅ Worker сервис остановлен."
    } else {
        Write-Host "⚠️ Worker сервис не запущен."
    }
} catch {
    Write-Error "❌ Ошибка при остановке Worker сервиса: $_"
}

# 3. Остановка Scheduler сервиса
Write-Host "🛑 Остановка Scheduler сервиса..."
try {
    $schedulerProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*scheduler/index.js*" }
    if ($schedulerProcesses) {
        foreach ($process in $schedulerProcesses) {
            Stop-Process -Id $process.Id -Force
        }
        Write-Host "✅ Scheduler сервис остановлен."
    } else {
        Write-Host "⚠️ Scheduler сервис не запущен."
    }
} catch {
    Write-Error "❌ Ошибка при остановке Scheduler сервиса: $_"
}

# 4. Проверка остановки всех сервисов
Write-Host "🔍 Проверка остановки всех сервисов..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*api/index.js*" -or 
    $_.CommandLine -like "*worker/index.js*" -or 
    $_.CommandLine -like "*scheduler/index.js*" 
}

if ($nodeProcesses) {
    Write-Host "⚠️ Некоторые сервисы все еще запущены:"
    foreach ($process in $nodeProcesses) {
        Write-Host "  - Process ID: $($process.Id), Command: $($process.CommandLine)"
    }
} else {
    Write-Host "✅ Все сервисы успешно остановлены."
}

# 5. Завершение
Write-Host "`n🎉 VHM24 успешно остановлен!"
