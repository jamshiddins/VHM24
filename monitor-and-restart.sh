#!/bin/bash
# VHM24 - Monitor and Restart Script
# Этот скрипт мониторит систему и автоматически перезапускает её при необходимости

echo "👀 Запуск мониторинга системы VHM24..."

# Функция для проверки работоспособности системы
check_health() {
  # Проверяем доступность API Gateway
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    return 0  # Система работает
  else
    return 1  # Система не работает
  fi
}

# Функция для перезапуска системы
restart_system() {
  echo "⚠️ Система недоступна, перезапуск..."
  
  # Останавливаем все процессы Node.js
  pkill -f node || echo "⚠️ Некоторые процессы не удалось остановить, продолжаем..."
  
  # Запускаем систему в фоновом режиме
  ./start-background.sh
  
  echo "🔄 Система перезапущена"
}

# Основной цикл мониторинга
while true; do
  if ! check_health; then
    restart_system
  else
    echo "✅ $(date): Система работает нормально"
  fi
  
  # Ждем 5 минут перед следующей проверкой
  sleep 300
done
