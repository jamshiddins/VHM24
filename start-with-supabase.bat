@echo off
echo ===================================
echo VHM24 Platform with Supabase
echo ===================================
echo.

echo Checking Docker for Redis...
docker ps >nul 2>&1
if errorlevel 1 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    timeout /t 20 /nobreak > nul
)

echo.
echo Starting Redis...
docker-compose up -d redis

echo.
echo Waiting for Redis...
timeout /t 5 /nobreak > nul

echo.
echo Starting Gateway Service...
cd services\gateway
start "Gateway" cmd /k "npm run dev"
cd ..\..

echo.
echo Services starting...
echo.
timeout /t 5 /nobreak > nul

echo Testing endpoints:
echo.
curl -s http://localhost:8000/health
echo.
echo.
curl -s http://localhost:8000/api/v1/test-db
echo.
echo.
echo Gateway: http://localhost:8000
echo Health: http://localhost:8000/health
echo Test DB: http://localhost:8000/api/v1/test-db
echo Stats: http://localhost:8000/api/v1/dashboard/stats
echo.
pause
