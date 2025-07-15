/**
 * FSM: task_execution_fsm
 * Назначение: Выполнение назначенной задачи по чек-листу.
 * Роли: Оператор, Техник.
 * Состояния:
 *   - task_list_assigned: список назначенных задач
 *   - task_view_details: просмотр деталей задачи
 *   - task_start: начало выполнения задачи
 *   - task_photo_before: фото до выполнения
 *   - task_input_weights: ввод весов (для ингредиентов)
 *   - task_input_units: ввод количества (для воды)
 *   - task_photo_after: фото после выполнения
 *   - task_finish: завершение задачи
 *   - task_error_report: отчет об ошибке
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('task_execution_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[task_execution_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные выполнения задачи
    ctx.session.executionData = {
      taskId: null,
      photoBefore: null,
      photoAfter: null,
      weights: [],
      units: [],
      currentChecklistItemIndex: 0,
      checklistCompleted: false
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'task_list_assigned';
    
    // Переходим к списку назначенных задач
    await handleTaskListAssigned(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену task_execution_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_list_assigned
async function handleTaskListAssigned(ctx) {
  try {
    // Получаем ID пользователя
    const userId = ctx.session.user.id;
    
    // Получаем список назначенных задач
    const tasks = await prisma.task.findMany({
      where: {
        assignedUserId: userId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      include: {
        machine: {
          include: { location: true }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ]
    });
    
    if (tasks.length === 0) {
      await ctx.reply('📭 У вас нет активных задач.');
      return await ctx.scene.leave();
    }
    
    const message = `
📋 Ваши активные задачи:

Выберите задачу для выполнения:
`;
    
    // Создаем клавиатуру с задачами
    const buttons = tasks.map(task => {
      const statusIcon = task.status === 'ASSIGNED' ? '⏳' : '🔄';
      const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
      
      return [Markup.button.callback(
        `${statusIcon} ${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})`,
        `task_${task.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при получении списка задач:', error);
    await ctx.reply('❌ Произошла ошибка при получении списка задач. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора задачи
scene.action(/^task_(.+)$/, async (ctx) => {
  try {
    const taskId = ctx.match[1];
    
    // Сохраняем ID задачи
    ctx.session.executionData.taskId = taskId;
    
    // Переходим к просмотру деталей задачи
    ctx.session.state = 'task_view_details';
    await handleTaskViewDetails(ctx);
  } catch (error) {
    console.error('Ошибка при выборе задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_view_details
async function handleTaskViewDetails(ctx) {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        machine: {
          include: { location: true }
        },
        assignedUser: true,
        createdBy: true,
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        },
        taskIngredients: {
          include: { ingredient: true }
        },
        taskWaters: {
          include: { waterType: true }
        }
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      ctx.session.state = 'task_list_assigned';
      return await handleTaskListAssigned(ctx);
    }
    
    // Формируем текст с деталями задачи
    let detailsText = `
📋 Детали задачи:

🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Статус: ${getTaskStatusName(task.status)}
🔹 Срок: ${task.dueDate.toLocaleDateString('ru-RU')}
🔹 Создана: ${task.createdAt.toLocaleDateString('ru-RU')} (${task.createdBy.firstName} ${task.createdBy.lastName || ''})
`;
    
    // Добавляем информацию об ингредиентах, если они есть
    if (task.taskIngredients && task.taskIngredients.length > 0) {
      detailsText += '\n🧂 Ингредиенты для замены:\n';
      task.taskIngredients.forEach(ti => {
        detailsText += `- ${ti.ingredient.name} (${ti.ingredient.code})\n`;
      });
    }
    
    // Добавляем информацию о воде, если она есть
    if (task.taskWaters && task.taskWaters.length > 0) {
      detailsText += '\n💧 Вода для замены:\n';
      task.taskWaters.forEach(tw => {
        detailsText += `- ${tw.waterType.name} (${tw.waterType.volume} л)\n`;
      });
    }
    
    // Добавляем описание, если оно есть
    if (task.description) {
      detailsText += `\n📝 Описание: ${task.description}\n`;
    }
    
    // Добавляем информацию о чек-листе, если он есть
    if (task.checklist) {
      detailsText += `\n📝 Чек-лист: ${task.checklist.items.length} пунктов\n`;
    }
    
    // Создаем клавиатуру с действиями
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('▶️ Начать выполнение', 'start_execution')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.editMessageText(detailsText, keyboard);
  } catch (error) {
    console.error('Ошибка при просмотре деталей задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик начала выполнения задачи
scene.action('start_execution', async (ctx) => {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Обновляем статус задачи на "В процессе"
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' }
    });
    
    // Переходим к следующему шагу в зависимости от типа задачи
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      ctx.session.state = 'task_list_assigned';
      return await handleTaskListAssigned(ctx);
    }
    
    await ctx.editMessageText(`✅ Задача переведена в статус "В процессе"`);
    
    // Переходим к фото до выполнения
    ctx.session.state = 'task_photo_before';
    await handleTaskPhotoBefore(ctx);
  } catch (error) {
    console.error('Ошибка при начале выполнения задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_photo_before
async function handleTaskPhotoBefore(ctx) {
  try {
    await ctx.reply(`
📸 Сделайте фото ДО выполнения задачи.

Пожалуйста, сфотографируйте текущее состояние автомата/ингредиентов/воды.
Отправьте фото или нажмите кнопку "Пропустить", если фото не требуется.
`, Markup.inlineKeyboard([
      [Markup.button.callback('⏩ Пропустить', 'skip_photo_before')]
    ]));
    
    // Ожидаем фото от пользователя
  } catch (error) {
    console.error('Ошибка при запросе фото до выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик пропуска фото до выполнения
scene.action('skip_photo_before', async (ctx) => {
  try {
    await ctx.editMessageText('⏩ Фото ДО выполнения пропущено.');
    
    // Переходим к следующему шагу в зависимости от типа задачи
    const task = await prisma.task.findUnique({
      where: { id: ctx.session.executionData.taskId }
    });
    
    if (task.type === 'INGREDIENTS') {
      ctx.session.state = 'task_input_weights';
      await handleTaskInputWeights(ctx);
    } else if (task.type === 'WATER') {
      ctx.session.state = 'task_input_units';
      await handleTaskInputUnits(ctx);
    } else if (task.checklist) {
      ctx.session.state = 'task_checklist';
      await handleTaskChecklist(ctx);
    } else {
      ctx.session.state = 'task_photo_after';
      await handleTaskPhotoAfter(ctx);
    }
  } catch (error) {
    console.error('Ошибка при пропуске фото до выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик получения фото до выполнения
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'task_photo_before') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.executionData.photoBefore = photoId;
      
      await ctx.reply('✅ Фото ДО выполнения получено.');
      
      // Переходим к следующему шагу в зависимости от типа задачи
      const task = await prisma.task.findUnique({
        where: { id: ctx.session.executionData.taskId }
      });
      
      if (task.type === 'INGREDIENTS') {
        ctx.session.state = 'task_input_weights';
        await handleTaskInputWeights(ctx);
      } else if (task.type === 'WATER') {
        ctx.session.state = 'task_input_units';
        await handleTaskInputUnits(ctx);
      } else if (task.checklist) {
        ctx.session.state = 'task_checklist';
        await handleTaskChecklist(ctx);
      } else {
        ctx.session.state = 'task_photo_after';
        await handleTaskPhotoAfter(ctx);
      }
    } catch (error) {
      console.error('Ошибка при получении фото до выполнения:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния task_input_weights
async function handleTaskInputWeights(ctx) {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Получаем информацию о задаче и ингредиентах
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        taskIngredients: {
          include: { ingredient: true }
        }
      }
    });
    
    if (!task || !task.taskIngredients || task.taskIngredients.length === 0) {
      await ctx.reply('❌ Не найдены ингредиенты для задачи. Пропускаем этот шаг.');
      
      if (task.checklist) {
        ctx.session.state = 'task_checklist';
        return await handleTaskChecklist(ctx);
      } else {
        ctx.session.state = 'task_photo_after';
        return await handleTaskPhotoAfter(ctx);
      }
    }
    
    // Если это первый ингредиент, отображаем инструкцию
    if (ctx.session.executionData.weights.length === 0) {
      await ctx.reply(`
⚖️ Ввод весов ингредиентов

Пожалуйста, введите вес каждого ингредиента (в граммах) после замены.
`);
    }
    
    // Получаем текущий ингредиент
    const currentIndex = ctx.session.executionData.weights.length;
    
    if (currentIndex >= task.taskIngredients.length) {
      // Все ингредиенты обработаны, переходим к следующему шагу
      if (task.checklist) {
        ctx.session.state = 'task_checklist';
        return await handleTaskChecklist(ctx);
      } else {
        ctx.session.state = 'task_photo_after';
        return await handleTaskPhotoAfter(ctx);
      }
    }
    
    const currentIngredient = task.taskIngredients[currentIndex].ingredient;
    
    await ctx.reply(`
🧂 Ингредиент: ${currentIngredient.name} (${currentIngredient.code})

Введите вес в граммах:
`);
    
    // Ожидаем ввод веса от пользователя
  } catch (error) {
    console.error('Ошибка при вводе весов ингредиентов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода веса ингредиента
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'task_input_weights') {
    try {
      // Получаем введенный вес
      const weight = parseInt(ctx.message.text.trim());
      
      if (isNaN(weight) || weight < 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (вес в граммах).');
      }
      
      // Получаем информацию о задаче и ингредиентах
      const task = await prisma.task.findUnique({
        where: { id: ctx.session.executionData.taskId },
        include: {
          taskIngredients: {
            include: { ingredient: true }
          }
        }
      });
      
      // Получаем текущий ингредиент
      const currentIndex = ctx.session.executionData.weights.length;
      const currentIngredient = task.taskIngredients[currentIndex].ingredient;
      
      // Сохраняем вес
      ctx.session.executionData.weights.push({
        ingredientId: currentIngredient.id,
        weight
      });
      
      await ctx.reply(`✅ Вес ингредиента ${currentIngredient.name} (${weight} г) сохранен.`);
      
      // Переходим к следующему ингредиенту или шагу
      await handleTaskInputWeights(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода веса ингредиента:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'task_input_units') {
    try {
      // Получаем введенное количество
      const units = parseInt(ctx.message.text.trim());
      
      if (isNaN(units) || units < 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (количество бутылок).');
      }
      
      // Получаем информацию о задаче и типах воды
      const task = await prisma.task.findUnique({
        where: { id: ctx.session.executionData.taskId },
        include: {
          taskWaters: {
            include: { waterType: true }
          }
        }
      });
      
      // Получаем текущий тип воды
      const currentIndex = ctx.session.executionData.units.length;
      const currentWaterType = task.taskWaters[currentIndex].waterType;
      
      // Сохраняем количество
      ctx.session.executionData.units.push({
        waterTypeId: currentWaterType.id,
        units
      });
      
      await ctx.reply(`✅ Количество бутылок ${currentWaterType.name} (${units} шт.) сохранено.`);
      
      // Переходим к следующему типу воды или шагу
      await handleTaskInputUnits(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода количества бутылок:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния task_input_units
async function handleTaskInputUnits(ctx) {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Получаем информацию о задаче и типах воды
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        taskWaters: {
          include: { waterType: true }
        }
      }
    });
    
    if (!task || !task.taskWaters || task.taskWaters.length === 0) {
      await ctx.reply('❌ Не найдены типы воды для задачи. Пропускаем этот шаг.');
      
      if (task.checklist) {
        ctx.session.state = 'task_checklist';
        return await handleTaskChecklist(ctx);
      } else {
        ctx.session.state = 'task_photo_after';
        return await handleTaskPhotoAfter(ctx);
      }
    }
    
    // Если это первый тип воды, отображаем инструкцию
    if (ctx.session.executionData.units.length === 0) {
      await ctx.reply(`
🔢 Ввод количества бутылок

Пожалуйста, введите количество бутылок каждого типа воды после замены.
`);
    }
    
    // Получаем текущий тип воды
    const currentIndex = ctx.session.executionData.units.length;
    
    if (currentIndex >= task.taskWaters.length) {
      // Все типы воды обработаны, переходим к следующему шагу
      if (task.checklist) {
        ctx.session.state = 'task_checklist';
        return await handleTaskChecklist(ctx);
      } else {
        ctx.session.state = 'task_photo_after';
        return await handleTaskPhotoAfter(ctx);
      }
    }
    
    const currentWaterType = task.taskWaters[currentIndex].waterType;
    
    await ctx.reply(`
💧 Тип воды: ${currentWaterType.name} (${currentWaterType.volume} л)

Введите количество бутылок:
`);
    
    // Ожидаем ввод количества от пользователя
  } catch (error) {
    console.error('Ошибка при вводе количества бутылок:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния task_checklist
async function handleTaskChecklist(ctx) {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Получаем информацию о задаче и чек-листе
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    
    if (!task || !task.checklist || !task.checklist.items || task.checklist.items.length === 0) {
      await ctx.reply('❌ Не найден чек-лист для задачи. Пропускаем этот шаг.');
      ctx.session.state = 'task_photo_after';
      return await handleTaskPhotoAfter(ctx);
    }
    
    // Если это первый пункт чек-листа, отображаем инструкцию
    if (ctx.session.executionData.currentChecklistItemIndex === 0) {
      await ctx.reply(`
📝 Выполнение чек-листа

Пожалуйста, выполните каждый пункт чек-листа и отметьте его как выполненный.
`);
    }
    
    // Получаем текущий пункт чек-листа
    const currentIndex = ctx.session.executionData.currentChecklistItemIndex;
    
    if (currentIndex >= task.checklist.items.length) {
      // Все пункты чек-листа выполнены, переходим к следующему шагу
      ctx.session.executionData.checklistCompleted = true;
      ctx.session.state = 'task_photo_after';
      return await handleTaskPhotoAfter(ctx);
    }
    
    const currentItem = task.checklist.items[currentIndex];
    
    await ctx.reply(`
📋 Пункт ${currentIndex + 1}/${task.checklist.items.length}:

${currentItem.text}
`, Markup.inlineKeyboard([
      [Markup.button.callback('✅ Выполнено', `checklist_done_${currentItem.id}`)],
      [Markup.button.callback('❌ Не выполнено', `checklist_skip_${currentItem.id}`)]
    ]));
    
    // Ожидаем ответ от пользователя
  } catch (error) {
    console.error('Ошибка при выполнении чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выполнения пунктов чек-листа
scene.action(/^checklist_done_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Обновляем статус пункта чек-листа
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { status: 'COMPLETED' }
    });
    
    await ctx.editMessageText(`✅ Пункт выполнен.`);
    
    // Переходим к следующему пункту
    ctx.session.executionData.currentChecklistItemIndex++;
    await handleTaskChecklist(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выполнения пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

scene.action(/^checklist_skip_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Обновляем статус пункта чек-листа
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { status: 'SKIPPED' }
    });
    
    await ctx.editMessageText(`⏩ Пункт пропущен.`);
    
    // Переходим к следующему пункту
    ctx.session.executionData.currentChecklistItemIndex++;
    await handleTaskChecklist(ctx);
  } catch (error) {
    console.error('Ошибка при обработке пропуска пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_photo_after
async function handleTaskPhotoAfter(ctx) {
  try {
    await ctx.reply(`
📸 Сделайте фото ПОСЛЕ выполнения задачи.

Пожалуйста, сфотографируйте результат выполнения задачи.
Отправьте фото или нажмите кнопку "Пропустить", если фото не требуется.
`, Markup.inlineKeyboard([
      [Markup.button.callback('⏩ Пропустить', 'skip_photo_after')]
    ]));
    
    // Ожидаем фото от пользователя
  } catch (error) {
    console.error('Ошибка при запросе фото после выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик пропуска фото после выполнения
scene.action('skip_photo_after', async (ctx) => {
  try {
    await ctx.editMessageText('⏩ Фото ПОСЛЕ выполнения пропущено.');
    
    // Переходим к завершению задачи
    ctx.session.state = 'task_finish';
    await handleTaskFinish(ctx);
  } catch (error) {
    console.error('Ошибка при пропуске фото после выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик получения фото после выполнения
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'task_photo_after') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.executionData.photoAfter = photoId;
      
      await ctx.reply('✅ Фото ПОСЛЕ выполнения получено.');
      
      // Переходим к завершению задачи
      ctx.session.state = 'task_finish';
      await handleTaskFinish(ctx);
    } catch (error) {
      console.error('Ошибка при получении фото после выполнения:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния task_finish
async function handleTaskFinish(ctx) {
  try {
    const taskId = ctx.session.executionData.taskId;
    
    // Получаем информацию о задаче
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        machine: {
          include: { location: true }
        },
        checklist: true
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена. Попробуйте снова.');
      ctx.session.state = 'task_list_assigned';
      return await handleTaskListAssigned(ctx);
    }
    
    // Проверяем, выполнен ли чек-лист (если он есть)
    let checklistCompleted = true;
    
    if (task.checklist) {
      const checklistItems = await prisma.checklistItem.findMany({
        where: { checklistId: task.checklist.id }
      });
      
      // Проверяем, все ли пункты чек-листа выполнены или пропущены
      checklistCompleted = checklistItems.every(item => 
        item.status === 'COMPLETED' || item.status === 'SKIPPED'
      );
      
      if (!checklistCompleted) {
        await ctx.reply('⚠️ Не все пункты чек-листа выполнены. Пожалуйста, завершите чек-лист.');
        ctx.session.state = 'task_checklist';
        return await handleTaskChecklist(ctx);
      }
      
      // Обновляем статус чек-листа
      await prisma.checklist.update({
        where: { id: task.checklist.id },
        data: { status: 'COMPLETED' }
      });
    }
    
    // Сохраняем данные о выполнении задачи
    const executionData = ctx.session.executionData;
    
    // Создаем запись о выполнении задачи
    const taskExecution = await prisma.taskExecution.create({
      data: {
        taskId,
        executorId: ctx.session.user.id,
        photoBefore: executionData.photoBefore,
        photoAfter: executionData.photoAfter,
        completedAt: new Date()
      }
    });
    
    // Сохраняем данные о весах ингредиентов, если они есть
    if (executionData.weights && executionData.weights.length > 0) {
      for (const weightData of executionData.weights) {
        await prisma.ingredientWeight.create({
          data: {
            taskExecutionId: taskExecution.id,
            ingredientId: weightData.ingredientId,
            weight: weightData.weight
          }
        });
      }
    }
    
    // Сохраняем данные о количестве бутылок воды, если они есть
    if (executionData.units && executionData.units.length > 0) {
      for (const unitData of executionData.units) {
        await prisma.waterUnit.create({
          data: {
            taskExecutionId: taskExecution.id,
            waterTypeId: unitData.waterTypeId,
            units: unitData.units
          }
        });
      }
    }
    
    // Обновляем статус задачи на "Выполнено"
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' }
    });
    
    // Отправляем уведомление менеджеру
    try {
      // Получаем информацию о создателе задачи
      const manager = await prisma.user.findUnique({
        where: { id: task.createdById },
        select: { telegramId: true }
      });
      
      if (manager && manager.telegramId) {
        // Формируем текст уведомления
        const notificationText = `
✅ Задача выполнена!

🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Исполнитель: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}
🔹 Дата выполнения: ${new Date().toLocaleDateString('ru-RU')}
`;
        
        // Отправляем уведомление
        await ctx.telegram.sendMessage(manager.telegramId, notificationText);
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления менеджеру:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    // Отображаем сообщение об успешном выполнении задачи
    await ctx.reply(`
✅ Задача успешно выполнена!

🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Дата выполнения: ${new Date().toLocaleDateString('ru-RU')}

Менеджер получил уведомление о выполнении задачи.
`);
    
    // Предлагаем вернуться к списку задач или в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 К списку задач', 'back_to_tasks')],
      [Markup.button.callback('🔙 В главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при завершении задачи:', error);
    await ctx.reply('❌ Произошла ошибка при завершении задачи. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Выполнение задачи отменено.');
  await ctx.scene.leave();
});

// Обработчик возврата к списку задач
scene.action('back_to_tasks', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.executionData = {
    taskId: null,
    photoBefore: null,
    photoAfter: null,
    weights: [],
    units: [],
    currentChecklistItemIndex: 0,
    checklistCompleted: false
  };
  
  ctx.session.state = 'task_list_assigned';
  await ctx.editMessageText('📋 Возвращаемся к списку задач...');
  await handleTaskListAssigned(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

// Обработка состояния task_error_report
async function handleTaskErrorReport(ctx) {
  try {
    await ctx.reply(`
⚠️ Отчет об ошибке

Пожалуйста, опишите проблему, с которой вы столкнулись при выполнении задачи.
Это поможет менеджеру разобраться в ситуации.
`);
    
    // Ожидаем ввод текста от пользователя
    ctx.session.state = 'task_error_text';
  } catch (error) {
    console.error('Ошибка при создании отчета об ошибке:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода текста ошибки
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'task_error_text') {
    try {
      const errorText = ctx.message.text.trim();
      
      if (!errorText) {
        return await ctx.reply('❌ Пожалуйста, введите описание проблемы.');
      }
      
      // Создаем отчет об ошибке
      await prisma.taskError.create({
        data: {
          taskId: ctx.session.executionData.taskId,
          userId: ctx.session.user.id,
          description: errorText,
          createdAt: new Date()
        }
      });
      
      // Отправляем уведомление менеджеру
      try {
        const task = await prisma.task.findUnique({
          where: { id: ctx.session.executionData.taskId },
          include: {
            machine: {
              include: { location: true }
            },
            createdBy: true
          }
        });
        
        if (task && task.createdBy && task.createdBy.telegramId) {
          // Формируем текст уведомления
          const notificationText = `
⚠️ Проблема при выполнении задачи!

🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Исполнитель: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

📝 Описание проблемы:
${errorText}
`;
          
          // Отправляем уведомление
          await ctx.telegram.sendMessage(task.createdBy.telegramId, notificationText);
        }
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления о проблеме:', notificationError);
        // Не прерываем выполнение, если не удалось отправить уведомление
      }
      
      await ctx.reply(`
✅ Отчет об ошибке отправлен.

Менеджер получил уведомление о проблеме и свяжется с вами.
`);
      
      // Предлагаем вернуться к списку задач или в главное меню
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📋 К списку задач', 'back_to_tasks')],
        [Markup.button.callback('🔙 В главное меню', 'back_to_menu')]
      ]);
      
      await ctx.reply('Что вы хотите сделать дальше?', keyboard);
    } catch (error) {
      console.error('Ошибка при обработке отчета об ошибке:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
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

// Функция для получения названия статуса задачи
function getTaskStatusName(status) {
  const taskStatuses = {
    'CREATED': '🆕 Создана',
    'ASSIGNED': '⏳ Назначена',
    'IN_PROGRESS': '🔄 В процессе',
    'COMPLETED': '✅ Выполнена',
    'CANCELLED': '❌ Отменена'
  };
  
  return taskStatuses[status] || status;
}

module.exports = scene;
