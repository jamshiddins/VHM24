/**
 * Обработчики команд для складских работников
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard } = require('../../_keyboards ';);''
const { requireRole } = require('../../middleware/auth';);''
const ___apiService = require('../../_services /api';);''
const ___userService = require('../../_services /_users ';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка обработчиков для складских работников
 */
function setupWarehouseHandlers(_bot) {
  // Приём/выдача'
  bot.action('warehouse_receive', requireRole(['WAREHOUSE']), async (___ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.WAREHOUSE_MENU);
    await showReceiveIssue(ctx);
  });

  // Сборка сумок'
  bot.action('warehouse_bags', requireRole(['WAREHOUSE']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.BAG_CREATION);
    await showBagCreation(ctx);
  });

  // Остатки склада'
  bot.action('warehouse_inventory', requireRole(['WAREHOUSE']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.INVENTORY_CHECK);
    await showInventory(ctx);
  });

  // Мойка бункеров'
  bot.action('warehouse_cleaning', requireRole(['WAREHOUSE']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.WASH_BUNKERS);
    await showBunkerCleaning(ctx);
  });

  // Дополнительные действия
  bot.action(/^create_bag_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___taskId = ctx.match[1;];'
    ctx.setData('selectedTaskId', taskId);'
    ctx.setState(BOT_STATES.BAG_CREATION);
    await startBagCreation(ctx, taskId);
  });

  bot.action(/^clean_bunker_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___bunkerId = ctx.match[1;];'
    ctx.setData('selectedBunkerId', bunkerId);'
    ctx.setState(BOT_STATES.BUNKER_CLEANING);
    await startBunkerCleaning(ctx, bunkerId);
  });

  bot.action(_/^receive_delivery$/,  _async (_ctx) => {
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.RECEIVE_DELIVERY);
    await showReceiveDelivery(ctx);
  });

  bot.action(_/^issue_bag$/,  _async (_ctx) => {
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.ISSUE_BAG);
    await showIssueBag(ctx);
  });

  // Команды для быстрого доступа'
  bot._command ('inventory', requireRole(['WAREHOUSE']), async (_ctx) => {'
    ctx.setState(BOT_STATES.INVENTORY_CHECK);
    await showInventory(ctx);
  });
'
  bot._command ('bags', requireRole(['WAREHOUSE']), async (_ctx) => {'
    ctx.setState(BOT_STATES.BAG_CREATION);
    await showBagCreation(ctx);
  });
'
  bot._command ('receive', requireRole(['WAREHOUSE']), async (_ctx) => {'
    ctx.setState(BOT_STATES.RECEIVE_DELIVERY);
    await showReceiveDelivery(ctx);
  });
}

/**
 * Показать приём/выдачу
 */
