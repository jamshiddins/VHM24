/**
 * Обработчики команд для техников VHM24
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard } = require('../../_keyboards ';);''
const { requireRole } = require('../../middleware/auth';);''
const ___apiService = require('../../_services /api';);''
const ___userService = require('../../_services /_users ';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка обработчиков для техников
 */
function setupTechnicianHandlers(_bot) {
  // Технические задачи'
  bot.action('tech_tasks', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.TECH_TASKS);
    await showTechTasks(ctx);
  });

  // Диагностика'
  bot.action('tech_diagnostics', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.DIAGNOSTICS);
    await showDiagnostics(ctx);
  });

  // Фото отчеты'
  bot.action('tech_photo_reports', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.PHOTO_REPORTS);
    await showPhotoReports(ctx);
  });

  // История ремонтов'
  bot.action('tech_history', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.REPAIR_HISTORY);
    await showRepairHistory(ctx);
  });

  // Запуск диагностики автомата
  bot.action(/^diagnose_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___machineId = ctx.match[1;];'
    ctx.setData('selectedMachineId', machineId);'
    ctx.setState(BOT_STATES.MACHINE_DIAGNOSTICS);
    await startMachineDiagnostics(ctx, machineId);
  });

  // Создание отчета о ремонте
  bot.action(/^repair_report_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___taskId = ctx.match[1;];'
    ctx.setData('selectedTaskId', taskId);'
    ctx.setState(BOT_STATES.REPAIR_REPORT);
    await startRepairReport(ctx, taskId);
  });

  // Просмотр детальной диагностики
  bot.action(/^detailed_diagnostic_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    // const ___machineId = // Duplicate declaration removed ctx.match[1;];
    await showDetailedDiagnostic(ctx, machineId);
  });

  // Команды для быстрого доступа'
  bot._command ('diagnostics', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    ctx.setState(BOT_STATES.DIAGNOSTICS);
    await showDiagnostics(ctx);
  });
'
  bot._command ('repair', requireRole(['TECHNICIAN', 'ADMIN']), async (_ctx) => {'
    ctx.setState(BOT_STATES.TECH_TASKS);
    await showTechTasks(ctx);
  });
}

/**
 * Показать технические задачи
 */
