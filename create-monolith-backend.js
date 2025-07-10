#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Создание монолитного backend для VHM24...\n');

async function createMonolithBackend() {
  const backendPath = path.join(__dirname, 'backend');
  
  // 1. Создаем структуру папок
  console.log('📁 Создание структуры папок...');
  const dirs = [
    'backend',
    'backend/src',
    'backend/src/routes',
    'backend/src/controllers',
    'backend/src/middleware',
    'backend/src/services',
    'backend/src/utils'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(path.join(__dirname, dir), { recursive: true });
  }
  
  // 2. Создаем package.json
  console.log('📦 Создание package.json...');
  const packageJson = {
    name: "@vhm24/backend",
    version: "1.0.0",
    main: "src/index.js",
    scripts: {
      start: "node src/index.js",
      dev: "nodemon src/index.js",
      "prisma:generate": "prisma generate",
      "prisma:migrate": "prisma migrate deploy"
    },
    dependencies: {
      "@prisma/client": "^6.11.1",
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.0.3",
      "jsonwebtoken": "^9.0.0",
      "bcrypt": "^5.1.1",
      "express-rate-limit": "^6.7.0",
      "helmet": "^7.0.0",
      "morgan": "^1.10.0",
      "joi": "^17.9.2",
      "redis": "^4.6.5",
      "node-telegram-bot-api": "^0.61.0",
      "aws-sdk": "^2.1329.0"
    },
    devDependencies: {
      "nodemon": "^2.0.22",
      "prisma": "^6.11.1"
    }
  };
  
  await fs.writeFile(
    path.join(backendPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // 3. Копируем Prisma схему
  console.log('📋 Копирование Prisma схемы...');
  await fs.mkdir(path.join(backendPath, 'prisma'), { recursive: true });
  await fs.copyFile(
    path.join(__dirname, 'packages/database/prisma/schema.prisma'),
    path.join(backendPath, 'prisma/schema.prisma')
  );
  
  // 4. Создаем основной файл сервера
  console.log('🔨 Создание основного сервера...');
  const serverCode = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

// Инициализация
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Импорт роутов
const authRoutes = require('./routes/auth');
const machinesRoutes = require('./routes/machines');
const inventoryRoutes = require('./routes/inventory');
const tasksRoutes = require('./routes/tasks');
const recipesRoutes = require('./routes/recipes');
const usersRoutes = require('./routes/users');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'VHM24 Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/machines', machinesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/recipes', recipesRoutes);
app.use('/api/v1/users', usersRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Запуск сервера
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    app.listen(PORT, () => {
      console.log(\`🚀 VHM24 Backend запущен на порту \${PORT}\`);
      console.log(\`📍 Health check: http://localhost:\${PORT}/health\`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Остановка сервера...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
`;
  
  await fs.writeFile(path.join(backendPath, 'src/index.js'), serverCode);
  
  // 5. Создаем auth роут
  console.log('🔐 Создание auth роута...');
  const authRoute = `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { telegramId, username, password, role } = req.body;
    
    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Хеширование пароля
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        telegramId,
        username,
        passwordHash: hashedPassword,
        role: role || 'operator',
        isActive: false // Требует подтверждения админом
      }
    });
    
    res.status(201).json({
      message: 'Регистрация успешна. Ожидайте подтверждения администратора.',
      userId: user.id
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { telegramId, password } = req.body;
    
    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Проверка пароля
    if (user.passwordHash) {
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
      }
    }
    
    // Создание токена
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
`;
  
  await fs.writeFile(path.join(backendPath, 'src/routes/auth.js'), authRoute);
  
  // 6. Создаем machines роут
  console.log('🏭 Создание machines роута...');
  const machinesRoute = `const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все машины
router.get('/', async (req, res) => {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        location: true,
        bunkers: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.json(machines);
  } catch (error) {
    console.error('Ошибка получения машин:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить машину по ID
router.get('/:id', async (req, res) => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: req.params.id },
      include: {
        location: true,
        bunkers: {
          include: {
            ingredient: true
          }
        },
        telemetry: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });
    
    if (!machine) {
      return res.status(404).json({ error: 'Машина не найдена' });
    }
    
    res.json(machine);
  } catch (error) {
    console.error('Ошибка получения машины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать машину
router.post('/', async (req, res) => {
  try {
    const machine = await prisma.machine.create({
      data: req.body
    });
    res.status(201).json(machine);
  } catch (error) {
    console.error('Ошибка создания машины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
`;
  
  await fs.writeFile(path.join(backendPath, 'src/routes/machines.js'), machinesRoute);
  
  // 7. Создаем заглушки для остальных роутов
  const routeStub = `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Этот роут еще в разработке' });
});

module.exports = router;
`;
  
  const stubRoutes = ['inventory', 'tasks', 'recipes', 'users'];
  for (const route of stubRoutes) {
    await fs.writeFile(
      path.join(backendPath, `src/routes/${route}.js`),
      routeStub
    );
  }
  
  // 8. Создаем .env файл для backend
  console.log('🔧 Создание .env для backend...');
  const envContent = `# Скопируйте сюда переменные из основного .env файла
DATABASE_URL="${process.env.DATABASE_URL || ''}"
JWT_SECRET="${process.env.JWT_SECRET || ''}"
REDIS_URL="${process.env.REDIS_URL || ''}"
PORT=8000
`;
  
  await fs.writeFile(path.join(backendPath, '.env'), envContent);
  
  console.log('\n✅ Монолитный backend создан!');
  console.log('\n📋 Дальнейшие действия:');
  console.log('1. Перейдите в папку backend:');
  console.log('   cd backend');
  console.log('\n2. Установите зависимости:');
  console.log('   npm install');
  console.log('\n3. Сгенерируйте Prisma клиент:');
  console.log('   npx prisma generate');
  console.log('\n4. Запустите сервер:');
  console.log('   npm start');
  console.log('\n✨ Backend будет доступен на http://localhost:8000');
}

// Запуск
createMonolithBackend().catch(error => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});
