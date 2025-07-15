/**
 * FSM: bag_fsm
 * Назначение: Формирование сумок-комплектов для оператора.
 * Роли: Складской работник (Warehouse).
 * Состояния:
 *   - bag_select_machine: выбор автомата
 *   - bag_add_hoppers: добавление бункеров
 *   - bag_add_syrups: добавление сиропов
 *   - bag_add_water: добавление воды
 *   - bag_add_extras: добавление дополнительных предметов
 *   - bag_photo: фото сумки
 *   - bag_confirm: подтверждение
 *   - bag_dispatch: отправка сумки
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('bag_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[bag_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или WAREHOUSE
  if (!ctx.session.user || !['ADMIN', 'WAREHOUSE'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к формированию сумок.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные сумки
    ctx.session.bagData = {
      machineId: null,
      operatorId: null,
      hoppers: [],
      syrups: [],
      water: [],
      extras: [],
      photo: null,
      notes: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'bag_select_machine';
    
    // Переходим к выбору автомата
    await handleBagSelectMachine(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену bag_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_select_machine
async function handleBagSelectMachine(ctx) {
  try {
    // Получаем список автоматов
    const machines = await prisma.machine.findMany({
      where: { status: 'ACTIVE' },
      include: { location: true },
      orderBy: { internalCode: 'asc' }
    });
    
    if (machines.length === 0) {
      await ctx.reply('❌ Нет доступных автоматов. Невозможно создать сумку.');
      return await ctx.scene.leave();
    }
    
    const message = `
🎒 Формирование сумки-комплекта

Выберите автомат, для которого формируется сумка:
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
    ctx.session.bagData.machineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleBagSelectMachine(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // Переходим к выбору оператора
    ctx.session.state = 'bag_select_operator';
    await handleBagSelectOperator(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_select_operator
async function handleBagSelectOperator(ctx) {
  try {
    // Получаем список операторов
    const operators = await prisma.user.findMany({
      where: { 
        role: 'OPERATOR',
        status: 'ACTIVE'
      },
      orderBy: { firstName: 'asc' }
    });
    
    if (operators.length === 0) {
      await ctx.reply('❌ Нет доступных операторов. Невозможно создать сумку.');
      return await ctx.scene.leave();
    }
    
    const message = `
👤 Выберите оператора, для которого формируется сумка:
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
    console.error('Ошибка при выборе оператора:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора оператора
scene.action(/^operator_(.+)$/, async (ctx) => {
  try {
    const operatorId = ctx.match[1];
    
    // Сохраняем ID оператора
    ctx.session.bagData.operatorId = operatorId;
    
    // Получаем информацию об операторе
    const operator = await prisma.user.findUnique({
      where: { id: operatorId }
    });
    
    if (!operator) {
      await ctx.reply('❌ Оператор не найден. Попробуйте снова.');
      return await handleBagSelectOperator(ctx);
    }
    
    await ctx.editMessageText(`Выбран оператор: ${operator.firstName} ${operator.lastName || ''}`);
    
    // Переходим к добавлению бункеров
    ctx.session.state = 'bag_add_hoppers';
    await handleBagAddHoppers(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора оператора:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_add_hoppers
async function handleBagAddHoppers(ctx) {
  try {
    // Получаем список ингредиентов
    const ingredients = await prisma.ingredient.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    if (ingredients.length === 0) {
      await ctx.reply('❌ Нет доступных ингредиентов. Пропускаем этот шаг.');
      ctx.session.state = 'bag_add_syrups';
      return await handleBagAddSyrups(ctx);
    }
    
    const message = `
🧂 Добавление бункеров с ингредиентами

Выберите ингредиенты для добавления в сумку:
`;
    
    // Создаем клавиатуру с ингредиентами
    const buttons = ingredients.map(ingredient => {
      // Проверяем, выбран ли уже этот ингредиент
      const isSelected = ctx.session.bagData.hoppers.some(h => h.ingredientId === ingredient.id);
      const prefix = isSelected ? '✅ ' : '';
      
      return [Markup.button.callback(
        `${prefix}${ingredient.name} (${ingredient.code})`,
        `ingredient_${ingredient.id}`
      )];
    });
    
    // Добавляем кнопки управления
    buttons.push([
      Markup.button.callback('✅ Готово', 'hoppers_done'),
      Markup.button.callback('❌ Отмена', 'cancel')
    ]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при добавлении бункеров:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора ингредиентов
scene.action(/^ingredient_(.+)$/, async (ctx) => {
  try {
    const ingredientId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот ингредиент
    const existingIndex = ctx.session.bagData.hoppers.findIndex(h => h.ingredientId === ingredientId);
    
    if (existingIndex !== -1) {
      // Если ингредиент уже выбран, удаляем его
      ctx.session.bagData.hoppers.splice(existingIndex, 1);
      await ctx.answerCbQuery('Ингредиент удален из списка');
    } else {
      // Добавляем ингредиент в список
      ctx.session.bagData.hoppers.push({
        ingredientId,
        weight: 0 // Вес будет запрошен позже
      });
      await ctx.answerCbQuery('Ингредиент добавлен в список');
    }
    
    // Обновляем список ингредиентов
    await handleBagAddHoppers(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора ингредиента:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик завершения выбора ингредиентов
scene.action('hoppers_done', async (ctx) => {
  try {
    // Если выбраны ингредиенты, запрашиваем вес для каждого
    if (ctx.session.bagData.hoppers.length > 0) {
      await ctx.editMessageText('✅ Ингредиенты выбраны. Теперь введите вес для каждого ингредиента.');
      
      // Переходим к вводу веса для первого ингредиента
      ctx.session.bagData.currentHopperIndex = 0;
      ctx.session.state = 'bag_input_hopper_weight';
      await handleBagInputHopperWeight(ctx);
    } else {
      await ctx.editMessageText('⏩ Ингредиенты не выбраны. Пропускаем этот шаг.');
      
      // Переходим к добавлению сиропов
      ctx.session.state = 'bag_add_syrups';
      await handleBagAddSyrups(ctx);
    }
  } catch (error) {
    console.error('Ошибка при завершении выбора ингредиентов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_input_hopper_weight
async function handleBagInputHopperWeight(ctx) {
  try {
    const currentIndex = ctx.session.bagData.currentHopperIndex;
    
    // Проверяем, все ли ингредиенты обработаны
    if (currentIndex >= ctx.session.bagData.hoppers.length) {
      // Все ингредиенты обработаны, переходим к добавлению сиропов
      ctx.session.state = 'bag_add_syrups';
      return await handleBagAddSyrups(ctx);
    }
    
    // Получаем текущий ингредиент
    const currentHopper = ctx.session.bagData.hoppers[currentIndex];
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: currentHopper.ingredientId }
    });
    
    if (!ingredient) {
      // Если ингредиент не найден, пропускаем его
      ctx.session.bagData.currentHopperIndex++;
      return await handleBagInputHopperWeight(ctx);
    }
    
    await ctx.reply(`
⚖️ Введите вес бункера с ингредиентом "${ingredient.name}" (в граммах):
`);
    
    // Ожидаем ввод веса от пользователя
  } catch (error) {
    console.error('Ошибка при вводе веса бункера:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода веса бункера
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'bag_input_hopper_weight') {
    try {
      // Получаем введенный вес
      const weight = parseInt(ctx.message.text.trim());
      
      if (isNaN(weight) || weight <= 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (вес в граммах).');
      }
      
      // Сохраняем вес для текущего ингредиента
      const currentIndex = ctx.session.bagData.currentHopperIndex;
      ctx.session.bagData.hoppers[currentIndex].weight = weight;
      
      // Получаем информацию об ингредиенте
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ctx.session.bagData.hoppers[currentIndex].ingredientId }
      });
      
      await ctx.reply(`✅ Вес бункера с ингредиентом "${ingredient.name}" (${weight} г) сохранен.`);
      
      // Переходим к следующему ингредиенту
      ctx.session.bagData.currentHopperIndex++;
      await handleBagInputHopperWeight(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода веса бункера:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'bag_input_syrup_units') {
    try {
      // Получаем введенное количество
      const units = parseInt(ctx.message.text.trim());
      
      if (isNaN(units) || units <= 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (количество единиц).');
      }
      
      // Сохраняем количество для текущего сиропа
      const currentIndex = ctx.session.bagData.currentSyrupIndex;
      ctx.session.bagData.syrups[currentIndex].units = units;
      
      // Получаем информацию о сиропе
      const syrup = await prisma.syrup.findUnique({
        where: { id: ctx.session.bagData.syrups[currentIndex].syrupId }
      });
      
      await ctx.reply(`✅ Количество сиропа "${syrup.name}" (${units} шт.) сохранено.`);
      
      // Переходим к следующему сиропу
      ctx.session.bagData.currentSyrupIndex++;
      await handleBagInputSyrupUnits(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода количества сиропа:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'bag_input_water_units') {
    try {
      // Получаем введенное количество
      const units = parseInt(ctx.message.text.trim());
      
      if (isNaN(units) || units <= 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (количество бутылок).');
      }
      
      // Сохраняем количество для текущего типа воды
      const currentIndex = ctx.session.bagData.currentWaterIndex;
      ctx.session.bagData.water[currentIndex].units = units;
      
      // Получаем информацию о типе воды
      const waterType = await prisma.waterType.findUnique({
        where: { id: ctx.session.bagData.water[currentIndex].waterTypeId }
      });
      
      await ctx.reply(`✅ Количество воды "${waterType.name}" (${units} шт.) сохранено.`);
      
      // Переходим к следующему типу воды
      ctx.session.bagData.currentWaterIndex++;
      await handleBagInputWaterUnits(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода количества воды:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'bag_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.bagData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к фото сумки
      ctx.session.state = 'bag_photo';
      await handleBagPhoto(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния bag_add_syrups
async function handleBagAddSyrups(ctx) {
  try {
    // Получаем список сиропов
    const syrups = await prisma.syrup.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    if (syrups.length === 0) {
      await ctx.reply('❌ Нет доступных сиропов. Пропускаем этот шаг.');
      ctx.session.state = 'bag_add_water';
      return await handleBagAddWater(ctx);
    }
    
    const message = `
🧴 Добавление сиропов

Выберите сиропы для добавления в сумку:
`;
    
    // Создаем клавиатуру с сиропами
    const buttons = syrups.map(syrup => {
      // Проверяем, выбран ли уже этот сироп
      const isSelected = ctx.session.bagData.syrups.some(s => s.syrupId === syrup.id);
      const prefix = isSelected ? '✅ ' : '';
      
      return [Markup.button.callback(
        `${prefix}${syrup.name} (${syrup.volume} мл)`,
        `syrup_${syrup.id}`
      )];
    });
    
    // Добавляем кнопки управления
    buttons.push([
      Markup.button.callback('✅ Готово', 'syrups_done'),
      Markup.button.callback('❌ Отмена', 'cancel')
    ]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при добавлении сиропов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора сиропов
scene.action(/^syrup_(.+)$/, async (ctx) => {
  try {
    const syrupId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот сироп
    const existingIndex = ctx.session.bagData.syrups.findIndex(s => s.syrupId === syrupId);
    
    if (existingIndex !== -1) {
      // Если сироп уже выбран, удаляем его
      ctx.session.bagData.syrups.splice(existingIndex, 1);
      await ctx.answerCbQuery('Сироп удален из списка');
    } else {
      // Добавляем сироп в список
      ctx.session.bagData.syrups.push({
        syrupId,
        units: 0 // Количество будет запрошено позже
      });
      await ctx.answerCbQuery('Сироп добавлен в список');
    }
    
    // Обновляем список сиропов
    await handleBagAddSyrups(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора сиропа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик завершения выбора сиропов
scene.action('syrups_done', async (ctx) => {
  try {
    // Если выбраны сиропы, запрашиваем количество для каждого
    if (ctx.session.bagData.syrups.length > 0) {
      await ctx.editMessageText('✅ Сиропы выбраны. Теперь введите количество для каждого сиропа.');
      
      // Переходим к вводу количества для первого сиропа
      ctx.session.bagData.currentSyrupIndex = 0;
      ctx.session.state = 'bag_input_syrup_units';
      await handleBagInputSyrupUnits(ctx);
    } else {
      await ctx.editMessageText('⏩ Сиропы не выбраны. Пропускаем этот шаг.');
      
      // Переходим к добавлению воды
      ctx.session.state = 'bag_add_water';
      await handleBagAddWater(ctx);
    }
  } catch (error) {
    console.error('Ошибка при завершении выбора сиропов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_input_syrup_units
async function handleBagInputSyrupUnits(ctx) {
  try {
    const currentIndex = ctx.session.bagData.currentSyrupIndex;
    
    // Проверяем, все ли сиропы обработаны
    if (currentIndex >= ctx.session.bagData.syrups.length) {
      // Все сиропы обработаны, переходим к добавлению воды
      ctx.session.state = 'bag_add_water';
      return await handleBagAddWater(ctx);
    }
    
    // Получаем текущий сироп
    const currentSyrup = ctx.session.bagData.syrups[currentIndex];
    const syrup = await prisma.syrup.findUnique({
      where: { id: currentSyrup.syrupId }
    });
    
    if (!syrup) {
      // Если сироп не найден, пропускаем его
      ctx.session.bagData.currentSyrupIndex++;
      return await handleBagInputSyrupUnits(ctx);
    }
    
    await ctx.reply(`
🔢 Введите количество сиропа "${syrup.name}" (в штуках):
`);
    
    // Ожидаем ввод количества от пользователя
  } catch (error) {
    console.error('Ошибка при вводе количества сиропа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния bag_add_water
async function handleBagAddWater(ctx) {
  try {
    // Получаем список типов воды
    const waterTypes = await prisma.waterType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    if (waterTypes.length === 0) {
      await ctx.reply('❌ Нет доступных типов воды. Пропускаем этот шаг.');
      ctx.session.state = 'bag_add_extras';
      return await handleBagAddExtras(ctx);
    }
    
    const message = `
💧 Добавление воды

Выберите типы воды для добавления в сумку:
`;
    
    // Создаем клавиатуру с типами воды
    const buttons = waterTypes.map(waterType => {
      // Проверяем, выбран ли уже этот тип воды
      const isSelected = ctx.session.bagData.water.some(w => w.waterTypeId === waterType.id);
      const prefix = isSelected ? '✅ ' : '';
      
      return [Markup.button.callback(
        `${prefix}${waterType.name} (${waterType.volume} л)`,
        `water_${waterType.id}`
      )];
    });
    
    // Добавляем кнопки управления
    buttons.push([
      Markup.button.callback('✅ Готово', 'water_done'),
      Markup.button.callback('❌ Отмена', 'cancel')
    ]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при добавлении воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора типов воды
scene.action(/^water_(.+)$/, async (ctx) => {
  try {
    const waterTypeId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот тип воды
    const existingIndex = ctx.session.bagData.water.findIndex(w => w.waterTypeId === waterTypeId);
    
    if (existingIndex !== -1) {
      // Если тип воды уже выбран, удаляем его
      ctx.session.bagData.water.splice(existingIndex, 1);
      await ctx.answerCbQuery('Тип воды удален из списка');
    } else {
      // Добавляем тип воды в список
      ctx.session.bagData.water.push({
        waterTypeId,
        units: 0 // Количество будет запрошено позже
      });
      await ctx.answerCbQuery('Тип воды добавлен в список');
    }
    
    // Обновляем список типов воды
    await handleBagAddWater(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик завершения выбора типов воды
scene.action('water_done', async (ctx) => {
  try {
    // Если выбраны типы воды, запрашиваем количество для каждого
    if (ctx.session.bagData.water.length > 0) {
      await ctx.editMessageText('✅ Типы воды выбраны. Теперь введите количество для каждого типа воды.');
      
      // Переходим к вводу количества для первого типа воды
      ctx.session.bagData.currentWaterIndex = 0;
      ctx.session.state = 'bag_input_water_units';
      await handleBagInputWaterUnits(ctx);
    } else {
      await ctx.editMessageText('⏩ Типы воды не выбраны. Пропускаем этот шаг.');
      
      // Переходим к добавлению дополнительных предметов
      ctx.session.state = 'bag_add_extras';
      await handleBagAddExtras(ctx);
    }
  } catch (error) {
    console.error('Ошибка при завершении выбора типов воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_input_water_units
async function handleBagInputWaterUnits(ctx) {
  try {
    const currentIndex = ctx.session.bagData.currentWaterIndex;
    
    // Проверяем, все ли типы воды обработаны
    if (currentIndex >= ctx.session.bagData.water.length) {
      // Все типы воды обработаны, переходим к добавлению дополнительных предметов
      ctx.session.state = 'bag_add_extras';
      return await handleBagAddExtras(ctx);
    }
    
    // Получаем текущий тип воды
    const currentWater = ctx.session.bagData.water[currentIndex];
    const waterType = await prisma.waterType.findUnique({
      where: { id: currentWater.waterTypeId }
    });
    
    if (!waterType) {
      // Если тип воды не найден, пропускаем его
      ctx.session.bagData.currentWaterIndex++;
      return await handleBagInputWaterUnits(ctx);
    }
    
    await ctx.reply(`
🔢 Введите количество воды "${waterType.name}" (в бутылках):
`);
    
    // Ожидаем ввод количества от пользователя
  } catch (error) {
    console.error('Ошибка при вводе количества воды:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния bag_add_extras
async function handleBagAddExtras(ctx) {
  try {
    // Получаем список дополнительных предметов
    const extras = await prisma.extraItem.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    if (extras.length === 0) {
      await ctx.reply('❌ Нет доступных дополнительных предметов. Пропускаем этот шаг.');
      ctx.session.state = 'bag_input_notes';
      return await handleBagInputNotes(ctx);
    }
    
    const message = `
🧰 Добавление дополнительных предметов

Выберите предметы для добавления в сумку:
`;
    
    // Создаем клавиатуру с предметами
    const buttons = extras.map(extra => {
      // Проверяем, выбран ли уже этот предмет
      const isSelected = ctx.session.bagData.extras.some(e => e.extraItemId === extra.id);
      const prefix = isSelected ? '✅ ' : '';
      
      return [Markup.button.callback(
        `${prefix}${extra.name}`,
        `extra_${extra.id}`
      )];
    });
    
    // Добавляем кнопки управления
    buttons.push([
      Markup.button.callback('✅ Готово', 'extras_done'),
      Markup.button.callback('❌ Отмена', 'cancel')
    ]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при добавлении дополнительных предметов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора дополнительных предметов
scene.action(/^extra_(.+)$/, async (ctx) => {
  try {
    const extraItemId = ctx.match[1];
    
    // Проверяем, выбран ли уже этот предмет
    const existingIndex = ctx.session.bagData.extras.findIndex(e => e.extraItemId === extraItemId);
    
    if (existingIndex !== -1) {
      // Если предмет уже выбран, удаляем его
      ctx.session.bagData.extras.splice(existingIndex, 1);
      await ctx.answerCbQuery('Предмет удален из списка');
    } else {
      // Добавляем предмет в список
      ctx.session.bagData.extras.push({
        extraItemId,
        units: 1 // По умолчанию 1 штука
      });
      await ctx.answerCbQuery('Предмет добавлен в список');
    }
    
    // Обновляем список предметов
    await handleBagAddExtras(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора дополнительного предмета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик завершения выбора дополнительных предметов
scene.action('extras_done', async (ctx) => {
  try {
    await ctx.editMessageText('✅ Дополнительные предметы выбраны.');
    
    // Переходим к вводу примечаний
    ctx.session.state = 'bag_input_notes';
    await handleBagInputNotes(ctx);
  } catch (error) {
    console.error('Ошибка при завершении выбора дополнительных предметов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_input_notes
async function handleBagInputNotes(ctx) {
  try {
    await ctx.reply(`
📝 Примечания к сумке

Введите дополнительные примечания к сумке или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'bag_input_notes';
  } catch (error) {
    console.error('Ошибка при запросе примечаний:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик пропуска примечаний
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'bag_input_notes') {
    ctx.session.bagData.notes = null;
    
    // Переходим к фото сумки
    ctx.session.state = 'bag_photo';
    await handleBagPhoto(ctx);
  }
});

// Обработка состояния bag_photo
async function handleBagPhoto(ctx) {
  try {
    await ctx.reply(`
📸 Фото сумки

Пожалуйста, сделайте фото сформированной сумки.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'bag_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото сумки
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'bag_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.bagData.photo = photoId;
      
      await ctx.reply('✅ Фото сумки получено.');
      
      // Переходим к подтверждению
      ctx.session.state = 'bag_confirm';
      await handleBagConfirm(ctx);
    } catch (error) {
      console.error('Ошибка при получении фото сумки:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото сумки
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'bag_wait_photo') {
    // Переходим к подтверждению
    ctx.session.state = 'bag_confirm';
    await handleBagConfirm(ctx);
  }
});

// Обработка состояния bag_confirm
async function handleBagConfirm(ctx) {
  try {
    const bagData = ctx.session.bagData;
    
    // Получаем информацию об автомате и операторе
    const machine = await prisma.machine.findUnique({
      where: { id: bagData.machineId },
      include: { location: true }
    });
    
    const operator = await prisma.user.findUnique({
      where: { id: bagData.operatorId }
    });
    
    if (!machine || !operator) {
      await ctx.reply('❌ Не удалось получить информацию об автомате или операторе.');
      return await ctx.scene.leave();
    }
    
    // Формируем текст подтверждения
    let confirmText = `
🎒 Подтверждение формирования сумки

🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Оператор: ${operator.firstName} ${operator.lastName || ''}
`;
    
    // Добавляем информацию о бункерах
    if (bagData.hoppers.length > 0) {
      confirmText += '\n🧂 Бункеры с ингредиентами:\n';
      
      for (const hopper of bagData.hoppers) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: hopper.ingredientId }
        });
        
        if (ingredient) {
          confirmText += `- ${ingredient.name} (${hopper.weight} г)\n`;
        }
      }
    }
    
    // Добавляем информацию о сиропах
    if (bagData.syrups.length > 0) {
      confirmText += '\n🧴 Сиропы:\n';
      
      for (const syrupItem of bagData.syrups) {
        const syrup = await prisma.syrup.findUnique({
          where: { id: syrupItem.syrupId }
        });
        
        if (syrup) {
          confirmText += `- ${syrup.name} (${syrupItem.units} шт.)\n`;
        }
      }
    }
    
    // Добавляем информацию о воде
    if (bagData.water.length > 0) {
      confirmText += '\n💧 Вода:\n';
      
      for (const waterItem of bagData.water) {
        const waterType = await prisma.waterType.findUnique({
          where: { id: waterItem.waterTypeId }
        });
        
        if (waterType) {
          confirmText += `- ${waterType.name} (${waterItem.units} шт.)\n`;
        }
      }
    }
    
    // Добавляем информацию о дополнительных предметах
    if (bagData.extras.length > 0) {
      confirmText += '\n🧰 Дополнительные предметы:\n';
      
      for (const extraItem of bagData.extras) {
        const extra = await prisma.extraItem.findUnique({
          where: { id: extraItem.extraItemId }
        });
        
        if (extra) {
          confirmText += `- ${extra.name} (${extraItem.units} шт.)\n`;
        }
      }
    }
    
    // Добавляем примечания, если они есть
    if (bagData.notes) {
      confirmText += `\n📝 Примечания: ${bagData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_bag')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении формирования сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения формирования сумки
scene.action('confirm_bag', async (ctx) => {
  try {
    const bagData = ctx.session.bagData;
    
    // Создаем запись о сумке в базе данных
    const bag = await prisma.bag.create({
      data: {
        machineId: bagData.machineId,
        operatorId: bagData.operatorId,
        createdById: ctx.session.user.id,
        status: 'CREATED',
        photo: bagData.photo,
        notes: bagData.notes
      }
    });
    
    // Создаем записи о бункерах
    for (const hopper of bagData.hoppers) {
      await prisma.bagHopper.create({
        data: {
          bagId: bag.id,
          ingredientId: hopper.ingredientId,
          weight: hopper.weight
        }
      });
    }
    
    // Создаем записи о сиропах
    for (const syrupItem of bagData.syrups) {
      await prisma.bagSyrup.create({
        data: {
          bagId: bag.id,
          syrupId: syrupItem.syrupId,
          units: syrupItem.units
        }
      });
    }
    
    // Создаем записи о воде
    for (const waterItem of bagData.water) {
      await prisma.bagWater.create({
        data: {
          bagId: bag.id,
          waterTypeId: waterItem.waterTypeId,
          units: waterItem.units
        }
      });
    }
    
    // Создаем записи о дополнительных предметах
    for (const extraItem of bagData.extras) {
      await prisma.bagExtra.create({
        data: {
          bagId: bag.id,
          extraItemId: extraItem.extraItemId,
          units: extraItem.units
        }
      });
    }
    
    // Отправляем уведомление оператору
    try {
      const operator = await prisma.user.findUnique({
        where: { id: bagData.operatorId },
        select: { telegramId: true }
      });
      
      if (operator && operator.telegramId) {
        // Получаем информацию об автомате
        const machine = await prisma.machine.findUnique({
          where: { id: bagData.machineId },
          include: { location: true }
        });
        
        // Формируем текст уведомления
        const notificationText = `
🎒 Для вас сформирована новая сумка!

🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Сформирована: ${new Date().toLocaleDateString('ru-RU')}

Вы можете получить сумку на складе.
`;
        
        // Отправляем уведомление
        await ctx.telegram.sendMessage(operator.telegramId, notificationText);
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления оператору:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    // Отображаем сообщение об успешном формировании сумки
    await ctx.editMessageText(`
✅ Сумка успешно сформирована!

🔹 ID: ${bag.id}
🔹 Статус: Создана
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Оператор получил уведомление о новой сумке.
`);
    
    // Переходим к отправке сумки
    ctx.session.state = 'bag_dispatch';
    await handleBagDispatch(ctx);
  } catch (error) {
    console.error('Ошибка при создании сумки:', error);
    await ctx.reply('❌ Произошла ошибка при создании сумки. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния bag_dispatch
async function handleBagDispatch(ctx) {
  try {
    // Предлагаем создать еще одну сумку или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🎒 Создать еще сумку', 'create_another_bag')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при отправке сумки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Формирование сумки отменено.');
  await ctx.scene.leave();
});

// Обработчик создания еще одной сумки
scene.action('create_another_bag', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.bagData = {
    machineId: null,
    operatorId: null,
    hoppers: [],
    syrups: [],
    water: [],
    extras: [],
    photo: null,
    notes: null
  };
  
  ctx.session.state = 'bag_select_machine';
  await ctx.editMessageText('🎒 Создание новой сумки...');
  await handleBagSelectMachine(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

module.exports = scene;
