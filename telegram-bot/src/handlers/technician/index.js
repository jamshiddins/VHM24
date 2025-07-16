const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const apiService = require('../../services/api');
const logger = require('../../utils/logger');

/**
 * Регистрирует обработчики для роли TECHNICIAN
 * @param {Object} bot - Экземпляр бота Telegraf
 * @param {Function} requireRole - Функция для проверки роли
 */
const register = (bot, requireRole) => {
  // Обработчик для просмотра задач техника
  bot.action('technician_tasks', requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await viewTechnicianTasksHandler(ctx);
    } catch (error) {
      logger.error('Error in technician_tasks action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для просмотра деталей задачи техника
  bot.action(/^tech_task_(\d+)$/, requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await viewTechnicianTaskDetailsHandler(ctx);
    } catch (error) {
      logger.error('Error in tech_task details action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для обновления статуса задачи техника
  bot.action(/^tech_update_status_(\d+)$/, requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await updateTechnicianTaskStatusHandler(ctx);
    } catch (error) {
      logger.error('Error in tech_update_status action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для установки статуса задачи техника
  bot.action(/^tech_set_status_(\d+)_(\w+)$/, requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      const parts = ctx.callbackQuery.data.split('_');
      const taskId = parts[3];
      const newStatus = parts[4];
      
      // Обновляем статус задачи
      const result = await apiService.updateTaskStatus(taskId, newStatus);
      
      if (result.success) {
        await ctx.reply(`✅ Статус задачи успешно обновлен на "${getStatusText(newStatus)}"`);
        
        // Возвращаемся к деталям задачи
        await viewTechnicianTaskDetailsHandler({
          ...ctx,
          callbackQuery: {
            ...ctx.callbackQuery,
            data: `tech_task_${taskId}`
          }
        });
      } else {
        await ctx.reply('❌ Не удалось обновить статус задачи. Пожалуйста, попробуйте позже.');
      }
      
      logger.info(`User ${ctx.from.id} set status for technician task ${taskId} to ${newStatus}`);
    } catch (error) {
      logger.error('Error in tech_set_status action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для принятия задачи техника
  bot.action(/^tech_accept_(\d+)$/, requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      const taskId = ctx.match[1];
      const result = await apiService.updateTaskStatus(taskId, 'IN_PROGRESS');
      
      if (result.success) {
        await ctx.reply('✅ Задача принята к исполнению');
        
        // Возвращаемся к деталям задачи
        await viewTechnicianTaskDetailsHandler({
          ...ctx,
          callbackQuery: {
            ...ctx.callbackQuery,
            data: `tech_task_${taskId}`
          }
        });
      } else {
        await ctx.reply('❌ Не удалось принять задачу. Пожалуйста, попробуйте позже.');
      }
      
      logger.info(`User ${ctx.from.id} accepted technician task ${taskId}`);
    } catch (error) {
      logger.error('Error in tech_accept action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для отклонения задачи техника
  bot.action(/^tech_reject_(\d+)$/, requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      const taskId = ctx.match[1];
      const result = await apiService.updateTaskStatus(taskId, 'REJECTED', {
        reason: 'Отклонено техником'
      });
      
      if (result.success) {
        await ctx.reply('✅ Задача отклонена');
        
        // Возвращаемся к списку задач
        await viewTechnicianTasksHandler(ctx);
      } else {
        await ctx.reply('❌ Не удалось отклонить задачу. Пожалуйста, попробуйте позже.');
      }
      
      logger.info(`User ${ctx.from.id} rejected technician task ${taskId}`);
    } catch (error) {
      logger.error('Error in tech_reject action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для диагностики автоматов
  bot.action('technician_diagnostics', requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await diagnosticsMachinesHandler(ctx);
    } catch (error) {
      logger.error('Error in technician_diagnostics action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для истории ремонтов
  bot.action('technician_repair_history', requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await repairHistoryHandler(ctx);
    } catch (error) {
      logger.error('Error in technician_repair_history action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для чек-листов обслуживания
  bot.action('technician_checklists', requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await maintenanceChecklistsHandler(ctx);
    } catch (error) {
      logger.error('Error in technician_checklists action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для возврата к списку задач техника
  bot.action('view_technician_tasks', requireRole(['TECHNICIAN', 'ADMIN']), async (ctx) => {
    try {
      await viewTechnicianTasksHandler(ctx);
    } catch (error) {
      logger.error('Error in view_technician_tasks action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  logger.info('Technician handlers registered');
};

// Обработчик для просмотра заданий техника
const viewTechnicianTasksHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const tasks = [
      { id: '1', type: 'Ремонт', machineName: 'Кофейный автомат #101', description: 'Не работает купюроприемник', status: 'ASSIGNED', deadline: '2025-07-20' },
      { id: '2', type: 'Обслуживание', machineName: 'Кофейный автомат #102', description: 'Плановое ТО', status: 'IN_PROGRESS', deadline: '2025-07-18' },
      { id: '3', type: 'Диагностика', machineName: 'Кофейный автомат #103', description: 'Проверка после установки', status: 'COMPLETED', deadline: '2025-07-15' }
    ];
    
    if (!tasks || tasks.length === 0) {
      await ctx.reply('📋 У вас нет активных задач на данный момент.');
      return;
    }
    
    // Формируем сообщение со списком задач
    let message = '📋 *Ваши текущие задачи:*\n\n';
    
    tasks.forEach((task, index) => {
      const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
      const status = getStatusText(task.status);
      
      message += `*${index + 1}. ${task.type}*\n`;
      message += `📍 Автомат: ${task.machineName}\n`;
      message += `📝 Описание: ${task.description}\n`;
      message += `⏱ Срок: ${deadline}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для выбора задачи
    const keyboard = tasks.map((task, index) => [
      Markup.button.callback(`Задача #${index + 1}: ${task.type}`, `tech_task_${task.id}`)
    ]);
    
    // Добавляем кнопку возврата в главное меню
    keyboard.push([Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]);
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.TECHNICIAN_TASKS);
    }
    
    logger.info(`User ${ctx.from.id} viewed technician tasks`);
  } catch (error) {
    logger.error('Error in view technician tasks handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении списка задач. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для просмотра деталей задачи техника
const viewTechnicianTaskDetailsHandler = async (ctx) => {
  try {
    // Получаем ID задачи из callback_data
    const taskId = ctx.callbackQuery.data.split('_')[2];
    
    // В режиме разработки используем мок-данные
    const tasks = [
      { id: '1', type: 'Ремонт', machineName: 'Кофейный автомат #101', description: 'Не работает купюроприемник', status: 'ASSIGNED', deadline: '2025-07-20' },
      { id: '2', type: 'Обслуживание', machineName: 'Кофейный автомат #102', description: 'Плановое ТО', status: 'IN_PROGRESS', deadline: '2025-07-18' },
      { id: '3', type: 'Диагностика', machineName: 'Кофейный автомат #103', description: 'Проверка после установки', status: 'COMPLETED', deadline: '2025-07-15' }
    ];
    
    // Находим нужную задачу
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена.');
      return;
    }
    
    // Формируем сообщение с деталями задачи
    const deadline = new Date(task.deadline).toLocaleDateString('ru-RU');
    const status = getStatusText(task.status);
    
    let message = `📋 *Детали задачи #${task.id}*\n\n`;
    message += `*Тип:* ${task.type}\n`;
    message += `*Автомат:* ${task.machineName}\n`;
    message += `*Описание:* ${task.description}\n`;
    message += `*Срок:* ${deadline}\n`;
    message += `*Статус:* ${status}\n`;
    
    // Создаем клавиатуру с действиями
    const keyboard = [
      [
        Markup.button.callback('✅ Принять задачу', `tech_accept_${task.id}`),
        Markup.button.callback('❌ Отклонить задачу', `tech_reject_${task.id}`)
      ],
      [
        Markup.button.callback('🔄 Обновить статус', `tech_update_status_${task.id}`),
        Markup.button.callback('📝 Добавить комментарий', `tech_add_comment_${task.id}`)
      ],
      [Markup.button.callback('🔙 Назад к списку задач', 'view_technician_tasks')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} viewed technician task details for task ${taskId}`);
  } catch (error) {
    logger.error('Error in view technician task details handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении деталей задачи. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для обновления статуса задачи техника
const updateTechnicianTaskStatusHandler = async (ctx) => {
  try {
    // Получаем ID задачи из callback_data
    const taskId = ctx.callbackQuery.data.split('_')[3];
    
    // Создаем клавиатуру для выбора статуса
    const keyboard = [
      [
        Markup.button.callback('🔄 В процессе', `tech_set_status_${taskId}_IN_PROGRESS`),
        Markup.button.callback('✅ Выполнено', `tech_set_status_${taskId}_COMPLETED`)
      ],
      [
        Markup.button.callback('⏸ Приостановлено', `tech_set_status_${taskId}_PAUSED`),
        Markup.button.callback('❌ Отменено', `tech_set_status_${taskId}_CANCELLED`)
      ],
      [Markup.button.callback('🔙 Назад', `tech_task_${taskId}`)]
    ];
    
    await ctx.reply('Выберите новый статус задачи:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} is updating status for technician task ${taskId}`);
  } catch (error) {
    logger.error('Error in update technician task status handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления статуса
const getStatusText = (status) => {
  const statusMap = {
    'ASSIGNED': '📝 Назначено',
    'IN_PROGRESS': '🔄 В процессе',
    'COMPLETED': '✅ Выполнено',
    'PAUSED': '⏸ Приостановлено',
    'CANCELLED': '❌ Отменено'
  };
  
  return statusMap[status] || status;
};

/**
 * Обработчик для диагностики автоматов
 * @param {Object} ctx - Контекст Telegraf
 */
const diagnosticsMachinesHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const machines = [
      { id: '101', name: 'Кофейный автомат #101', status: 'OPERATIONAL', lastDiagnostics: '2025-07-10', issues: [] },
      { id: '102', name: 'Кофейный автомат #102', status: 'WARNING', lastDiagnostics: '2025-07-05', issues: ['Низкое давление воды'] },
      { id: '103', name: 'Кофейный автомат #103', status: 'ERROR', lastDiagnostics: '2025-07-01', issues: ['Неисправен купюроприемник', 'Ошибка дозатора'] },
      { id: '104', name: 'Кофейный автомат #104', status: 'OPERATIONAL', lastDiagnostics: '2025-07-12', issues: [] },
      { id: '105', name: 'Кофейный автомат #105', status: 'MAINTENANCE', lastDiagnostics: '2025-07-08', issues: ['Плановое обслуживание'] }
    ];
    
    // Формируем сообщение со списком автоматов
    let message = '🔧 *Диагностика автоматов:*\n\n';
    
    machines.forEach((machine, index) => {
      const status = getMachineStatusText(machine.status);
      
      message += `*${index + 1}. ${machine.name}*\n`;
      message += `🔄 Статус: ${status}\n`;
      message += `📅 Последняя диагностика: ${machine.lastDiagnostics}\n`;
      
      if (machine.issues.length > 0) {
        message += `⚠️ Проблемы: ${machine.issues.join(', ')}\n`;
      } else {
        message += `✅ Проблем не обнаружено\n`;
      }
      
      message += '\n';
    });
    
    // Создаем клавиатуру для диагностики автоматов
    const keyboard = [
      [
        Markup.button.callback('🔍 Провести диагностику', 'run_diagnostics'),
        Markup.button.callback('📋 Чек-лист диагностики', 'diagnostics_checklist')
      ],
      [
        Markup.button.callback('📊 Статистика ошибок', 'error_statistics'),
        Markup.button.callback('📱 Сканировать QR-код', 'scan_machine_qr')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.TECHNICIAN_DIAGNOSTICS);
    }
    
    logger.info(`User ${ctx.from.id} viewed machine diagnostics`);
  } catch (error) {
    logger.error('Error in diagnostics machines handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении данных о диагностике автоматов. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для истории ремонтов
 * @param {Object} ctx - Контекст Telegraf
 */
const repairHistoryHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const repairs = [
      { id: '1', machine: 'Кофейный автомат #101', date: '2025-07-01', type: 'Замена купюроприемника', technician: 'Иван Иванов', status: 'COMPLETED' },
      { id: '2', machine: 'Кофейный автомат #102', date: '2025-07-05', type: 'Ремонт дозатора', technician: 'Иван Иванов', status: 'COMPLETED' },
      { id: '3', machine: 'Кофейный автомат #103', date: '2025-07-10', type: 'Замена помпы', technician: 'Петр Петров', status: 'IN_PROGRESS' },
      { id: '4', machine: 'Кофейный автомат #101', date: '2025-07-15', type: 'Чистка системы', technician: 'Иван Иванов', status: 'SCHEDULED' }
    ];
    
    // Формируем сообщение со списком ремонтов
    let message = '🔧 *История ремонтов:*\n\n';
    
    repairs.forEach((repair, index) => {
      const status = getRepairStatusText(repair.status);
      
      message += `*${index + 1}. ${repair.machine} (${repair.date})*\n`;
      message += `🔧 Тип: ${repair.type}\n`;
      message += `👨‍🔧 Техник: ${repair.technician}\n`;
      message += `🔄 Статус: ${status}\n\n`;
    });
    
    // Создаем клавиатуру для истории ремонтов
    const keyboard = [
      [
        Markup.button.callback('➕ Добавить ремонт', 'add_repair'),
        Markup.button.callback('🔍 Поиск по автомату', 'search_repairs_by_machine')
      ],
      [
        Markup.button.callback('📊 Статистика ремонтов', 'repair_statistics'),
        Markup.button.callback('📅 Фильтр по дате', 'filter_repairs_by_date')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.TECHNICIAN_REPAIR_HISTORY);
    }
    
    logger.info(`User ${ctx.from.id} viewed repair history`);
  } catch (error) {
    logger.error('Error in repair history handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении истории ремонтов. Пожалуйста, попробуйте позже.');
  }
};

/**
 * Обработчик для чек-листов обслуживания
 * @param {Object} ctx - Контекст Telegraf
 */
const maintenanceChecklistsHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // В режиме разработки используем мок-данные
    const checklists = [
      { id: '1', name: 'Ежедневное обслуживание', items: 5, completed: 0, machine: 'Все автоматы' },
      { id: '2', name: 'Еженедельное обслуживание', items: 10, completed: 0, machine: 'Все автоматы' },
      { id: '3', name: 'Ежемесячное обслуживание', items: 15, completed: 0, machine: 'Все автоматы' },
      { id: '4', name: 'Техническое обслуживание', items: 20, completed: 0, machine: 'Кофейный автомат #101' }
    ];
    
    // Формируем сообщение со списком чек-листов
    let message = '📋 *Чек-листы обслуживания:*\n\n';
    
    checklists.forEach((checklist, index) => {
      const progress = checklist.completed > 0 ? `${checklist.completed}/${checklist.items}` : '0%';
      
      message += `*${index + 1}. ${checklist.name}*\n`;
      message += `📍 Автомат: ${checklist.machine}\n`;
      message += `📊 Прогресс: ${progress}\n\n`;
    });
    
    // Создаем клавиатуру для чек-листов обслуживания
    const keyboard = [
      [
        Markup.button.callback('✅ Выполнить чек-лист', 'complete_checklist'),
        Markup.button.callback('➕ Создать чек-лист', 'create_checklist')
      ],
      [
        Markup.button.callback('📊 История выполнения', 'checklist_history'),
        Markup.button.callback('📱 Сканировать QR-код', 'scan_checklist_qr')
      ],
      [Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.TECHNICIAN_CHECKLISTS);
    }
    
    logger.info(`User ${ctx.from.id} viewed maintenance checklists`);
  } catch (error) {
    logger.error('Error in maintenance checklists handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении чек-листов обслуживания. Пожалуйста, попробуйте позже.');
  }
};

// Вспомогательная функция для получения текстового представления статуса автомата
const getMachineStatusText = (status) => {
  const statusMap = {
    'OPERATIONAL': '✅ Работает',
    'WARNING': '⚠️ Предупреждение',
    'ERROR': '❌ Ошибка',
    'MAINTENANCE': '🔧 Обслуживание',
    'OFFLINE': '⚫ Не в сети'
  };
  
  return statusMap[status] || status;
};

// Вспомогательная функция для получения текстового представления статуса ремонта
const getRepairStatusText = (status) => {
  const statusMap = {
    'SCHEDULED': '📅 Запланирован',
    'IN_PROGRESS': '🔄 В процессе',
    'COMPLETED': '✅ Выполнен',
    'CANCELLED': '❌ Отменен'
  };
  
  return statusMap[status] || status;
};

module.exports = {
  viewTechnicianTasksHandler,
  viewTechnicianTaskDetailsHandler,
  updateTechnicianTaskStatusHandler,
  diagnosticsMachinesHandler,
  repairHistoryHandler,
  maintenanceChecklistsHandler,
  register
};
