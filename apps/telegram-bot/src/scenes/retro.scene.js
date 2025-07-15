/**
 * FSM: retro_fsm
 * Назначение: Ретроспективный ввод данных (действий, произошедших в прошлом).
 * Роли: Все исполнители (Кладовщик, Оператор).
 * Состояния:
 *   - retro_select_action: выбор типа действия
 *   - retro_select_date: выбор даты
 *   - retro_input_data: ввод данных
 *   - retro_photo_optional: загрузка фото (опционально)
 *   - retro_confirm: подтверждение
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('retro_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[retro_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN, MANAGER, OPERATOR или WAREHOUSE
  if (!ctx.session.user || !['ADMIN', 'MANAGER', 'OPERATOR', 'WAREHOUSE'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к ретроспективному вводу данных.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные ретроспективного ввода
    ctx.session.retroData = {
      actionType: null,
      date: null,
      machineId: null,
      taskId: null,
      amount: 0,
      weight: 0,
      units: 0,
      itemId: null,
      photo: null,
      notes: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'retro_select_action';
    
    // Переходим к выбору типа действия
    await handleRetroSelectAction(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену retro_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния retro_select_action
async function handleRetroSelectAction(ctx) {
  try {
    const message = `
⏱️ Ретроспективный ввод данных

Выберите тип действия, которое необходимо зарегистрировать задним числом:
`;
    
    // Создаем клавиатуру с типами действий в зависимости от роли пользователя
    const buttons = [];
    
    // Общие действия для всех ролей
    buttons.push([Markup.button.callback('🔄 Выполнение задачи', 'action_task_execution')]);
    
    // Действия для операторов
    if (['ADMIN', 'MANAGER', 'OPERATOR'].includes(ctx.session.user.role)) {
      buttons.push([Markup.button.callback('💰 Инкассация', 'action_cash')]);
    }
    
    // Действия для кладовщиков
    if (['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(ctx.session.user.role)) {
      buttons.push([Markup.button.callback('📦 Прием товаров', 'action_receive')]);
      buttons.push([Markup.button.callback('🔄 Возврат товаров', 'action_return')]);
      buttons.push([Markup.button.callback('🎒 Формирование сумки', 'action_bag')]);
    }
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе типа действия:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора типа действия
scene.action(/^action_(.+)$/, async (ctx) => {
  try {
    const actionType = ctx.match[1];
    
    // Сохраняем тип действия
    ctx.session.retroData.actionType = actionType;
    
    // Отображаем выбранный тип действия
    let actionName = '';
    switch (actionType) {
      case 'task_execution':
        actionName = '🔄 Выполнение задачи';
        break;
      case 'cash':
        actionName = '💰 Инкассация';
        break;
      case 'receive':
        actionName = '📦 Прием товаров';
        break;
      case 'return':
        actionName = '🔄 Возврат товаров';
        break;
      case 'bag':
        actionName = '🎒 Формирование сумки';
        break;
    }
    
    await ctx.editMessageText(`Выбрано действие: ${actionName}`);
    
    // Переходим к выбору даты
    ctx.session.state = 'retro_select_date';
    await handleRetroSelectDate(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа действия:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния retro_select_date
async function handleRetroSelectDate(ctx) {
  try {
    await ctx.reply(`
📅 Выбор даты

Введите дату, когда было выполнено действие, в формате ДД.ММ.ГГГГ (например, 15.07.2025):
`);
    
    // Ожидаем ввод даты от пользователя
  } catch (error) {
    console.error('Ошибка при запросе даты:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода даты
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'retro_select_date') {
    try {
      // Получаем введенную дату
      const dateText = ctx.message.text.trim();
      
      // Проверяем формат даты (ДД.ММ.ГГГГ)
      const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
      const match = dateText.match(dateRegex);
      
      if (!match) {
        return await ctx.reply('❌ Пожалуйста, введите дату в формате ДД.ММ.ГГГГ (например, 15.07.2025).');
      }
      
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // Месяцы в JavaScript начинаются с 0
      const year = parseInt(match[3]);
      
      const date = new Date(year, month, day);
      
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return await ctx.reply('❌ Пожалуйста, введите корректную дату.');
      }
      
      // Проверяем, что дата не в будущем
      const today = new Date();
      if (date > today) {
        return await ctx.reply('❌ Дата не может быть в будущем.');
      }
      
      // Сохраняем дату
      ctx.session.retroData.date = date;
      
      await ctx.reply(`✅ Дата (${date.toLocaleDateString('ru-RU')}) сохранена.`);
      
      // Переходим к вводу данных в зависимости от типа действия
      ctx.session.state = 'retro_input_data';
      await handleRetroInputData(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода даты:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'retro_input_data') {
    try {
      const actionType = ctx.session.retroData.actionType;
      
      // Обрабатываем ввод данных в зависимости от типа действия
      switch (actionType) {
        case 'cash':
          // Получаем введенную сумму
          const amount = parseFloat(ctx.message.text.trim().replace(',', '.'));
          
          if (isNaN(amount) || amount <= 0) {
            return await ctx.reply('❌ Пожалуйста, введите корректное число (сумму в рублях).');
          }
          
          // Сохраняем сумму
          ctx.session.retroData.amount = amount;
          
          await ctx.reply(`✅ Сумма инкассации (${amount} руб.) сохранена.`);
          break;
        case 'receive':
          // Получаем введенное количество или вес
          const value = parseInt(ctx.message.text.trim());
          
          if (isNaN(value) || value <= 0) {
            return await ctx.reply('❌ Пожалуйста, введите корректное число (количество или вес).');
          }
          
          // Сохраняем количество или вес в зависимости от типа товара
          if (ctx.session.retroData.itemType === 'ingredient') {
            ctx.session.retroData.weight = value;
            await ctx.reply(`✅ Вес ингредиента (${value} г) сохранен.`);
          } else {
            ctx.session.retroData.units = value;
            await ctx.reply(`✅ Количество товара (${value} шт.) сохранено.`);
          }
          break;
        default:
          // Сохраняем примечания для других типов действий
          ctx.session.retroData.notes = ctx.message.text.trim();
          
          await ctx.reply('✅ Данные сохранены.');
          break;
      }
      
      // Переходим к загрузке фото
      ctx.session.state = 'retro_photo_optional';
      await handleRetroPhotoOptional(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода данных:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'retro_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.retroData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к подтверждению
      ctx.session.state = 'retro_confirm';
      await handleRetroConfirm(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния retro_input_data
async function handleRetroInputData(ctx) {
  try {
    const actionType = ctx.session.retroData.actionType;
    
    // Запрашиваем данные в зависимости от типа действия
    switch (actionType) {
      case 'task_execution':
        // Получаем список задач
        const tasks = await prisma.task.findMany({
          where: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            assignedUserId: ctx.session.user.id
          },
          include: {
            machine: {
              include: { location: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (tasks.length === 0) {
          await ctx.reply('❌ Нет доступных задач для ретроспективного выполнения.');
          return await ctx.scene.leave();
        }
        
        const taskMessage = `
🔄 Выберите задачу, которую вы выполнили ${ctx.session.retroData.date.toLocaleDateString('ru-RU')}:
`;
        
        // Создаем клавиатуру с задачами
        const taskButtons = tasks.map(task => {
          const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
          return [Markup.button.callback(
            `${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})`,
            `task_${task.id}`
          )];
        });
        
        // Добавляем кнопку отмены
        taskButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const taskKeyboard = Markup.inlineKeyboard(taskButtons);
        
        await ctx.reply(taskMessage, taskKeyboard);
        break;
      case 'cash':
        // Получаем список автоматов
        const machines = await prisma.machine.findMany({
          where: { status: 'ACTIVE' },
          include: { location: true },
          orderBy: { internalCode: 'asc' }
        });
        
        if (machines.length === 0) {
          await ctx.reply('❌ Нет доступных автоматов для ретроспективной инкассации.');
          return await ctx.scene.leave();
        }
        
        const cashMessage = `
💰 Выберите автомат, для которого вы выполнили инкассацию ${ctx.session.retroData.date.toLocaleDateString('ru-RU')}:
`;
        
        // Создаем клавиатуру с автоматами
        const cashButtons = machines.map(machine => {
          const locationName = machine.location ? machine.location.name : 'Без локации';
          return [Markup.button.callback(
            `${machine.internalCode} - ${locationName}`,
            `machine_${machine.id}`
          )];
        });
        
        // Добавляем кнопку отмены
        cashButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const cashKeyboard = Markup.inlineKeyboard(cashButtons);
        
        await ctx.reply(cashMessage, cashKeyboard);
        break;
      case 'receive':
        // Получаем список типов товаров
        const receiveMessage = `
📦 Выберите тип товара, который вы приняли ${ctx.session.retroData.date.toLocaleDateString('ru-RU')}:
`;
        
        const receiveButtons = [
          [Markup.button.callback('🧂 Ингредиенты', 'item_type_ingredient')],
          [Markup.button.callback('💧 Вода', 'item_type_water')],
          [Markup.button.callback('🧴 Сиропы', 'item_type_syrup')],
          [Markup.button.callback('🧰 Дополнительные предметы', 'item_type_extra')],
          [Markup.button.callback('❌ Отмена', 'cancel')]
        ];
        
        const receiveKeyboard = Markup.inlineKeyboard(receiveButtons);
        
        await ctx.reply(receiveMessage, receiveKeyboard);
        break;
      case 'return':
        // Получаем список задач для возврата
        const returnTasks = await prisma.task.findMany({
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
        
        if (returnTasks.length === 0) {
          await ctx.reply('❌ Нет завершенных задач для ретроспективного возврата товаров.');
          return await ctx.scene.leave();
        }
        
        const returnMessage = `
🔄 Выберите задачу, по которой вы приняли возврат ${ctx.session.retroData.date.toLocaleDateString('ru-RU')}:
`;
        
        // Создаем клавиатуру с задачами
        const returnButtons = returnTasks.map(task => {
          const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
          const operatorName = `${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`;
          
          return [Markup.button.callback(
            `${getTaskTypeName(task.type)} - ${task.machine.internalCode} - ${operatorName}`,
            `return_task_${task.id}`
          )];
        });
        
        // Добавляем кнопку отмены
        returnButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const returnKeyboard = Markup.inlineKeyboard(returnButtons);
        
        await ctx.reply(returnMessage, returnKeyboard);
        break;
      case 'bag':
        // Получаем список автоматов для формирования сумки
        const bagMachines = await prisma.machine.findMany({
          where: { status: 'ACTIVE' },
          include: { location: true },
          orderBy: { internalCode: 'asc' }
        });
        
        if (bagMachines.length === 0) {
          await ctx.reply('❌ Нет доступных автоматов для ретроспективного формирования сумки.');
          return await ctx.scene.leave();
        }
        
        const bagMessage = `
🎒 Выберите автомат, для которого вы сформировали сумку ${ctx.session.retroData.date.toLocaleDateString('ru-RU')}:
`;
        
        // Создаем клавиатуру с автоматами
        const bagButtons = bagMachines.map(machine => {
          const locationName = machine.location ? machine.location.name : 'Без локации';
          return [Markup.button.callback(
            `${machine.internalCode} - ${locationName}`,
            `bag_machine_${machine.id}`
          )];
        });
        
        // Добавляем кнопку отмены
        bagButtons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
        
        const bagKeyboard = Markup.inlineKeyboard(bagButtons);
        
        await ctx.reply(bagMessage, bagKeyboard);
        break;
    }
  } catch (error) {
    console.error('Ошибка при запросе данных:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора задачи
scene.action(/^task_(.+)$/, async (ctx) => {
  try {
    const taskId = ctx.match[1];
    
    // Сохраняем ID задачи
    ctx.session.retroData.taskId = taskId;
    
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
      return await handleRetroInputData(ctx);
    }
    
    const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбрана задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode} (${locationName})`);
    
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания о выполнении задачи или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'retro_input_notes';
  } catch (error) {
    console.error('Ошибка при обработке выбора задачи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора автомата для инкассации
scene.action(/^machine_(.+)$/, async (ctx) => {
  try {
    const machineId = ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.retroData.machineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleRetroInputData(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // Запрашиваем сумму инкассации
    await ctx.reply(`
💰 Введите сумму инкассации (в рублях):
`);
    
    // Ожидаем ввод суммы от пользователя
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора типа товара для приема
scene.action(/^item_type_(.+)$/, async (ctx) => {
  try {
    const itemType = ctx.match[1];
    
    // Сохраняем тип товара
    ctx.session.retroData.itemType = itemType;
    
    // Отображаем выбранный тип товара
    let typeName = '';
    switch (itemType) {
      case 'ingredient':
        typeName = '🧂 Ингредиенты';
        break;
      case 'water':
        typeName = '💧 Вода';
        break;
      case 'syrup':
        typeName = '🧴 Сиропы';
        break;
      case 'extra':
        typeName = '🧰 Дополнительные предметы';
        break;
    }
    
    await ctx.editMessageText(`Выбран тип товара: ${typeName}`);
    
    // Получаем список товаров выбранного типа
    let items = [];
    let message = '';
    
    switch (itemType) {
      case 'ingredient':
        items = await prisma.ingredient.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        });
        message = '🧂 Выберите ингредиент:';
        break;
      case 'water':
        items = await prisma.waterType.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        });
        message = '💧 Выберите тип воды:';
        break;
      case 'syrup':
        items = await prisma.syrup.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        });
        message = '🧴 Выберите сироп:';
        break;
      case 'extra':
        items = await prisma.extraItem.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        });
        message = '🧰 Выберите дополнительный предмет:';
        break;
    }
    
    if (items.length === 0) {
      await ctx.reply(`❌ Нет доступных товаров типа "${typeName}". Попробуйте выбрать другой тип.`);
      ctx.session.state = 'retro_input_data';
      return await handleRetroInputData(ctx);
    }
    
    // Создаем клавиатуру с товарами
    const buttons = items.map(item => {
      let buttonText = '';
      
      switch (itemType) {
        case 'ingredient':
          buttonText = `${item.name} (${item.code})`;
          break;
        case 'water':
          buttonText = `${item.name} (${item.volume} л)`;
          break;
        case 'syrup':
          buttonText = `${item.name} (${item.volume} мл)`;
          break;
        case 'extra':
          buttonText = item.name;
          break;
      }
      
      return [Markup.button.callback(buttonText, `receive_item_${item.id}`)];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора товара для приема
scene.action(/^receive_item_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Сохраняем ID товара
    ctx.session.retroData.itemId = itemId;
    
    const itemType = ctx.session.retroData.itemType;
    let item;
    
    // Получаем информацию о товаре
    switch (itemType) {
      case 'ingredient':
        item = await prisma.ingredient.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран ингредиент: ${item.name} (${item.code})`);
        
        // Запрашиваем вес ингредиента
        await ctx.reply(`
⚖️ Введите вес ингредиента "${item.name}" (в граммах):
`);
        break;
      case 'water':
        item = await prisma.waterType.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран тип воды: ${item.name} (${item.volume} л)`);
        
        // Запрашиваем количество бутылок
        await ctx.reply(`
🔢 Введите количество бутылок воды "${item.name}" (в штуках):
`);
        break;
      case 'syrup':
        item = await prisma.syrup.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран сироп: ${item.name} (${item.volume} мл)`);
        
        // Запрашиваем количество бутылок
        await ctx.reply(`
🔢 Введите количество бутылок сиропа "${item.name}" (в штуках):
`);
        break;
      case 'extra':
        item = await prisma.extraItem.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран предмет: ${item.name}`);
        
        // Запрашиваем количество предметов
        await ctx.reply(`
🔢 Введите количество предметов "${item.name}" (в штуках):
`);
        break;
    }
    
    // Ожидаем ввод количества или веса от пользователя
  } catch (error) {
    console.error('Ошибка при обработке выбора товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора задачи для возврата
scene.action(/^return_task_(.+)$/, async (ctx) => {
  try {
    const taskId = ctx.match[1];
    
    // Сохраняем ID задачи
    ctx.session.retroData.taskId = taskId;
    
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
      return await handleRetroInputData(ctx);
    }
    
    const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
    const operatorName = `${task.assignedUser.firstName} ${task.assignedUser.lastName || ''}`;
    
    await ctx.editMessageText(`Выбрана задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode} - ${operatorName}`);
    
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания о возврате или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'retro_input_notes';
  } catch (error) {
    console.error('Ошибка при обработке выбора задачи для возврата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора автомата для формирования сумки
scene.action(/^bag_machine_(.+)$/, async (ctx) => {
  try {
    const machineId = ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.retroData.machineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleRetroInputData(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // Получаем список операторов
    const operators = await prisma.user.findMany({
      where: { 
        role: 'OPERATOR',
        status: 'ACTIVE'
      },
      orderBy: { firstName: 'asc' }
    });
    
    if (operators.length === 0) {
      await ctx.reply('❌ Нет доступных операторов для формирования сумки.');
      return await ctx.scene.leave();
    }
    
    const message = `
👤 Выберите оператора, для которого была сформирована сумка:
`;
    
    // Создаем клавиатуру с операторами
    const buttons = operators.map(operator => {
      return [Markup.button.callback(
        `${operator.firstName} ${operator.lastName || ''}`,
        `operator_${operator.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата для формирования сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора оператора для формирования сумки
scene.action(/^operator_(.+)$/, async (ctx) => {
  try {
    const operatorId = ctx.match[1];
    
    // Сохраняем ID оператора
    ctx.session.retroData.operatorId = operatorId;
    
    // Получаем информацию об операторе
    const operator = await prisma.user.findUnique({
      where: { id: operatorId }
    });
    
    if (!operator) {
      await ctx.reply('❌ Оператор не найден. Попробуйте снова.');
      return;
    }
    
    await ctx.editMessageText(`Выбран оператор: ${operator.firstName} ${operator.lastName || ''}`);
    
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания о формировании сумки или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'retro_input_notes';
  } catch (error) {
    console.error('Ошибка при обработке выбора оператора:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния retro_photo_optional
async function handleRetroPhotoOptional(ctx) {
  try {
    await ctx.reply(`
📸 Фото (опционально)

Вы можете прикрепить фото, подтверждающее выполнение действия.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'retro_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'retro_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.retroData.photo = photoId;
      
      await ctx.reply('✅ Фото получено.');
      
      // Переходим к подтверждению
      ctx.session.state = 'retro_confirm';
      await handleRetroConfirm(ctx);
    } catch (error) {
      console.error('Ошибка при получении фото:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'retro_wait_photo') {
    // Переходим к подтверждению
    ctx.session.state = 'retro_confirm';
    await handleRetroConfirm(ctx);
  } else if (ctx.session.state === 'retro_input_notes') {
    ctx.session.retroData.notes = null;
    
    // Переходим к загрузке фото
    ctx.session.state = 'retro_photo_optional';
    await handleRetroPhotoOptional(ctx);
  }
});

// Обработка состояния retro_confirm
async function handleRetroConfirm(ctx) {
  try {
    const retroData = ctx.session.retroData;
    const actionType = retroData.actionType;
    
    // Формируем текст подтверждения
    let confirmText = `
⏱️ Подтверждение ретроспективного ввода данных

📅 Дата: ${retroData.date.toLocaleDateString('ru-RU')}
`;
    
    // Добавляем информацию в зависимости от типа действия
    switch (actionType) {
      case 'task_execution':
        // Получаем информацию о задаче
        const task = await prisma.task.findUnique({
          where: { id: retroData.taskId },
          include: {
            machine: {
              include: { location: true }
            }
          }
        });
        
        confirmText += `🔄 Действие: Выполнение задачи\n`;
        confirmText += `🔹 Задача: ${getTaskTypeName(task.type)} - ${task.machine.internalCode}\n`;
        confirmText += `🔹 Локация: ${task.machine.location?.name || 'Без локации'}\n`;
        break;
      case 'cash':
        // Получаем информацию об автомате
        const cashMachine = await prisma.machine.findUnique({
          where: { id: retroData.machineId },
          include: { location: true }
        });
        
        confirmText += `💰 Действие: Инкассация\n`;
        confirmText += `🔹 Автомат: ${cashMachine.internalCode}\n`;
        confirmText += `🔹 Локация: ${cashMachine.location?.name || 'Без локации'}\n`;
        confirmText += `🔹 Сумма: ${retroData.amount} руб.\n`;
        break;
      case 'receive':
        // Получаем информацию о товаре
        let receiveItemName = '';
        
        switch (retroData.itemType) {
          case 'ingredient':
            const ingredient = await prisma.ingredient.findUnique({
              where: { id: retroData.itemId }
            });
            receiveItemName = `${ingredient.name} (${ingredient.code})`;
            confirmText += `📦 Действие: Прием ингредиента\n`;
            confirmText += `🔹 Ингредиент: ${receiveItemName}\n`;
            confirmText += `🔹 Вес: ${retroData.weight} г\n`;
            break;
          case 'water':
            const waterType = await prisma.waterType.findUnique({
              where: { id: retroData.itemId }
            });
            receiveItemName = `${waterType.name} (${waterType.volume} л)`;
            confirmText += `📦 Действие: Прием воды\n`;
            confirmText += `🔹 Вода: ${receiveItemName}\n`;
            confirmText += `🔹 Количество: ${retroData.units} шт.\n`;
            break;
          case 'syrup':
            const syrup = await prisma.syrup.findUnique({
              where: { id: retroData.itemId }
            });
            receiveItemName = `${syrup.name} (${syrup.volume} мл)`;
            confirmText += `📦 Действие: Прием сиропа\n`;
            confirmText += `🔹 Сироп: ${receiveItemName}\n`;
            confirmText += `🔹 Количество: ${retroData.units} шт.\n`;
            break;
          case 'extra':
            const extraItem = await prisma.extraItem.findUnique({
              where: { id: retroData.itemId }
            });
            receiveItemName = extraItem.name;
            confirmText += `📦 Действие: Прием дополнительного предмета\n`;
            confirmText += `🔹 Предмет: ${receiveItemName}\n`;
            confirmText += `🔹 Количество: ${retroData.units} шт.\n`;
            break;
        }
        break;
      case 'return':
        // Получаем информацию о задаче
        const returnTask = await prisma.task.findUnique({
          where: { id: retroData.taskId },
          include: {
            machine: {
              include: { location: true }
            },
            assignedUser: true
          }
        });
        
        confirmText += `🔄 Действие: Возврат товаров\n`;
        confirmText += `🔹 Задача: ${getTaskTypeName(returnTask.type)} - ${returnTask.machine.internalCode}\n`;
        confirmText += `🔹 Локация: ${returnTask.machine.location?.name || 'Без локации'}\n`;
        confirmText += `🔹 Оператор: ${returnTask.assignedUser.firstName} ${returnTask.assignedUser.lastName || ''}\n`;
        break;
      case 'bag':
        // Получаем информацию об автомате и операторе
        const bagMachine = await prisma.machine.findUnique({
          where: { id: retroData.machineId },
          include: { location: true }
        });
        
        const operator = await prisma.user.findUnique({
          where: { id: retroData.operatorId }
        });
        
        confirmText += `🎒 Действие: Формирование сумки\n`;
        confirmText += `🔹 Автомат: ${bagMachine.internalCode}\n`;
        confirmText += `🔹 Локация: ${bagMachine.location?.name || 'Без локации'}\n`;
        confirmText += `🔹 Оператор: ${operator.firstName} ${operator.lastName || ''}\n`;
        break;
    }
    
    // Добавляем примечания, если они есть
    if (retroData.notes) {
      confirmText += `\n📝 Примечания: ${retroData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_retro')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении ретроспективного ввода данных:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения ретроспективного ввода данных
scene.action('confirm_retro', async (ctx) => {
  try {
    const retroData = ctx.session.retroData;
    const actionType = retroData.actionType;
    
    // Создаем запись о ретроспективном вводе данных в базе данных
    const retro = await prisma.retroAction.create({
      data: {
        type: actionType.toUpperCase(),
        date: retroData.date,
        machineId: retroData.machineId,
        taskId: retroData.taskId,
        operatorId: retroData.operatorId,
        itemId: retroData.itemId,
        itemType: retroData.itemType?.toUpperCase(),
        amount: retroData.amount,
        weight: retroData.weight,
        units: retroData.units,
        photo: retroData.photo,
        notes: retroData.notes,
        userId: ctx.session.user.id,
        createdAt: new Date()
      }
    });
    
    // Обновляем данные в зависимости от типа действия
    switch (actionType) {
      case 'task_execution':
        // Обновляем статус задачи
        await prisma.task.update({
          where: { id: retroData.taskId },
          data: {
            status: 'COMPLETED',
            completedAt: retroData.date
          }
        });
        break;
      case 'cash':
        // Создаем запись об инкассации
        await prisma.cash.create({
          data: {
            machineId: retroData.machineId,
            amount: retroData.amount,
            photo: retroData.photo,
            notes: retroData.notes,
            userId: ctx.session.user.id,
            createdAt: retroData.date,
            reconciled: false
          }
        });
        break;
      case 'receive':
        // Создаем запись о приеме товара
        await prisma.warehouseReceive.create({
          data: {
            type: retroData.itemType.toUpperCase(),
            itemId: retroData.itemId,
            quantity: retroData.units,
            weight: retroData.weight,
            photo: retroData.photo,
            notes: retroData.notes,
            userId: ctx.session.user.id,
            timestamp: retroData.date
          }
        });
        
        // Обновляем остатки на складе
        switch (retroData.itemType) {
          case 'ingredient':
            // Получаем текущий остаток ингредиента
            const ingredientInventory = await prisma.ingredientInventory.findFirst({
              where: { ingredientId: retroData.itemId }
            });
            
            if (ingredientInventory) {
              // Обновляем существующий остаток
              await prisma.ingredientInventory.update({
                where: { id: ingredientInventory.id },
                data: { weight: ingredientInventory.weight + retroData.weight }
              });
            } else {
              // Создаем новую запись об остатке
              await prisma.ingredientInventory.create({
                data: {
                  ingredientId: retroData.itemId,
                  weight: retroData.weight
                }
              });
            }
            break;
          case 'water':
            // Получаем текущий остаток воды
            const waterInventory = await prisma.waterInventory.findFirst({
              where: { waterTypeId: retroData.itemId }
            });
            
            if (waterInventory) {
              // Обновляем существующий остаток
              await prisma.waterInventory.update({
                where: { id: waterInventory.id },
                data: { units: waterInventory.units + retroData.units }
              });
            } else {
              // Создаем новую запись об остатке
              await prisma.waterInventory.create({
                data: {
                  waterTypeId: retroData.itemId,
                  units: retroData.units
                }
              });
            }
            break;
          case 'syrup':
            // Получаем текущий остаток сиропа
            const syrupInventory = await prisma.syrupInventory.findFirst({
              where: { syrupId: retroData.itemId }
            });
            
            if (syrupInventory) {
              // Обновляем существующий остаток
              await prisma.syrupInventory.update({
                where: { id: syrupInventory.id },
                data: { units: syrupInventory.units + retroData.units }
              });
            } else {
              // Создаем новую запись об остатке
              await prisma.syrupInventory.create({
                data: {
                  syrupId: retroData.itemId,
                  units: retroData.units
                }
              });
            }
            break;
          case 'extra':
            // Получаем текущий остаток дополнительного предмета
            const extraInventory = await prisma.extraItemInventory.findFirst({
              where: { extraItemId: retroData.itemId }
            });
            
            if (extraInventory) {
              // Обновляем существующий остаток
              await prisma.extraItemInventory.update({
                where: { id: extraInventory.id },
                data: { units: extraInventory.units + retroData.units }
              });
            } else {
              // Создаем новую запись об остатке
              await prisma.extraItemInventory.create({
                data: {
                  extraItemId: retroData.itemId,
                  units: retroData.units
                }
              });
            }
            break;
        }
        break;
      case 'bag':
        // Создаем запись о сумке
        await prisma.bag.create({
          data: {
            machineId: retroData.machineId,
            operatorId: retroData.operatorId,
            createdById: ctx.session.user.id,
            status: 'CREATED',
            photo: retroData.photo,
            notes: retroData.notes,
            createdAt: retroData.date
          }
        });
        break;
    }
    
    // Отображаем сообщение об успешном ретроспективном вводе данных
    await ctx.editMessageText(`
✅ Ретроспективный ввод данных успешно выполнен!

🔹 ID: ${retro.id}
🔹 Дата действия: ${retroData.date.toLocaleDateString('ru-RU')}
🔹 Дата ввода: ${new Date().toLocaleDateString('ru-RU')}

Данные успешно сохранены в системе.
`);
    
    // Предлагаем ввести еще данные или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏱️ Ввести еще данные', 'retro_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при ретроспективном вводе данных:', error);
    await ctx.reply('❌ Произошла ошибка при ретроспективном вводе данных. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Ретроспективный ввод данных отменен.');
  await ctx.scene.leave();
});

// Обработчик ввода еще данных
scene.action('retro_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.retroData = {
    actionType: null,
    date: null,
    machineId: null,
    taskId: null,
    amount: 0,
    weight: 0,
    units: 0,
    itemId: null,
    photo: null,
    notes: null
  };
  
  ctx.session.state = 'retro_select_action';
  await ctx.editMessageText('⏱️ Новый ретроспективный ввод данных...');
  await handleRetroSelectAction(ctx);
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
