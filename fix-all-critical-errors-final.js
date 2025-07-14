const fs = require('fs');
const path = require('path');



// Исправление auth.js
const authPath = 'backend/src/routes/auth.js';


const authContent = `const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// Авторизация через Telegram
router.post('/telegram', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID обязателен' });
    }

    // Поиск или создание пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          username: username || '',
          firstName: firstName || '',
          lastName: lastName || '',
          role: 'operator'
        }
      });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id,
        telegramId: user.telegramId,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

module.exports = router;
`;

fs.writeFileSync(authPath, authContent);


// Исправление api.js
const apiPath = 'backend/src/routes/api.js';


const apiContent = `const express = require('express');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const machinesRoutes = require('./machines');
const tasksRoutes = require('./tasks');
const inventoryRoutes = require('./inventory');
const warehouseRoutes = require('./warehouse');
const dataImportRoutes = require('./data-import');
const telegramRoutes = require('./telegram');
const healthRoutes = require('./health');

const router = express.Router();

// Подключение всех маршрутов
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/machines', machinesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/data-import', dataImportRoutes);
router.use('/telegram', telegramRoutes);
router.use('/health', healthRoutes);

// Базовый маршрут API
router.get('/', (req, res) => {
  res.json({
    message: 'VHM24 API работает',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/machines',
      '/api/tasks',
      '/api/inventory',
      '/api/warehouse',
      '/api/data-import',
      '/api/telegram',
      '/api/health'
    ]
  });
});

module.exports = router;
`;

fs.writeFileSync(apiPath, apiContent);


// Обновление .env для локальной разработки


const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vhm24?schema=public"

# JWT Secret
JWT_SECRET=process.env.API_KEY_191 || "vhm24-super-secret-key-2024"

# Telegram Bot
TELEGRAM_BOT_TOKEN="7372348138:AAGOKJhJKJHJKJHJKJHJKJHJKJHJKJHJKJH"

# API Configuration
API_URL="process.env.API_URL"
PORT=3000
NODE_ENV="development"

# File Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE="10485760"

# Session
SESSION_SECRET=process.env.API_KEY_192 || "vhm24-session-secret"

# CORS
CORS_ORIGIN="process.env.API_URL,http://localhost:3001"

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"
`;

fs.writeFileSync('.env', envContent);


// Создание простого скрипта запуска без базы данных


const startWithoutDbContent = `const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VHM24 без базы данных (только API и Telegram бот)...');

// Запуск backend без Prisma
const backendProcess = spawn('node', ['src/index-no-db.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

// Запуск Telegram бота
setTimeout(() => {
  const botProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'apps/telegram-bot'),
    stdio: 'inherit'
  });

  botProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска Telegram бота:', error);
  });
}, 2000);

backendProcess.on('error', (error) => {
  console.error('❌ Ошибка запуска backend:', error);
});





`;

fs.writeFileSync('start-without-db.js', startWithoutDbContent);

// Создание backend/src/index-no-db.js
const indexNoDbContent = `const express = require('express');
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
`;

fs.writeFileSync('backend/src/index-no-db.js', indexNoDbContent);









