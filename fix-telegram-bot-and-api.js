const fs = require('fs');
const path = require('path');



// 1. Исправляем machines.js
const machinesRoute = `const express = require('express');
const router = express.Router();

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const machines = [
      { 
        id: '1',
        name: 'Coffee Machine #1',
        model: 'CM-2000',
        location: 'Office Floor 1',
        status: 'ACTIVE'
      },
      { 
        id: '2',
        name: 'Snack Machine #1',
        model: 'SM-1500',
        location: 'Office Floor 2',
        status: 'ACTIVE'
      },
      { 
        id: '3',
        name: 'Beverage Machine #1',
        model: 'BM-1000',
        location: 'Lobby',
        status: 'MAINTENANCE'
      }
    ];
    
    res.json(machines);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/machines/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const machine = { 
      id,
      name: \`Machine #\${id}\`,
      model: 'Generic Model',
      location: 'Unknown Location',
      status: 'ACTIVE'
    };
    
    res.json(machine);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/machines
router.post('/', async (req, res) => {
  try {
    const { name, model, location } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Machine name is required' });
    }

    const machine = {
      id: Date.now().toString(),
      name,
      model: model || 'Unknown Model',
      location: location || 'Unknown Location',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ machine, message: 'Machine created successfully' });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;`;

// 2. Создаем маршрут для задач
const tasksRoute = `const express = require('express');
const router = express.Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const tasks = [
      {
        id: '1',
        title: 'Заправка кофе-машины #1',
        type: 'REFILL',
        status: 'PENDING',
        machineId: '1',
        assignedTo: userId || '123456789',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        description: 'Заправить кофе и молоко'
      },
      {
        id: '2',
        title: 'Техническое обслуживание',
        type: 'MAINTENANCE',
        status: 'IN_PROGRESS',
        machineId: '2',
        assignedTo: userId || '123456789',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        description: 'Проверка и чистка автомата'
      }
    ];
    
    // Фильтруем задачи по пользователю если указан
    const filteredTasks = userId ? 
      tasks.filter(task => task.assignedTo === userId) : 
      tasks;
    
    res.json(filteredTasks);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = {
      id,
      title: \`Task #\${id}\`,
      type: 'GENERAL',
      status: 'PENDING',
      machineId: '1',
      assignedTo: '123456789',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'General task description'
    };
    
    res.json(task);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title, type, machineId, assignedTo, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = {
      id: Date.now().toString(),
      title,
      type: type || 'GENERAL',
      status: 'PENDING',
      machineId,
      assignedTo,
      description,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ task, message: 'Task created successfully' });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;`;

// 3. Создаем маршрут для health check
const healthRoute = `const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'VHM24 API'
  });
});

module.exports = router;`;

