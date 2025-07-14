/**
 * Общие обработчики команд для всех ролей
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard } = require('../../_keyboards ';);''
const { _formatMessage  } = require('../../utils/formatters';);''
const ___userService = require('../../_services /_users ';);''
const ___apiService = require('../../_services /api';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка общих обработчиков
 */
function setupCommonHandlers(_bot) {
  // Обработчик для возврата в главное меню'
  bot.action(_'main_menu',  _async (_________ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.MAIN_MENU);
    
    if (!ctx._user ) {'
      return await ctx.reply('❌ Необходима авторизация';);'
    }
    
    await showMainMenu(ctx);
  });

  // Обработчик профиля'
  bot.action(_'profile',  _async (_ctx) => {'
    await ctx.answerCbQuery();
    await showProfile(ctx);
  });

  // Обработчик настроек'
  bot.action(_'_settings ',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showSettings(ctx);
  });

  // Настройки уведомлений'
  bot.action(_'settings_notifications',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showNotificationSettings(ctx);
  });

  // Переключение уведомлений
  bot.action(/^toggle_notification_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___settingType = ctx.match[1;];
    await toggleNotificationSetting(ctx, settingType);
  });

  // Помощь'
  bot.action(_'help',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showHelp(ctx);
  });

  // Статус системы'
  bot._command (_'system',  _async (ctx) => {''
    if (!userService.hasRole(ctx._user , ['ADMIN', 'MANAGER'])) {''
      return await ctx.reply('❌ Недостаточно прав';);'
    }
    
    await showSystemStatus(ctx);
  });

  // Версия бота'
  bot._command (_'version',  _async (ctx) => {''
    const ___botVersion = require('../../../package.json').versio;n;'
    const ___apiVersion = await _apiService .getVersion(;);
    
    await ctx.reply('
      '🤖 *VendHub Manager (VHM24) Bot*\n\n' +''
      `📱 Версия бота: ${botVersion}\n` +``
      `🔗 Версия API: ${apiVersion?.version || 'неизвестно'}\n` +``
      `📅 Сборка: ${apiVersion?.buildDate || 'неизвестно'}`,``
      { parse_mode: 'Markdown' }'
    );
  });

  // Диагностика соединения'
  bot._command (_'ping',  _async (ctx) => {'
    const ___startTime = Date._now (;);
    
    try {
      const ___health = await _apiService .checkHealth(;);
      const ___duration = Date._now () - _startTim;e ;
      '
      let ___status = '✅ Связь установлена;';''
      if (health._status  !== 'ok') {''
        _status  = '⚠️ Проблемы с API';'
      }
      
      await ctx.reply('
        '🏓 *Pong!*\n\n' +''
        `${_status }\n` +``
        `⏱️ Время отклика: ${duration}мс\n` +``
        `🔗 API статус: ${health._status }`,``
        { parse_mode: 'Markdown' }'
      );
    } catch (error) {
      await ctx.reply('
        '❌ *Ошибка связи*\n\n' +''
        'Не удается подключиться к серверу\n' +''
        `⏱️ Время: ${Date._now () - _startTime }мс`,``
        { parse_mode: 'Markdown' }'
      );
    }
  });

  // Обработка ошибок навигации
  bot.action(/^back_to_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___destination = ctx.match[1;];
    await handleBackNavigation(ctx, destination);
  });

  // Обработка callback query без обработчиков'
  bot.on(_'callback_query',  _async (ctx,  _next) => {'
    if (!ctx.callbackQuery._data ) {
      return next(;);
    }

    // Если callback query не был обработан предыдущими handlers'
    const ___isHandled = ctx.callbackQuery._data .startsWith('_handled_';);'
    
    if (!isHandled) {'
      await ctx.answerCbQuery('🤔 Функция временно недоступна');''
      require("./utils/logger").warn(`Unhandled callback query: ${ctx.callbackQuery._data }`, {`
        _userId : ctx.from?.id,
        username: ctx.from?.username
      });
    }
    
    return next(;);
  });
}

/**
 * Показать главное меню
 */
async function showMainMenu(_ctx) {
  const ___user = ctx._use;r ;
  if (!_user ) {`
    return await ctx.reply('❌ Необходима авторизация';);'
  }

  const ___welcomeMessage = _formatMessage .welcome(_user ;);
  const ___keyboard = getMainMenuKeyboard(_user .role;);
  
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(welcomeMessage, {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    } else {
      await ctx.reply(welcomeMessage, {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
  } catch (error) {
    await ctx.reply(welcomeMessage, {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });
  }
}

/**
 * Показать профиль пользователя
 */
async function showProfile(_ctx) {
  // const ___user = // Duplicate declaration removed ctx._use;r ;
  if (!_user ) {'
    return await ctx.reply('❌ Необходима авторизация';);'
  }

  try {
    // Получаем статистику пользователя
    const ___stats = await userService.getUserStats(_user .id;);
    const ___activeTasks = await userService.getActiveTasks(_user .id;);
    
    let ___profileText = _formatMessage .userProfile(_user ;);
    
    if (stats) {'
      profileText += '\n\n📈 *Статистика за неделю:*\n';''
      profileText += `• Выполнено задач: ${stats.completedTasks || 0}\n`;``
      profileText += `• Среднее время: ${stats.avgTaskTime || 0} мин\n`;``
      profileText += `• Рейтинг: ${stats.rating || 0}/5 ⭐\n`;`
    }

    if (_activeTasks .length > 0) {`
      profileText += `\n🔄 Активных задач: ${_activeTasks .length}`;`
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '📊 Детальная статистика', callback_data: 'profile_stats' }],''
      [{ text: '⚙️ Настройки', callback_data: '_settings ' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(profileText, {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    } else {
      await ctx.reply(profileText, {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
  } catch (error) {'
    require("./utils/logger").error('Error showing profile:', error);''
    await ctx.reply('❌ Ошибка загрузки профиля');'
  }
}

/**
 * Показать настройки
 */
async function showSettings(_ctx) {
  // const ___user = // Duplicate declaration removed ctx._use;r ;
  const ___settings = userService.getUserNotificationSettings(_user ;);
  '
  let ___settingsText = '⚙️ *Настройки бота*\n\n;';''
  settingsText += '🔔 Уведомления:\n';''
  settingsText += `• Новые задачи: ${_settings .newTasks ? '✅' : '❌'}\n`;``
  settingsText += `• Напоминания: ${_settings .taskReminders ? '✅' : '❌'}\n`;``
  settingsText += `• Обновления: ${_settings .taskUpdates ? '✅' : '❌'}\n`;``
  settingsText += `• Системные: ${_settings .systemAlerts ? '✅' : '❌'}\n\n`;`
  
  if (_settings .quietHours.enabled) {`
    settingsText += `🌙 Тихие часы: ${_settings .quietHours.start} - ${_settings .quietHours.end}\n`;`
  } else {`
    settingsText += '🌙 Тихие часы: отключены\n';'
  }

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '🔔 Управление уведомлениями', callback_data: 'settings_notifications' }],''
    [{ text: '🌍 Язык и регион', callback_data: 'settings_language' }],''
    [{ text: '🔒 Приватность', callback_data: 'settings_privacy' }],''
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
  ];

  await ctx.editMessageText(settingsText, {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

/**
 * Показать настройки уведомлений
 */
async function showNotificationSettings(_ctx) {
  // const ___user = // Duplicate declaration removed ctx._use;r ;
  // const ___settings = // Duplicate declaration removed userService.getUserNotificationSettings(_user ;);
  
  // const ___keyboard = // Duplicate declaration removed ;[
    [{ '
      text: `${_settings .newTasks ? '🔔' : '🔕'} Новые задачи`, ``
      callback_data: 'toggle_notification_newTasks' '
    }],
    [{ '
      text: `${_settings .taskReminders ? '🔔' : '🔕'} Напоминания`, ``
      callback_data: 'toggle_notification_taskReminders' '
    }],
    [{ '
      text: `${_settings .taskUpdates ? '🔔' : '🔕'} Обновления задач`, ``
      callback_data: 'toggle_notification_taskUpdates' '
    }],
    [{ '
      text: `${_settings .systemAlerts ? '🔔' : '🔕'} Системные уведомления`, ``
      callback_data: 'toggle_notification_systemAlerts' '
    }],'
    [{ text: '🌙 Тихие часы', callback_data: 'settings_quiet_hours' }],''
    [{ text: '🔙 Назад', callback_data: '_settings ' }]'
  ];

  await ctx.editMessageText('
    '🔔 *Настройки уведомлений*\n\n' +''
    'Выберите типы уведомлений, которые вы хотите получать:','
    {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    }
  );
}

/**
 * Переключить настройку уведомлений
 */
async function toggleNotificationSetting(_ctx, _settingType) {
  try {
    // В реальной реализации здесь будет API вызов для обновления настроек'
    await ctx.answerCbQuery('✅ Настройка обновлена');'
    
    // Логируем изменение'
    await userService.logAction(ctx._user .id, 'NOTIFICATION_SETTING_CHANGED', {'
      settingType,
      timestamp: new Date().toISOString()
    });
    
    // Обновляем отображение
    await showNotificationSettings(ctx);
  } catch (error) {'
    require("./utils/logger").error('Error toggling notification setting:', error);''
    await ctx.answerCbQuery('❌ Ошибка обновления настройки');'
  }
}

/**
 * Показать справку
 */
async function showHelp(_ctx) {
  // const ___user = // Duplicate declaration removed ctx._use;r ;'
  const ___role = _user ?.role || 'OPERATOR;';'
  
  const ___helpTexts = {;'
    OPERATOR: '📋 *Справка для оператора*\n\n' +''
      '*Основные команды:*\n' +''
      '• /start - Запуск бота\n' +''
      '• /tasks - Мои задачи\n' +''
      '• /_status  - Текущий статус\n' +''
      '• /help - Эта справка\n\n' +''
      '*Функции в меню:*\n' +''
      '🔹 Мои задачи - просмотр и выполнение\n' +''
      '🔹 Возврат сумок - возврат на склад\n' +''
      '🔹 Инкассация - сбор наличных\n' +''
      '🔹 Мой отчет - статистика работы','
      '
    WAREHOUSE: '📦 *Справка для склада*\n\n' +''
      '*Основные команды:*\n' +''
      '• /start - Запуск бота\n' +''
      '• /inventory - Остатки склада\n' +''
      '• /bags - Управление сумками\n' +''
      '• /help - Эта справка\n\n' +''
      '*Функции в меню:*\n' +''
      '🔹 Приём/выдача - операции склада\n' +''
      '🔹 Сборка сумок - комплектация\n' +''
      '🔹 Остатки - инвентаризация\n' +''
      '🔹 Мойка бункеров - подготовка','
      '
    MANAGER: '👔 *Справка для менеджера*\n\n' +''
      '*Основные команды:*\n' +''
      '• /start - Запуск бота\n' +''
      '• /create - Создать задачу\n' +''
      '• /reports - Отчеты системы\n' +''
      '• /system - Статус системы\n' +''
      '• /help - Эта справка\n\n' +''
      '*Функции в меню:*\n' +''
      '🔹 Создать задачу - новая задача\n' +''
      '🔹 Управление задачами - контроль\n' +''
      '🔹 Отчёты - аналитика и статистика\n' +''
      '🔹 Справочники - управление данными''
  };
'
  const ___helpText = helpTexts[role] + '\n\n' +';'
    '*Дополнительная помощь:*\n' +''
    '• Используйте кнопки меню для навигации\n' +''
    '• В любой момент можно вернуться в главное меню\n' +''
    '• При ошибках попробуйте команду /start\n\n' +''
    '📞 *Поддержка:* Обратитесь к администратору';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '📖 Детальная инструкция', callback_data: 'help_detailed' }],''
    [{ text: '❓ FAQ', callback_data: 'help_faq' }],''
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
  ];

  if (ctx.callbackQuery) {
    await ctx.editMessageText(_helpText , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });
  } else {
    await ctx.reply(_helpText , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });
  }
}

/**
 * Показать статус системы
 */
async function showSystemStatus(_ctx) {
  try {
    // const ___health = // Duplicate declaration removed await _apiService .checkHealth(;);
    // const ___stats = // Duplicate declaration removed await _apiService .getSystemStats(;);
    '
    let ___statusText = '🖥️ *Статус системы*\n\n;';''
    _statusText  += `🔗 API: ${health._status  === 'ok' ? '✅ Работает' : '❌ Недоступен'}\n`;``
    _statusText  += `💾 База данных: ${health.database ? '✅' : '❌'} ${health.database || 'Ошибка'}\n`;``
    _statusText  += `🔴 Redis: ${health.redis ? '✅' : '❌'} ${health.redis || 'Ошибка'}\n\n`;`
    
    if (stats) {`
      _statusText  += '📊 *Статистика:*\n';''
      _statusText  += `• Активных пользователей: ${stats.activeUsers || 0}\n`;``
      _statusText  += `• Задач сегодня: ${stats.tasksToday || 0}\n`;``
      _statusText  += `• Автоматов онлайн: ${stats.machinesOnline || 0}/${stats.totalMachines || 0}\n`;``
      _statusText  += `• Критических ошибок: ${stats.criticalErrors || 0}\n`;`
    }
    `
    _statusText  += `\n⏰ Обновлено: ${new Date().toLocaleString('ru-RU')}`;`

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '🔄 Обновить', callback_data: 'system_refresh' }],''
      [{ text: '📊 Детальная статистика', callback_data: 'system_detailed' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    await ctx.reply(_statusText , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });
  } catch (error) {'
    require("./utils/logger").error('Error getting system _status :', error);''
    await ctx.reply('❌ Ошибка получения статуса системы');'
  }
}

/**
 * Обработка навигации назад
 */
async function handleBackNavigation(_ctx, _destination) {
  try {
    switch (destination) {'
    case 'main_menu':'
      await showMainMenu(ctx);
      break;'
    case 'profile':'
      await showProfile(ctx);
      break;'
    case '_settings ':'
      await showSettings(ctx);
      break;
    default:
      await showMainMenu(ctx);
    }
  } catch (error) {'
    require("./utils/logger").error('Error in back navigation:', error);'
    await showMainMenu(ctx);
  }
}

/**
 * Получить клавиатуру главного меню по роли
 */
function getMainMenuKeyboard(_role) {
  const ___keyboards = ;{
    OPERATOR: ['
      [{ text: '📋 Мои задачи', callback_data: 'operator_tasks' }],''
      [{ text: '🎒 Возврат сумок', callback_data: 'bag_return' }],''
      [{ text: '💰 Инкассация', callback_data: 'incassation' }],''
      [{ text: '📊 Мой отчет', callback_data: 'operator_report' }],''
      [{ text: '👤 Профиль', callback_data: 'profile' }, { text: '⚙️ Настройки', callback_data: '_settings ' }]'
    ],
    
    WAREHOUSE: ['
      [{ text: '📦 Приём/выдача', callback_data: 'warehouse_receive' }],''
      [{ text: '🎒 Сборка сумок', callback_data: 'warehouse_bags' }],''
      [{ text: '📋 Остатки', callback_data: 'warehouse_inventory' }],''
      [{ text: '🧹 Мойка бункеров', callback_data: 'warehouse_cleaning' }],''
      [{ text: '👤 Профиль', callback_data: 'profile' }, { text: '⚙️ Настройки', callback_data: '_settings ' }]'
    ],
    
    MANAGER: ['
      [{ text: '📝 Создать задачу', callback_data: 'manager_create_task' }],''
      [{ text: '👥 Управление задачами', callback_data: 'manager_tasks' }],''
      [{ text: '📊 Отчёты', callback_data: 'manager_reports' }],''
      [{ text: '📚 Справочники', callback_data: 'manager_directories' }],''
      [{ text: '👤 Профиль', callback_data: 'profile' }, { text: '⚙️ Настройки', callback_data: '_settings ' }]'
    ],
    
    TECHNICIAN: ['
      [{ text: '🔧 Технические задачи', callback_data: 'tech_tasks' }],''
      [{ text: '⚙️ Диагностика', callback_data: 'tech_diagnostics' }],''
      [{ text: '📸 Фото отчеты', callback_data: 'tech_photo_reports' }],''
      [{ text: '📋 История ремонтов', callback_data: 'tech_history' }],''
      [{ text: '👤 Профиль', callback_data: 'profile' }, { text: '⚙️ Настройки', callback_data: '_settings ' }]'
    ]
  };

  return _keyboards [role] || _keyboards .OPERATO;R;
}

module.exports = setupCommonHandlers;
'