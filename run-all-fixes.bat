@echo off
echo 🚀 Запуск всех исправлений VHM24...

REM Исправление импортов fast-jwt
echo 📋 Исправление импортов fast-jwt
node scripts/fix-fast-jwt.js

REM Исправление импортов canvas
echo 📋 Исправление импортов canvas
node scripts/fix-canvas.js

REM Исправление тестов
echo 📋 Исправление тестов
node scripts/fix-dependencies.js

REM Запуск в Docker
echo 📋 Запуск в Docker
run-in-docker.bat
