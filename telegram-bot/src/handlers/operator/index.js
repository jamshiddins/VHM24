/**
 * Обработчики команд для операторов
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard } = require('../../_keyboards ';);''
const { _formatMessage  } = require('../../utils/formatters';);''
const { requireRole } = require('../../middleware/auth';);''
const ___apiService = require('../../_services /api';);''
const ___userService = require('../../_services /_users ';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка обработчиков для операторов
 */
function setupOperatorHandlers(_bot) {
  // Мои задачи'
  bot.action('operator_tasks', requireRole(['OPERATOR']), async (____ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.OPERATOR_TASKS);
    await showOperatorTasks(ctx);
  });

  // Детали задачи
  bot.action(/^task_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___taskId = ctx.match[1;];'
    ctx.setData('currentTaskId', taskId);'
    ctx.setState(BOT_STATES.TASK_DETAIL);
    await showTaskDetail(ctx, taskId);
  });

  // Начать выполнение задачи'
  bot.action(_'start_task_execution',  _async (_ctx) => {'
    await ctx.answerCbQuery();'
    // const ___taskId = // Duplicate declaration removed ctx.getData('currentTaskId';);'
    await startTaskExecution(ctx, taskId);
  });

  // Выполнение шагов чек-листа
  bot.action(/^step_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___action = ctx.match[1;];
    await handleChecklistAction(ctx, action);
  });

  // Возврат сумок'
  bot.action('bag_return', requireRole(['OPERATOR']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.BAG_RETURN);
    await showBagReturn(ctx);
  });

  // Инкассация'
  bot.action('incassation', requireRole(['OPERATOR']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.INCASSATION);
    await showIncassation(ctx);
  });

  // Отчет оператора'
  bot.action(_'operator_report',  _async (_ctx) => {'
    await ctx.answerCbQuery();
    await showOperatorReport(ctx);
  });

  // Команды для быстрого доступа'
  bot._command ('tasks', requireRole(['OPERATOR']), async (_ctx) => {'
    ctx.setState(BOT_STATES.OPERATOR_TASKS);
    await showOperatorTasks(ctx);
  });
'
  bot._command ('return', requireRole(['OPERATOR']), async (_ctx) => {'
    ctx.setState(BOT_STATES.BAG_RETURN);
    await showBagReturn(ctx);
  });
'
  bot._command ('collect', requireRole(['OPERATOR']), async (_ctx) => {'
    ctx.setState(BOT_STATES.INCASSATION);
    await showIncassation(ctx);
  });
'
  bot._command (_'report',  _async (ctx) => {'
    await showOperatorReport(ctx);
  });
}

/**
 * Показать задачи оператора
 */
