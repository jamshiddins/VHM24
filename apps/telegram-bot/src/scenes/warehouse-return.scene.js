/**
 * FSM: warehouse_return_fsm
 * Назначение: Приём возвратов от оператора (сумок с бункерами, использованных бутылок воды, сиропов).
 * Роли: Складской работник (Warehouse).
 * Состояния:
 *   - return_select_task: выбор задачи, по которой возвращаются товары
 *   - return_select_bag: выбор сумки для возврата
 *   - return_input_weights: ввод весов возвращаемых бункеров
 *   - return_photo: фото возвращаемых товаров
 *   - return_finish: завершение возврата
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('warehouse_return_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[warehouse_return_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или WAREHOUSE
  if (!ctx.session.user || !['ADMIN', 'WAREHOUSE'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к приему возвратов.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные возврата
    ctx.session.returnData = {
      taskId: null,
      bagId: null,
      hopperWeights: [],
      photo: null,
      notes: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'return_select_task';
    
    // Переходим к выбору задачи
    await handleReturnSelectTask(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену warehouse_return_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния return_select_task
async function handleReturnSelectTask(ctx) {
  try {
    // Получаем список завершенных задач
    const tasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        type: { in: ['INGREDIENTS', 'WATER'] }
      },
      include: {
        machine: {
          include: { location: true }
        },
        assignedUser: true
      },
      orderBy: { completedAt: 'desc' },
      take: 10 // Ограничиваем список последними 10 задачами
    });
    
    if (tasks.length === 0) {
      await ctx.reply('❌ Нет завершенных задач для возврата товаров.');
      return await ctx.scene.leave();
    }
    
    const message = `
📦 Приём возвратов от оператора

Выберите задачу, по которой возвращаются товары:
`;
    
    // Создаем клавиатуру с задачами
    const buttons = tasks.map(task => {
      const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
      const operatorName = `${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`;
      const completedDate = task.completedAt ? task.completedAt.toLocaleDateString('ru-RU') : 'Неизвестно';
      
      return [Markup.button.callback(
        `${getTaskTypeName(task.type)} - ${task.machine.internalCode} - ${operatorName} (${completedDate})`,
        `task_${task.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора задачи
scene.action(/^task_(.+)$/, async (ctx) => {
  try {
    const taskId = ctx.match[1];
    
    // Сохраняем ID задачи
    ctx.session.returnData.taskId = taskId;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        machine: {
          include: { location: true }
        },
        assignedUser: true
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      return await handleReturnSelectTask(ctx);
    }
    
    const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
    const operatorName = `${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`;
    
    await ctx.editMessageText(`Выбрана задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode} - ${operatorName}`);
    
    // Переходим к выбору сумки
    ctx.session.state = 'return_select_bag';
    await handleReturnSelectBag(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния return_select_bag
async function handleReturnSelectBag(ctx) {
  try {
    const taskId = ctx.session.returnData.taskId;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedUser: true
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      return await handleReturnSelectTask(ctx);
    }
    
    // Получаем список сумок, выданных оператору
    const bags = await prisma.bag.findMany({
      where: {
        operatorId: task.assignedUser.id,
        status: 'DISPATCHED'
      },
      include: {
        machine: {
          include: { location: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (bags.length === 0) {
      // Если сумок нет, предлагаем создать новую запись о возврате без привязки к сумке
      await ctx.reply(`
⚠️ Для оператора ${task.assignedUser.firstName} ${task.assignedUser.lastName || ''} не найдено выданных сумок.

Вы можете продолжить без привязки к сумке или отменить операцию.
`, Markup.inlineKeyboard([
        [Markup.button.callback('✅ Продолжить без сумки', 'continue_without_bag')],
        [Markup.button.callback('❌ Отмена', 'cancel')]
      ]));
      return;
    }
    
    const message = `
🎒 Выберите сумку для возврата:
`;
    
    // Создаем клавиатуру с сумками
    const buttons = bags.map(bag => {
      const locationName = bag.machine.location ? bag.machine.location.name : 'Без локации';
      const createdDate = bag.createdAt.toLocaleDateString('ru-RU');
      
      return [Markup.button.callback(
        `Сумка #${bag.id} - ${bag.machine.internalCode} (${createdDate})`,
        `bag_${bag.id}`
      )];
    });
    
    // Добавляем кнопку "Без сумки" и отмены
    buttons.push([Markup.button.callback('✅ Продолжить без сумки', 'continue_without_bag')]);
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора сумки
scene.action(/^bag_(.+)$/, async (ctx) => {
  try {
    const bagId = ctx.match[1];
    
    // Сохраняем ID сумки
    ctx.session.returnData.bagId = bagId;
    
    // Получаем информацию о сумке
    const bag = await prisma.bag.findUnique({
      where: { id: bagId },
      include: {
        machine: {
          include: { location: true }
        },
        bagHoppers: {
          include: { ingredient: true }
        }
      }
    });
    
    if (!bag) {
      await ctx.reply('❌ Сумка не найдена. Попробуйте снова.');
      return await handleReturnSelectBag(ctx);
    }
    
    await ctx.editMessageText(`Выбрана сумка #${bag.id} для автомата ${bag.machine.internalCode}`);
    
    // Если в сумке есть бункеры, переходим к вводу весов
    if (bag.bagHoppers && bag.bagHoppers.length > 0) {
      ctx.session.state = 'return_input_weights';
      await handleReturnInputWeights(ctx);
    } else {
      // Если бункеров нет, переходим к фото
      ctx.session.state = 'return_photo';
      await handleReturnPhoto(ctx);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик продолжения без сумки
scene.action('continue_without_bag', async (ctx) => {
  try {
    await ctx.editMessageText('✅ Продолжаем без привязки к сумке.');
    
    // Переходим к фото
    ctx.session.state = 'return_photo';
    await handleReturnPhoto(ctx);
  } catch (error) {
    console.error('Ошибка при продолжении без сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния return_input_weights
async function handleReturnInputWeights(ctx) {
  try {
    const bagId = ctx.session.returnData.bagId;
    
    // Получаем информацию о сумке и бункерах
    const bag = await prisma.bag.findUnique({
      where: { id: bagId },
      include: {
        bagHoppers: {
          include: { ingredient: true }
        }
      }
    });
    
    if (!bag || !bag.bagHoppers || bag.bagHoppers.length === 0) {
      await ctx.reply('❌ В сумке нет бункеров. Пропускаем этот шаг.');
      ctx.session.state = 'return_photo';
      return await handleReturnPhoto(ctx);
    }
    
    // Если это первый бункер, отображаем инструкцию
    if (ctx.session.returnData.hopperWeights.length === 0) {
      await ctx.reply(`
⚖️ Ввод весов возвращаемых бункеров

Пожалуйста, введите вес каждого бункера после использования.
`);
    }
    
    // Получаем текущий бункер
    const currentIndex = ctx.session.returnData.hopperWeights.length;
    
    if (currentIndex >= bag.bagHoppers.length) {
      // Все бункеры обработаны, переходим к фото
      ctx.session.state = 'return_photo';
      return await handleReturnPhoto(ctx);
    }
    
    const currentHopper = bag.bagHoppers[currentIndex];
    
    await ctx.reply(`
🧂 Бункер с ингредиентом: ${currentHopper.ingredient.name} (${currentHopper.ingredient.code})
⚖️ Исходный вес: ${currentHopper.weight} г

Введите вес бункера после использования (в граммах):
`);
    
    // Ожидаем ввод веса от пользователя
  } catch (error) {
    console.error('Ошибка при вводе весов бункеров:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода веса бункера
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'return_input_weights') {
    try {
      // Получаем введенный вес
      const weight = parseInt(ctx.message.text.trim());
      
      if (isNaN(weight) || weight < 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (вес в граммах).');
      }
      
      const bagId = ctx.session.returnData.bagId;
      
      // Получаем информацию о сумке и бункерах
      const bag = await prisma.bag.findUnique({
        where: { id: bagId },
        include: {
          bagHoppers: {
            include: { ingredient: true }
          }
        }
      });
      
      // Получаем текущий бункер
      const currentIndex = ctx.session.returnData.hopperWeights.length;
      const currentHopper = bag.bagHoppers[currentIndex];
      
      // Сохраняем вес
      ctx.session.returnData.hopperWeights.push({
        hopperIndex: currentIndex,
        ingredientId: currentHopper.ingredientId,
        originalWeight: currentHopper.weight,
        returnedWeight: weight
      });
      
      await ctx.reply(`✅ Вес бункера с ингредиентом "${currentHopper.ingredient.name}" (${weight} г) сохранен.`);
      
      // Переходим к следующему бункеру
      await handleReturnInputWeights(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода веса бункера:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'return_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.returnData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к завершению возврата
      ctx.session.state = 'return_finish';
      await handleReturnFinish(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния return_photo
async function handleReturnPhoto(ctx) {
  try {
    await ctx.reply(`
📸 Фото возвращаемых товаров

Пожалуйста, сделайте фото возвращаемых товаров.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'return_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото возвращаемых товаров:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото возвращаемых товаров
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'return_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.returnData.photo = photoId;
      
      await ctx.reply('✅ Фото возвращаемых товаров получено.');
      
      // Запрашиваем примечания
      await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
      
      // Ожидаем ввод примечаний от пользователя
      ctx.session.state = 'return_input_notes';
    } catch (error) {
      console.error('Ошибка при получении фото возвращаемых товаров:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'return_wait_photo') {
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'return_input_notes';
  } else if (ctx.session.state === 'return_input_notes') {
    ctx.session.returnData.notes = null;
    
    // Переходим к завершению возврата
    ctx.session.state = 'return_finish';
    await handleReturnFinish(ctx);
  }
});

// Обработка состояния return_finish
async function handleReturnFinish(ctx) {
  try {
    const returnData = ctx.session.returnData;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: returnData.taskId },
      include: {
        machine: {
          include: { location: true }
        },
        assignedUser: true
      }
    });
    
    // Формируем текст подтверждения
    let confirmText = `
📦 Подтверждение приема возврата

🔹 Задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode}
🔹 Оператор: ${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}
`;
    
    // Добавляем информацию о сумке, если она выбрана
    if (returnData.bagId) {
      const bag = await prisma.bag.findUnique({
        where: { id: returnData.bagId }
      });
      
      confirmText += `🔹 Сумка: #${bag.id}\n`;
    }
    
    // Добавляем информацию о бункерах, если они есть
    if (returnData.hopperWeights && returnData.hopperWeights.length > 0) {
      confirmText += '\n🧂 Возвращаемые бункеры:\n';
      
      for (const hopperWeight of returnData.hopperWeights) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: hopperWeight.ingredientId }
        });
        
        confirmText += `- ${ingredient.name}: ${hopperWeight.returnedWeight} г (исходный вес: ${hopperWeight.originalWeight} г)\n`;
      }
    }
    
    // Добавляем примечания, если они есть
    if (returnData.notes) {
      confirmText += `\n📝 Примечания: ${returnData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_return')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при завершении возврата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения возврата
scene.action('confirm_return', async (ctx) => {
  try {
    const returnData = ctx.session.returnData;
    
    // Создаем запись о возврате в базе данных
    const warehouseReturn = await prisma.warehouseReturn.create({
      data: {
        taskId: returnData.taskId,
        bagId: returnData.bagId,
        photo: returnData.photo,
        notes: returnData.notes,
        userId: ctx.session.user.id,
        timestamp: new Date()
      }
    });
    
    // Если есть бункеры, сохраняем информацию о них
    if (returnData.hopperWeights && returnData.hopperWeights.length > 0) {
      for (const hopperWeight of returnData.hopperWeights) {
        await prisma.returnedHopper.create({
          data: {
            returnId: warehouseReturn.id,
            ingredientId: hopperWeight.ingredientId,
            originalWeight: hopperWeight.originalWeight,
            returnedWeight: hopperWeight.returnedWeight
          }
        });
        
        // Обновляем остатки на складе
        const usedWeight = hopperWeight.originalWeight - hopperWeight.returnedWeight;
        
        if (usedWeight > 0) {
          // Получаем текущий остаток ингредиента
          const ingredientInventory = await prisma.ingredientInventory.findFirst({
            where: { ingredientId: hopperWeight.ingredientId }
          });
          
          if (ingredientInventory) {
            // Обновляем существующий остаток (вычитаем использованный вес)
            await prisma.ingredientInventory.update({
              where: { id: ingredientInventory.id },
              data: { 
                weight: ingredientInventory.weight - usedWeight,
                lastUpdated: new Date()
              }
            });
          }
        }
      }
    }
    
    // Если была выбрана сумка, обновляем ее статус
    if (returnData.bagId) {
      await prisma.bag.update({
        where: { id: returnData.bagId },
        data: { status: 'RETURNED' }
      });
    }
    
    // Отображаем сообщение об успешном приеме возврата
    await ctx.editMessageText(`
✅ Возврат успешно принят!

🔹 ID: ${warehouseReturn.id}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Остатки на складе обновлены.
`);
    
    // Предлагаем принять еще один возврат или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Принять еще возврат', 'return_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при приеме возврата:', error);
    await ctx.reply('❌ Произошла ошибка при приеме возврата. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Прием возврата отменен.');
  await ctx.scene.leave();
});

// Обработчик приема еще одного возврата
scene.action('return_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.returnData = {
    taskId: null,
    bagId: null,
    hopperWeights: [],
    photo: null,
    notes: null
  };
  
  ctx.session.state = 'return_select_task';
  await ctx.editMessageText('📦 Прием нового возврата...');
  await handleReturnSelectTask(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

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
