/**
 * FSM: warehouse_check_inventory_fsm
 * Назначение: Проведение инвентаризации складских запасов.
 * Роли: Складской работник (Warehouse).
 * Состояния:
 *   - inventory_select_type: выбор типа товара для инвентаризации
 *   - inventory_select_item: выбор конкретного товара
 *   - inventory_input_data: ввод фактического количества/веса
 *   - inventory_photo: фото товара
 *   - inventory_finish: завершение инвентаризации
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('warehouse_check_inventory_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[warehouse_check_inventory_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или WAREHOUSE
  if (!ctx.session.user || !['ADMIN', 'WAREHOUSE'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к проведению инвентаризации.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные инвентаризации
    ctx.session.inventoryData = {
      type: null,
      itemId: null,
      systemQuantity: 0,
      systemWeight: 0,
      actualQuantity: 0,
      actualWeight: 0,
      photo: null,
      notes: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'inventory_select_type';
    
    // Переходим к выбору типа товара
    await handleInventorySelectType(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену warehouse_check_inventory_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния inventory_select_type
async function handleInventorySelectType(ctx) {
  try {
    const message = `
📊 Инвентаризация складских запасов

Выберите тип товара для инвентаризации:
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
    ctx.session.inventoryData.type = type;
    
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
    ctx.session.state = 'inventory_select_item';
    await handleInventorySelectItem(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния inventory_select_item
async function handleInventorySelectItem(ctx) {
  try {
    const type = ctx.session.inventoryData.type;
    let items = [];
    let message = '';
    
    // Получаем список товаров в зависимости от типа
    switch (type) {
      case 'ingredient':
        // Получаем ингредиенты с остатками
        const ingredientInventories = await prisma.ingredientInventory.findMany({
          include: { ingredient: true }
        });
        
        if (ingredientInventories.length === 0) {
          await ctx.reply('❌ Нет остатков ингредиентов на складе.');
          ctx.session.state = 'inventory_select_type';
          return await handleInventorySelectType(ctx);
        }
        
        items = ingredientInventories.map(inv => ({
          id: inv.ingredient.id,
          name: inv.ingredient.name,
          code: inv.ingredient.code,
          quantity: 0,
          weight: inv.weight
        }));
        
        message = '🧂 Выберите ингредиент для инвентаризации:';
        break;
      case 'water':
        // Получаем типы воды с остатками
        const waterInventories = await prisma.waterInventory.findMany({
          include: { waterType: true }
        });
        
        if (waterInventories.length === 0) {
          await ctx.reply('❌ Нет остатков воды на складе.');
          ctx.session.state = 'inventory_select_type';
          return await handleInventorySelectType(ctx);
        }
        
        items = waterInventories.map(inv => ({
          id: inv.waterType.id,
          name: inv.waterType.name,
          volume: inv.waterType.volume,
          quantity: inv.units,
          weight: 0
        }));
        
        message = '💧 Выберите тип воды для инвентаризации:';
        break;
      case 'syrup':
        // Получаем сиропы с остатками
        const syrupInventories = await prisma.syrupInventory.findMany({
          include: { syrup: true }
        });
        
        if (syrupInventories.length === 0) {
          await ctx.reply('❌ Нет остатков сиропов на складе.');
          ctx.session.state = 'inventory_select_type';
          return await handleInventorySelectType(ctx);
        }
        
        items = syrupInventories.map(inv => ({
          id: inv.syrup.id,
          name: inv.syrup.name,
          volume: inv.syrup.volume,
          quantity: inv.units,
          weight: 0
        }));
        
        message = '🧴 Выберите сироп для инвентаризации:';
        break;
      case 'extra':
        // Получаем дополнительные предметы с остатками
        const extraInventories = await prisma.extraItemInventory.findMany({
          include: { extraItem: true }
        });
        
        if (extraInventories.length === 0) {
          await ctx.reply('❌ Нет остатков дополнительных предметов на складе.');
          ctx.session.state = 'inventory_select_type';
          return await handleInventorySelectType(ctx);
        }
        
        items = extraInventories.map(inv => ({
          id: inv.extraItem.id,
          name: inv.extraItem.name,
          quantity: inv.units,
          weight: 0
        }));
        
        message = '🧰 Выберите дополнительный предмет для инвентаризации:';
        break;
    }
    
    // Сохраняем список товаров в сессии
    ctx.session.inventoryData.items = items;
    
    // Создаем клавиатуру с товарами
    const buttons = items.map(item => {
      let buttonText = '';
      
      switch (type) {
        case 'ingredient':
          buttonText = `${item.name} (${item.code}) - ${item.weight} г`;
          break;
        case 'water':
          buttonText = `${item.name} (${item.volume} л) - ${item.quantity} шт.`;
          break;
        case 'syrup':
          buttonText = `${item.name} (${item.volume} мл) - ${item.quantity} шт.`;
          break;
        case 'extra':
          buttonText = `${item.name} - ${item.quantity} шт.`;
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
    const type = ctx.session.inventoryData.type;
    
    // Находим выбранный товар в списке
    const selectedItem = ctx.session.inventoryData.items.find(item => item.id === itemId);
    
    if (!selectedItem) {
      await ctx.reply('❌ Товар не найден. Попробуйте снова.');
      return await handleInventorySelectItem(ctx);
    }
    
    // Сохраняем ID товара и системные данные
    ctx.session.inventoryData.itemId = itemId;
    ctx.session.inventoryData.systemQuantity = selectedItem.quantity;
    ctx.session.inventoryData.systemWeight = selectedItem.weight;
    
    // Отображаем выбранный товар
    let itemText = '';
    switch (type) {
      case 'ingredient':
        itemText = `${selectedItem.name} (${selectedItem.code})`;
        await ctx.editMessageText(`Выбран ингредиент: ${itemText}\nСистемный остаток: ${selectedItem.weight} г`);
        break;
      case 'water':
        itemText = `${selectedItem.name} (${selectedItem.volume} л)`;
        await ctx.editMessageText(`Выбран тип воды: ${itemText}\nСистемный остаток: ${selectedItem.quantity} шт.`);
        break;
      case 'syrup':
        itemText = `${selectedItem.name} (${selectedItem.volume} мл)`;
        await ctx.editMessageText(`Выбран сироп: ${itemText}\nСистемный остаток: ${selectedItem.quantity} шт.`);
        break;
      case 'extra':
        itemText = selectedItem.name;
        await ctx.editMessageText(`Выбран предмет: ${itemText}\nСистемный остаток: ${selectedItem.quantity} шт.`);
        break;
    }
    
    // Переходим к вводу фактического количества/веса
    ctx.session.state = 'inventory_input_data';
    await handleInventoryInputData(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния inventory_input_data
async function handleInventoryInputData(ctx) {
  try {
    const type = ctx.session.inventoryData.type;
    const itemId = ctx.session.inventoryData.itemId;
    
    // Находим выбранный товар в списке
    const selectedItem = ctx.session.inventoryData.items.find(item => item.id === itemId);
    
    // Запрашиваем ввод фактического количества или веса в зависимости от типа товара
    switch (type) {
      case 'ingredient':
        await ctx.reply(`
⚖️ Введите фактический вес ингредиента "${selectedItem.name}" (в граммах):

Системный остаток: ${selectedItem.weight} г
`);
        break;
      case 'water':
      case 'syrup':
      case 'extra':
        await ctx.reply(`
🔢 Введите фактическое количество товара "${selectedItem.name}" (в штуках):

Системный остаток: ${selectedItem.quantity} шт.
`);
        break;
    }
    
    // Ожидаем ввод фактического количества или веса от пользователя
  } catch (error) {
    console.error('Ошибка при запросе фактического количества/веса:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода фактического количества/веса
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'inventory_input_data') {
    try {
      const type = ctx.session.inventoryData.type;
      const value = parseInt(ctx.message.text.trim());
      
      if (isNaN(value) || value < 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (больше или равно нулю).');
      }
      
      // Сохраняем фактическое количество или вес в зависимости от типа товара
      switch (type) {
        case 'ingredient':
          ctx.session.inventoryData.actualWeight = value;
          break;
        case 'water':
        case 'syrup':
        case 'extra':
          ctx.session.inventoryData.actualQuantity = value;
          break;
      }
      
      await ctx.reply('✅ Значение сохранено.');
      
      // Переходим к запросу фото
      ctx.session.state = 'inventory_photo';
      await handleInventoryPhoto(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода фактического количества/веса:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'inventory_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.inventoryData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к завершению инвентаризации
      ctx.session.state = 'inventory_finish';
      await handleInventoryFinish(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния inventory_photo
async function handleInventoryPhoto(ctx) {
  try {
    await ctx.reply(`
📸 Фото товара

Пожалуйста, сделайте фото товара для инвентаризации.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'inventory_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото товара:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото товара
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'inventory_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.inventoryData.photo = photoId;
      
      await ctx.reply('✅ Фото товара получено.');
      
      // Запрашиваем примечания
      await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
      
      // Ожидаем ввод примечаний от пользователя
      ctx.session.state = 'inventory_input_notes';
    } catch (error) {
      console.error('Ошибка при получении фото товара:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'inventory_wait_photo') {
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'inventory_input_notes';
  } else if (ctx.session.state === 'inventory_input_notes') {
    ctx.session.inventoryData.notes = null;
    
    // Переходим к завершению инвентаризации
    ctx.session.state = 'inventory_finish';
    await handleInventoryFinish(ctx);
  }
});

// Обработка состояния inventory_finish
async function handleInventoryFinish(ctx) {
  try {
    const inventoryData = ctx.session.inventoryData;
    const type = inventoryData.type;
    const itemId = inventoryData.itemId;
    
    // Находим выбранный товар в списке
    const selectedItem = inventoryData.items.find(item => item.id === itemId);
    
    // Формируем текст подтверждения
    let confirmText = `
📊 Подтверждение инвентаризации

`;
    
    switch (type) {
      case 'ingredient':
        confirmText += `🧂 Ингредиент: ${selectedItem.name} (${selectedItem.code})\n`;
        confirmText += `⚖️ Системный остаток: ${inventoryData.systemWeight} г\n`;
        confirmText += `⚖️ Фактический остаток: ${inventoryData.actualWeight} г\n`;
        
        // Вычисляем разницу
        const weightDiff = inventoryData.actualWeight - inventoryData.systemWeight;
        if (weightDiff > 0) {
          confirmText += `📈 Излишек: ${weightDiff} г\n`;
        } else if (weightDiff < 0) {
          confirmText += `📉 Недостача: ${Math.abs(weightDiff)} г\n`;
        } else {
          confirmText += `✅ Остаток совпадает\n`;
        }
        break;
      case 'water':
      case 'syrup':
      case 'extra':
        let itemName = '';
        switch (type) {
          case 'water':
            itemName = `💧 Вода: ${selectedItem.name} (${selectedItem.volume} л)`;
            break;
          case 'syrup':
            itemName = `🧴 Сироп: ${selectedItem.name} (${selectedItem.volume} мл)`;
            break;
          case 'extra':
            itemName = `🧰 Предмет: ${selectedItem.name}`;
            break;
        }
        
        confirmText += `${itemName}\n`;
        confirmText += `🔢 Системный остаток: ${inventoryData.systemQuantity} шт.\n`;
        confirmText += `🔢 Фактический остаток: ${inventoryData.actualQuantity} шт.\n`;
        
        // Вычисляем разницу
        const quantityDiff = inventoryData.actualQuantity - inventoryData.systemQuantity;
        if (quantityDiff > 0) {
          confirmText += `📈 Излишек: ${quantityDiff} шт.\n`;
        } else if (quantityDiff < 0) {
          confirmText += `📉 Недостача: ${Math.abs(quantityDiff)} шт.\n`;
        } else {
          confirmText += `✅ Остаток совпадает\n`;
        }
        break;
    }
    
    // Добавляем примечания, если они есть
    if (inventoryData.notes) {
      confirmText += `\n📝 Примечания: ${inventoryData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_inventory')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при завершении инвентаризации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения инвентаризации
scene.action('confirm_inventory', async (ctx) => {
  try {
    const inventoryData = ctx.session.inventoryData;
    const type = inventoryData.type;
    const itemId = inventoryData.itemId;
    
    // Создаем запись об инвентаризации в базе данных
    const inventory = await prisma.inventory.create({
      data: {
        type: type.toUpperCase(),
        itemId: itemId,
        systemQuantity: inventoryData.systemQuantity,
        systemWeight: inventoryData.systemWeight,
        actualQuantity: inventoryData.actualQuantity,
        actualWeight: inventoryData.actualWeight,
        photo: inventoryData.photo,
        notes: inventoryData.notes,
        userId: ctx.session.user.id,
        timestamp: new Date()
      }
    });
    
    // Обновляем остатки на складе в соответствии с фактическими данными
    switch (type) {
      case 'ingredient':
        // Обновляем остаток ингредиента
        const ingredientInventory = await prisma.ingredientInventory.findFirst({
          where: { ingredientId: itemId }
        });
        
        if (ingredientInventory) {
          await prisma.ingredientInventory.update({
            where: { id: ingredientInventory.id },
            data: { 
              weight: inventoryData.actualWeight,
              lastUpdated: new Date()
            }
          });
        }
        break;
      case 'water':
        // Обновляем остаток воды
        const waterInventory = await prisma.waterInventory.findFirst({
          where: { waterTypeId: itemId }
        });
        
        if (waterInventory) {
          await prisma.waterInventory.update({
            where: { id: waterInventory.id },
            data: { 
              units: inventoryData.actualQuantity,
              lastUpdated: new Date()
            }
          });
        }
        break;
      case 'syrup':
        // Обновляем остаток сиропа
        const syrupInventory = await prisma.syrupInventory.findFirst({
          where: { syrupId: itemId }
        });
        
        if (syrupInventory) {
          await prisma.syrupInventory.update({
            where: { id: syrupInventory.id },
            data: { 
              units: inventoryData.actualQuantity,
              lastUpdated: new Date()
            }
          });
        }
        break;
      case 'extra':
        // Обновляем остаток дополнительного предмета
        const extraInventory = await prisma.extraItemInventory.findFirst({
          where: { extraItemId: itemId }
        });
        
        if (extraInventory) {
          await prisma.extraItemInventory.update({
            where: { id: extraInventory.id },
            data: { 
              units: inventoryData.actualQuantity,
              lastUpdated: new Date()
            }
          });
        }
        break;
    }
    
    // Отображаем сообщение об успешной инвентаризации
    await ctx.editMessageText(`
✅ Инвентаризация успешно завершена!

🔹 ID: ${inventory.id}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Остатки на складе обновлены в соответствии с фактическими данными.
`);
    
    // Предлагаем провести еще одну инвентаризацию или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📊 Провести еще инвентаризацию', 'inventory_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при проведении инвентаризации:', error);
    await ctx.reply('❌ Произошла ошибка при проведении инвентаризации. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Инвентаризация отменена.');
  await ctx.scene.leave();
});

// Обработчик проведения еще одной инвентаризации
scene.action('inventory_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.inventoryData = {
    type: null,
    itemId: null,
    systemQuantity: 0,
    systemWeight: 0,
    actualQuantity: 0,
    actualWeight: 0,
    photo: null,
    notes: null
  };
  
  ctx.session.state = 'inventory_select_type';
  await ctx.editMessageText('📊 Новая инвентаризация...');
  await handleInventorySelectType(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

module.exports = scene;
