const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const apiService = require('../../services/api');
const logger = require('../../utils/logger');

/**
 * Регистрирует обработчики для роли WAREHOUSE
 * @param {Object} bot - Экземпляр бота Telegraf
 * @param {Function} requireRole - Функция для проверки роли
 */
const register = (bot, requireRole) => {
  // Обработчик для просмотра запасов на складе
  bot.action('warehouse_inventory', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await viewInventoryHandler(ctx);
    } catch (error) {
      logger.error('Error in warehouse_inventory action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для обновления запасов
  bot.action('update_inventory', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await updateInventoryHandler(ctx);
    } catch (error) {
      logger.error('Error in update_inventory action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для заказа поставок
  bot.action('order_supplies', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await orderSuppliesHandler(ctx);
    } catch (error) {
      logger.error('Error in order_supplies action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для управления сумками
  bot.action('warehouse_bags', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await manageBagsHandler(ctx);
    } catch (error) {
      logger.error('Error in warehouse_bags action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для мойки бункеров
  bot.action('warehouse_wash', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await washBunkersHandler(ctx);
    } catch (error) {
      logger.error('Error in warehouse_wash action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для обновления конкретного товара
  bot.action(/^update_item_(\d+)$/, requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      const itemId = ctx.match[1];
      
      // Сохраняем ID товара в сессии
      if (ctx.session) {
        ctx.session.updateItemId = itemId;
      }
      
      await ctx.reply('Введите новое количество:');
      
      // Устанавливаем состояние бота
      if (ctx.scene && ctx.scene.enter) {
        await ctx.scene.enter(BOT_STATES.WAREHOUSE_UPDATE_ITEM);
      }
      
      logger.info(`User ${ctx.from.id} is updating item ${itemId}`);
    } catch (error) {
      logger.error('Error in update_item action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для заказа конкретного товара
  bot.action(/^order_item_(\d+)$/, requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      const itemId = ctx.match[1];
      
      // Сохраняем ID товара в сессии
      if (ctx.session) {
        ctx.session.orderItemId = itemId;
      }
      
      await ctx.reply('Введите количество для заказа:');
      
      // Устанавливаем состояние бота
      if (ctx.scene && ctx.scene.enter) {
        await ctx.scene.enter(BOT_STATES.WAREHOUSE_ORDER_ITEM);
      }
      
      logger.info(`User ${ctx.from.id} is ordering item ${itemId}`);
    } catch (error) {
      logger.error('Error in order_item action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для возврата к просмотру запасов
  bot.action('view_inventory', requireRole(['WAREHOUSE', 'ADMIN']), async (ctx) => {
    try {
      await viewInventoryHandler(ctx);
    } catch (error) {
      logger.error('Error in view_inventory action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  logger.info('Warehouse handlers registered');
};

// Обработчик для просмотра запасов на складе
const viewInventoryHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const inventory = [
      { id: '1', name: 'Кофе в зернах', quantity: 25, unit: 'кг', status: 'IN_STOCK' },
      { id: '2', name: 'Молоко', quantity: 15, unit: 'л', status: 'LOW_STOCK' },
      { id: '3', name: 'Сахар', quantity: 30, unit: 'кг', status: 'IN_STOCK' },
      { id: '4', name: 'Стаканчики', quantity: 500, unit: 'шт', status: 'IN_STOCK' },
      { id: '5', name: 'Крышки', quantity: 5, unit: 'уп', status: 'CRITICAL_STOCK' }
    ];
    
    // Формируем сообщение со списком запасов
    let message = '📦 *Текущие запасы на складе:*\n\n';
    
    inventory.forEach((item, index) => {
      const status = getStatusText(item.status);
      
      message += `*${index + 1}. ${item.name}*\n`;
      message += `📊 Количество: ${item.quantity} ${item.unit}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для управления запасами
    const keyboard = [
      [
        Markup.button.callback('🔄 Обновить запасы', 'update_inventory'),
        Markup.button.callback('➕ Добавить товар', 'add_inventory')
      ],
      [
        Markup.button.callback('📋 Заказать поставку', 'order_supplies'),
        Markup.button.callback('📊 Аналитика расхода', 'inventory_analytics')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.WAREHOUSE_INVENTORY);
    }
    
    logger.info(`User ${ctx.from.id} viewed inventory`);
  } catch (error) {
    logger.error('Error in view inventory handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о запасах. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для обновления запасов
const updateInventoryHandler = async (ctx) => {
  try {
    // Создаем клавиатуру для выбора товара для обновления
    const inventory = [
      { id: '1', name: 'Кофе в зернах' },
      { id: '2', name: 'Молоко' },
      { id: '3', name: 'Сахар' },
      { id: '4', name: 'Стаканчики' },
      { id: '5', name: 'Крышки' }
    ];
    
    const keyboard = inventory.map(item => [
      Markup.button.callback(`${item.name}`, `update_item_${item.id}`)
    ]);
    
    // Добавляем кнопку возврата
    keyboard.push([Markup.button.callback('🔙 Назад', 'view_inventory')]);
    
    await ctx.reply('Выберите товар для обновления:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} is updating inventory`);
  } catch (error) {
    logger.error('Error in update inventory handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для заказа поставки
const orderSuppliesHandler = async (ctx) => {
  try {
    // Создаем клавиатуру для выбора товара для заказа
    const inventory = [
      { id: '1', name: 'Кофе в зернах' },
      { id: '2', name: 'Молоко' },
      { id: '3', name: 'Сахар' },
      { id: '4', name: 'Стаканчики' },
      { id: '5', name: 'Крышки' }
    ];
    
    const keyboard = inventory.map(item => [
      Markup.button.callback(`${item.name}`, `order_item_${item.id}`)
    ]);
    
    // Добавляем кнопку возврата
    keyboard.push([Markup.button.callback('🔙 Назад', 'view_inventory')]);
    
    await ctx.reply('Выберите товар для заказа поставки:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} is ordering supplies`);
  } catch (error) {
    logger.error('Error in order supplies handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления статуса
const getStatusText = (status) => {
  const statusMap = {
    'IN_STOCK': '✅ В наличии',
    'LOW_STOCK': '⚠️ Мало',
    'CRITICAL_STOCK': '❌ Критически мало',
    'OUT_OF_STOCK': '❗ Отсутствует'
  };
  
  return statusMap[status] || status;
};

/**
 * Обработчик для управления сумками
 * @param {Object} ctx - Контекст Telegraf
 */
const manageBagsHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const bags = [
      { id: '1', code: 'BAG001', status: 'IN_USE', location: 'Автомат #101', lastChecked: '2025-07-10' },
      { id: '2', code: 'BAG002', status: 'AVAILABLE', location: 'Склад', lastChecked: '2025-07-12' },
      { id: '3', code: 'BAG003', status: 'MAINTENANCE', location: 'Ремонт', lastChecked: '2025-07-08' },
      { id: '4', code: 'BAG004', status: 'IN_USE', location: 'Автомат #102', lastChecked: '2025-07-11' },
      { id: '5', code: 'BAG005', status: 'AVAILABLE', location: 'Склад', lastChecked: '2025-07-13' }
    ];
    
    // Формируем сообщение со списком сумок
    let message = '👜 *Управление сумками:*\n\n';
    
    bags.forEach((bag, index) => {
      const status = getBagStatusText(bag.status);
      
      message += `*${index + 1}. ${bag.code}*\n`;
      message += `📍 Местоположение: ${bag.location}\n`;
      message += `🔄 Статус: ${status}\n`;
      message += `📅 Последняя проверка: ${bag.lastChecked}\n\n`;
    });
    
    // Создаем клавиатуру для управления сумками
    const keyboard = [
      [
        Markup.button.callback('🔄 Обновить статус', 'update_bag_status'),
        Markup.button.callback('📋 Инвентаризация', 'inventory_bags')
      ],
      [
        Markup.button.callback('➕ Добавить сумку', 'add_bag'),
        Markup.button.callback('🔍 Найти по QR', 'scan_bag_qr')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.WAREHOUSE_BAGS);
    }
    
    logger.info(`User ${ctx.from.id} viewed bags management`);
  } catch (error) {
    logger.error('Error in manage bags handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о сумках. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для мойки бункеров
 * @param {Object} ctx - Контекст Telegraf
 */
const washBunkersHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const bunkers = [
      { id: '1', code: 'BNK001', type: 'Кофе', lastWashed: '2025-07-05', status: 'NEEDS_WASHING' },
      { id: '2', code: 'BNK002', type: 'Молоко', lastWashed: '2025-07-10', status: 'CLEAN' },
      { id: '3', code: 'BNK003', type: 'Сахар', lastWashed: '2025-07-08', status: 'CLEAN' },
      { id: '4', code: 'BNK004', type: 'Шоколад', lastWashed: '2025-07-01', status: 'NEEDS_WASHING' },
      { id: '5', code: 'BNK005', type: 'Чай', lastWashed: '2025-07-12', status: 'CLEAN' }
    ];
    
    // Формируем сообщение со списком бункеров
    let message = '🧼 *Мойка бункеров:*\n\n';
    
    bunkers.forEach((bunker, index) => {
      const status = getBunkerStatusText(bunker.status);
      
      message += `*${index + 1}. ${bunker.code} (${bunker.type})*\n`;
      message += `🔄 Статус: ${status}\n`;
      message += `📅 Последняя мойка: ${bunker.lastWashed}\n\n`;
    });
    
    // Создаем клавиатуру для управления мойкой бункеров
    const keyboard = [
      [
        Markup.button.callback('✅ Отметить как вымытый', 'mark_bunker_washed'),
        Markup.button.callback('📋 Чек-лист мойки', 'bunker_wash_checklist')
      ],
      [
        Markup.button.callback('📊 Статистика мойки', 'bunker_wash_stats'),
        Markup.button.callback('📝 Журнал мойки', 'bunker_wash_log')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.WAREHOUSE_WASH);
    }
    
    logger.info(`User ${ctx.from.id} viewed bunker washing`);
  } catch (error) {
    logger.error('Error in wash bunkers handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о бункерах. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления статуса сумки
const getBagStatusText = (status) => {
  const statusMap = {
    'IN_USE': '🔄 Используется',
    'AVAILABLE': '✅ Доступна',
    'MAINTENANCE': '🔧 На обслуживании',
    'LOST': '❓ Утеряна',
    'DAMAGED': '❌ Повреждена'
  };
  
  return statusMap[status] || status;
};

// Вспомогательная функция для получения текстового представления статуса бункера
const getBunkerStatusText = (status) => {
  const statusMap = {
    'CLEAN': '✅ Чистый',
    'NEEDS_WASHING': '🧼 Требует мойки',
    'IN_WASHING': '🔄 В процессе мойки',
    'DAMAGED': '❌ Поврежден'
  };
  
  return statusMap[status] || status;
};

module.exports = {
  viewInventoryHandler,
  updateInventoryHandler,
  orderSuppliesHandler,
  manageBagsHandler,
  washBunkersHandler,
  register
};
