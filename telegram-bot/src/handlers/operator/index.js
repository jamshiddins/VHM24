const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const apiService = require('../../services/api');
const logger = require('../../utils/logger');

/**
 * Регистрирует обработчики для роли OPERATOR
 * @param {Object} bot - Экземпляр бота Telegraf
 * @param {Function} requireRole - Функция для проверки роли
 */
const register = (bot, requireRole) => {
  // Обработчик для просмотра задач оператора
  bot.action('operator_tasks', requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      await viewTasksHandler(ctx);
    } catch (error) {
      logger.error('Error in operator_tasks action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для просмотра деталей задачи
  bot.action(/^task_(\d+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      await viewTaskDetailsHandler(ctx);
    } catch (error) {
      logger.error('Error in task details action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для обновления статуса задачи
  bot.action(/^update_status_(\d+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      await updateTaskStatusHandler(ctx);
    } catch (error) {
      logger.error('Error in update task status action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для установки статуса задачи
  bot.action(/^set_status_(\d+)_(\w+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      await setTaskStatusHandler(ctx);
    } catch (error) {
      logger.error('Error in set task status action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для принятия задачи
  bot.action(/^accept_task_(\d+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      const taskId = ctx.match[1];
      const result = await apiService.updateTaskStatus(taskId, 'IN_PROGRESS');
      
      if (result.success) {
        await ctx.reply('✅ Задача принята к исполнению');
        
        // Возвращаемся к деталям задачи
        await viewTaskDetailsHandler({
          ...ctx,
          callbackQuery: {
            ...ctx.callbackQuery,
            data: `task_${taskId}`
          }
        });
      } else {
        await ctx.reply('❌ Не удалось принять задачу. Пожалуйста, попробуйте позже.');
      }
      
      logger.info(`User ${ctx.from.id} accepted task ${taskId}`);
    } catch (error) {
      logger.error('Error in accept task action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для отклонения задачи
  bot.action(/^reject_task_(\d+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      const taskId = ctx.match[1];
      const result = await apiService.updateTaskStatus(taskId, 'REJECTED', {
        reason: 'Отклонено оператором'
      });
      
      if (result.success) {
        await ctx.reply('✅ Задача отклонена');
        
        // Возвращаемся к списку задач
        await viewTasksHandler(ctx);
      } else {
        await ctx.reply('❌ Не удалось отклонить задачу. Пожалуйста, попробуйте позже.');
      }
      
      logger.info(`User ${ctx.from.id} rejected task ${taskId}`);
    } catch (error) {
      logger.error('Error in reject task action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для добавления комментария к задаче
  bot.action(/^add_comment_(\d+)$/, requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      const taskId = ctx.match[1];
      
      // Сохраняем ID задачи в сессии
      if (ctx.session) {
        ctx.session.commentTaskId = taskId;
      }
      
      await ctx.reply('Введите комментарий к задаче:');
      
      // Устанавливаем состояние бота
      if (ctx.scene && ctx.scene.enter) {
        await ctx.scene.enter(BOT_STATES.OPERATOR_TASK_COMMENT);
      }
      
      logger.info(`User ${ctx.from.id} is adding comment to task ${taskId}`);
    } catch (error) {
      logger.error('Error in add comment action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для возврата к списку задач
  bot.action('view_tasks', requireRole(['OPERATOR', 'ADMIN']), async (ctx) => {
    try {
      await viewTasksHandler(ctx);
    } catch (error) {
      logger.error('Error in view tasks action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  logger.info('Operator handlers registered');
};

// Обработчик для просмотра задач оператора
const viewTasksHandler = async (ctx) => {
  try {
    // Получаем ID пользователя
    const userId = ctx.user?.id || '1';
    
    // Получаем задачи пользователя
    const tasks = await apiService.getUserTasks(userId);
    
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
      Markup.button.callback(`Задача #${index + 1}: ${task.type}`, `task_${task.id}`)
    ]);
    
    // Добавляем кнопку возврата в главное меню
    keyboard.push([Markup.button.callback('🔙 Назад в меню', 'back_to_menu')]);
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.OPERATOR_TASKS);
    }
    
    logger.info(`User ${ctx.from.id} viewed tasks`);
  } catch (error) {
    logger.error('Error in view tasks handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении списка задач. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для просмотра деталей задачи
const viewTaskDetailsHandler = async (ctx) => {
  try {
    // Получаем ID задачи из callback_data
    const taskId = ctx.callbackQuery.data.split('_')[1];
    
    // Получаем задачи пользователя
    const userId = ctx.user?.id || '1';
    const tasks = await apiService.getUserTasks(userId);
    
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
        Markup.button.callback('✅ Принять задачу', `accept_task_${task.id}`),
        Markup.button.callback('❌ Отклонить задачу', `reject_task_${task.id}`)
      ],
      [
        Markup.button.callback('🔄 Обновить статус', `update_status_${task.id}`),
        Markup.button.callback('📝 Добавить комментарий', `add_comment_${task.id}`)
      ],
      [Markup.button.callback('🔙 Назад к списку задач', 'view_tasks')]
    ];
    
    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} viewed task details for task ${taskId}`);
  } catch (error) {
    logger.error('Error in view task details handler:', error);
    await ctx.reply('❌ Произошла ошибка при получении деталей задачи. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для обновления статуса задачи
const updateTaskStatusHandler = async (ctx) => {
  try {
    // Получаем ID задачи из callback_data
    const taskId = ctx.callbackQuery.data.split('_')[2];
    
    // Создаем клавиатуру для выбора статуса
    const keyboard = [
      [
        Markup.button.callback('🔄 В процессе', `set_status_${taskId}_IN_PROGRESS`),
        Markup.button.callback('✅ Выполнено', `set_status_${taskId}_COMPLETED`)
      ],
      [
        Markup.button.callback('⏸ Приостановлено', `set_status_${taskId}_PAUSED`),
        Markup.button.callback('❌ Отменено', `set_status_${taskId}_CANCELLED`)
      ],
      [Markup.button.callback('🔙 Назад', `task_${taskId}`)]
    ];
    
    await ctx.reply('Выберите новый статус задачи:', Markup.inlineKeyboard(keyboard));
    
    logger.info(`User ${ctx.from.id} is updating status for task ${taskId}`);
  } catch (error) {
    logger.error('Error in update task status handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик для установки статуса задачи
const setTaskStatusHandler = async (ctx) => {
  try {
    // Получаем ID задачи и новый статус из callback_data
    const parts = ctx.callbackQuery.data.split('_');
    const taskId = parts[2];
    const newStatus = parts[3];
    
    // Обновляем статус задачи
    const result = await apiService.updateTaskStatus(taskId, newStatus);
    
    if (result.success) {
      await ctx.reply(`✅ Статус задачи успешно обновлен на "${getStatusText(newStatus)}"`);
      
      // Возвращаемся к деталям задачи
      await viewTaskDetailsHandler({
        ...ctx,
        callbackQuery: {
          ...ctx.callbackQuery,
          data: `task_${taskId}`
        }
      });
    } else {
      await ctx.reply('❌ Не удалось обновить статус задачи. Пожалуйста, попробуйте позже.');
    }
    
    logger.info(`User ${ctx.from.id} set status for task ${taskId} to ${newStatus}`);
  } catch (error) {
    logger.error('Error in set task status handler:', error);
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

module.exports = {
  viewTasksHandler,
  viewTaskDetailsHandler,
  updateTaskStatusHandler,
  setTaskStatusHandler,
  register
};
