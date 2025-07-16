const axios = require('axios'); 
const fs = require('fs'); 
const path = require('path'); 
const dotenv = require('dotenv'); 
 
// Загрузка переменных окружения 
dotenv.config(); 

// Получение URL API из переменных окружения
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
 
// Функция для проверки API 
async function testApi() { 
  console.log('Проверка API...'); 
 
  try { 
    // Проверка доступности API 
    const healthResponse = await axios.get(`${API_URL}/health`); 
    console.log('API доступен:', healthResponse.data); 
 
    // Проверка API для пользователей 
    console.log('Проверка API для пользователей...'); 
    try { 
      const usersResponse = await axios.get(`${API_URL}/users/test`); 
      console.log('API для пользователей:', usersResponse.data); 
    } catch (error) { 
      console.error('Ошибка при проверке API для пользователей:', error.message); 
    } 
 
    // Проверка API для автоматов 
    console.log('Проверка API для автоматов...'); 
    try { 
      const machinesResponse = await axios.get(`${API_URL}/machines/test`); 
      console.log('API для автоматов:', machinesResponse.data); 
    } catch (error) { 
      console.error('Ошибка при проверке API для автоматов:', error.message); 
    } 
 
    // Проверка API для задач 
    console.log('Проверка API для задач...'); 
    try { 
      const tasksResponse = await axios.get(`${API_URL}/tasks/test`); 
      console.log('API для задач:', tasksResponse.data); 
    } catch (error) { 
      console.error('Ошибка при проверке API для задач:', error.message); 
    } 
 
    console.log('Проверка API завершена.'); 
  } catch (error) { 
    console.error('Ошибка при проверке API:', error.message); 
    if (error.response) { 
      console.error('Ответ сервера:', error.response.data); 
    } 
    process.exit(1); 
  } 
} 
 
// Запуск проверки API 
testApi();
