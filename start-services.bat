@echo off
echo Starting VHM24 Services...
echo.

echo Checking Docker containers...
docker ps | findstr vhm24

echo.
echo Starting Auth Service...
start "Auth Service" cmd /k "cd services\auth && npm run dev"

timeout /t 2 > nul

echo Starting Gateway...
start "Gateway" cmd /k "cd services\gateway && npm run dev"

echo.
echo Services starting...
echo.
echo Wait a few seconds, then check:
echo - Gateway Health: http://localhost:8000/health
echo - Auth Health: http://localhost:3001/health
echo.
echo Test login:
echo curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@vhm24.ru\",\"password\":\"admin123\"}"
echo.
pause
