@echo off
echo Stopping all VHM24 services...

taskkill /F /FI "WINDOWTITLE eq Gateway*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Auth Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Machines Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Inventory Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Tasks Service*" 2>nul

echo Killing processes on ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do taskkill /F /PID %%a 2>nul

echo All services stopped.
pause
