@echo off
echo ========================================
echo VHM24 Platform - Development Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo ✓ Node.js is installed
echo ✓ Docker is available

echo.
echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

call npm install --workspaces
if %errorlevel% neq 0 (
    echo ERROR: Failed to install workspace dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed

echo.
echo Step 2: Starting infrastructure (PostgreSQL, Redis, MinIO)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker services
    pause
    exit /b 1
)

echo ✓ Infrastructure started

echo.
echo Step 3: Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Step 4: Setting up database...
cd packages\database
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)

call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo WARNING: Migration failed, database might already be set up
)

call npx prisma db seed
if %errorlevel% neq 0 (
    echo WARNING: Seeding failed, continuing anyway
)

cd ..\..
echo ✓ Database setup completed

echo.
echo Step 5: Starting all services...
echo.
echo Starting services in separate windows...

REM Start Auth Service
start "VHM24 Auth Service" cmd /k "cd services\auth && npm start"
timeout /t 2 /nobreak >nul

REM Start Gateway Service
start "VHM24 Gateway" cmd /k "cd services\gateway && npm start"
timeout /t 2 /nobreak >nul

REM Start Machines Service
start "VHM24 Machines" cmd /k "cd services\machines && npm start"
timeout /t 2 /nobreak >nul

REM Start Inventory Service
start "VHM24 Inventory" cmd /k "cd services\inventory && npm start"
timeout /t 2 /nobreak >nul

REM Start Tasks Service
start "VHM24 Tasks" cmd /k "cd services\tasks && npm start"
timeout /t 2 /nobreak >nul

REM Start Telegram Bot
start "VHM24 Telegram Bot" cmd /k "cd services\telegram-bot && npm start"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✓ VHM24 Platform is starting up!
echo ========================================
echo.
echo Services will be available at:
echo • Gateway API: http://localhost:8000
echo • Auth Service: http://localhost:3001
echo • Machines Service: http://localhost:3002
echo • Inventory Service: http://localhost:3003
echo • Tasks Service: http://localhost:3004
echo • Telegram Bot: Running in background
echo.
echo Infrastructure:
echo • PostgreSQL: localhost:5432
echo • Redis: localhost:6379
echo • MinIO: http://localhost:9001 (admin/admin)
echo.
echo To stop all services, run: stop-all.bat
echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Testing service health...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Gateway is responding
) else (
    echo ⚠ Gateway might still be starting...
)

echo.
echo ========================================
echo VHM24 Platform is ready for development!
echo ========================================
pause
