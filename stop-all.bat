@echo off
echo ===================================
echo Остановка всех сервисов VHM24
echo ===================================

echo.
echo Завершение процессов...

taskkill /FI "WINDOWTITLE eq API Server*" /T /F
taskkill /FI "WINDOWTITLE eq Worker*" /T /F
taskkill /FI "WINDOWTITLE eq Scheduler*" /T /F
taskkill /FI "WINDOWTITLE eq Telegram Bot*" /T /F

echo.
echo ===================================
echo Все сервисы остановлены!
echo ===================================
