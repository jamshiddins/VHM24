@echo off
echo ===================================
echo VHM24 Microservices Platform
echo ===================================
echo.

echo Starting all services...
echo.

echo [1/5] Starting Auth Service...
start "Auth Service" cmd /k "cd services\auth && node src\index.js"
timeout /t 2 /nobreak > nul

echo [2/5] Starting Machines Service...
start "Machines Service" cmd /k "cd services\machines && node src\index.js"
timeout /t 2 /nobreak > nul

echo [3/5] Starting Inventory Service...
start "Inventory Service" cmd /k "cd services\inventory && node src\index.js"
timeout /t 2 /nobreak > nul

echo [4/5] Starting Tasks Service...
start "Tasks Service" cmd /k "cd services\tasks && node src\index.js"
timeout /t 2 /nobreak > nul

echo [5/5] Starting API Gateway...
start "API Gateway" cmd /k "cd services\gateway && node src\index.js"

echo.
echo All services starting...
echo.
timeout /t 5 /nobreak > nul

echo Testing system health...
echo.
curl -s http://localhost:8000/health | jq
echo.
echo.
echo Services are running at:
echo   - Gateway:   http://localhost:8000
echo   - Auth:      http://localhost:3001
echo   - Machines:  http://localhost:3002
echo   - Inventory: http://localhost:3003
echo   - Tasks:     http://localhost:3004
echo.
echo Test the system:
echo   curl http://localhost:8000/api/v1/dashboard/stats
echo.
pause
