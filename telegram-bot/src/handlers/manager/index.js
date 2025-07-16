const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const apiService = require('../../services/api');
const logger = require('../../utils/logger');

/**
 * Регистрирует обработчики для роли MANAGER
 * @param {Object} bot - Экземпляр бота Telegraf
 * @param {Function} requireRole - Функция для проверки роли
 */
const register = (bot, requireRole) => {
  // Обработчик для просмотра аналитики
  bot.action('manager_analytics', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await viewAnalyticsHandler(ctx);
    } catch (error) {
      logger.error('Error in manager_analytics action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для создания задачи
  bot.action('manager_create_task', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await createTaskHandler(ctx);
    } catch (error) {
      logger.error('Error in manager_create_task action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для выбора типа задачи
  bot.action(/^task_type_(\w+)$/, requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await selectTaskTypeHandler(ctx);
    } catch (error) {
      logger.error('Error in task_type action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для управления маршрутами
  bot.action('manager_routes', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await manageRoutesHandler(ctx);
    } catch (error) {
      logger.error('Error in manager_routes action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для планирования задач
  bot.action('manager_schedule', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await scheduleTasksHandler(ctx);
    } catch (error) {
      logger.error('Error in manager_schedule action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для детальной аналитики
  bot.action('detailed_analytics', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await detailedAnalyticsHandler(ctx);
    } catch (error) {
      logger.error('Error in detailed_analytics action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для экспорта отчета
  bot.action('export_report', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await exportReportHandler(ctx);
    } catch (error) {
      logger.error('Error in export_report action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для выбора автомата для задачи
  bot.action(/^task_machine_(\d+)$/, requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      const machineId = ctx.match[1];
      
      // Сохраняем ID автомата в сессии
      if (ctx.session) {
        ctx.session.taskMachineId = machineId;
      }
      
      // Получаем список операторов из сессии
      const operators = ctx.session?.operators || [
        { id: '1', name: 'Иван Иванов' },
        { id: '2', name: 'Петр Петров' },
        { id: '3', name: 'Сидор Сидоров' }
      ];
      
      // Создаем клавиатуру для выбора оператора
      const keyboard = operators.map(operator => [
        Markup.button.callback(operator.name, `task_operator_${operator.id}`)
      ]);
      
      // Добавляем кнопку возврата
      keyboard.push([Markup.button.callback('🔙 Назад', 'create_task')]);
      
      await ctx.reply('Выберите оператора для задачи:', Markup.inlineKeyboard(keyboard));
      
      logger.info(`User ${ctx.from.id} selected machine ${machineId} for task`);
    } catch (error) {
      logger.error('Error in task_machine action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для возврата к созданию задачи
  bot.action('create_task', requireRole(['MANAGER', 'ADMIN']), async (ctx) => {
    try {
      await createTaskHandler(ctx);
    } catch (error) {
      logger.error('Error in create_task action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  logger.info('Manager handlers registered');
};

// Обработчик для просмотра аналитики
const viewAnalyticsHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const analytics = {
      sales: {
        today: 1250,
        week: 8750,
        month: 32500
      },
      machines: {
        total: 15,
        active: 12,
        inactive: 3
      },
      products: {
        mostPopular: 'Капучино',
        leastPopular: 'Американо'
      },
      tasks: {
        completed: 25,
        pending: 8,
        overdue: 2
      }
    };
    
    // Формируем сообщение с аналитикой
    let message = '📊 *Аналитика системы:*\n\n';
    
    message += '*Продажи:*\n';
    message += `📅 Сегодня: ${analytics.sales.today} руб.\n`;
    message += `📆 За неделю: ${analytics.sales.week} руб.\n`;
    message += `📆 За месяц: ${analytics.sales.month} руб.\n\n`;
    
    message += '*Автоматы:*\n';
    message += `📊 Всего: ${analytics.machines.total}\n`;
    message += `✅ Активных: ${analytics.machines.active}\n`;
    message += `❌ Неактивных: ${analytics.machines.inactive}\n\n`;
    
    message += '*Продукты:*\n';
    message += `🔝 Самый популярный: ${analytics.products.mostPopular}\n`;
    message += `⬇️ Наименее популярный: ${analytics.products.leastPopular}\n\n`;
    
    message += '*Задачи:*\n';
    message += `✅ Выполнено: ${analytics.tasks.completed}\n`;
    message += `⏳ В ожидании: ${analytics.tasks.pending}\n`;
    message += `⚠️ Просрочено: ${analytics.tasks.overdue}\n`;
    
    // Создаем клавиатуру для управления аналитикой
    const keyboard = [
      [
        Markup.button.callback('📊 Детальная аналитика', 'detailed_analytics'),
        Markup.button.callback('📈 Экспорт отчета', 'export_report')
      ],
      [
        Markup.button.callback('📅 По дням', 'analytics_by_day'),
        Markup.button.callback('📆 По неделям', 'analytics_by_week'),
        Markup.button.callback('📆 По месяцам', 'analytics_by_month')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MANAGER_ANALYTICS);
    }
    
    logger.info(`User ${ctx.from.id} viewed analytics`);
  } catch (error) {
    logger.error('Error in view analytics handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении аналитики. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для создания задачи
const createTaskHandler = async (ctx) => {
  try {
    // Получаем список операторов
    const operators = [
      { id: '1', name: 'Иван Иванов' },
      { id: '2', name: 'Петр Петров' },
      { id: '3', name: 'Сидор Сидоров' }
    ];
    
    // Получаем список автоматов
    const machines = [
      { id: '101', name: 'Кофейный автомат #101' },
      { id: '102', name: 'Кофейный автомат #102' },
      { id: '103', name: 'Кофейный автомат #103' }
    ];
    
    // Сохраняем данные в сессии
    if (ctx.session) {
      ctx.session.operators = operators;
      ctx.session.machines = machines;
    }
    
    // Создаем клавиатуру для выбора типа задачи
    const keyboard = [
      [Markup.button.callback('🔧 Техническое обслуживание', 'task_type_maintenance')],
      [Markup.button.callback('🧹 Чистка автомата', 'task_type_cleaning')],
      [Markup.button.callback('📦 Пополнение ингредиентов', 'task_type_refill')],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.reply('Выберите тип задачи:', Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MANAGER_CREATE_TASK);
    }
    
    logger.info(`User ${ctx.from.id} is creating a task`);
  } catch (error) {
    logger.error('Error in create task handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для выбора типа задачи
const selectTaskTypeHandler = async (ctx) => {
  try {
    // Получаем тип задачи из callback_data
    const taskType = ctx.callbackQuery.data.split('_')[2];
    
    // Сохраняем тип задачи в сессии
    if (ctx.session) {
      ctx.session.taskType = taskType;
    }
    
    // Получаем список автоматов из сессии
    const machines = ctx.session?.machines || [
      { id: '101', name: 'Кофейный автомат #101' },
      { id: '102', name: 'Кофейный автомат #102' },
      { id: '103', name: 'Кофейный автомат #103' }
    ];
    
    // Создаем клавиатуру для выбора автомата
    const keyboard = machines.map(machine => [
      Markup.button.callback(machine.name, `task_machine_${machine.id}`)
    ]);
    
    // Добавляем кнопку возврата
    keyboard.push([Markup.button.callback('🔙 Назад', 'create_task')]);
    
    await ctx.reply('Выберите автомат для задачи:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} selected task type: ${taskType}`);
  } catch (error) {
    logger.error('Error in select task type handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для управления маршрутами
 * @param {Object} ctx - Контекст Telegraf
 */
const manageRoutesHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const routes = [
      { id: '1', name: 'Маршрут #1', operator: 'Иван Иванов', machines: ['101', '102', '103'], status: 'ACTIVE' },
      { id: '2', name: 'Маршрут #2', operator: 'Петр Петров', machines: ['104', '105'], status: 'ACTIVE' },
      { id: '3', name: 'Маршрут #3', operator: 'Сидор Сидоров', machines: ['106', '107', '108', '109'], status: 'INACTIVE' }
    ];
    
    // Формируем сообщение со списком маршрутов
    let message = '🚗 *Управление маршрутами:*\n\n';
    
    routes.forEach((route, index) => {
      const status = getRouteStatusText(route.status);
      
      message += `*${index + 1}. ${route.name}*\n`;
      message += `👨‍💼 Оператор: ${route.operator}\n`;
      message += `🔢 Количество автоматов: ${route.machines.length}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для управления маршрутами
    const keyboard = [
      [
        Markup.button.callback('➕ Создать маршрут', 'create_route'),
        Markup.button.callback('✏️ Редактировать маршрут', 'edit_route')
      ],
      [
        Markup.button.callback('🗑 Удалить маршрут', 'delete_route'),
        Markup.button.callback('📊 Статистика маршрутов', 'route_stats')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MANAGER_ROUTES);
    }
    
    logger.info(`User ${ctx.from.id} viewed routes management`);
  } catch (error) {
    logger.error('Error in manage routes handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о маршрутах. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для планирования задач
 * @param {Object} ctx - Контекст Telegraf
 */
const scheduleTasksHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const scheduledTasks = [
      { id: '1', type: 'Техническое обслуживание', machine: 'Автомат #101', operator: 'Иван Иванов', scheduledDate: '2025-07-20', status: 'PENDING' },
      { id: '2', type: 'Пополнение ингредиентов', machine: 'Автомат #102', operator: 'Петр Петров', scheduledDate: '2025-07-18', status: 'PENDING' },
      { id: '3', type: 'Инкассация', machine: 'Автомат #103', operator: 'Сидор Сидоров', scheduledDate: '2025-07-25', status: 'PENDING' }
    ];
    
    // Формируем сообщение со списком запланированных задач
    let message = '📅 *Планирование задач:*\n\n';
    
    scheduledTasks.forEach((task, index) => {
      const status = getTaskStatusText(task.status);
      
      message += `*${index + 1}. ${task.type}*\n`;
      message += `📍 Автомат: ${task.machine}\n`;
      message += `👨‍💼 Оператор: ${task.operator}\n`;
      message += `📅 Дата: ${task.scheduledDate}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для планирования задач
    const keyboard = [
      [
        Markup.button.callback('➕ Запланировать задачу', 'schedule_task'),
        Markup.button.callback('✏️ Редактировать задачу', 'edit_scheduled_task')
      ],
      [
        Markup.button.callback('🗑 Удалить задачу', 'delete_scheduled_task'),
        Markup.button.callback('📊 Календарь задач', 'task_calendar')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MANAGER_SCHEDULE);
    }
    
    logger.info(`User ${ctx.from.id} viewed task scheduling`);
  } catch (error) {
    logger.error('Error in schedule tasks handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о запланированных задачах. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для детальной аналитики
 * @param {Object} ctx - Контекст Telegraf
 */
const detailedAnalyticsHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const detailedAnalytics = {
      sales: {
        byProduct: [
          { name: 'Капучино', count: 250, amount: 12500 },
          { name: 'Латте', count: 200, amount: 10000 },
          { name: 'Американо', count: 150, amount: 6000 },
          { name: 'Эспрессо', count: 100, amount: 4000 }
        ],
        byMachine: [
          { id: '101', name: 'Автомат #101', count: 300, amount: 15000 },
          { id: '102', name: 'Автомат #102', count: 250, amount: 12500 },
          { id: '103', name: 'Автомат #103', count: 150, amount: 7500 }
        ]
      },
      tasks: {
        byType: [
          { type: 'Техническое обслуживание', count: 10 },
          { type: 'Пополнение ингредиентов', count: 15 },
          { type: 'Инкассация', count: 5 }
        ],
        byStatus: [
          { status: 'COMPLETED', count: 20 },
          { status: 'IN_PROGRESS', count: 5 },
          { status: 'PENDING', count: 5 }
        ]
      }
    };
    
    // Формируем сообщение с детальной аналитикой
    let message = '📊 *Детальная аналитика:*\n\n';
    
    message += '*Продажи по продуктам:*\n';
    detailedAnalytics.sales.byProduct.forEach(product => {
      message += `• ${product.name}: ${product.count} шт. (${product.amount} руб.)\n`;
    });
    
    message += '\n*Продажи по автоматам:*\n';
    detailedAnalytics.sales.byMachine.forEach(machine => {
      message += `• ${machine.name}: ${machine.count} шт. (${machine.amount} руб.)\n`;
    });
    
    message += '\n*Задачи по типам:*\n';
    detailedAnalytics.tasks.byType.forEach(task => {
      message += `• ${task.type}: ${task.count} шт.\n`;
    });
    
    message += '\n*Задачи по статусам:*\n';
    detailedAnalytics.tasks.byStatus.forEach(task => {
      message += `• ${getTaskStatusText(task.status)}: ${task.count} шт.\n`;
    });
    
    // Создаем клавиатуру для управления аналитикой
    const keyboard = [
      [
        Markup.button.callback('📊 Экспорт отчета', 'export_report'),
        Markup.button.callback('📈 Графики', 'analytics_charts')
      ],
      [
        Markup.button.callback('📅 По дням', 'analytics_by_day'),
        Markup.button.callback('📆 По неделям', 'analytics_by_week'),
        Markup.button.callback('📆 По месяцам', 'analytics_by_month')
      ],
      [Markup.button.callback('🔙 Назад к аналитике', 'manager_analytics')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} viewed detailed analytics`);
  } catch (error) {
    logger.error('Error in detailed analytics handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении детальной аналитики. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для экспорта отчета
 * @param {Object} ctx - Контекст Telegraf
 */
const exportReportHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // Создаем клавиатуру для выбора формата отчета
    const keyboard = [
      [
        Markup.button.callback('📊 Excel', 'export_excel'),
        Markup.button.callback('📄 PDF', 'export_pdf'),
        Markup.button.callback('📝 CSV', 'export_csv')
      ],
      [Markup.button.callback('🔙 Назад к аналитике', 'manager_analytics')]
    ];
    
    await ctx.reply('Выберите формат отчета:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} is exporting report`);
  } catch (error) {
    logger.error('Error in export report handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления статуса маршрута
const getRouteStatusText = (status) => {
  const statusMap = {
    'ACTIVE': '✅ Активен',
    'INACTIVE': '❌ Неактивен',
    'PAUSED': '⏸ Приостановлен'
  };
  
  return statusMap[status] || status;
};

// Вспомогательная функция для получения текстового представления статуса задачи
const getTaskStatusText = (status) => {
  const statusMap = {
    'PENDING': '⏳ Ожидает',
    'IN_PROGRESS': '🔄 В процессе',
    'COMPLETED': '✅ Выполнено',
    'CANCELLED': '❌ Отменено'
  };
  
  return statusMap[status] || status;
};

module.exports = {
  viewAnalyticsHandler,
  createTaskHandler,
  selectTaskTypeHandler,
  manageRoutesHandler,
  scheduleTasksHandler,
  detailedAnalyticsHandler,
  exportReportHandler,
  register
};
