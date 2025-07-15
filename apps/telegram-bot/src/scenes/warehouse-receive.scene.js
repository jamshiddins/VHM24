/**
 * FSM: warehouse_receive_fsm
 * Назначение: Приём новых ингредиентов, товаров, бутылок воды на склад.
 * Роли: Складской работник (Warehouse).
 * Состояния:
 *   - receive_select_type: выбор типа принимаемого товара
 *   - receive_input_quantity_or_weight: ввод количества или веса
 *   - receive_photo: фото принимаемого товара
 *   - receive_confirm: подтверждение приема
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('warehouse_receive_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[warehouse_receive_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или WAREHOUSE
  if (!ctx.session.user || !['ADMIN', 'WAREHOUSE'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к приему товаров на склад.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные приема товара
    ctx.session.receiveData = {
      type: null,
      itemId: null,
      quantity: 0,
      weight: 0,
      photo: null,
      notes: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'receive_select_type';
    
    // Переходим к выбору типа товара
    await handleReceiveSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену warehouse_receive_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния receive_select_type
async function handleReceiveSelectType(ctx) {
  try {
    const message = `
📦 Приём товаров на склад

Выберите тип принимаемого товара:
`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🧂 Ингредиенты', 'type_ingredient')],
      [Markup.button.callback('💧 Вода', 'type_water')],
      [Markup.button.callback('🧴 Сиропы', 'type_syrup')],
      [Markup.button.callback('🧰 Дополнительные предметы', 'type_extra')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе типа товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора типа товара
scene.action(/^type_(.+)$/, async (ctx) => {
  try {
    const type = ctx.match[1];
    
    // Сохраняем тип товара
    ctx.session.receiveData.type = type;
    
    // Отображаем выбранный тип
    let typeName = '';
    switch (type) {
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
    
    // Переходим к выбору конкретного товара
    ctx.session.state = 'receive_select_item';
    await handleReceiveSelectItem(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния receive_select_item
async function handleReceiveSelectItem(ctx) {
  try {
    const type = ctx.session.receiveData.type;
    let items = [];
    let message = '';
    
    // Получаем список товаров в зависимости от типа
    switch (type) {
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
      await ctx.reply(`❌ Нет доступных товаров типа "${type}". Попробуйте выбрать другой тип.`);
      ctx.session.state = 'receive_select_type';
      return await handleReceiveSelectType(ctx);
    }
    
    // Создаем клавиатуру с товарами
    const buttons = items.map(item => {
      let buttonText = '';
      
      switch (type) {
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
      
      return [Markup.button.callback(buttonText, `item_${item.id}`)];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора товара
scene.action(/^item_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Сохраняем ID товара
    ctx.session.receiveData.itemId = itemId;
    
    const type = ctx.session.receiveData.type;
    let item;
    
    // Получаем информацию о товаре
    switch (type) {
      case 'ingredient':
        item = await prisma.ingredient.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран ингредиент: ${item.name} (${item.code})`);
        break;
      case 'water':
        item = await prisma.waterType.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран тип воды: ${item.name} (${item.volume} л)`);
        break;
      case 'syrup':
        item = await prisma.syrup.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран сироп: ${item.name} (${item.volume} мл)`);
        break;
      case 'extra':
        item = await prisma.extraItem.findUnique({
          where: { id: itemId }
        });
        await ctx.editMessageText(`Выбран предмет: ${item.name}`);
        break;
    }
    
    // Переходим к вводу количества или веса
    ctx.session.state = 'receive_input_quantity_or_weight';
    await handleReceiveInputQuantityOrWeight(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния receive_input_quantity_or_weight
async function handleReceiveInputQuantityOrWeight(ctx) {
  try {
    const type = ctx.session.receiveData.type;
    const itemId = ctx.session.receiveData.itemId;
    
    // Запрашиваем ввод количества или веса в зависимости от типа товара
    switch (type) {
      case 'ingredient':
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: itemId }
        });
        await ctx.reply(`
⚖️ Введите вес ингредиента "${ingredient.name}" (в граммах):
`);
        break;
      case 'water':
        const waterType = await prisma.waterType.findUnique({
          where: { id: itemId }
        });
        await ctx.reply(`
🔢 Введите количество бутылок воды "${waterType.name}" (в штуках):
`);
        break;
      case 'syrup':
        const syrup = await prisma.syrup.findUnique({
          where: { id: itemId }
        });
        await ctx.reply(`
🔢 Введите количество бутылок сиропа "${syrup.name}" (в штуках):
`);
        break;
      case 'extra':
        const extraItem = await prisma.extraItem.findUnique({
          where: { id: itemId }
        });
        await ctx.reply(`
🔢 Введите количество предметов "${extraItem.name}" (в штуках):
`);
        break;
    }
    
    // Ожидаем ввод количества или веса от пользователя
  } catch (error) {
    console.error('Ошибка при запросе количества или веса:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода количества или веса
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'receive_input_quantity_or_weight') {
    try {
      const type = ctx.session.receiveData.type;
      const value = parseInt(ctx.message.text.trim());
      
      if (isNaN(value) || value <= 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (больше нуля).');
      }
      
      // Сохраняем количество или вес в зависимости от типа товара
      switch (type) {
        case 'ingredient':
          ctx.session.receiveData.weight = value;
          break;
        case 'water':
        case 'syrup':
        case 'extra':
          ctx.session.receiveData.quantity = value;
          break;
      }
      
      await ctx.reply('✅ Значение сохранено.');
      
      // Переходим к запросу фото
      ctx.session.state = 'receive_photo';
      await handleReceivePhoto(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода количества или веса:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'receive_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.receiveData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к подтверждению
      ctx.session.state = 'receive_confirm';
      await handleReceiveConfirm(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния receive_photo
async function handleReceivePhoto(ctx) {
  try {
    await ctx.reply(`
📸 Фото товара

Пожалуйста, сделайте фото принимаемого товара.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'receive_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото товара
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'receive_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.receiveData.photo = photoId;
      
      await ctx.reply('✅ Фото товара получено.');
      
      // Запрашиваем примечания
      await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
      
      // Ожидаем ввод примечаний от пользователя
      ctx.session.state = 'receive_input_notes';
    } catch (error) {
      console.error('Ошибка при получении фото товара:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'receive_wait_photo') {
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'receive_input_notes';
  } else if (ctx.session.state === 'receive_input_notes') {
    ctx.session.receiveData.notes = null;
    
    // Переходим к подтверждению
    ctx.session.state = 'receive_confirm';
    await handleReceiveConfirm(ctx);
  }
});

// Обработка состояния receive_confirm
async function handleReceiveConfirm(ctx) {
  try {
    const receiveData = ctx.session.receiveData;
    const type = receiveData.type;
    const itemId = receiveData.itemId;
    
    // Получаем информацию о товаре
    let item;
    let confirmText = '📦 Подтверждение приема товара на склад\n\n';
    
    switch (type) {
      case 'ingredient':
        item = await prisma.ingredient.findUnique({
          where: { id: itemId }
        });
        confirmText += `🧂 Ингредиент: ${item.name} (${item.code})\n`;
        confirmText += `⚖️ Вес: ${receiveData.weight} г\n`;
        break;
      case 'water':
        item = await prisma.waterType.findUnique({
          where: { id: itemId }
        });
        confirmText += `💧 Вода: ${item.name} (${item.volume} л)\n`;
        confirmText += `🔢 Количество: ${receiveData.quantity} шт.\n`;
        break;
      case 'syrup':
        item = await prisma.syrup.findUnique({
          where: { id: itemId }
        });
        confirmText += `🧴 Сироп: ${item.name} (${item.volume} мл)\n`;
        confirmText += `🔢 Количество: ${receiveData.quantity} шт.\n`;
        break;
      case 'extra':
        item = await prisma.extraItem.findUnique({
          where: { id: itemId }
        });
        confirmText += `🧰 Предмет: ${item.name}\n`;
        confirmText += `🔢 Количество: ${receiveData.quantity} шт.\n`;
        break;
    }
    
    // Добавляем примечания, если они есть
    if (receiveData.notes) {
      confirmText += `\n📝 Примечания: ${receiveData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_receive')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении приема товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения приема товара
scene.action('confirm_receive', async (ctx) => {
  try {
    const receiveData = ctx.session.receiveData;
    const type = receiveData.type;
    const itemId = receiveData.itemId;
    
    // Создаем запись о приеме товара в базе данных
    const warehouseReceive = await prisma.warehouseReceive.create({
      data: {
        type: type.toUpperCase(),
        itemId: itemId,
        quantity: receiveData.quantity,
        weight: receiveData.weight,
        photo: receiveData.photo,
        notes: receiveData.notes,
        userId: ctx.session.user.id,
        timestamp: new Date()
      }
    });
    
    // Обновляем остатки на складе
    switch (type) {
      case 'ingredient':
        // Получаем текущий остаток ингредиента
        const ingredientInventory = await prisma.ingredientInventory.findFirst({
          where: { ingredientId: itemId }
        });
        
        if (ingredientInventory) {
          // Обновляем существующий остаток
          await prisma.ingredientInventory.update({
            where: { id: ingredientInventory.id },
            data: { weight: ingredientInventory.weight + receiveData.weight }
          });
        } else {
          // Создаем новую запись об остатке
          await prisma.ingredientInventory.create({
            data: {
              ingredientId: itemId,
              weight: receiveData.weight
            }
          });
        }
        break;
      case 'water':
        // Получаем текущий остаток воды
        const waterInventory = await prisma.waterInventory.findFirst({
          where: { waterTypeId: itemId }
        });
        
        if (waterInventory) {
          // Обновляем существующий остаток
          await prisma.waterInventory.update({
            where: { id: waterInventory.id },
            data: { units: waterInventory.units + receiveData.quantity }
          });
        } else {
          // Создаем новую запись об остатке
          await prisma.waterInventory.create({
            data: {
              waterTypeId: itemId,
              units: receiveData.quantity
            }
          });
        }
        break;
      case 'syrup':
        // Получаем текущий остаток сиропа
        const syrupInventory = await prisma.syrupInventory.findFirst({
          where: { syrupId: itemId }
        });
        
        if (syrupInventory) {
          // Обновляем существующий остаток
          await prisma.syrupInventory.update({
            where: { id: syrupInventory.id },
            data: { units: syrupInventory.units + receiveData.quantity }
          });
        } else {
          // Создаем новую запись об остатке
          await prisma.syrupInventory.create({
            data: {
              syrupId: itemId,
              units: receiveData.quantity
            }
          });
        }
        break;
      case 'extra':
        // Получаем текущий остаток дополнительного предмета
        const extraInventory = await prisma.extraItemInventory.findFirst({
          where: { extraItemId: itemId }
        });
        
        if (extraInventory) {
          // Обновляем существующий остаток
          await prisma.extraItemInventory.update({
            where: { id: extraInventory.id },
            data: { units: extraInventory.units + receiveData.quantity }
          });
        } else {
          // Создаем новую запись об остатке
          await prisma.extraItemInventory.create({
            data: {
              extraItemId: itemId,
              units: receiveData.quantity
            }
          });
        }
        break;
    }
    
    // Отображаем сообщение об успешном приеме товара
    await ctx.editMessageText(`
✅ Товар успешно принят на склад!

🔹 ID: ${warehouseReceive.id}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Остатки на складе обновлены.
`);
    
    // Предлагаем принять еще один товар или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Принять еще товар', 'receive_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при приеме товара:', error);
    await ctx.reply('❌ Произошла ошибка при приеме товара. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Прием товара отменен.');
  await ctx.scene.leave();
});

// Обработчик приема еще одного товара
scene.action('receive_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.receiveData = {
    type: null,
    itemId: null,
    quantity: 0,
    weight: 0,
    photo: null,
    notes: null
  };
  
  ctx.session.state = 'receive_select_type';
  await ctx.editMessageText('📦 Прием нового товара...');
  await handleReceiveSelectType(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

module.exports = scene;
