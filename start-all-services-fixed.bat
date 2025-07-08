@echo off
echo =====================================
echo VHM24 Platform - Starting All Services
echo =====================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node version
echo Checking Node.js version...
node --version
echo.

REM Check if Docker is running
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (30 seconds)...
    timeout /t 30 /nobreak > nul
)

REM Start infrastructure
echo.
echo Starting infrastructure services...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Docker services
    echo Make sure Docker Desktop is running
    pause
    exit /b 1
)

REM Wait for services to be ready
echo.
echo Waiting for infrastructure to be ready...
timeout /t 10 /nobreak > nul

REM Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Generate Prisma client
echo.
echo Generating Prisma client...
cd packages\database
call npx prisma generate
cd ..\..

REM Start services in separate windows
echo.
echo Starting microservices...
echo.

REM Gateway Service
echo Starting Gateway Service (Port 8000)...
cd services\gateway
if not exist "node_modules" call npm install
start "VHM24 - Gateway" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Auth Service
echo Starting Auth Service (Port 3001)...
cd services\auth
if not exist "node_modules" call npm install
start "VHM24 - Auth" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Machines Service
echo Starting Machines Service (Port 3002)...
cd services\machines
if not exist "node_modules" call npm install
start "VHM24 - Machines" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Inventory Service
echo Starting Inventory Service (Port 3003)...
cd services\inventory
if not exist "node_modules" call npm install
start "VHM24 - Inventory" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Tasks Service
echo Starting Tasks Service (Port 3004)...
cd services\tasks
if not exist "node_modules" call npm install
start "VHM24 - Tasks" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Bunkers Service
echo Starting Bunkers Service (Port 3005)...
cd services\bunkers
if not exist "node_modules" call npm install
start "VHM24 - Bunkers" cmd /k "npm run dev || npm start"
cd ..\..
timeout /t 3 /nobreak > nul

REM Telegram Bot Service
echo Starting Telegram Bot Service...
cd services\telegram-bot
if not exist "node_modules" call npm install
start "VHM24 - Telegram Bot" cmd /k "npm run dev || npm start"
cd ..\..

REM Wait for all services to start
echo.
echo Waiting for all services to start...
timeout /t 10 /nobreak > nul

REM Test services
echo.
echo =====================================
echo Testing services...
echo =====================================
echo.

REM Test Gateway health
echo Testing Gateway...
curl -s http://localhost:8000/health
echo.
echo.

REM Test database connection
echo Testing Database Connection...
curl -s http://localhost:8000/api/v1/test-db
echo.
echo.

REM Display service URLs
echo =====================================
echo VHM24 Services are running!
echo =====================================
echo.
echo Gateway API:     http://localhost:8000
echo Auth Service:    http://localhost:3001
echo Machines:        http://localhost:3002
echo Inventory:       http://localhost:3003
echo Tasks:           http://localhost:3004
echo Bunkers:         http://localhost:3005
echo.
echo API Health:      http://localhost:8000/health
echo API Docs:        http://localhost:8000/docs
echo WebSocket:       ws://localhost:8000/ws
echo.
echo PostgreSQL:      localhost:5432
echo Redis:           localhost:6379
echo MinIO Console:   http://localhost:9001
echo.
echo Default login:   admin@vhm24.ru / admin123
echo.
echo To stop all services, run: stop-all.bat
echo =====================================
echo.
pause