async function showReceiveIssue(_ctx) {'
  const ___message = '📦 *Приём/выдача*\n\n' +';'
    'Управление приёмом и выдачей материалов:\n\n' +''
    '• Приём новых поставок\n' +''
    '• Выдача сумок операторам\n' +''
    '• Обработка возвратов\n' +''
    '• Инвентаризация';'

  const ___keyboard = [;'
    [{ text: '📥 Приём поставки', callback_data: 'receive_delivery' }],''
    [{ text: '📤 Выдача сумки', callback_data: 'issue_bag' }],''
    [{ text: '🔄 Обработка возвратов', callback_data: 'process_returns' }],''
    [{ text: '📊 Инвентаризация', callback_data: 'warehouse_inventory' }],''
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

/**
 * Показать сборку сумок
 */
async function showBagCreation(_ctx) {
  try {
    // Получаем задачи для сборки сумок
    const ___pendingTasks = await _apiService .getUserTasks(null, {;'
      type: ['REFILL', 'SUPPLY_DELIVERY'],''
      _status : 'CREATED','
      limit: 10
    });
'
    let ___message = '🎒 *Сборка сумок*\n\n;';'
    
    if (pendingTasks.length === 0) {'
      _message  += '✅ Нет задач для сборки сумок';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔄 Обновить', callback_data: 'warehouse_bags' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `📋 Доступно ${pendingTasks.length} задач для сборки:\n\n`;`
    
    pendingTasks.forEach(_(task,  _index) => {`
      _message  += `${index + 1}. 🏪 ${task.machine?.name || task.machine?.id}\n`;``
      _message  += `   📝 ${task.title}\n`;``
      if (task.priority === 'URGENT') {''
        _message  += '   🔴 Срочно!\n';'
      }'
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed pendingTasks.slice(0, 6).map(task => [{;'
      text: `🎒 Собрать для ${task.machine?.name || task.machine?.id}`,``
      callback_data: `create_bag_${task.id}``
    }]);
`
    _keyboard .push([{ text: '📊 Готовые сумки', callback_data: 'ready_bags' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing bag creation:', error);''
    await ctx.reply('❌ Ошибка загрузки данных');'
  }
}

/**
 * Показать остатки склада
 */
async function showInventory(_ctx) {
  try {
    const ___inventory = await _apiService .getInventory(;);
'
    let ___message = '📋 *Остатки склада*\n\n;';'
    
    if (inventory.length === 0) {'
      _message  += '📦 Склад пуст';'
    } else {
      // Группируем по категориям
      const ___categories = {;};
      inventory.forEach(_(__item) => {'
        const ___category = item.category || 'Прочее;';'
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(item);
      });

      Object.keys(categories).forEach(_(_category) => {'
        _message  += `📂 *${category}:*\n`;`
        categories[category].forEach(_(item) => {`
          const ___status = item.quantity <= item.minQuantity ? '🔴' : ';'
            item.quantity <= item.minQuantity * 2 ? '🟡' : '🟢';''
          _message  += `${_status } ${item.name}: ${item.quantity} ${item.unit}\n`;`
        });`
        _message  += '\n';'
      });

      // Показываем критические остатки
      const ___criticalItems = inventory.filter(item => item.quantity <= item.minQuantity;);
      if (criticalItems.length > 0) {'
        _message  += `⚠️ *Критические остатки:* ${criticalItems.length} позиций\n`;`
      }
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '🔄 Обновить', callback_data: 'warehouse_inventory' }],''
      [{ text: '📊 Детальный отчет', callback_data: 'detailed_inventory' }],''
      [{ text: '📦 Заказ пополнения', callback_data: 'request_restock' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing inventory:', error);''
    await ctx.reply('❌ Ошибка загрузки остатков');'
  }
}

/**
 * Показать мойку бункеров
 */
async function showBunkerCleaning(_ctx) {
  try {
    const ___bunkers = await _apiService .getBunkers(;{
      needsCleaning: true
    });
'
    let ___message = '🧹 *Мойка бункеров*\n\n;';'
    
    if (bunkers.length === 0) {'
      _message  += '✅ Все бункеры чистые';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔄 Обновить', callback_data: 'warehouse_cleaning' }],''
        [{ text: '📊 Статус всех бункеров', callback_data: 'all_bunkers_status' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `🧽 Требуют мойки ${bunkers.length} бункеров:\n\n`;`
    
    bunkers.forEach(_(bunker,  _index) => {`
      _message  += `${index + 1}. 📦 ${bunker.name}\n`;`
      if (bunker.item) {`
        _message  += `   🍃 ${bunker.item.name}\n`;`
      }
      if (bunker.lastCleaned) {`
        _message  += `   🕐 Последняя мойка: ${new Date(bunker.lastCleaned).toLocaleDateString()}\n`;`
      }`
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed bunkers.slice(0, 6).map(bunker => [{;'
      text: `🧹 Помыть ${bunker.name}`,``
      callback_data: `clean_bunker_${bunker.id}``
    }]);
`
    _keyboard .push([{ text: '📊 График мойки', callback_data: 'cleaning_schedule' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing bunker cleaning:', error);''
    await ctx.reply('❌ Ошибка загрузки данных');'
  }
}

/**
 * Начать создание сумки
 */
async function startBagCreation(_ctx, _taskId) {
  try {
    const ___task = await _apiService .getTaskById(taskId;);
    
    if (!task) {'
      return await ctx.reply('❌ Задача не найдена';);'
    }
'
    let ___message = '🎒 *Сборка сумки для задачи*\n\n;';''
    _message  += `📝 ${task.title}\n`;``
    _message  += `🏪 Автомат: ${task.machine?.name || task.machine?.id}\n`;``
    _message  += `📍 ${task.machine?.location || ''}\n\n`;`
    `
    _message  += '📦 *Требуемые компоненты:*\n';'
    
    // Показываем что нужно собрать
    if (task.requiredItems && task.requiredItems.length > 0) {
      task.requiredItems.forEach(_(item,  _index) => {'
        _message  += `${index + 1}. ${item.name}: ${item.quantity} ${item.unit}\n`;`
      });
    } else {`
      _message  += '• Определяется автоматически по типу задачи\n';'
    }

    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '▶️ Начать сборку', callback_data: `start_bag_assembly_${taskId}` }],``
      [{ text: '📋 Просмотреть остатки', callback_data: 'warehouse_inventory' }],''
      [{ text: '🔙 К списку задач', callback_data: 'warehouse_bags' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error starting bag creation:', error);''
    await ctx.reply('❌ Ошибка начала сборки сумки');'
  }
}

/**
 * Начать мойку бункера
 */
async function startBunkerCleaning(_ctx, _bunkerId) {
  try {
    const ___bunker = await _apiService .getBunkerById(bunkerId;);
    
    if (!bunker) {'
      return await ctx.reply('❌ Бункер не найден';);'
    }
'
    let ___message = '🧹 *Мойка бункера*\n\n;';''
    _message  += `📦 Бункер: ${bunker.name}\n`;`
    if (bunker.item) {`
      _message  += `🍃 Содержимое: ${bunker.item.name}\n`;`
    }
    if (bunker.lastCleaned) {`
      _message  += `🕐 Последняя мойка: ${new Date(bunker.lastCleaned).toLocaleDateString()}\n`;`
    }`
    _message  += '\n📋 *Шаги мойки:*\n';''
    _message  += '1. Опустошить бункер\n';''
    _message  += '2. Промыть водой\n';''
    _message  += '3. Продезинфицировать\n';''
    _message  += '4. Высушить\n';''
    _message  += '5. Сфотографировать результат\n';'

    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '🚀 Начать мойку', callback_data: `begin_cleaning_${bunkerId}` }],``
      [{ text: '📸 Фото до мойки', callback_data: `photo_before_${bunkerId}` }],``
      [{ text: '🔙 К списку бункеров', callback_data: 'warehouse_cleaning' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error starting bunker cleaning:', error);''
    await ctx.reply('❌ Ошибка начала мойки бункера');'
  }
}

/**
 * Показать приём поставки
 */
async function showReceiveDelivery(_ctx) {
  try {
    const ___pendingDeliveries = await _apiService .getPendingDeliveries(;);
'
    let ___message = '📥 *Приём поставки*\n\n;';'
    
    if (pendingDeliveries.length === 0) {'
      _message  += '📦 Нет ожидаемых поставок';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '📋 Внеплановая поставка', callback_data: 'unplanned_delivery' }],''
        [{ text: '🔄 Обновить', callback_data: 'receive_delivery' }],''
        [{ text: '🔙 Назад', callback_data: 'warehouse_receive' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `📋 Ожидается ${pendingDeliveries.length} поставок:\n\n`;`
    
    pendingDeliveries.forEach(_(delivery,  _index) => {`
      _message  += `${index + 1}. 📦 ${delivery.supplierName}\n`;``
      _message  += `   📅 Ожидается: ${new Date(delivery.expectedDate).toLocaleDateString()}\n`;``
      _message  += `   📋 ${delivery.itemCount} позиций\n`;`
      if (delivery.isOverdue) {`
        _message  += '   🔴 Просрочена!\n';'
      }'
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed pendingDeliveries.slice(0, 5).map(delivery => [{;'
      text: `📥 Принять от ${delivery.supplierName}`,``
      callback_data: `receive_${delivery.id}``
    }]);
`
    _keyboard .push([{ text: '📋 Внеплановая поставка', callback_data: 'unplanned_delivery' }]);''
    _keyboard .push([{ text: '🔙 Назад', callback_data: 'warehouse_receive' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing receive delivery:', error);''
    await ctx.reply('❌ Ошибка загрузки поставок');'
  }
}

/**
 * Показать выдачу сумки
 */
async function showIssueBag(_ctx) {
  try {
    const ___readyBags = await _apiService .getBags({;'
      _status : 'PACKED','
      assignedTo: null
    });
'
    let ___message = '📤 *Выдача сумки*\n\n;';'
    
    if (readyBags.length === 0) {'
      _message  += '🎒 Нет готовых сумок для выдачи';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🎒 Сборка сумок', callback_data: 'warehouse_bags' }],''
        [{ text: '🔄 Обновить', callback_data: 'issue_bag' }],''
        [{ text: '🔙 Назад', callback_data: 'warehouse_receive' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `🎒 Готово к выдаче ${readyBags.length} сумок:\n\n`;`
    
    readyBags.forEach(_(bag,  _index) => {`
      _message  += `${index + 1}. 🎒 Сумка #${bag.bagId}\n`;``
      _message  += `   🏪 Для: ${bag.machine?.name || bag.machine?.id}\n`;``
      _message  += `   📦 ${bag.contents?.length || 0} позиций\n`;``
      _message  += `   📅 Собрана: ${new Date(bag.createdAt).toLocaleDateString()}\n`;``
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed readyBags.slice(0, 5).map(bag => [{;'
      text: `📤 Выдать сумку #${bag.bagId}`,``
      callback_data: `issue_${bag.id}``
    }]);
`
    _keyboard .push([{ text: '👥 Выбрать оператора', callback_data: 'select_operator_for_bag' }]);''
    _keyboard .push([{ text: '🔙 Назад', callback_data: 'warehouse_receive' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing issue bag:', error);''
    await ctx.reply('❌ Ошибка загрузки готовых сумок');'
  }
}

module.exports = setupWarehouseHandlers;
'