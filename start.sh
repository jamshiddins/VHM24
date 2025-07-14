#!/bin/bash
echo "🚀 Starting VendHub System..."

# Start backend
echo "📡 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start telegram bot (if token is available)
if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "🤖 Starting Telegram bot..."
    cd ../apps/telegram-bot && npm start &
    BOT_PID=$!
else
    echo "⚠️ TELEGRAM_BOT_TOKEN not set, skipping bot startup"
fi

echo "✅ VendHub System started!"
echo "📍 Backend: http://localhost:3000"
echo "📍 Health check: http://localhost:3000/health"

# Keep script running
wait
