@echo off
echo =====================================
echo Starting VHM24 - VendHub Manager 24/7
echo =====================================
echo.
echo System operates 24 hours a day, 7 days a week
echo.

echo [1/5] Starting Auth Service...
start "Auth Service" cmd /k "cd services\auth && npm run dev"
timeout /t 2 > nul

echo [2/5] Starting Machines Service...
start "Machines Service" cmd /k "cd services\machines && npm run dev"
timeout /t 2 > nul

echo [3/5] Starting Inventory Service...
start "Inventory Service" cmd /k "cd services\inventory && npm run dev"
timeout /t 2 > nul

echo [4/5] Starting Tasks Service...
start "Tasks Service" cmd /k "cd services\tasks && npm run dev"
timeout /t 2 > nul

echo [5/7] Starting Bunkers Service (24/7)...
start "Bunkers Service 24/7" cmd /k "cd services\bunkers && npm run dev"
timeout /t 2 > nul

echo [6/7] Starting Telegram Bot (24/7)...
start "Telegram Bot 24/7" cmd /k "cd services\telegram-bot && npm run dev"
timeout /t 2 > nul

echo [7/7] Starting Gateway...
start "Gateway" cmd /k "cd services\gateway && npm run dev"

echo.
echo Starting Web Dashboard...
start "Web Dashboard" cmd /k "cd apps\web-dashboard && npm run dev"

echo.
echo =====================================
echo VHM24 - VendHub Manager 24/7 Started!
echo =====================================
echo.
echo All services running 24/7:
echo - Gateway: http://localhost:8000
echo - Web Dashboard: http://localhost:3000
echo - Telegram Bot: Always Online
echo.
echo The system will operate continuously.
echo Close this window to stop all services.
echo.
pause