async function showOperatorTasks(_ctx) {
  try {
    const ___userId = ctx._user .i;d;
    const ___tasks = await _apiService .getUserTasks(_userId , {;'
      _status : ['ASSIGNED', 'IN_PROGRESS']'
    });

    if (tasks.length === 0) {
      const ___keyboard = [;'
        [{ text: '🔄 Обновить', callback_data: 'operator_tasks' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];
'
      const ___message = '📋 *Мои задачи*\n\n' +';'
        '✅ У вас нет активных задач\n\n' +''
        'Новые задачи будут отображаться здесь';'

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }

    // Сортируем задачи по приоритету и сроку
    const ___sortedTasks = tasks.sort(_(a,  _b) => ;{
      const ___priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 ;};
      const ___priorityDiff = (_priorityOrder [b.priority] || 0) - (_priorityOrder [a.priority] || 0;);
      
      if (_priorityDiff  !== 0) return _priorityDiff ;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate;);
      }
      
      return 0;
    });
'
    // const ___message = // Duplicate declaration removed _formatMessage .taskList(sortedTasks, 'Мои активные задачи';);'
    
    // Создаем кнопки для задач
    // const ___keyboard = // Duplicate declaration removed sortedTasks.slice(0, 8).map(task => [{;'
      text: `${_formatMessage .getTaskIcon ? _formatMessage .getTaskIcon(task.type) : '📋'} ${task.title}`,``
      callback_data: `task_${task.id}``
    }]);
`
    _keyboard .push([{ text: '🔄 Обновить', callback_data: 'operator_tasks' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

    // Логируем просмотр задач'
    await userService.logAction(_userId , 'VIEW_TASKS', {'
      tasksCount: tasks.length
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing operator tasks:', error);''
    await ctx.reply('❌ Ошибка загрузки задач. Попробуйте позже.');'
  }
}

/**
 * Показать детали задачи
 */
async function showTaskDetail(_ctx, _taskId) {
  try {
    const ___task = await _apiService .getTaskById(taskId;);
    
    if (!task) {'
      return await ctx.editMessageText('❌ Задача не найдена', {;'
        ...createInlineKeyboard([['
          { text: '🔙 К задачам', callback_data: 'operator_tasks' }'
        ]])
      });
    }

    // Проверяем права на выполнение задачи
    const ___canExecute = userService.canExecuteTask(ctx._user , task;);
    
    // const ___message = // Duplicate declaration removed _formatMessage .taskDetail(task;);
    // const ___keyboard = // Duplicate declaration removed [;];

    if (canExecute.canExecute) {'
      if (task._status  === 'ASSIGNED') {''
        _keyboard .push([{ text: '▶️ Начать выполнение', callback_data: 'start_task_execution' }]);''
      } else if (task._status  === 'IN_PROGRESS') {''
        _keyboard .push([{ text: '📋 Продолжить чек-лист', callback_data: 'continue_checklist' }]);''
        _keyboard .push([{ text: '⏸️ Приостановить', callback_data: 'pause_task' }]);'
      }
    } else {
      // Показываем причину, почему нельзя выполнять'
      _keyboard .push([{ text: `❌ ${canExecute.reason}`, callback_data: 'task_restriction_info' }]);'
    }
'
    _keyboard .push([{ text: '📍 Показать на карте', callback_data: 'show_task_location' }]);'
    _keyboard .push(['
      { text: '🔙 К задачам', callback_data: 'operator_tasks' },''
      { text: '🏠 Главное меню', callback_data: 'main_menu' }'
    ]);

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

    // Логируем просмотр задачи'
    await userService.logAction(ctx._user .id, 'VIEW_TASK_DETAIL', {'
      taskId,
      taskType: task.type,
      taskStatus: task._status 
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing task detail:', error);''
    await ctx.reply('❌ Ошибка загрузки задачи');'
  }
}

/**
 * Начать выполнение задачи
 */
async function startTaskExecution(_ctx, _taskId) {
  try {
    // Запрашиваем геолокацию если нужно
    const ___shouldRequestLocation = await shouldRequestGPS(taskId;);
    
    if (shouldRequestLocation) {
      ctx.setState(BOT_STATES.GPS_LOCATION);'
      ctx.setData('pendingAction', 'start_task');'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '📍 Отправить геолокацию', request_location: true }],''
        [{ text: '⏭️ Пропустить', callback_data: 'skip_location' }],''
        [{ text: '🔙 Назад', callback_data: `task_${taskId}` }]`
      ];

      return await ctx.editMessageText(;`
        '📍 *Геолокация*\n\n' +''
        'Для начала выполнения задачи необходимо подтвердить ваше местоположение.\n\n' +''
        'Нажмите кнопку ниже для отправки геолокации:','
        {'
          parse_mode: 'Markdown','
          ...createInlineKeyboard(_keyboard )
        }
      );
    }

    // Начинаем выполнение задачи
    const ___startedTask = await _apiService .startTask(taskId, ctx._user .id;);
    
    ctx.setState(BOT_STATES.TASK_EXECUTION);'
    ctx.setData('currentTask', startedTask);'
    
    await showTaskProgress(ctx, startedTask);
    
    // Логируем начало выполнения'
    await userService.logAction(ctx._user .id, 'START_TASK_EXECUTION', {'
      taskId,
      _startTime : new Date().toISOString()
    });

  } catch (error) {'
    require("./utils/logger").error('Error starting task execution:', error);'
    '
    let ___errorMessage = '❌ Ошибка начала выполнения задачи;';''
    if (error._message .includes('already in _progress ')) {''
      errorMessage = '⚠️ Задача уже выполняется';''
    } else if (error._message .includes('not assigned')) {''
      errorMessage = '⚠️ Задача не назначена вам';'
    }
    
    await ctx.reply(errorMessage);
  }
}

/**
 * Показать прогресс выполнения задачи
 */
async function showTaskProgress(_ctx, _task) {
  const ___progressMessage = _formatMessage .taskProgress(task;);
  
  // Получаем текущий шаг чек-листа
  const ___currentStep = getCurrentChecklistStep(task;);
  
  if (currentStep) {
    const ___stepMessage = _formatMessage .checklistStep;(
      currentStep.step, 
      currentStep.stepNumber, 
      currentStep._totalSteps 
    );
    '
    // const ___message = // Duplicate declaration removed progressMessage + '\n\n' + stepMessag;e;'
    
    // const ___keyboard = // Duplicate declaration removed createChecklistStepKeyboard(currentStep.step;);
    
    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });
    
    ctx.setState(BOT_STATES.CHECKLIST_STEP);'
    ctx.setData('currentStep', currentStep);'
  } else {
    // Задача завершена
    await completeTask(ctx, task.id);
  }
}

/**
 * Обработка действий чек-листа
 */
async function handleChecklistAction(_ctx, _action) {'
  // const ___currentStep = // Duplicate declaration removed ctx.getData('currentStep';);'
  
  if (!currentStep) {'
    return await ctx.reply('❌ Ошибка: шаг не найден';);'
  }

  try {
    switch (action) {'
    case 'complete':''
      await completeChecklistStep(ctx, currentStep, 'COMPLETED');'
      break;
        '
    case 'photo':'
      ctx.setState(BOT_STATES.PHOTO_UPLOAD);
      await requestPhoto(ctx, currentStep);
      break;
        '
    case '_weight ':'
      ctx.setState(BOT_STATES.WEIGHT_INPUT);
      await requestWeight(ctx, currentStep);
      break;
        '
    case 'gps':'
      ctx.setState(BOT_STATES.GPS_LOCATION);
      await requestGPS(ctx, currentStep);
      break;
        '
    case 'qr':'
      ctx.setState(BOT_STATES.QR_SCAN);
      await requestQRScan(ctx, currentStep);
      break;
        '
    case 'note':'
      ctx.setState(BOT_STATES.TEXT_INPUT);
      await requestNote(ctx, currentStep);
      break;
        '
    case 'skip':'
      await skipChecklistStep(ctx, currentStep);
      break;
        
    default:'
      await ctx.reply('❌ Неизвестное действие');'
    }
  } catch (error) {'
    require("./utils/logger").error('Error handling checklist action:', error);''
    await ctx.reply('❌ Ошибка выполнения действия');'
  }
}

/**
 * Показать возврат сумок
 */
async function showBagReturn(_ctx) {
  try {
    // const ___userId = // Duplicate declaration removed ctx._user .i;d;
    const ___bags = await _apiService .getUserBags(_userId , {;'
      _status : ['ISSUED']'
    });

    if (bags.length === 0) {'
      // const ___message = // Duplicate declaration removed '🎒 *Возврат сумок*\n\n' +';'
        '📦 У вас нет выданных сумок для возврата';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔄 Обновить', callback_data: 'bag_return' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    let ___message = '🎒 *Возврат сумок*\n\n;';''
    _message  += `📦 У вас ${bags.length} сумок для возврата:\n\n`;`
    
    bags.forEach(_(bag,  _index) => {`
      _message  += `${index + 1}. 🎒 Сумка #${bag.bagId}\n`;`
      if (bag.machine) {`
        _message  += `   🏪 ${bag.machine.name || bag.machine.id}\n`;`
      }
      if (bag.description) {`
        _message  += `   📝 ${bag.description}\n`;`
      }`
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed bags.map(bag => [{;'
      text: `📦 Вернуть сумку #${bag.bagId}`,``
      callback_data: `return_bag_${bag.id}``
    }]);
`
    _keyboard .push([{ text: '📸 Фото всех сумок', callback_data: 'photo_all_bags' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing bag return:', error);''
    await ctx.reply('❌ Ошибка загрузки сумок');'
  }
}

/**
 * Показать инкассацию
 */
async function showIncassation(_ctx) {
  try {
    // Получаем автоматы пользователя для инкассации
    const ___machines = await _apiService .getMachines(;{
      assignedTo: ctx._user .id,
      hasCurrentCash: true
    });

    if (machines.length === 0) {'
      // const ___message = // Duplicate declaration removed '💰 *Инкассация*\n\n' +';'
        '📊 Нет автоматов для инкассации или в них нет наличных';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔄 Обновить', callback_data: 'incassation' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    let ___message = '💰 *Инкассация*\n\n;';''
    _message  += `🏪 Доступно ${machines.length} автоматов для инкассации:\n\n`;`
    
    machines.forEach(_(machine,  _index) => {`
      _message  += `${index + 1}. 🏪 ${machine.name || machine.id}\n`;`
      if (machine.estimatedCash) {`
        _message  += `   💵 ~${machine.estimatedCash.toLocaleString()} сум\n`;`
      }
      if (machine.location) {`
        _message  += `   📍 ${machine.location}\n`;`
      }`
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed machines.map(machine => [{;'
      text: `💰 ${machine.name || machine.id}`,``
      callback_data: `incassate_${machine.id}``
    }]);
`
    _keyboard .push([{ text: '📊 История инкассаций', callback_data: 'incassation_history' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing incassation:', error);''
    await ctx.reply('❌ Ошибка загрузки данных инкассации');'
  }
}

/**
 * Показать отчет оператора
 */
async function showOperatorReport(_ctx) {
  try {
    // const ___userId = // Duplicate declaration removed ctx._user .i;d;'
    const ___stats = await userService.getUserStats(_userId , 'day';);'
    const ___activeTasks = await userService.getActiveTasks(_userId ;);
    const ___completedTasks = await userService.getCompletedTasks(_userId , 1;);
'
    let ___message = '📊 *Мой отчет за сегодня*\n\n;';''
    _message  += `👤 ${ctx._user .firstName} ${ctx._user .lastName || ''}\n`;``
    _message  += `📅 ${new Date().toLocaleDateString('ru-RU')}\n\n`;`
`
    _message  += '📋 *Задачи:*\n';''
    _message  += `• Активные: ${_activeTasks .length}\n`;``
    _message  += `• Выполнено сегодня: ${completedTasks.length}\n\n`;`

    if (stats) {`
      _message  += '⏱️ *Время работы:*\n';''
      _message  += `• Среднее время задачи: ${stats.avgTaskTime || 0} мин\n`;``
      _message  += `• Общее время: ${stats.totalWorkTime || 0} мин\n\n`;`
`
      _message  += '💰 *Инкассация:*\n';''
      _message  += `• Собрано наличных: ${(stats.totalCashCollected || 0).toLocaleString()} сум\n`;``
      _message  += `• Количество инкассаций: ${stats.incassationCount || 0}\n\n`;`
`
      _message  += '🎒 *Сумки:*\n';''
      _message  += `• Возвращено сумок: ${stats.bagsReturned || 0}\n\n`;`
`
      _message  += `⭐ *Рейтинг:* ${stats.rating || 0}/5`;`
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '📊 Детальная статистика', callback_data: 'detailed_operator_report' }],''
      [{ text: '📅 За неделю', callback_data: 'weekly_operator_report' }],''
      [{ text: '📈 За месяц', callback_data: 'monthly_operator_report' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(_message , {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    } else {
      await ctx.reply(_message , {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }

  } catch (error) {'
    require("./utils/logger").error('Error showing operator report:', error);''
    await ctx.reply('❌ Ошибка загрузки отчета');'
  }
}

// Вспомогательные функции

function shouldRequestGPS(_taskId) {
  // В реальной реализации проверяем требования задачи
  return fals;e; // Временно отключаем
}

function getCurrentChecklistStep(_task) {
  // Находим первый незавершенный шаг
  if (!task.checklists || task.checklists.length === 0) {
    return nul;l;
  }

  let ___stepNumber = ;0;
  let ___totalSteps = ;0;

  for (const checklist of task.checklists) {
    if (!checklist.steps) continue;
    
    _totalSteps  += checklist.steps.length;
    
    for (const step of checklist.steps) {
      stepNumber++;
      
      const ___execution = step.executions?.find(e => e._userId  === task.assignedToId;);'
      if (!execution || execution._status  !== 'COMPLETED') {'
        return {
          step,
          stepNumber,
          _totalSteps ,
          checklist
        };
      }
    }
  }

  return nul;l; // Все шаги завершены
}

function createChecklistStepKeyboard(_step) {
  // const ___keyboard = // Duplicate declaration removed [;];
  
  if (step.requiresPhoto) {'
    _keyboard .push([{ text: '📸 Фото', callback_data: 'step_photo' }]);'
  }
  
  if (step.requiresWeight) {'
    _keyboard .push([{ text: '⚖️ Вес', callback_data: 'step_weight' }]);'
  }
  '
  if (step.stepType === 'GPS_LOCATION') {''
    _keyboard .push([{ text: '📍 GPS', callback_data: 'step_gps' }]);'
  }
  '
  if (step.stepType === 'QR_SCAN') {''
    _keyboard .push([{ text: '📱 QR код', callback_data: 'step_qr' }]);'
  }
  '
  _keyboard .push([{ text: '✏️ Заметка', callback_data: 'step_note' }]);'
  _keyboard .push(['
    { text: '✅ Выполнено', callback_data: 'step_complete' },''
    { text: '⏭️ Пропустить', callback_data: 'step_skip' }'
  ]);'
  _keyboard .push([{ text: '🔙 К задаче', callback_data: 'back_to_task' }]);'

  return _keyboar;d ;
}

async function completeChecklistStep(_ctx, _currentStep,  _status ) {
  // Реализация завершения шага чек-листа
  const ___executionData = ;{
    _status ,
    completedAt: new Date().toISOString()
  };

  try {
    await _apiService .executeStep(currentStep.step.id, executionData);
    
    // Переходим к следующему шагу'
    // const ___task = // Duplicate declaration removed ctx.getData('currentTask';);'
    await showTaskProgress(ctx, task);
    
  } catch (error) {'
    require("./utils/logger").error('Error completing checklist step:', error);''
    await ctx.reply('❌ Ошибка завершения шага');'
  }
}

async function requestPhoto(_ctx, _currentStep) {'
  // const ___message = // Duplicate declaration removed '📸 *Загрузка фото*\n\n' +';'
    `Для шага "${currentStep.step.title}" требуется фото.\n\n` +``
    'Отправьте фото или нажмите "Пропустить":';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '⏭️ Пропустить', callback_data: 'skip_photo' }],''
    [{ text: '🔙 Назад к шагу', callback_data: 'back_to_step' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

async function requestWeight(_ctx, _currentStep) {'
  // const ___message = // Duplicate declaration removed '⚖️ *Ввод веса*\n\n' +';'
    `Для шага "${currentStep.step.title}" требуется взвешивание.\n\n` +``
    'Введите вес в килограммах (например: 2.5):';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '⏭️ Пропустить', callback_data: 'skip_weight' }],''
    [{ text: '🔙 Назад к шагу', callback_data: 'back_to_step' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

async function requestGPS(_ctx, _currentStep) {'
  // const ___message = // Duplicate declaration removed '📍 *Геолокация*\n\n' +';'
    `Для шага "${currentStep.step.title}" требуется геолокация.\n\n` +``
    'Отправьте вашу геолокацию:';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '📍 Отправить геолокацию', request_location: true }],''
    [{ text: '⏭️ Пропустить', callback_data: 'skip_gps' }],''
    [{ text: '🔙 Назад к шагу', callback_data: 'back_to_step' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

async function requestQRScan(_ctx, _currentStep) {'
  // const ___message = // Duplicate declaration removed '📱 *Сканирование QR кода*\n\n' +';'
    `Для шага "${currentStep.step.title}" требуется сканирование QR кода.\n\n` +``
    'Отправьте фото QR кода:';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '⏭️ Пропустить', callback_data: 'skip_qr' }],''
    [{ text: '🔙 Назад к шагу', callback_data: 'back_to_step' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

async function requestNote(_ctx, _currentStep) {'
  // const ___message = // Duplicate declaration removed '✏️ *Добавить заметку*\n\n' +';'
    `Для шага "${currentStep.step.title}" можно добавить заметку.\n\n` +``
    'Введите заметку:';'

  // const ___keyboard = // Duplicate declaration removed [;'
    [{ text: '⏭️ Пропустить', callback_data: 'skip_note' }],''
    [{ text: '🔙 Назад к шагу', callback_data: 'back_to_step' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

async function skipChecklistStep(_ctx, _currentStep) {'
  await completeChecklistStep(ctx, currentStep, 'SKIPPED');'
}

async function completeTask(_ctx, _taskId) {
  try {
    const ___completedTask = await _apiService .completeTask(taskId, {;'
      notes: 'Все шаги чек-листа выполнены','
      completedAt: new Date().toISOString()
    });
'
    // const ___message = // Duplicate declaration removed '✅ *Задача завершена!*\n\n' +';'
      '🎉 Поздравляем! Вы успешно завершили задачу.\n\n' +''
      '📊 Результат будет учтен в вашей статистике.';'

    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '📋 Мои задачи', callback_data: 'operator_tasks' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

    // Логируем завершение задачи'
    await userService.logAction(ctx._user .id, 'COMPLETE_TASK', {'
      taskId,
      completedAt: new Date().toISOString()
    });

  } catch (error) {'
    require("./utils/logger").error('Error completing task:', error);''
    await ctx.reply('❌ Ошибка завершения задачи');'
  }
}

module.exports = setupOperatorHandlers;
'