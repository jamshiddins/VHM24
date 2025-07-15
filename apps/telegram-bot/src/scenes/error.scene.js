/**
 * FSM: error_fsm
 * Назначение: Фиксация ошибок и проблем (например, пропущенных фото, несоответствий).
 * Роли: Все исполнители.
 * Состояния:
 *   - error_select_reason: выбор причины ошибки
 *   - error_comment: ввод комментария
 *   - error_photo_optional: загрузка фото (опционально)
 *   - error_submit: подтверждение и отправка
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('error_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[error_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль в системе
  if (!ctx.session.user) {
    await ctx.reply('⚠️ У вас нет доступа к фиксации ошибок.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные ошибки
    ctx.session.errorData = {
      reason: null,
      comment: null,
      photo: null,
      relatedTaskId: null,
      relatedMachineId: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'error_select_reason';
    
    // Переходим к выбору причины ошибки
    await handleErrorSelectReason(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену error_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния error_select_reason
async function handleErrorSelectReason(ctx) {
  try {
    const message = `
⚠️ Фиксация ошибки или проблемы

Выберите причину ошибки:
`;
    
    // Создаем клавиатуру с причинами ошибок
    const buttons = [
      [Markup.button.callback('📸 Пропущено фото', 'reason_missed_photo')],
      [Markup.button.callback('⚖️ Несоответствие веса/количества', 'reason_quantity_mismatch')],
      [Markup.button.callback('🔧 Техническая неисправность', 'reason_technical_issue')],
      [Markup.button.callback('🚫 Невозможность выполнения задачи', 'reason_task_impossible')],
      [Markup.button.callback('⏱️ Нарушение сроков', 'reason_deadline_missed')],
      [Markup.button.callback('📋 Ошибка в данных', 'reason_data_error')],
      [Markup.button.callback('🔄 Другая причина', 'reason_other')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе причины ошибки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора причины ошибки
scene.action(/^reason_(.+)$/, async (ctx) => {
  try {
    const reason = ctx.match[1];
    
    // Сохраняем причину ошибки
    ctx.session.errorData.reason = reason;
    
    // Отображаем выбранную причину
    let reasonName = '';
    switch (reason) {
      case 'missed_photo':
        reasonName = '📸 Пропущено фото';
        break;
      case 'quantity_mismatch':
        reasonName = '⚖️ Несоответствие веса/количества';
        break;
      case 'technical_issue':
        reasonName = '🔧 Техническая неисправность';
        break;
      case 'task_impossible':
        reasonName = '🚫 Невозможность выполнения задачи';
        break;
      case 'deadline_missed':
        reasonName = '⏱️ Нарушение сроков';
        break;
      case 'data_error':
        reasonName = '📋 Ошибка в данных';
        break;
      case 'other':
        reasonName = '🔄 Другая причина';
        break;
    }
    
    await ctx.editMessageText(`Выбрана причина: ${reasonName}`);
    
    // Проверяем, связана ли ошибка с задачей
    if (['task_impossible', 'deadline_missed'].includes(reason)) {
      // Получаем список задач пользователя
      const tasks = await prisma.task.findMany({
        where: {
          assignedUserId: ctx.session.user.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        },
        include: {
          machine: {
            include: { location: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (tasks.length > 0) {
        const taskMessage = `
🔄 Выберите задачу, к которой относится ошибка:
`;
        
        // Создаем клавиатуру с задачами
        const taskButtons = tasks.map(task => {
          const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
          return [Markup.button.callback(
            `${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})`,
            `task_${task.id}`
          )];
        });
        
        // Добавляем кнопку "Не связано с задачей"
        taskButtons.push([Markup.button.callback('🔄 Не связано с задачей', 'no_task')]);
        
        // Добавляем кнопку отмены
        taskButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const taskKeyboard = Markup.inlineKeyboard(taskButtons);
        
        await ctx.reply(taskMessage, taskKeyboard);
        return;
      }
    } else if (['technical_issue'].includes(reason)) {
      // Получаем список автоматов
      const machines = await prisma.machine.findMany({
        where: { status: 'ACTIVE' },
        include: { location: true },
        orderBy: { internalCode: 'asc' }
      });
      
      if (machines.length > 0) {
        const machineMessage = `
🔄 Выберите автомат, к которому относится ошибка:
`;
        
        // Создаем клавиатуру с автоматами
        const machineButtons = machines.map(machine => {
          const locationName = machine.location ? machine.location.name : 'Без локации';
          return [Markup.button.callback(
            `${machine.internalCode} - ${locationName}`,
            `machine_${machine.id}`
          )];
        });
        
        // Добавляем кнопку "Не связано с автоматом"
        machineButtons.push([Markup.button.callback('🔄 Не связано с автоматом', 'no_machine')]);
        
        // Добавляем кнопку отмены
        machineButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const machineKeyboard = Markup.inlineKeyboard(machineButtons);
        
        await ctx.reply(machineMessage, machineKeyboard);
        return;
      }
    }
    
    // Если нет связанных задач или автоматов, переходим к вводу комментария
    ctx.session.state = 'error_comment';
    await handleErrorComment(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора причины ошибки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора задачи
scene.action(/^task_(.+)$/, async (ctx) => {
  try {
    const taskId = ctx.match[1];
    
    // Сохраняем ID задачи
    ctx.session.errorData.relatedTaskId = taskId;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        machine: {
          include: { location: true }
        }
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      return await handleErrorSelectReason(ctx);
    }
    
    const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбрана задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})`);
    
    // Переходим к вводу комментария
    ctx.session.state = 'error_comment';
    await handleErrorComment(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик "Не связано с задачей"
scene.action('no_task', async (ctx) => {
  try {
    await ctx.editMessageText('✅ Ошибка не связана с конкретной задачей.');
    
    // Переходим к вводу комментария
    ctx.session.state = 'error_comment';
    await handleErrorComment(ctx);
  } catch (error) {
    console.error('Ошибка при обработке "Не связано с задачей":', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора автомата
scene.action(/^machine_(.+)$/, async (ctx) => {
  try {
    const machineId = ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.errorData.relatedMachineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleErrorSelectReason(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // Переходим к вводу комментария
    ctx.session.state = 'error_comment';
    await handleErrorComment(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик "Не связано с автоматом"
scene.action('no_machine', async (ctx) => {
  try {
    await ctx.editMessageText('✅ Ошибка не связана с конкретным автоматом.');
    
    // Переходим к вводу комментария
    ctx.session.state = 'error_comment';
    await handleErrorComment(ctx);
  } catch (error) {
    console.error('Ошибка при обработке "Не связано с автоматом":', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния error_comment
async function handleErrorComment(ctx) {
  try {
    await ctx.reply(`
📝 Комментарий к ошибке

Пожалуйста, опишите проблему подробнее:
`);
    
    // Ожидаем ввод комментария от пользователя
  } catch (error) {
    console.error('Ошибка при запросе комментария:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода комментария
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'error_comment') {
    try {
      // Сохраняем комментарий
      ctx.session.errorData.comment = ctx.message.text.trim();
      
      await ctx.reply('✅ Комментарий сохранен.');
      
      // Переходим к загрузке фото
      ctx.session.state = 'error_photo_optional';
      await handleErrorPhotoOptional(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода комментария:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния error_photo_optional
async function handleErrorPhotoOptional(ctx) {
  try {
    await ctx.reply(`
📸 Фото (опционально)

Вы можете прикрепить фото, иллюстрирующее проблему.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'error_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'error_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.errorData.photo = photoId;
      
      await ctx.reply('✅ Фото получено.');
      
      // Переходим к подтверждению
      ctx.session.state = 'error_submit';
      await handleErrorSubmit(ctx);
    } catch (error) {
      console.error('Ошибка при получении фото:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'error_wait_photo') {
    // Переходим к подтверждению
    ctx.session.state = 'error_submit';
    await handleErrorSubmit(ctx);
  }
});

// Обработка состояния error_submit
async function handleErrorSubmit(ctx) {
  try {
    const errorData = ctx.session.errorData;
    
    // Формируем текст подтверждения
    let confirmText = `
⚠️ Подтверждение фиксации ошибки

🔹 Причина: ${getReasonName(errorData.reason)}
`;
    
    // Добавляем информацию о задаче, если она выбрана
    if (errorData.relatedTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: errorData.relatedTaskId },
        include: {
          machine: {
            include: { location: true }
          }
        }
      });
      
      if (task) {
        const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
        confirmText += `🔹 Задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})\n`;
      }
    }
    
    // Добавляем информацию об автомате, если он выбран
    if (errorData.relatedMachineId) {
      const machine = await prisma.machine.findUnique({
        where: { id: errorData.relatedMachineId },
        include: { location: true }
      });
      
      if (machine) {
        const locationName = machine.location ? machine.location.name : 'Без локации';
        confirmText += `🔹 Автомат: ${machine.internalCode} - ${locationName}\n`;
      }
    }
    
    // Добавляем комментарий
    confirmText += `\n📝 Комментарий: ${errorData.comment}\n`;
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_error')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении фиксации ошибки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения фиксации ошибки
scene.action('confirm_error', async (ctx) => {
  try {
    const errorData = ctx.session.errorData;
    
    // Создаем запись об ошибке в базе данных
    const error = await prisma.errorReport.create({
      data: {
        reason: errorData.reason.toUpperCase(),
        comment: errorData.comment,
        photo: errorData.photo,
        taskId: errorData.relatedTaskId,
        machineId: errorData.relatedMachineId,
        userId: ctx.session.user.id,
        status: 'OPEN',
        createdAt: new Date()
      }
    });
    
    // Отправляем уведомление менеджерам
    try {
      // Получаем список менеджеров
      const managers = await prisma.user.findMany({
        where: { 
          role: { in: ['ADMIN', 'MANAGER'] },
          status: 'ACTIVE'
        },
        select: { telegramId: true }
      });
      
      // Формируем текст уведомления
      const notificationText = `
⚠️ Новая ошибка зафиксирована!

🔹 ID: ${error.id}
🔹 Причина: ${getReasonName(errorData.reason)}
🔹 Пользователь: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

📝 Комментарий: ${errorData.comment}

Требуется рассмотрение.
`;
      
      // Отправляем уведомление каждому менеджеру
      for (const manager of managers) {
        if (manager.telegramId) {
          await ctx.telegram.sendMessage(manager.telegramId, notificationText);
          
          // Если есть фото, отправляем его
          if (errorData.photo) {
            await ctx.telegram.sendPhoto(manager.telegramId, errorData.photo);
          }
        }
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления менеджерам:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    // Отображаем сообщение об успешной фиксации ошибки
    await ctx.editMessageText(`
✅ Ошибка успешно зафиксирована!

🔹 ID: ${error.id}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Менеджеры получили уведомление и рассмотрят проблему.
`);
    
    // Предлагаем зафиксировать еще ошибку или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⚠️ Зафиксировать еще ошибку', 'error_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при фиксации ошибки:', error);
    await ctx.reply('❌ Произошла ошибка при фиксации ошибки. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Фиксация ошибки отменена.');
  await ctx.scene.leave();
});

// Обработчик фиксации еще одной ошибки
scene.action('error_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.errorData = {
    reason: null,
    comment: null,
    photo: null,
    relatedTaskId: null,
    relatedMachineId: null
  };
  
  ctx.session.state = 'error_select_reason';
  await ctx.editMessageText('⚠️ Фиксация новой ошибки...');
  await handleErrorSelectReason(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

// Функция для получения названия причины ошибки
function getReasonName(reason) {
  const reasons = {
    'missed_photo': '📸 Пропущено фото',
    'quantity_mismatch': '⚖️ Несоответствие веса/количества',
    'technical_issue': '🔧 Техническая неисправность',
    'task_impossible': '🚫 Невозможность выполнения задачи',
    'deadline_missed': '⏱️ Нарушение сроков',
    'data_error': '📋 Ошибка в данных',
    'other': '🔄 Другая причина'
  };
  
  return reasons[reason] || reason;
}

// Функция для получения названия типа задачи
function getTaskTypeName(type) {
  const taskTypes = {
    'INGREDIENTS': '🔄 Замена ингредиентов',
    'WATER': '💧 Замена воды',
    'CLEANING': '🧹 Чистка автомата',
    'REPAIR': '🔧 Ремонт',
    'CASH': '💰 Инкассация'
  };
  
  return taskTypes[type] || type;
}

module.exports = scene;