// 4. Улучшенный Telegram бот
const telegramBot = `require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'process.env.API_URL/api';

if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
}

// Создание бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware для логирования
bot.use((ctx, next) => {
    
    return next();
});

// Главное меню
const mainMenu = Markup.keyboard([
    ['🏪 Автоматы', '📋 Мои задачи'],
    ['📊 Статус системы', '👤 Профиль'],
    ['❓ Помощь']
]).resize();

// Команда /start
bot.start((ctx) => {
    const welcomeMessage = \`
🤖 Добро пожаловать в VHM24 (VendHub Manager)!

Система управления вендинговыми автоматами.

Выберите действие из меню ниже:
    \`;
    
    ctx.reply(welcomeMessage, mainMenu);
});

// Команда /help
bot.help((ctx) => {
    const helpMessage = \`
📋 Доступные команды:

🏪 Автоматы - Список всех автоматов
📋 Мои задачи - Ваши текущие задачи
📊 Статус системы - Проверка работы API
👤 Профиль - Информация о вашем аккаунте

🔧 Система VHM24 v1.0
Для получения полного доступа обратитесь к администратору.
    \`;
    
    ctx.reply(helpMessage, mainMenu);
});

// Обработка кнопок меню
bot.hears('🏪 Автоматы', async (ctx) => {
    await handleMachinesCommand(ctx);
});

bot.hears('📋 Мои задачи', async (ctx) => {
    await handleTasksCommand(ctx);
});

bot.hears('📊 Статус системы', async (ctx) => {
    await handleStatusCommand(ctx);
});

bot.hears('👤 Профиль', (ctx) => {
    handleProfileCommand(ctx);
});

bot.hears('❓ Помощь', (ctx) => {
    ctx.reply(\`
📋 Доступные функции:

🏪 Автоматы - Просмотр списка всех вендинговых автоматов
📋 Мои задачи - Ваши назначенные задачи и их статус
📊 Статус системы - Проверка работоспособности API
👤 Профиль - Ваша информация в системе

Для навигации используйте кнопки меню.
    \`, mainMenu);
});

// Команда /status
async function handleStatusCommand(ctx) {
    try {
        ctx.reply('🔄 Проверяю статус системы...');
        
        const response = await axios.get(\`\${API_BASE_URL}/health\`, {
            timeout: 5000
        });
        
        const data = response.data;
        const statusMessage = \`
✅ Система работает нормально

📊 Статус API: \${response.status === 200 ? 'OK' : 'Ошибка'}
🕐 Время работы: \${Math.floor(data.uptime / 60)} мин
📅 Последняя проверка: \${new Date().toLocaleString('ru-RU')}
🔧 Версия: \${data.version || '1.0.0'}
        \`;
        
        ctx.reply(statusMessage, mainMenu);
    } catch (error) {
        console.error('Ошибка проверки статуса:', error.message);
        ctx.reply(\`
❌ Ошибка подключения к API

🔍 Возможные причины:
• API сервер не запущен
• Проблемы с сетью
• Неверный URL API

Обратитесь к администратору.
        \`, mainMenu);
    }
}

// Команда /machines
async function handleMachinesCommand(ctx) {
    try {
        ctx.reply('🔄 Загружаю список автоматов...');
        
        const response = await axios.get(\`\${API_BASE_URL}/machines\`, {
            timeout: 5000
        });
        
        const machines = response.data;
        
        if (machines && machines.length > 0) {
            let message = '🏪 Список автоматов:\\n\\n';
            machines.forEach((machine, index) => {
                const statusIcon = machine.status === 'ACTIVE' ? '🟢' : 
                                 machine.status === 'MAINTENANCE' ? '🟡' : '🔴';
                
                message += \`\${index + 1}. \${machine.name || machine.id}\\n\`;
                message += \`   📍 \${machine.location || 'Не указано'}\\n\`;
                message += \`   🏷️ \${machine.model || 'Неизвестно'}\\n\`;
                message += \`   \${statusIcon} \${machine.status || 'Неизвестно'}\\n\\n\`;
            });
            
            ctx.reply(message, mainMenu);
        } else {
            ctx.reply('📭 Автоматы не найдены', mainMenu);
        }
    } catch (error) {
        console.error('Ошибка получения автоматов:', error.message);
        ctx.reply(\`
❌ Ошибка получения списка автоматов

🔍 Проверьте:
• Подключение к API
• Права доступа

Попробуйте позже или обратитесь к администратору.
        \`, mainMenu);
    }
}

// Команда /tasks
async function handleTasksCommand(ctx) {
    try {
        ctx.reply('🔄 Загружаю ваши задачи...');
        
        const userId = ctx.from.id;
        const response = await axios.get(\`\${API_BASE_URL}/tasks?userId=\${userId}\`, {
            timeout: 5000
        });
        
        const tasks = response.data;
        
        if (tasks && tasks.length > 0) {
            let message = '📋 Ваши задачи:\\n\\n';
            tasks.forEach((task, index) => {
                const statusIcon = task.status === 'PENDING' ? '⏳' : 
                                 task.status === 'IN_PROGRESS' ? '🔄' : 
                                 task.status === 'COMPLETED' ? '✅' : '❓';
                
                const dueDate = task.dueDate ? 
                    new Date(task.dueDate).toLocaleDateString('ru-RU') : 
                    'Без срока';
                
                message += \`\${index + 1}. \${task.title || task.type}\\n\`;
                message += \`   📅 Срок: \${dueDate}\\n\`;
                message += \`   \${statusIcon} \${task.status || 'Новая'}\\n\`;
                if (task.description) {
                    message += \`   📝 \${task.description}\\n\`;
                }
                message += \`\\n\`;
            });
            
            ctx.reply(message, mainMenu);
        } else {
            ctx.reply(\`
📭 У вас нет активных задач

Возможные причины:
• Задачи еще не назначены
• Все задачи выполнены
• Проблемы с загрузкой данных

Обратитесь к менеджеру для получения новых задач.
            \`, mainMenu);
        }
    } catch (error) {
        console.error('Ошибка получения задач:', error.message);
        ctx.reply(\`
❌ Ошибка получения задач

🔍 Проверьте подключение к системе.
Попробуйте позже или обратитесь к администратору.
        \`, mainMenu);
    }
}

// Команда /profile
function handleProfileCommand(ctx) {
    const user = ctx.from;
    const profileMessage = \`
👤 Ваш профиль:

🆔 ID: \${user.id}
👤 Имя: \${user.first_name || 'Не указано'}
👤 Фамилия: \${user.last_name || 'Не указано'}
📝 Username: @\${user.username || 'Не указано'}
🌐 Язык: \${user.language_code || 'Не указано'}

🔧 Роль в системе: Пользователь
📅 Дата регистрации: \${new Date().toLocaleDateString('ru-RU')}

Для настройки роли и прав доступа обратитесь к администратору.
    \`;
    
    ctx.reply(profileMessage, mainMenu);
}

// Обработка неизвестных команд и текста
bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply(\`
🤔 Я не понимаю это сообщение.

Используйте кнопки меню для навигации или команду /help для получения справки.
        \`, mainMenu);
    }
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('❌ Ошибка бота:', err);
    ctx.reply('❌ Произошла ошибка. Попробуйте позже.', mainMenu);
});

// Запуск бота
async function startBot() {
    try {
        
        
        // Проверка подключения к API
        try {
            const response = await axios.get(\`\${API_BASE_URL}/health\`, { timeout: 5000 });
            
        } catch (error) {
            
            
        }
        
        await bot.launch();
        
        
        
        // Graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('❌ Ошибка запуска бота:', error);
        process.exit(1);
    }
}

// Запуск
if (require.main === module) {
    startBot();
}

module.exports = { bot, startBot };`;

// Записываем исправленные файлы
try {
    // Исправляем machines.js
    fs.writeFileSync('backend/src/routes/machines.js', machinesRoute);
    

    // Создаем tasks.js если его нет или исправляем
    fs.writeFileSync('backend/src/routes/tasks.js', tasksRoute);
    

    // Создаем health.js
    fs.writeFileSync('backend/src/routes/health.js', healthRoute);
    

    // Обновляем Telegram бот
    fs.writeFileSync('apps/telegram-bot/src/index.js', telegramBot);
    

    
    
    
    
    
    
    
    

} catch (error) {
    console.error('❌ Ошибка при записи файлов:', error);
}
