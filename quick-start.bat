@echo off
echo ========================================
echo VHM24 - Quick Start Script
echo ========================================
echo.

REM Проверка Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo [1/6] Installing dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

call npm install --workspaces --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install workspace dependencies
    pause
    exit /b 1
)

echo [2/6] Starting Docker containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker containers
    pause
    exit /b 1
)

echo [3/6] Waiting for database...
timeout /t 10 /nobreak >nul

echo [4/6] Setting up Prisma...
cd packages\database
call npx prisma generate --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)

echo [5/6] Running database migrations...
call npx prisma migrate deploy --silent
if %errorlevel% neq 0 (
    echo WARNING: Migration failed, trying to create new migration...
    call npx prisma migrate dev --name init --skip-seed --silent
)

cd ..\..

echo [6/6] Starting services...
start "VHM24 Development" cmd /k start-development.bat

echo.
echo ========================================
echo ✅ VHM24 is starting up!
echo ========================================
echo.
echo Services will be available at:
echo • Gateway API: http://localhost:8000
echo • Auth Service: http://localhost:3001
echo • Machines Service: http://localhost:3002
echo • Inventory Service: http://localhost:3003
echo • Tasks Service: http://localhost:3004
echo.
echo To stop all services, run: stop-all.bat
echo.
pause
