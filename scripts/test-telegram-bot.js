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
    process.exit(1); 
  } 
 
  // Проверка наличия файла bot.js 
  const botFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'bot.js'); 
  if (!fs.existsSync(botFilePath)) { 
    console.error(`Ошибка: Файл ${botFilePath} не найден.`); 
    process.exit(1); 
  } 
 
  // Проверка наличия файла states.js 
  const statesFilePath = path.join(__dirname, '..', 'telegram-bot', 'src', 'fsm', 'states.js'); 
  if (!fs.existsSync(statesFilePath)) { 
    console.error(`Ошибка: Файл ${statesFilePath} не найден.`); 
    process.exit(1); 
  } 
 
  console.log('Проверка Telegram-бота завершена успешно.'); 
} 
 
// Запуск проверки Telegram-бота 
testTelegramBot();
