@echo off
REM Исправленный скрипт для деплоя на Railway с новым синтаксисом

echo 🚀 Деплой VHM24 на Railway (исправленная версия)
echo.

REM Проверяем Railway CLI
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Railway CLI не установлен!
    echo Установите: npm install -g @railway/cli
    exit /b 1
)

echo ✅ Railway CLI найден
echo.

REM Устанавливаем переменные с новым синтаксисом
echo 📝 Устанавливаем переменные окружения...

railway variables --set "DATABASE_URL=postgresql://postgres:rxkEqEMCmEx1pQDu@db.pgghdmepazenwkrmagvy.supabase.co:5432/postgres" ^
--set "JWT_SECRET=933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e" ^
--set "JWT_EXPIRES_IN=7d" ^
--set "TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ" ^
--set "TELEGRAM_WEBHOOK_URL=https://vhm24-production.up.railway.app/webhook" ^
--set "ADMIN_IDS=42283329" ^
--set "API_URL=https://vhm24-production.up.railway.app/api/v1" ^
--set "WEB_URL=https://vhm24-production.up.railway.app" ^
--set "SUPABASE_URL=https://pgghdmepazenwkrmagvy.supabase.co" ^
--set "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2hkbWVwYXplbndrcm1hZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjI0NzAsImV4cCI6MjA1MTg5ODQ3MH0.Ej0KhHCJh0u0xYPkqL8aVpLUfhVLy-Ej0KhHCJh0u0" ^
--set "NODE_ENV=production" ^
--set "GATEWAY_PORT=8000" ^
--set "AUTH_PORT=3001" ^
--set "MACHINES_PORT=3002" ^
--set "INVENTORY_PORT=3003" ^
--set "TASKS_PORT=3004" ^
--set "BUNKERS_PORT=3005"

echo.
echo ✅ Переменные установлены!
echo.

echo 📋 Проверяем переменные...
railway variables

echo.
echo ✅ Деплой завершен!
echo.
echo ⏳ Подождите 2-3 минуты для завершения сборки
echo.
echo Затем проверьте:
echo 1. railway logs
echo 2. node test-railway-api.js
echo 3. https://vhm24-production.up.railway.app/health
echo.
pause
