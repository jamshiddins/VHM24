@echo off
echo ===================================
echo Starting VHM24 Platform
echo ===================================
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

echo [5/5] Starting Gateway...
start "Gateway" cmd /k "cd services\gateway && npm run dev"

echo.
echo All services starting...
echo.
echo Wait 5 seconds, then check:
echo.
echo Gateway Health: http://localhost:8000/health
echo.
echo Test endpoints:
echo - Login: POST http://localhost:8000/api/v1/auth/login
echo - Stats: GET http://localhost:8000/api/v1/dashboard/stats
echo - Machines: GET http://localhost:8000/api/v1/machines
echo - Tasks: GET http://localhost:8000/api/v1/tasks
echo.
pause
