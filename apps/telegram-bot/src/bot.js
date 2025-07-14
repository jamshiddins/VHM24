
const { Telegraf, Scenes, session } = require('telegraf');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для аутентификации
bot.use(async (ctx, next) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (!user) {
      return ctx.reply('❌ Вы не зарегистрированы в системе. Обратитесь к администратору.');
    }
    
    if (user.status !== 'ACTIVE') {
      return ctx.reply('❌ Ваш аккаунт заблокирован. Обратитесь к администратору.');
    }
    
    ctx.user = user;
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return ctx.reply('❌ Ошибка авторизации. Попробуйте позже.');
  }
});

// Команда /start
bot.start(async (ctx) => {
  const user = ctx.user;
  
  const welcomeMessage = `
🎉 Добро пожаловать в VendHub!

👤 Пользователь: ${user.name}
🔑 Роль: ${user.role}

Выберите действие:
`;

  const keyboard = getMainKeyboard(user.role);
  
  return ctx.reply(welcomeMessage, keyboard);
});

// Функция для получения клавиатуры по роли
function getMainKeyboard(role) {
  const keyboards = {
    ADMIN: [
      ['👥 Пользователи', '🏭 Автоматы'],
      ['📋 Задачи', '📊 Отчеты'],
      ['⚙️ Настройки', '📝 Логи']
    ],
    MANAGER: [
      ['📋 Создать задачу', '📊 Отчеты'],
      ['🏭 Автоматы', '📦 Склад'],
      ['💰 Финансы']
    ],
    WAREHOUSE: [
      ['📦 Приемка', '📤 Выдача'],
      ['🎒 Сумки', '⚖️ Взвешивание'],
      ['📋 Инвентарь']
    ],
    OPERATOR: [
      ['🗺️ Мои маршруты', '📋 Задачи'],
      ['🔄 Замена бункеров', '💧 Замена воды'],
      ['🧽 Чистка', '💰 Инкассация']
    ],
    TECHNICIAN: [
      ['🔧 Ремонт', '🔍 Диагностика'],
      ['📋 Мои задачи']
    ]
  };
  
  return {
    reply_markup: {
      keyboard: keyboards[role] || keyboards.OPERATOR,
      resize_keyboard: true
    }
  };
}

// Обработчики для разных ролей
bot.hears('📋 Мои задачи', async (ctx) => {
  const user = ctx.user;
  
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedUserId: user.id,
        status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] }
      },
      include: {
        machine: { include: { location: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (tasks.length === 0) {
      return ctx.reply('📋 У вас нет активных задач');
    }
    
    let message = '📋 Ваши активные задачи:\n\n';
    
    tasks.forEach((task, index) => {
      message += `${index + 1}. ${task.type} - ${task.machine.internalCode}\n`;
      message += `   📍 ${task.machine.location.name}\n`;
      message += `   📅 ${task.createdAt.toLocaleDateString()}\n\n`;
    });
    
    return ctx.reply(message);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return ctx.reply('❌ Ошибка при получении задач');
  }
});

// Запуск бота
if (process.env.NODE_ENV !== 'test') {
  bot.launch();
  console.log('🤖 Telegram bot started');
}

module.exports = bot;
