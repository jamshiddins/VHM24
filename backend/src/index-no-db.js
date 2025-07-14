const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Простые маршруты без базы данных
app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 API работает (без БД)',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Моковые данные для автоматов
app.get('/api/machines', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Автомат №1',
        location: 'Офис',
        status: 'active',
        lastMaintenance: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Автомат №2',
        location: 'Склад',
        status: 'maintenance',
        lastMaintenance: new Date().toISOString()
      }
    ]
  });
});

// Моковые данные для задач
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Заправка автомата №1',
        status: 'pending',
        assignedTo: 'Оператор 1',
        dueDate: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Техобслуживание автомата №2',
        status: 'in_progress',
        assignedTo: 'Техник 1',
        dueDate: new Date().toISOString()
      }
    ]
  });
});

// Авторизация (мок)
app.post('/api/auth/telegram', (req, res) => {
  const { telegramId, username } = req.body;
  
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: {
      id: '1',
      telegramId: telegramId || '123456789',
      username: username || 'testuser',
      role: 'operator'
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  
  
});
