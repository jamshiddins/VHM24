@echo off
echo ===================================
echo Запуск всех сервисов VHM24 локально
echo ===================================

echo.
echo [1/4] Запуск API сервера...
start "API Server" cmd /c "node start-api-local.js"
timeout /t 5

echo.
echo [2/4] Запуск Worker...
start "Worker" cmd /c "node start-worker-local.js"
timeout /t 3

echo.
echo [3/4] Запуск Scheduler...
start "Scheduler" cmd /c "node start-scheduler-local.js"
timeout /t 3

echo.
echo [4/4] Запуск Telegram бота...
start "Telegram Bot" cmd /c "node apps/telegram-bot/src/index.js"
timeout /t 3

echo.
echo ===================================
echo Все сервисы запущены!
echo ===================================
echo.
echo Для проверки работоспособности выполните:
echo node check-system-health.js
echo.
echo Для остановки всех сервисов закройте окна терминалов
echo или выполните stop-all.bat
echo ===================================
