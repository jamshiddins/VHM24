/**
 * FSM: task_create_fsm
 * Назначение: Создание новых задач (для оператора, техника, склада).
 * Роли: Менеджер.
 * Состояния:
 *   - task_select_type: выбор типа задачи
 *   - task_select_machine: выбор автомата
 *   - task_select_items: выбор ингредиентов, сиропов, воды, миксеров
 *   - task_select_deadline: выбор срока выполнения
 *   - task_select_checklist_template: выбор шаблона чек-листа
 *   - task_assign_executor: назначение исполнителя
 *   - task_confirm_create: подтверждение создания задачи
 *   - task_success: успешное создание задачи
 *   - task_error: ошибка при создании задачи
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('task_create_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[task_create_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или MANAGER
  if (!ctx.session.user || !['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к созданию задач.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные задачи
    ctx.session.taskData = {
      type: null,
      machineId: null,
      items: [],
      deadline: null,
      checklistTemplateId: null,
      executorId: null,
      description: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'task_select_type';
    
    // Переходим к выбору типа задачи
    await handleTaskSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену task_create_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_select_type
async function handleTaskSelectType(ctx) {
  try {
    const message = `
📋 Создание новой задачи

Выберите тип задачи:
`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Замена ингредиентов', 'task_type_ingredients')],
      [Markup.button.callback('💧 Замена воды', 'task_type_water')],
      [Markup.button.callback('🧹 Чистка автомата', 'task_type_cleaning')],
      [Markup.button.callback('🔧 Ремонт', 'task_type_repair')],
      [Markup.button.callback('💰 Инкассация', 'task_type_cash')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе типа задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора типа задачи
scene.action(/^task_type_(.+)$/, async (ctx) => {
  try {
    const taskType = ctx.match[1];
    
    // Сохраняем тип задачи
    ctx.session.taskData.type = taskType.toUpperCase();
    
    // Отображаем выбранный тип
    let taskTypeName = '';
    switch (taskType) {
      case 'ingredients':
        taskTypeName = '🔄 Замена ингредиентов';
        break;
      case 'water':
        taskTypeName = '💧 Замена воды';
        break;
      case 'cleaning':
        taskTypeName = '🧹 Чистка автомата';
        break;
      case 'repair':
        taskTypeName = '🔧 Ремонт';
        break;
      case 'cash':
        taskTypeName = '💰 Инкассация';
        break;
    }
    
    await ctx.editMessageText(`Выбран тип задачи: ${taskTypeName}`);
    
    // Переходим к выбору автомата
    ctx.session.state = 'task_select_machine';
    await handleTaskSelectMachine(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_select_machine
async function handleTaskSelectMachine(ctx) {
  try {
    // Получаем список автоматов
    const machines = await prisma.machine.findMany({
      include: {
        location: true
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        internalCode: 'asc'
      }
    });
    
    if (machines.length === 0) {
      await ctx.reply('❌ Нет доступных автоматов. Невозможно создать задачу.');
      return await ctx.scene.leave();
    }
    
    const message = `
🏭 Выберите автомат для задачи:
`;
    
    // Создаем клавиатуру с автоматами
    const buttons = machines.map(machine => {
      const locationName = machine.location ? machine.location.name : 'Без локации';
      return [Markup.button.callback(
        `${machine.internalCode} - ${locationName}`,
        `machine_${machine.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора автомата
scene.action(/^machine_(.+)$/, async (ctx) => {
  try {
    const machineId = ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.taskData.machineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleTaskSelectMachine(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // В зависимости от типа задачи переходим к следующему шагу
    if (['INGREDIENTS', 'WATER'].includes(ctx.session.taskData.type)) {
      ctx.session.state = 'task_select_items';
      await handleTaskSelectItems(ctx);
    } else {
      ctx.session.state = 'task_select_deadline';
      await handleTaskSelectDeadline(ctx);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_select_items
async function handleTaskSelectItems(ctx) {
  try {
    const taskType = ctx.session.taskData.type;
    
    if (taskType === 'INGREDIENTS') {
      // Получаем список доступных ингредиентов
      const ingredients = await prisma.ingredient.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' }
      });
      
      if (ingredients.length === 0) {
        await ctx.reply('❌ Нет доступных ингредиентов. Невозможно создать задачу.');
        return await ctx.scene.leave();
      }
      
      const message = `
🧂 Выберите ингредиенты для замены:
`;
      
      // Создаем клавиатуру с ингредиентами
      const buttons = ingredients.map(ingredient => {
        return [Markup.button.callback(
          `${ingredient.name} (${ingredient.code})`,
          `ingredient_${ingredient.id}`
        )];
      });
      
      // Добавляем кнопки управления
      buttons.push([
        Markup.button.callback('✅ Готово', 'items_done'),
        Markup.button.callback('❌ Отмена', 'cancel')
      ]);
      
      const keyboard = Markup.inlineKeyboard(buttons);
      
      await ctx.reply(message, keyboard);
    } else if (taskType === 'WATER') {
      // Получаем список доступных типов воды
      const waterTypes = await prisma.waterType.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' }
      });
      
      if (waterTypes.length === 0) {
        await ctx.reply('❌ Нет доступных типов воды. Невозможно создать задачу.');
        return await ctx.scene.leave();
      }
      
      const message = `
💧 Выберите типы воды для замены:
`;
      
      // Создаем клавиатуру с типами воды
      const buttons = waterTypes.map(waterType => {
        return [Markup.button.callback(
          `${waterType.name} (${waterType.volume} л)`,
          `water_${waterType.id}`
        )];
      });
      
      // Добавляем кнопки управления
      buttons.push([
        Markup.button.callback('✅ Готово', 'items_done'),
        Markup.button.callback('❌ Отмена', 'cancel')
      ]);
      
      const keyboard = Markup.inlineKeyboard(buttons);
      
      await ctx.reply(message, keyboard);
    }
  } catch (error) {
    console.error('Ошибка при выборе ингредиентов/воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора ингредиентов
scene.action(/^ingredient_(.+)$/, async (ctx) => {
  try {
    const ingredientId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот ингредиент
    const existingIndex = ctx.session.taskData.items.findIndex(
      item => item.id === ingredientId && item.type === 'INGREDIENT'
    );
    
    if (existingIndex !== -1) {
      // Если ингредиент уже выбран, удаляем его
      ctx.session.taskData.items.splice(existingIndex, 1);
      await ctx.answerCbQuery('Ингредиент удален из списка');
    } else {
      // Добавляем ингредиент в список
      ctx.session.taskData.items.push({
        id: ingredientId,
        type: 'INGREDIENT'
      });
      await ctx.answerCbQuery('Ингредиент добавлен в список');
    }
    
    // Обновляем сообщение с текущим выбором
    const selectedItems = ctx.session.taskData.items.filter(item => item.type === 'INGREDIENT');
    
    if (selectedItems.length > 0) {
      // Получаем информацию о выбранных ингредиентах
      const ingredientIds = selectedItems.map(item => item.id);
      const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } }
      });
      
      let selectedText = '🧂 Выбранные ингредиенты:\n';
      ingredients.forEach(ingredient => {
        selectedText += `- ${ingredient.name} (${ingredient.code})\n`;
      });
      
      await ctx.reply(selectedText);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора ингредиента:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора воды
scene.action(/^water_(.+)$/, async (ctx) => {
  try {
    const waterTypeId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот тип воды
    const existingIndex = ctx.session.taskData.items.findIndex(
      item => item.id === waterTypeId && item.type === 'WATER'
    );
    
    if (existingIndex !== -1) {
      // Если тип воды уже выбран, удаляем его
      ctx.session.taskData.items.splice(existingIndex, 1);
      await ctx.answerCbQuery('Тип воды удален из списка');
    } else {
      // Добавляем тип воды в список
      ctx.session.taskData.items.push({
        id: waterTypeId,
        type: 'WATER'
      });
      await ctx.answerCbQuery('Тип воды добавлен в список');
    }
    
    // Обновляем сообщение с текущим выбором
    const selectedItems = ctx.session.taskData.items.filter(item => item.type === 'WATER');
    
    if (selectedItems.length > 0) {
      // Получаем информацию о выбранных типах воды
      const waterTypeIds = selectedItems.map(item => item.id);
      const waterTypes = await prisma.waterType.findMany({
        where: { id: { in: waterTypeIds } }
      });
      
      let selectedText = '💧 Выбранные типы воды:\n';
      waterTypes.forEach(waterType => {
        selectedText += `- ${waterType.name} (${waterType.volume} л)\n`;
      });
      
      await ctx.reply(selectedText);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора типа воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик завершения выбора ингредиентов/воды
scene.action('items_done', async (ctx) => {
  try {
    // Проверяем, выбран ли хотя бы один элемент
    if (ctx.session.taskData.items.length === 0) {
      await ctx.answerCbQuery('❌ Необходимо выбрать хотя бы один элемент');
      return;
    }
    
    await ctx.answerCbQuery('✅ Выбор завершен');
    
    // Переходим к выбору срока выполнения
    ctx.session.state = 'task_select_deadline';
    await handleTaskSelectDeadline(ctx);
  } catch (error) {
    console.error('Ошибка при завершении выбора элементов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_select_deadline
async function handleTaskSelectDeadline(ctx) {
  try {
    const message = `
📅 Выберите срок выполнения задачи:
`;
    
    // Получаем текущую дату
    const now = new Date();
    
    // Создаем варианты сроков
    const today = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    // Форматируем даты
    const formatDate = (date) => {
      return date.toLocaleDateString('ru-RU');
    };
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(`Сегодня (${formatDate(today)})`, `deadline_today`)],
      [Markup.button.callback(`Завтра (${formatDate(tomorrow)})`, `deadline_tomorrow`)],
      [Markup.button.callback(`Послезавтра (${formatDate(dayAfterTomorrow)})`, `deadline_day_after_tomorrow`)],
      [Markup.button.callback(`Через неделю (${formatDate(nextWeek)})`, `deadline_next_week`)],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе срока выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора срока выполнения
scene.action(/^deadline_(.+)$/, async (ctx) => {
  try {
    const deadlineType = ctx.match[1];
    
    // Получаем текущую дату
    const now = new Date();
    
    // Устанавливаем срок в зависимости от выбора
    let deadline;
    let deadlineText;
    
    switch (deadlineType) {
      case 'today':
        deadline = new Date(now);
        deadline.setHours(23, 59, 59);
        deadlineText = 'Сегодня';
        break;
      case 'tomorrow':
        deadline = new Date(now);
        deadline.setDate(now.getDate() + 1);
        deadline.setHours(23, 59, 59);
        deadlineText = 'Завтра';
        break;
      case 'day_after_tomorrow':
        deadline = new Date(now);
        deadline.setDate(now.getDate() + 2);
        deadline.setHours(23, 59, 59);
        deadlineText = 'Послезавтра';
        break;
      case 'next_week':
        deadline = new Date(now);
        deadline.setDate(now.getDate() + 7);
        deadline.setHours(23, 59, 59);
        deadlineText = 'Через неделю';
        break;
      default:
        deadline = new Date(now);
        deadline.setDate(now.getDate() + 1);
        deadline.setHours(23, 59, 59);
        deadlineText = 'Завтра';
    }
    
    // Сохраняем срок выполнения
    ctx.session.taskData.deadline = deadline;
    
    await ctx.editMessageText(`Выбран срок выполнения: ${deadlineText} (${deadline.toLocaleDateString('ru-RU')})`);
    
    // Переходим к выбору шаблона чек-листа
    ctx.session.state = 'task_select_checklist_template';
    await handleTaskSelectChecklistTemplate(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора срока выполнения:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_select_checklist_template
async function handleTaskSelectChecklistTemplate(ctx) {
  try {
    // Получаем список шаблонов чек-листов в зависимости от типа задачи
    const taskType = ctx.session.taskData.type;
    
    const checklistTemplates = await prisma.checklistTemplate.findMany({
      where: {
        taskType: taskType,
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    if (checklistTemplates.length === 0) {
      // Если шаблонов нет, пропускаем этот шаг
      ctx.session.taskData.checklistTemplateId = null;
      ctx.session.state = 'task_assign_executor';
      return await handleTaskAssignExecutor(ctx);
    }
    
    const message = `
📝 Выберите шаблон чек-листа:
`;
    
    // Создаем клавиатуру с шаблонами
    const buttons = checklistTemplates.map(template => {
      return [Markup.button.callback(
        `${template.name}`,
        `template_${template.id}`
      )];
    });
    
    // Добавляем кнопку "Без чек-листа"
    buttons.push([Markup.button.callback('Без чек-листа', 'template_none')]);
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе шаблона чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора шаблона чек-листа
scene.action(/^template_(.+)$/, async (ctx) => {
  try {
    const templateId = ctx.match[1];
    
    if (templateId === 'none') {
      // Если выбрано "Без чек-листа"
      ctx.session.taskData.checklistTemplateId = null;
      await ctx.editMessageText('Выбрано: Без чек-листа');
    } else {
      // Сохраняем ID шаблона
      ctx.session.taskData.checklistTemplateId = templateId;
      
      // Получаем информацию о шаблоне
      const template = await prisma.checklistTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!template) {
        await ctx.reply('❌ Шаблон не найден. Попробуйте снова.');
        return await handleTaskSelectChecklistTemplate(ctx);
      }
      
      await ctx.editMessageText(`Выбран шаблон: ${template.name}`);
    }
    
    // Переходим к назначению исполнителя
    ctx.session.state = 'task_assign_executor';
    await handleTaskAssignExecutor(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора шаблона чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния task_assign_executor
async function handleTaskAssignExecutor(ctx) {
  try {
    // Определяем роль исполнителя в зависимости от типа задачи
    const taskType = ctx.session.taskData.type;
    let executorRole;
    
    switch (taskType) {
      case 'REPAIR':
        executorRole = 'TECHNICIAN';
        break;
      case 'INGREDIENTS':
      case 'WATER':
      case 'CLEANING':
      case 'CASH':
        executorRole = 'OPERATOR';
        break;
      default:
        executorRole = 'OPERATOR';
    }
    
    // Получаем список пользователей с соответствующей ролью
    const executors = await prisma.user.findMany({
      where: {
        role: executorRole,
        status: 'ACTIVE'
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    if (executors.length === 0) {
      await ctx.reply(`❌ Нет доступных исполнителей с ролью ${executorRole}. Невозможно создать задачу.`);
      return await ctx.scene.leave();
    }
    
    const message = `
👤 Выберите исполнителя задачи:
`;
    
    // Создаем клавиатуру с исполнителями
    const buttons = executors.map(user => {
      return [Markup.button.callback(
        `${user.firstName} ${user.lastName || ''}`,
        `executor_${user.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при назначении исполнителя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора исполнителя
scene.action(/^executor_(.+)$/, async (ctx) => {
  try {
    const executorId = ctx.match[1];
    
    // Сохраняем ID исполнителя
    ctx.session.taskData.executorId = executorId;
    
    // Получаем информацию об исполнителе
    const executor = await prisma.user.findUnique({
      where: { id: executorId }
    });
    
    if (!executor) {
      await ctx.reply('❌ Исполнитель не найден. Попробуйте снова.');
      return await handleTaskAssignExecutor(ctx);
    }
    
    await ctx.editMessageText(`Выбран исполнитель: ${executor.firstName} ${executor.lastName || ''}`);
    
    // Запрашиваем описание задачи
    ctx.session.state = 'task_description';
    await ctx.reply('📝 Введите описание задачи (или отправьте /skip для пропуска):');
  } catch (error) {
    console.error('Ошибка при обработке выбора исполнителя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка ввода описания задачи
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'task_description') {
    ctx.session.taskData.description = null;
    ctx.session.state = 'task_confirm_create';
    await handleTaskConfirmCreate(ctx);
  }
});

scene.on('text', async (ctx) => {
  if (ctx.session.state === 'task_description') {
    ctx.session.taskData.description = ctx.message.text;
    ctx.session.state = 'task_confirm_create';
    await handleTaskConfirmCreate(ctx);
  }
});

// Обработка состояния task_confirm_create
async function handleTaskConfirmCreate(ctx) {
  try {
    // Получаем данные для отображения
    const taskData = ctx.session.taskData;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: taskData.machineId },
      include: { location: true }
    });
    
    // Получаем информацию об исполнителе
    const executor = await prisma.user.findUnique({
      where: { id: taskData.executorId }
    });
    
    // Формируем текст для подтверждения
    let confirmText = `
📋 Подтвердите создание задачи:

🔹 Тип: ${getTaskTypeName(taskData.type)}
🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Срок: ${taskData.deadline.toLocaleDateString('ru-RU')}
🔹 Исполнитель: ${executor.firstName} ${executor.lastName || ''}
`;
    
    // Добавляем информацию о выбранных элементах, если они есть
    if (taskData.items.length > 0) {
      if (taskData.type === 'INGREDIENTS') {
        // Получаем информацию о выбранных ингредиентах
        const ingredientIds = taskData.items
          .filter(item => item.type === 'INGREDIENT')
          .map(item => item.id);
        
        if (ingredientIds.length > 0) {
          const ingredients = await prisma.ingredient.findMany({
            where: { id: { in: ingredientIds } }
          });
          
          confirmText += '\n🧂 Ингредиенты:\n';
          ingredients.forEach(ingredient => {
            confirmText += `- ${ingredient.name} (${ingredient.code})\n`;
          });
        }
      } else if (taskData.type === 'WATER') {
        // Получаем информацию о выбранных типах воды
        const waterTypeIds = taskData.items
          .filter(item => item.type === 'WATER')
          .map(item => item.id);
        
        if (waterTypeIds.length > 0) {
          const waterTypes = await prisma.waterType.findMany({
            where: { id: { in: waterTypeIds } }
          });
          
          confirmText += '\n💧 Типы воды:\n';
          waterTypes.forEach(waterType => {
            confirmText += `- ${waterType.name} (${waterType.volume} л)\n`;
          });
        }
      }
    }
    
    // Добавляем информацию о шаблоне чек-листа, если он выбран
    if (taskData.checklistTemplateId) {
      const template = await prisma.checklistTemplate.findUnique({
        where: { id: taskData.checklistTemplateId }
      });
      
      if (template) {
        confirmText += `\n📝 Чек-лист: ${template.name}\n`;
      }
    }
    
    // Добавляем описание, если оно есть
    if (taskData.description) {
      confirmText += `\n📄 Описание: ${taskData.description}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Создать задачу', 'confirm_create')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении создания задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения создания задачи
scene.action('confirm_create', async (ctx) => {
  try {
    // Устанавливаем состояние
    ctx.session.state = 'task_success';
    
    // Получаем данные задачи
    const taskData = ctx.session.taskData;
    
    // Создаем задачу в базе данных
    const task = await prisma.task.create({
      data: {
        type: taskData.type,
        status: 'ASSIGNED',
        machineId: taskData.machineId,
        assignedUserId: taskData.executorId,
        createdById: ctx.session.user.id,
        dueDate: taskData.deadline,
        description: taskData.description,
        checklistTemplateId: taskData.checklistTemplateId
      }
    });
    
    // Если есть выбранные элементы, создаем связи
    if (taskData.items.length > 0) {
      for (const item of taskData.items) {
        if (item.type === 'INGREDIENT') {
          await prisma.taskIngredient.create({
            data: {
              taskId: task.id,
              ingredientId: item.id
            }
          });
        } else if (item.type === 'WATER') {
          await prisma.taskWater.create({
            data: {
              taskId: task.id,
              waterTypeId: item.id
            }
          });
        }
      }
    }
    
    // Если выбран шаблон чек-листа, создаем чек-лист для задачи
    if (taskData.checklistTemplateId) {
      // Получаем шаблон чек-листа
      const template = await prisma.checklistTemplate.findUnique({
        where: { id: taskData.checklistTemplateId },
        include: { items: true }
      });
      
      if (template && template.items.length > 0) {
        // Создаем чек-лист
        const checklist = await prisma.checklist.create({
          data: {
            taskId: task.id,
            templateId: template.id,
            status: 'PENDING'
          }
        });
        
        // Создаем элементы чек-листа
        for (const templateItem of template.items) {
          await prisma.checklistItem.create({
            data: {
              checklistId: checklist.id,
              text: templateItem.text,
              order: templateItem.order,
              status: 'PENDING'
            }
          });
        }
      }
    }
    
    // Отправляем уведомление исполнителю
    try {
      // Получаем информацию об исполнителе
      const executor = await prisma.user.findUnique({
        where: { id: taskData.executorId },
        select: { telegramId: true }
      });
      
      if (executor && executor.telegramId) {
        // Получаем информацию об автомате
        const machine = await prisma.machine.findUnique({
          where: { id: taskData.machineId },
          include: { location: true }
        });
        
        // Формируем текст уведомления
        const notificationText = `
📋 Вам назначена новая задача!

🔹 Тип: ${getTaskTypeName(taskData.type)}
🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Срок: ${taskData.deadline.toLocaleDateString('ru-RU')}

Для просмотра деталей перейдите в раздел "Мои задачи".
`;
        
        // Отправляем уведомление
        await ctx.telegram.sendMessage(executor.telegramId, notificationText);
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления исполнителю:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    // Отображаем сообщение об успешном создании задачи
    await ctx.editMessageText(`
✅ Задача успешно создана!

🔹 ID: ${task.id}
🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Статус: Назначена
🔹 Срок: ${task.dueDate.toLocaleDateString('ru-RU')}

Исполнитель получил уведомление о новой задаче.
`);
    
    // Предлагаем создать еще одну задачу или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Создать еще задачу', 'create_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    await ctx.reply('❌ Произошла ошибка при создании задачи. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Создание задачи отменено.');
  await ctx.scene.leave();
});

// Обработчик создания еще одной задачи
scene.action('create_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.taskData = {
    type: null,
    machineId: null,
    items: [],
    deadline: null,
    checklistTemplateId: null,
    executorId: null,
    description: null
  };
  
  ctx.session.state = 'task_select_type';
  await ctx.editMessageText('📋 Создание новой задачи...');
  await handleTaskSelectType(ctx);
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
