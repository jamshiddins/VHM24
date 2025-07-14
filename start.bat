@echo off
echo 🚀 Starting VendHub System...

echo 📡 Starting backend server...
cd backend
start "VendHub Backend" npm start

timeout /t 3 /nobreak > nul

if defined TELEGRAM_BOT_TOKEN (
    echo 🤖 Starting Telegram bot...
    cd ../apps/telegram-bot
    start "VendHub Bot" npm start
) else (
    echo ⚠️ TELEGRAM_BOT_TOKEN not set, skipping bot startup
)

echo ✅ VendHub System started!
echo 📍 Backend: http://localhost:3000
echo 📍 Health check: http://localhost:3000/health

pause
