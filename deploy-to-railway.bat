@echo off
REM Скрипт для быстрого деплоя на Railway с готовыми переменными (Windows)

echo 🚀 Деплой VHM24 на Railway
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

REM Устанавливаем переменные
echo 📝 Устанавливаем переменные окружения...

call railway variables set DATABASE_URL="postgresql://postgres:rxkEqEMCmEx1pQDu@db.pgghdmepazenwkrmagvy.supabase.co:5432/postgres"
call railway variables set JWT_SECRET="933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e"
call railway variables set JWT_EXPIRES_IN="7d"
call railway variables set TELEGRAM_BOT_TOKEN="8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ"
call railway variables set TELEGRAM_WEBHOOK_URL="https://vhm24-production.up.railway.app/webhook"
call railway variables set ADMIN_IDS="42283329"
call railway variables set API_URL="https://vhm24-production.up.railway.app/api/v1"
call railway variables set WEB_URL="https://vhm24-production.up.railway.app"
call railway variables set SUPABASE_URL="https://pgghdmepazenwkrmagvy.supabase.co"
call railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2hkbWVwYXplbndrcm1hZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMjI0NzAsImV4cCI6MjA1MTg5ODQ3MH0.Ej0KhHCJh0u0xYPkqL8aVpLUfhVLy-Ej0KhHCJh0u0"
call railway variables set NODE_ENV="production"
call railway variables set GATEWAY_PORT="8000"
call railway variables set AUTH_PORT="3001"
call railway variables set MACHINES_PORT="3002"
call railway variables set INVENTORY_PORT="3003"
call railway variables set TASKS_PORT="3004"
call railway variables set BUNKERS_PORT="3005"

echo.
echo ✅ Переменные установлены!
echo.

REM Коммитим и пушим
echo 📦 Деплоим изменения...
git add .
git commit -m "Deploy to Railway with all services configured"
git push origin main

echo.
echo ✅ Код отправлен на Railway!
echo.
echo ⏳ Подождите 2-3 минуты для завершения деплоя
echo.
echo Затем проверьте:
echo 1. railway logs
echo 2. node test-railway-api.js
echo 3. https://vhm24-production.up.railway.app/health
echo.
pause
