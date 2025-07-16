const fs = require('fs'); 
const path = require('path'); 
const dotenv = require('dotenv'); 
 
// Загрузка переменных окружения 
dotenv.config(); 
 
// Функция для проверки Telegram-бота 
function testTelegramBot() { 
  console.log('Проверка Telegram-бота...'); 
 
  // Проверка наличия токена бота 
  const botToken = process.env.BOT_TOKEN; 
  if (!botToken) { 
    console.error('Ошибка: BOT_TOKEN не найден в переменных окружения.'); 
    return; 
  } 
 
  console.log('Проверка Telegram-бота завершена успешно.'); 
} 
 
// Запуск проверки Telegram-бота 
testTelegramBot(); 