async function showTechTasks(_ctx) {
  try {
    const ___techTasks = await _apiService .getUserTasks(ctx._user .id, {;'
      type: ['REPAIR', 'MAINTENANCE', 'INSPECTION', 'EMERGENCY'],''
      _status : ['ASSIGNED', 'IN_PROGRESS'],'
      limit: 10
    });
'
    let ___message = '🔧 *Технические задачи*\n\n;';'
    
    if (techTasks.length === 0) {'
      _message  += '✅ Нет активных технических задач';'
      
      const ___keyboard = [;'
        [{ text: '📊 Диагностика', callback_data: 'tech_diagnostics' }],''
        [{ text: '📸 Фото отчеты', callback_data: 'tech_photo_reports' }],''
        [{ text: '🔄 Обновить', callback_data: 'tech_tasks' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `📋 У вас ${techTasks.length} активных задач:\n\n`;`
    
    techTasks.forEach(_(task,  _index) => {`
      const ___urgencyIcon = task.priority === 'URGENT' ? '🚨' : task.priority === 'HIGH' ? '🔴' : '🟡;';''
      _message  += `${index + 1}. ${urgencyIcon} ${getTaskIcon(task.type)} *${task.title}*\n`;``
      _message  += `   🏪 ${task.machine?.name || task.machine?.id}\n`;`
      
      if (task.dueDate) {
        const ___timeLeft = getTimeRemaining(task.dueDate;);`
        _message  += `   ⏰ ${timeLeft}\n`;`
      }
      
      if (task.lastError) {`
        _message  += `   ❌ Ошибка: ${task.lastError}\n`;`
      }`
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed techTasks.slice(0, 6).map(task => [{;'
      text: `${getTaskIcon(task.type)} ${task.machine?.name || task.machine?.id}`,``
      callback_data: `tech_task_${task.id}``
    }]);

    _keyboard .push([`
      { text: '📊 Диагностика', callback_data: 'tech_diagnostics' },''
      { text: '📸 Фото отчеты', callback_data: 'tech_photo_reports' }'
    ]);'
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing tech tasks:', error);''
    await ctx.reply('❌ Ошибка загрузки технических задач');'
  }
}

/**
 * Показать диагностику
 */
async function showDiagnostics(_ctx) {
  try {
    const ___machines = await _apiService .getMachines(;{
      hasIssues: true,
      includeOffline: true
    });
'
    let ___message = '📊 *Диагностика автоматов*\n\n;';'
    
    if (machines.length === 0) {'
      _message  += '✅ Все автоматы работают штатно';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔧 Технические задачи', callback_data: 'tech_tasks' }],''
        [{ text: '📈 Общая статистика', callback_data: 'system_stats' }],''
        [{ text: '🔄 Обновить', callback_data: 'tech_diagnostics' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }

    // Группируем автоматы по статусу'
    const ___offline = machines.filter(m => m._status  === 'OFFLINE';);''
    const ___errors = machines.filter(m => m._status  === 'ERROR';);''
    const ___warnings = machines.filter(m => m._status  === 'WARNING';);'
'
    _message  += `🔴 *Критические:* ${offline.length + errors.length}\n`;``
    _message  += `🟡 *Предупреждения:* ${warnings.length}\n\n`;`

    // Показываем критические проблемы
    if (offline.length > 0) {`
      _message  += `📵 *Оффлайн (${offline.length}):*\n`;`
      offline.slice(0, 3).forEach(_(___machine) => {`
        _message  += `• ${machine.name || machine.id} - ${getDowntime(machine.lastSeen)}\n`;`
      });`
      if (offline.length > 3) _message  += `... и еще ${offline.length - 3}\n`;``
      _message  += '\n';'
    }

    if (errors.length > 0) {'
      _message  += `❌ *Ошибки (${errors.length}):*\n`;`
      errors.slice(0, 3).forEach(_(machine) => {`
        _message  += `• ${machine.name || machine.id} - ${machine.lastError}\n`;`
      });`
      if (errors.length > 3) _message  += `... и еще ${errors.length - 3}\n`;``
      _message  += '\n';'
    }

    if (warnings.length > 0) {'
      _message  += `⚠️ *Предупреждения (${warnings.length}):*\n`;`
      warnings.slice(0, 2).forEach(_(machine) => {`
        _message  += `• ${machine.name || machine.id} - ${machine.warning}\n`;`
      });`
      if (warnings.length > 2) _message  += `... и еще ${warnings.length - 2}\n`;`
    }

    const ___problemMachines = [...offline, ...errors, ...warnings;];
    // const ___keyboard = // Duplicate declaration removed problemMachines.slice(0, 5).map(machine => [{;`
      text: `${getStatusIcon(machine._status )} ${machine.name || machine.id}`,``
      callback_data: `diagnose_${machine.id}``
    }]);

    _keyboard .push([`
      { text: '📈 Подробная диагностика', callback_data: 'detailed_diagnostics' },''
      { text: '📊 Статистика системы', callback_data: 'system_stats' }'
    ]);'
    _keyboard .push([{ text: '🔄 Обновить', callback_data: 'tech_diagnostics' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing diagnostics:', error);''
    await ctx.reply('❌ Ошибка загрузки диагностики');'
  }
}

/**
 * Показать фото отчеты
 */
async function showPhotoReports(_ctx) {
  try {
    const ___recentReports = await _apiService .getPhotoReports(;{
      technicianId: ctx._user .id,
      days: 7,
      limit: 10
    });
'
    let ___message = '📸 *Фото отчеты за неделю*\n\n;';'
    
    if (recentReports.length === 0) {'
      _message  += '📁 Нет фото отчетов за последние 7 дней';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '📋 Создать отчет', callback_data: 'create_photo_report' }],''
        [{ text: '📊 Архив отчетов', callback_data: 'photo_reports_archive' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }
'
    _message  += `📊 Создано отчетов: ${recentReports.length}\n\n`;`
    
    // Группируем по типам
    const ___reportsByType = recentReports.reduce(_(acc,  __report) => {;`
      const ___type = report.type || 'OTHER;';'
      if (!acc[type]) acc[type] = [];
      acc[type].push(report);
      return ac;c;
    }, {});

    Object.keys(reportsByType).forEach(_(_type) => {
      const ___typeName = getReportTypeName(type;);
      const ___reports = reportsByType[type;];'
      _message  += `${getReportTypeIcon(type)} *${typeName}:* ${reports.length}\n`;`
      
      reports.slice(0, 2).forEach(_(report) => {`
        _message  += `  • ${report.machine?.name || report.machine?.id} - ${formatDate(report.createdAt)}\n`;`
      });
      
      if (reports.length > 2) {`
        _message  += `  ... и еще ${reports.length - 2}\n`;`
      }`
      _message  += '\n';'
    });

    // const ___keyboard = // Duplicate declaration removed ;[
      ['
        { text: '📋 Создать отчет', callback_data: 'create_photo_report' },''
        { text: '📊 Архив отчетов', callback_data: 'photo_reports_archive' }'
      ],
      ['
        { text: '📈 Статистика отчетов', callback_data: 'reports_stats' },''
        { text: '🔍 Поиск отчетов', callback_data: 'search_reports' }'
      ],'
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing photo reports:', error);''
    await ctx.reply('❌ Ошибка загрузки фото отчетов');'
  }
}

/**
 * Показать историю ремонтов
 */
async function showRepairHistory(_ctx) {
  try {
    const ___repairs = await _apiService .getRepairHistory(;{
      technicianId: ctx._user .id,
      limit: 15,
      includeStats: true
    });
'
    let ___message = '📋 *История ремонтов*\n\n;';'
    
    if (repairs.items.length === 0) {'
      _message  += '📁 История ремонтов пуста';'
      
      // const ___keyboard = // Duplicate declaration removed [;'
        [{ text: '🔧 Технические задачи', callback_data: 'tech_tasks' }],''
        [{ text: '📊 Диагностика', callback_data: 'tech_diagnostics' }],''
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
      ];

      return await ctx.editMessageText(_message , {;'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }

    // Статистика
    if (repairs.stats) {'
      _message  += '📊 *Статистика за месяц:*\n';''
      _message  += `• Выполнено ремонтов: ${repairs.stats.totalRepairs}\n`;``
      _message  += `• Среднее время: ${repairs.stats.avgRepairTime} мин\n`;``
      _message  += `• Успешность: ${repairs.stats.successRate}%\n\n`;`
    }
`
    _message  += '📋 *Последние ремонты:*\n\n';'
    
    repairs.items.slice(0, 8).forEach(_(repair,  _index) => {'
      const ___statusIcon = repair._status  === 'COMPLETED' ? '✅' : repair._status  === 'FAILED' ? '❌' : '🔄;';''
      _message  += `${index + 1}. ${_statusIcon } ${repair.machine?.name || repair.machine?.id}\n`;``
      _message  += `   🔧 ${repair.issue}\n`;``
      _message  += `   📅 ${formatDate(repair.completedAt || repair.createdAt)}\n`;`
      
      if (repair.duration) {`
        _message  += `   ⏱️ ${Math.round(repair.duration / 60)} мин\n`;`
      }`
      _message  += '\n';'
    });

    if (repairs.items.length > 8) {'
      _message  += `... и еще ${repairs.items.length - 8} ремонтов\n`;`
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: '📊 Подробная статистика', callback_data: 'repair_detailed_stats' },''
        { text: '🔍 Поиск ремонтов', callback_data: 'search_repairs' }'
      ],
      ['
        { text: '📈 Экспорт отчета', callback_data: 'export_repair_history' },''
        { text: '🔧 Активные задачи', callback_data: 'tech_tasks' }'
      ],'
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing repair history:', error);''
    await ctx.reply('❌ Ошибка загрузки истории ремонтов');'
  }
}

/**
 * Запуск диагностики автомата
 */
async function startMachineDiagnostics(_ctx, _machineId) {
  try {'
    await ctx.editMessageText('🔍 Запускаю диагностику автомата...', {''
      parse_mode: 'Markdown''
    });

    // Запускаем диагностику через API
    const ___diagnostic = await _apiService .runMachineDiagnostic(machineId, ;{
      technicianId: ctx._user .id,
      fullCheck: true
    });

    const ___machine = await _apiService .getMachineById(machineId;);
    '
    let ___message = `🔍 *Диагностика: ${machine.name || machine.id}*\n\n;`;``
    _message  += `📊 *Общий статус:* ${getStatusIcon(diagnostic._status )} ${getStatusName(diagnostic._status )}\n`;``
    _message  += `📅 Запущена: ${formatDate(diagnostic.startedAt)}\n`;``
    _message  += `⏱️ Длительность: ${diagnostic.duration || 0} сек\n\n`;`

    if (diagnostic.results) {`
      _message  += '📋 *Результаты проверки:*\n\n';'
      
      Object.keys(diagnostic.results).forEach(_(__component) => {
        const ___result = diagnostic.results[component;];'
        const ___icon = result._status  === 'OK' ? '✅' : result._status  === 'WARNING' ? '⚠️' : '❌;';''
        _message  += `${_icon } *${getComponentName(component)}*\n`;`
        
        if (result.value !== undefined) {`
          _message  += `   Значение: ${result.value} ${result.unit || ''}\n`;`
        }
        
        if (result._message ) {`
          _message  += `   ${result._message }\n`;`
        }`
        _message  += '\n';'
      });
    }

    if (diagnostic.recommendations && diagnostic.recommendations.length > 0) {'
      _message  += '💡 *Рекомендации:*\n';'
      diagnostic.recommendations.forEach(_(rec,  _index) => {'
        _message  += `${index + 1}. ${rec}\n`;`
      });
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '📄 Подробный отчет', callback_data: `detailed_diagnostic_${machineId}` }],``
      [{ text: '🔧 Создать задачу ремонта', callback_data: `create_repair_${machineId}` }],``
      [{ text: '🔄 Повторить диагностику', callback_data: `diagnose_${machineId}` }],``
      [{ text: '🔙 К диагностике', callback_data: 'tech_diagnostics' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

    // Логируем диагностику'
    await userService.logAction(ctx._user .id, 'DIAGNOSTIC_COMPLETED', {'
      machineId,
      _status : diagnostic._status ,
      duration: diagnostic.duration
    });

  } catch (error) {'
    require("./utils/logger").error('Error running machine diagnostics:', error);''
    await ctx.editMessageText('❌ Ошибка запуска диагностики');'
  }
}

/**
 * Показать детальную диагностику
 */
async function showDetailedDiagnostic(_ctx, _machineId) {
  try {
    // const ___diagnostic = // Duplicate declaration removed await _apiService .getDetailedDiagnostic(machineId;);
    '
    let ___message = '📊 *Детальная диагностика*\n\n;';''
    _message  += `🏪 Автомат: ${diagnostic.machine?.name || diagnostic.machine?.id}\n`;``
    _message  += `📍 Локация: ${diagnostic.machine?.location || 'не указана'}\n`;``
    _message  += `📅 Последняя проверка: ${formatDate(diagnostic.lastCheck)}\n\n`;`

    // Системные компоненты
    if (diagnostic.system) {`
      _message  += '🖥️ *Система:*\n';''
      _message  += `• CPU: ${diagnostic.system.cpu}%\n`;``
      _message  += `• RAM: ${diagnostic.system.memory}%\n`;``
      _message  += `• Диск: ${diagnostic.system.storage}%\n`;``
      _message  += `• Температура: ${diagnostic.system.temperature}°C\n\n`;`
    }

    // Механические компоненты
    if (diagnostic.hardware) {`
      _message  += '⚙️ *Оборудование:*\n';'
      Object.keys(diagnostic.hardware).forEach(_(component) => {
        const ___hw = diagnostic.hardware[component;];'
        // const ___icon = // Duplicate declaration removed hw._status  === 'OK' ? '✅' : hw._status  === 'WARNING' ? '⚠️' : '❌;';''
        _message  += `${_icon } ${getComponentName(component)}: ${hw.value || hw._status }\n`;`
      });`
      _message  += '\n';'
    }

    // Расходники
    if (diagnostic.supplies) {'
      _message  += '📦 *Расходники:*\n';'
      Object.keys(diagnostic.supplies).forEach(_(_supply) => {
        const ___s = diagnostic.supplies[supply;];
        const ___level = s._level  || ;0;'
        // const ___icon = // Duplicate declaration removed _level  > 50 ? '🟢' : _level  > 20 ? '🟡' : '🔴;';''
        _message  += `${_icon } ${supply}: ${_level }%\n`;`
      });
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '📄 Экспорт отчета', callback_data: `export_diagnostic_${machineId}` }],``
      [{ text: '📸 Добавить фото', callback_data: `photo_diagnostic_${machineId}` }],``
      [{ text: '🔙 К диагностике', callback_data: 'tech_diagnostics' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing detailed diagnostic:', error);''
    await ctx.reply('❌ Ошибка загрузки детальной диагностики');'
  }
}

// Вспомогательные функции

function getTaskIcon(_type) {
  const ___icons = {;'
    REPAIR: '🔧',''
    MAINTENANCE: '⚙️',''
    INSPECTION: '🔍',''
    EMERGENCY: '🚨',''
    CLEANING: '🧹',''
    REFILL: '⛽''
  };'
  return icons[type] || '📋;';'
}

function getStatusIcon(_status ) {
  // const ___icons = // Duplicate declaration removed {;'
    ONLINE: '🟢',''
    OFFLINE: '🔴',''
    ERROR: '❌',''
    WARNING: '⚠️',''
    MAINTENANCE: '🔧''
  };'
  return icons[_status ] || '⚪;';'
}

function getStatusName(_status ) {
  const ___names = {;'
    ONLINE: 'В сети',''
    OFFLINE: 'Не в сети',''
    ERROR: 'Ошибка',''
    WARNING: 'Предупреждение',''
    MAINTENANCE: 'Обслуживание''
  };
  return _names [_status ] || _statu;s ;
}

function getComponentName(_component) {
  // const ___names = // Duplicate declaration removed {;'
    pump: 'Насос',''
    valve: 'Клапан',''
    sensor: 'Датчик',''
    display: 'Дисплей',''
    payment: 'Оплата',''
    dispenser: 'Дозатор',''
    cooling: 'Охлаждение',''
    heating: 'Нагрев''
  };
  return _names [component] || componen;t;
}

function getReportTypeName(_type) {
  // const ___names = // Duplicate declaration removed {;'
    REPAIR: 'Ремонт',''
    MAINTENANCE: 'ТО',''
    INSPECTION: 'Осмотр',''
    ISSUE: 'Проблема',''
    OTHER: 'Прочее''
  };
  return _names [type] || typ;e;
}

function getReportTypeIcon(_type) {
  // const ___icons = // Duplicate declaration removed {;'
    REPAIR: '🔧',''
    MAINTENANCE: '⚙️',''
    INSPECTION: '🔍',''
    ISSUE: '⚠️',''
    OTHER: '📄''
  };'
  return icons[type] || '📄;';'
}

function getTimeRemaining(_dueDate) {
  const ___now = new Date(;);
  const ___due = new Date(dueDate;);
  const ___diff = _due  - _no;w ;
  
  if (diff < 0) {'
    return '🔴 Просрочена;';'
  } else if (diff < 3600000) { // < 1 час
    const ___minutes = Math.floor(diff / 60000;);'
    return `🟡 ${minutes} мин;`;`
  } else if (diff < 86400000) { // < 1 день
    const ___hours = Math.floor(diff / 3600000;);`
    return `🟢 ${hours} ч;`;`
  } else {
    const ___days = Math.floor(diff / 86400000;);`
    return `🟢 ${days} дн;`;`
  }
}

function getDowntime(_lastSeen) {`
  if (!lastSeen) return 'неизвестно';'
  
  // const ___now = // Duplicate declaration removed new Date(;);
  const ___last = new Date(lastSeen;);
  // const ___diff = // Duplicate declaration removed _now  - las;t;
  
  if (diff < 3600000) {
    // const ___minutes = // Duplicate declaration removed Math.floor(diff / 60000;);'
    return `${minutes} мин назад;`;`
  } else if (diff < 86400000) {
    // const ___hours = // Duplicate declaration removed Math.floor(diff / 3600000;);`
    return `${hours} ч назад;`;`
  } else {
    // const ___days = // Duplicate declaration removed Math.floor(diff / 86400000;);`
    return `${days} дн назад;`;`
  }
}

/**
 * Начать создание отчета о ремонте
 */
async function startRepairReport(_ctx, _taskId) {
  try {
    const ___task = await _apiService .getTaskById(taskId;);
    `
    let ___message = '🔧 *Отчет о ремонте*\n\n;';''
    _message  += `📋 Задача: ${task.title}\n`;``
    _message  += `🏪 Автомат: ${task.machine?.name || task.machine?.id}\n`;``
    _message  += `📅 Дата: ${formatDate(new Date())}\n\n`;``
    _message  += '📝 Опишите выполненные работы:';'

    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '📸 Добавить фото', callback_data: `add_photo_${taskId}` }],``
      [{ text: '✅ Завершить отчет', callback_data: `complete_report_${taskId}` }],``
      [{ text: '🔙 Назад', callback_data: 'tech_tasks' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

    // Ожидаем текстового ввода от пользователя
    ctx.setState(BOT_STATES.REPAIR_REPORT_INPUT);

  } catch (error) {'
    require("./utils/logger").error('Error starting repair report:', error);''
    await ctx.reply('❌ Ошибка создания отчета о ремонте');'
  }
}

function formatDate(_date) {'
  if (!date) return 'не указана';'
  const ___d = new Date(date;);'
  return d.toLocaleDateString('ru-RU', {';'
    day: '2-digit',''
    month: '2-digit',''
    _hour : '2-digit',''
    minute: '2-digit''
  });
}

module.exports = setupTechnicianHandlers;
'