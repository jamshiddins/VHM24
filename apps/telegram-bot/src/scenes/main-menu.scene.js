/**
 * FSM: main_menu_fsm
 * Назначение: Отображение главного меню, динамически адаптирующегося под роль пользователя.
 * Роли: Все пользователи.
 * Состояния:
 *   - auth_check: проверка Telegram ID и роли пользователя.
 *   - main_menu: отображение кнопок главного меню в зависимости от роли.
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('main_menu_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[main_menu_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Устанавливаем начальное состояние
    ctx.session.state = 'auth_check';
    
    // Проверка авторизации пользователя
    await handleAuthCheck(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену main_menu_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния auth_check
async function handleAuthCheck(ctx) {
  try {
    const telegramId = ctx.from.id.toString();
    
    // Проверяем, существует ли пользователь в базе
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (!user) {
      // Пользователь не найден
      await ctx.reply('⚠️ Вы не зарегистрированы в системе. Обратитесь к администратору.');
      ctx.session.state = 'unauthorized';
      return;
    }
    
    if (user.status !== 'ACTIVE') {
      // Пользователь заблокирован
      await ctx.reply('⚠️ Ваш аккаунт заблокирован. Обратитесь к администратору.');
      ctx.session.state = 'unauthorized';
      return;
    }
    
    // Сохраняем данные пользователя в сессии
    ctx.session.user = {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    
    // Переходим к отображению главного меню
    ctx.session.state = 'main_menu';
    await handleMainMenu(ctx);
  } catch (error) {
    console.error('Ошибка при проверке авторизации:', error);
    await ctx.reply('❌ Ошибка авторизации. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния main_menu
async function handleMainMenu(ctx) {
  try {
    const user = ctx.session.user;
    
    // Формируем приветственное сообщение
    const welcomeMessage = `
🎉 Добро пожаловать в VendHub!

👤 Пользователь: ${user.firstName} ${user.lastName || ''}
🔑 Роль: ${getRoleText(user.role)}

Выберите действие из меню:
`;
    
    // Получаем клавиатуру в зависимости от роли
    const keyboard = getMainKeyboard(user.role);
    
    // Отправляем сообщение с клавиатурой
    await ctx.reply(welcomeMessage, keyboard);
    
    // Логируем действие
    await logAction(user.id, 'OPEN_MAIN_MENU');
  } catch (error) {
    console.error('Ошибка при отображении главного меню:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Получение текста роли
function getRoleText(role) {
  const roles = {
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    WAREHOUSE: 'Складской работник',
    OPERATOR: 'Оператор',
    TECHNICIAN: 'Техник',
    DRIVER: 'Водитель'
  };
  
  return roles[role] || 'Пользователь';
}

// Получение клавиатуры в зависимости от роли
function getMainKeyboard(role) {
  const keyboards = {
    ADMIN: [
      ['👥 Пользователи', '🏭 Автоматы'],
      ['📋 Задачи', '📊 Отчеты'],
      ['📚 Справочники', '⚙️ Настройки']
    ],
    MANAGER: [
      ['📋 Создать задачу', '📊 Отчеты'],
      ['🏭 Автоматы', '💰 Финансы'],
      ['📚 Справочники']
    ],
    WAREHOUSE: [
      ['📦 Приемка', '📤 Выдача'],
      ['🎒 Сумки', '📋 Мои задачи'],
      ['📊 Инвентаризация']
    ],
    OPERATOR: [
      ['🗺️ Мои маршруты', '📋 Мои задачи'],
      ['🔄 Замена бункеров', '💧 Замена воды'],
      ['🧹 Чистка', '💰 Инкассация']
    ],
    TECHNICIAN: [
      ['🔧 Ремонт', '🔍 Диагностика'],
      ['📋 Мои задачи', '📊 Отчеты']
    ]
  };
  
  return Markup.keyboard(keyboards[role] || keyboards.OPERATOR).resize();
}

// Логирование действий пользователя
async function logAction(userId, action, details = {}) {
  try {
    await prisma.userLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Ошибка при логировании действия:', error);
  }
}

// Обработка кнопок главного меню
scene.hears('👥 Пользователи', async (ctx) => {
  if (ctx.session.user?.role === 'ADMIN') {
    await ctx.scene.enter('user_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к этому разделу.');
  }
});

scene.hears('🏭 Автоматы', async (ctx) => {
  // Переход к сцене управления автоматами
  // В будущем можно добавить отдельную сцену для этого
  try {
    const response = await prisma.machine.findMany({
      include: {
        location: true
      }
    });
    
    if (response.length === 0) {
      await ctx.reply('📭 Автоматы не найдены');
      return;
    }
    
    let message = '🏪 Список автоматов:\n\n';
    
    response.forEach((machine, index) => {
      const statusIcon = machine.status === 'ACTIVE' ? '🟢' : 
                       machine.status === 'MAINTENANCE' ? '🟡' : '🔴';
      
      message += `${index + 1}. ${machine.name || machine.internalCode}\n`;
      message += `   📍 ${machine.location?.name || 'Не указано'}\n`;
      message += `   🏷️ ${machine.model || 'Неизвестно'}\n`;
      message += `   ${statusIcon} ${machine.status || 'Неизвестно'}\n\n`;
    });
    
    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка при получении списка автоматов:', error);
    await ctx.reply('❌ Ошибка при получении списка автоматов');
  }
});

scene.hears('📋 Задачи', async (ctx) => {
  await ctx.scene.enter('task_execution_fsm');
});

scene.hears('📋 Создать задачу', async (ctx) => {
  if (['ADMIN', 'MANAGER'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('task_create_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к созданию задач.');
  }
});

scene.hears('📋 Мои задачи', async (ctx) => {
  await ctx.scene.enter('task_execution_fsm');
});

scene.hears('📊 Отчеты', async (ctx) => {
  if (['ADMIN', 'MANAGER'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('report_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к отчетам.');
  }
});

scene.hears('📚 Справочники', async (ctx) => {
  if (['ADMIN', 'MANAGER'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('directory_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к справочникам.');
  }
});

scene.hears('⚙️ Настройки', async (ctx) => {
  if (ctx.session.user?.role === 'ADMIN') {
    await ctx.scene.enter('admin_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к настройкам.');
  }
});

scene.hears('💰 Финансы', async (ctx) => {
  if (['ADMIN', 'MANAGER'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('finance_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к финансам.');
  }
});

scene.hears('📦 Приемка', async (ctx) => {
  if (['ADMIN', 'WAREHOUSE'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('warehouse_receive_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к приемке товаров.');
  }
});

scene.hears('📤 Выдача', async (ctx) => {
  if (['ADMIN', 'WAREHOUSE'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('warehouse_return_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к выдаче товаров.');
  }
});

scene.hears('🎒 Сумки', async (ctx) => {
  if (['ADMIN', 'WAREHOUSE'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('bag_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к управлению сумками.');
  }
});

scene.hears('📊 Инвентаризация', async (ctx) => {
  if (['ADMIN', 'WAREHOUSE'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('warehouse_check_inventory_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к инвентаризации.');
  }
});

scene.hears('🗺️ Мои маршруты', async (ctx) => {
  if (['ADMIN', 'OPERATOR'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для маршрутов
    await ctx.reply('🚧 Раздел "Мои маршруты" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к маршрутам.');
  }
});

scene.hears('🔄 Замена бункеров', async (ctx) => {
  if (['ADMIN', 'OPERATOR'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для замены бункеров
    await ctx.reply('🚧 Раздел "Замена бункеров" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к замене бункеров.');
  }
});

scene.hears('💧 Замена воды', async (ctx) => {
  if (['ADMIN', 'OPERATOR'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для замены воды
    await ctx.reply('🚧 Раздел "Замена воды" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к замене воды.');
  }
});

scene.hears('🧹 Чистка', async (ctx) => {
  if (['ADMIN', 'OPERATOR'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для чистки
    await ctx.reply('🚧 Раздел "Чистка" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к чистке.');
  }
});

scene.hears('💰 Инкассация', async (ctx) => {
  if (['ADMIN', 'OPERATOR'].includes(ctx.session.user?.role)) {
    await ctx.scene.enter('cash_fsm');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к инкассации.');
  }
});

scene.hears('🔧 Ремонт', async (ctx) => {
  if (['ADMIN', 'TECHNICIAN'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для ремонта
    await ctx.reply('🚧 Раздел "Ремонт" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к ремонту.');
  }
});

scene.hears('🔍 Диагностика', async (ctx) => {
  if (['ADMIN', 'TECHNICIAN'].includes(ctx.session.user?.role)) {
    // Здесь можно добавить отдельную сцену для диагностики
    await ctx.reply('🚧 Раздел "Диагностика" находится в разработке.');
  } else {
    await ctx.reply('⚠️ У вас нет доступа к диагностике.');
  }
});

// Обработка команды /start
scene.command('start', async (ctx) => {
  // Сбрасываем состояние и начинаем сначала
  ctx.session.state = 'auth_check';
  await handleAuthCheck(ctx);
});

// Обработка команды /help
scene.command('help', async (ctx) => {
  const helpMessage = `
📋 Доступные команды:

/start - Начать сначала
/help - Показать эту справку
/menu - Вернуться в главное меню

Для навигации используйте кнопки меню.
`;
  
  await ctx.reply(helpMessage);
});

// Обработка команды /menu
scene.command('menu', async (ctx) => {
  // Возвращаемся в главное меню
  ctx.session.state = 'main_menu';
  await handleMainMenu(ctx);
});

// Обработка неизвестных сообщений
scene.on('message', async (ctx) => {
  await ctx.reply('❓ Не понимаю эту команду. Используйте кнопки меню или /help для справки.');
});

module.exports = scene;
