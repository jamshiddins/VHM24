const axios = require('axios'); 
const fs = require('fs'); 
const path = require('path'); 
const dotenv = require('dotenv'); 
 
// Загрузка переменных окружения 
dotenv.config(); 
 
 
// Функция для проверки API 
async function testApi() { 
  console.log('Проверка API...'); 
 
  try { 
    // Проверка доступности API 
    const healthResponse = await axios.get(`${API_URL}/health`); 
    console.log('API доступен:', healthResponse.data); 
 
    console.log('Проверка API завершена успешно.'); 
  } catch (error) { 
    console.error('Ошибка при проверке API:', error.message); 
    if (error.response) { 
      console.error('Ответ сервера:', error.response.data); 
    } 
  } 
} 
 
// Запуск проверки API 
testApi(); 
