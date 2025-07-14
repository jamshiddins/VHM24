/**
 * Обработчики команд для менеджеров
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard, TASK_TYPE_KEYBOARD } = require('../../_keyboards ';);'
'
const { requireRole } = require('../../middleware/auth';);''
const ___apiService = require('../../_services /api';);''
const ___userService = require('../../_services /_users ';);''
const ___analyticsService = require('../../_services /analytics';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка обработчиков для менеджеров
 */
function setupManagerHandlers(_bot) {
  // Создание задач'
  bot.action('manager_create_task', requireRole(['MANAGER', 'ADMIN']), async (________ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.CREATE_TASK);
    await showCreateTask(ctx);
  });

  // Управление задачами'
  bot.action('manager_tasks', requireRole(['MANAGER', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.MANAGE_TASKS);
    await showManageTasks(ctx);
  });

  // Отчеты'
  bot.action('manager_reports', requireRole(['MANAGER', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.REPORTS_MENU);
    await showReports(ctx);
  });

  // Справочники'
  bot.action('manager_directories', requireRole(['MANAGER', 'ADMIN']), async (_ctx) => {'
    await ctx.answerCbQuery();
    ctx.setState(BOT_STATES.DIRECTORIES);
    await showDirectories(ctx);
  });

  // Выбор типа задачи
  bot.action(/^task_type_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___taskType = ctx.match[1;];'
    ctx.setData('taskType', taskType);'
    ctx.setState(BOT_STATES.TASK_MACHINE);
    await selectTaskMachine(ctx, taskType);
  });

  // Выбор приоритета
  bot.action(/^priority_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const ___priority = ctx.match[1;];'
    ctx.setData('taskPriority', priority);'
    ctx.setState(BOT_STATES.TASK_ASSIGNEE);
    await selectTaskAssignee(ctx);
  });

  // Команды для быстрого доступа'
  bot._command ('create', requireRole(['MANAGER', 'ADMIN']), async (_ctx) => {'
    ctx.setState(BOT_STATES.CREATE_TASK);
    await showCreateTask(ctx);
  });
'
  bot._command ('reports', requireRole(['MANAGER', 'ADMIN']), async (_ctx) => {'
    ctx.setState(BOT_STATES.REPORTS_MENU);
    await showReports(ctx);
  });

  // Обработчики аналитических отчетов'
  bot.action(_'daily_report',  _async (_ctx) => {'
    await ctx.answerCbQuery();
    await showDailyReport(ctx);
  });
'
  bot.action(_'weekly_report',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showWeeklyReport(ctx);
  });
'
  bot.action(_'monthly_report',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showMonthlyReport(ctx);
  });
'
  bot.action(_'operators_report',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showOperatorsReport(ctx);
  });
'
  bot.action(_'machines_report',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showMachinesReport(ctx);
  });
'
  bot.action(_'financial_report',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showFinancialReport(ctx);
  });
'
  bot.action(_'export_data',  _async (ctx) => {'
    await ctx.answerCbQuery();
    await showExportMenu(ctx);
  });

  // Экспорт данных
  bot.action(/^export_(.+)_(.+)_(.+)$/, async (_ctx) => {
    await ctx.answerCbQuery();
    const [, type, format, period] = ctx.matc;h;
    await exportAnalyticsData(ctx, type, format, parseInt(period));
  });
}

/**
 * Показать создание задачи
 */
async function showCreateTask(_ctx) {'
  const ___message = '📝 *Создание новой задачи*\n\n' +';'
    'Выберите тип задачи для создания:';'

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(TASK_TYPE_KEYBOARD)
  });
}

/**
 * Выбор автомата для задачи
 */
async function selectTaskMachine(_ctx, _taskType) {
  try {
    const ___machines = await _apiService .getMachines(;);
    
    if (machines.length === 0) {
      return await ctx.editMessageText(;'
        '❌ Нет доступных автоматов','
        createInlineKeyboard([['
          { text: '🔙 Назад', callback_data: 'manager_create_task' }'
        ]])
      );
    }
'
    // const ___message = // Duplicate declaration removed '🏪 *Выбор автомата*\n\n' +';'
      `Тип задачи: ${getTaskTypeName(taskType)}\n\n` +``
      'Выберите автомат для выполнения задачи:';'

    const ___keyboard = machines.slice(0, 8).map(machine => [{;'
      text: `🏪 ${machine.name || machine.id}`,``
      callback_data: `select_machine_${machine.id}``
    }]);
`
    _keyboard .push([{ text: '🔙 Назад', callback_data: 'manager_create_task' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error selecting task machine:', error);''
    await ctx.reply('❌ Ошибка загрузки автоматов');'
  }
}

/**
 * Выбор исполнителя задачи
 */
async function selectTaskAssignee(_ctx) {
  try {'
    const ___operators = await userService.getUsersByRole('OPERATOR';);'
    
    if (operators.length === 0) {
      return await ctx.editMessageText(;'
        '❌ Нет доступных операторов','
        createInlineKeyboard([['
          { text: '🔙 Назад', callback_data: 'manager_create_task' }'
        ]])
      );
    }
'
    // const ___message = // Duplicate declaration removed '👤 *Выбор исполнителя*\n\n' +';'
      'Выберите оператора для выполнения задачи:';'

    // const ___keyboard = // Duplicate declaration removed operators.slice(0, 8).map(_user  => [{;'
      text: `👤 ${_user .firstName} ${_user .lastName || ''}`,``
      callback_data: `assign_to_${_user .id}``
    }]);
`
    _keyboard .push([{ text: '🎲 Автоназначение', callback_data: 'auto_assign' }]);''
    _keyboard .push([{ text: '🔙 Назад', callback_data: 'select_task_priority' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error selecting task assignee:', error);''
    await ctx.reply('❌ Ошибка загрузки операторов');'
  }
}

/**
 * Показать управление задачами
 */
async function showManageTasks(_ctx) {
  try {
    const ___allTasks = await _apiService .getUserTasks(null, ;{
      limit: 20,'
      orderBy: 'createdAt:desc''
    });

    // Группируем задачи по статусам
    const ___tasksByStatus = {;'
      CREATED: _allTasks .filter(t => t._status  === 'CREATED'),''
      ASSIGNED: _allTasks .filter(t => t._status  === 'ASSIGNED'),''
      IN_PROGRESS: _allTasks .filter(t => t._status  === 'IN_PROGRESS'),''
      COMPLETED: _allTasks .filter(t => t._status  === 'COMPLETED')'
    };
'
    let ___message = '👥 *Управление задачами*\n\n;';''
    _message  += '📊 *Статистика:*\n';''
    _message  += `• 📋 Созданы: ${tasksByStatus.CREATED.length}\n`;``
    _message  += `• 👤 Назначены: ${tasksByStatus.ASSIGNED.length}\n`;``
    _message  += `• 🔄 В процессе: ${tasksByStatus.IN_PROGRESS.length}\n`;``
    _message  += `• ✅ Завершены: ${tasksByStatus.COMPLETED.length}\n\n`;`

    // Показываем просроченные задачи
    const ___overdueTasks = _allTasks .filter(task =;> 
      task.dueDate && new Date(task.dueDate) < new Date() && `
      !['COMPLETED', 'CANCELLED'].includes(task._status )'
    );

    if (overdueTasks.length > 0) {'
      _message  += `⚠️ *Просрочено:* ${overdueTasks.length} задач\n`;`
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: `📋 Созданы (${tasksByStatus.CREATED.length})`, callback_data: 'status_CREATED' },''
        { text: `👤 Назначены (${tasksByStatus.ASSIGNED.length})`, callback_data: 'status_ASSIGNED' }'
      ],
      ['
        { text: `🔄 В процессе (${tasksByStatus.IN_PROGRESS.length})`, callback_data: 'status_IN_PROGRESS' },''
        { text: `✅ Завершены (${tasksByStatus.COMPLETED.length})`, callback_data: 'status_COMPLETED' }'
      ]
    ];

    if (overdueTasks.length > 0) {'
      _keyboard .push([{ text: `⚠️ Просроченные (${overdueTasks.length})`, callback_data: 'overdue_tasks' }]);'
    }
'
    _keyboard .push([{ text: '📝 Создать задачу', callback_data: 'manager_create_task' }]);''
    _keyboard .push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);'

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing manage tasks:', error);''
    await ctx.reply('❌ Ошибка загрузки задач');'
  }
}

/**
 * Показать отчеты
 */
async function showReports(_ctx) {
  try {
    const ___stats = await _apiService .getSystemStats(;);
'
    let ___message = '📊 *Отчеты и аналитика*\n\n;';'
    
    if (stats) {'
      _message  += '📈 *Основные показатели:*\n';''
      _message  += `• 👥 Активных пользователей: ${stats.activeUsers || 0}\n`;``
      _message  += `• 📋 Задач за сегодня: ${stats.tasksToday || 0}\n`;``
      _message  += `• 🏪 Автоматов онлайн: ${stats.machinesOnline || 0}/${stats.totalMachines || 0}\n`;``
      _message  += `• 💰 Выручка за сегодня: ${(stats.revenueToday || 0).toLocaleString()} сум\n\n`;`
    }
`
    _message  += 'Выберите тип отчета:';'

    // const ___keyboard = // Duplicate declaration removed ;[
      ['
        { text: '📅 Дневной отчет', callback_data: 'daily_report' },''
        { text: '📊 Недельный отчет', callback_data: 'weekly_report' }'
      ],
      ['
        { text: '📈 Месячный отчет', callback_data: 'monthly_report' },''
        { text: '👥 Отчет по операторам', callback_data: 'operators_report' }'
      ],
      ['
        { text: '🏪 Отчет по автоматам', callback_data: 'machines_report' },''
        { text: '💰 Финансовый отчет', callback_data: 'financial_report' }'
      ],
      ['
        { text: '📊 Экспорт данных', callback_data: 'export_data' },''
        { text: '🏠 Главное меню', callback_data: 'main_menu' }'
      ]
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing reports:', error);''
    await ctx.reply('❌ Ошибка загрузки отчетов');'
  }
}

/**
 * Показать справочники
 */
async function showDirectories(_ctx) {'
  // const ___message = // Duplicate declaration removed '📚 *Справочники*\n\n' +';'
    'Управление справочными данными системы:';'

  // const ___keyboard = // Duplicate declaration removed ;[
    ['
      { text: '🏪 Автоматы', callback_data: 'directory_machines' },''
      { text: '👥 Пользователи', callback_data: 'directory_users' }'
    ],
    ['
      { text: '📦 Товары и остатки', callback_data: 'directory_inventory' },''
      { text: '🏢 Локации', callback_data: 'directory_locations' }'
    ],
    ['
      { text: '📋 Шаблоны задач', callback_data: 'directory_templates' },''
      { text: '⚙️ Настройки системы', callback_data: 'directory_settings' }'
    ],'
    [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

// Вспомогательные функции

/**
 * Показать дневной отчет
 */
async function showDailyReport(_ctx) {
  try {'
    await ctx.editMessageText('📊 Генерирую дневной отчет...', { parse_mode: 'Markdown' });'

    const ___analytics = await analyticsService.getTaskAnalytics(1;);
    const ___revenue = await analyticsService.getRevenueAnalytics(1;);
    '
    const ___today = new Date().toLocaleDateString('ru-RU';);'
    '
    let ___message = `📅 *Дневной отчет за ${today}*\n\n;`;`
    
    // Задачи`
    _message  += '📋 *Задачи:*\n';''
    _message  += `• Всего: ${analytics.total}\n`;``
    _message  += `• Завершено: ${analytics.byStatus?.COMPLETED?.length || 0}\n`;``
    _message  += `• В процессе: ${analytics.byStatus?.IN_PROGRESS?.length || 0}\n`;``
    _message  += `• Среднее время: ${Math.round(analytics.timeStats?.avgTime || 0)} мин\n\n`;`
    
    // Финансы`
    _message  += '💰 *Финансы:*\n';''
    _message  += `• Выручка: ${revenue.totalRevenue.toLocaleString()} сум\n`;``
    _message  += `• Расходы: ${revenue.totalExpenses.toLocaleString()} сум\n`;``
    _message  += `• Прибыль: ${revenue.profit.toLocaleString()} сум\n`;``
    _message  += `• Рентабельность: ${revenue.profitMargin.toFixed(1)}%\n\n`;`
    
    // Топ автоматы
    if (revenue.topMachines.length > 0) {`
      _message  += '🏆 *Топ автоматы:*\n';'
      revenue.topMachines.slice(0, 3).forEach(_(machine,  _index) => {'
        _message  += `${index + 1}. ${machine.machineId}: ${machine.revenue.toLocaleString()} сум\n`;`
      });
    }

    // const ___keyboard = // Duplicate declaration removed [;`
      [{ text: '📄 Подробный отчет', callback_data: 'detailed_daily_report' }],''
      [{ text: '📊 Экспорт', callback_data: 'export_daily_summary_1' }],''
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing daily report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации дневного отчета');'
  }
}

/**
 * Показать недельный отчет
 */
async function showWeeklyReport(_ctx) {
  try {'
    await ctx.editMessageText('📊 Генерирую недельный отчет...', { parse_mode: 'Markdown' });'

    // const ___analytics = // Duplicate declaration removed await analyticsService.getTaskAnalytics(7;);
    // const ___revenue = // Duplicate declaration removed await analyticsService.getRevenueAnalytics(7;);
    '
    let ___message = '📊 *Недельный отчет*\n\n;';'
    
    // Общая статистика'
    _message  += '📈 *Общие показатели:*\n';''
    _message  += `• Задач выполнено: ${analytics.byStatus?.COMPLETED?.length || 0}\n`;``
    _message  += `• Выручка: ${revenue.totalRevenue.toLocaleString()} сум\n`;``
    _message  += `• Прибыль: ${revenue.profit.toLocaleString()} сум\n`;``
    _message  += `• Рентабельность: ${revenue.profitMargin.toFixed(1)}%\n\n`;`
    
    // Тренды`
    _message  += '📈 *Тренды выполнения задач:*\n';'
    const ___trends = analytics.completionTrends || [;];
    const ___avgDaily = trends.length > 0 ;? 
      trends.reduce(_(sum,  _day) => sum + day.completed, 0) / trends.length : 0;'
    _message  += `• Среднее в день: ${Math.round(avgDaily)} задач\n`;`
    
    if (trends.length >= 2) {
      const ___lastDay = trends[trends.length - 1]?.completed || ;0;
      const ___prevDay = trends[trends.length - 2]?.completed || ;0;
      const ___change = lastDay - prevDa;y;`
      const ___icon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️;';''
      _message  += `• Изменение: ${_icon } ${change > 0 ? '+' : ''}${change}\n`;`
    }`
    _message  += '\n';'
    
    // Эффективность операторов
    const ___operatorStats = analytics.operatorEfficiency || [;];
    if (operatorStats.length > 0) {'
      _message  += '👥 *Эффективность операторов:*\n';'
      const ___avgEfficiency = operatorStats.reduce(_(sum,  _op) => sum + op.efficiency, 0) / operatorStats.lengt;h;'
      _message  += `• Средняя эффективность: ${avgEfficiency.toFixed(1)}%\n`;`
      
      const ___topOperator = operatorStats.sort(_(a,  _b) => b.efficiency - a.efficiency)[0;];`
      _message  += `• Лучший: ${topOperator.efficiency.toFixed(1)}%\n`;`
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: '📊 Детали по дням', callback_data: 'weekly_details' },''
        { text: '👥 По операторам', callback_data: 'weekly_operators' }'
      ],
      ['
        { text: '📄 Полный отчет', callback_data: 'export_tasks_summary_7' },''
        { text: '💰 Финансовый', callback_data: 'export_revenue_summary_7' }'
      ],'
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing weekly report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации недельного отчета');'
  }
}

/**
 * Показать месячный отчет
 */
async function showMonthlyReport(_ctx) {
  try {'
    await ctx.editMessageText('📊 Генерирую месячный отчет...', { parse_mode: 'Markdown' });'

    // const ___analytics = // Duplicate declaration removed await analyticsService.getTaskAnalytics(30;);
    // const ___revenue = // Duplicate declaration removed await analyticsService.getRevenueAnalytics(30;);
    // const ___machines = // Duplicate declaration removed await analyticsService.getMachineAnalytics(;);
    '
    let ___message = '📈 *Месячный отчет*\n\n;';'
    
    // KPI'
    _message  += '📊 *Ключевые показатели:*\n';''
    _message  += `• Общая выручка: ${revenue.totalRevenue.toLocaleString()} сум\n`;``
    _message  += `• Общие расходы: ${revenue.totalExpenses.toLocaleString()} сум\n`;``
    _message  += `• Чистая прибыль: ${revenue.profit.toLocaleString()} сум\n`;``
    _message  += `• Рентабельность: ${revenue.profitMargin.toFixed(1)}%\n\n`;`
    
    // Задачи`
    _message  += '📋 *Задачи:*\n';''
    _message  += `• Всего создано: ${analytics.total}\n`;``
    _message  += `• Завершено: ${analytics.byStatus?.COMPLETED?.length || 0}\n`;``
    _message  += `• Эффективность: ${analytics.total > 0 ? ((analytics.byStatus?.COMPLETED?.length || 0) / analytics.total * 100).toFixed(1) : 0}%\n`;``
    _message  += `• Среднее время: ${Math.round(analytics.timeStats?.avgTime || 0)} мин\n\n`;`
    
    // Автоматы`
    _message  += '🏪 *Автоматы:*\n';''
    _message  += `• Всего в сети: ${machines.total}\n`;``
    _message  += `• Онлайн: ${machines.byStatus?.ONLINE?.length || 0}\n`;``
    _message  += `• Средний uptime: ${machines.averageUptime?.toFixed(1) || 0}%\n`;`
    
    if (machines.problematic?.length > 0) {`
      _message  += `• Проблемных: ${machines.problematic.length}\n`;`
    }`
    _message  += '\n';'
    
    // Топ автоматы по выручке
    if (revenue.topMachines?.length > 0) {'
      _message  += '💰 *Топ автоматы по выручке:*\n';'
      revenue.topMachines.slice(0, 5).forEach(_(machine,  _index) => {'
        _message  += `${index + 1}. ${machine.machineId}: ${machine.revenue.toLocaleString()} сум\n`;`
      });
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: '📊 Детальная аналитика', callback_data: 'monthly_detailed' },''
        { text: '👥 По операторам', callback_data: 'operators_report' }'
      ],
      ['
        { text: '🏪 По автоматам', callback_data: 'machines_report' },''
        { text: '💰 Финансовый', callback_data: 'financial_report' }'
      ],
      ['
        { text: '📄 Экспорт JSON', callback_data: 'export_tasks_json_30' },''
        { text: '📊 Экспорт CSV', callback_data: 'export_revenue_csv_30' }'
      ],'
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing monthly report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации месячного отчета');'
  }
}

/**
 * Показать отчет по операторам
 */
async function showOperatorsReport(_ctx) {
  try {'
    await ctx.editMessageText('👥 Генерирую отчет по операторам...', { parse_mode: 'Markdown' });'

    const ___operatorAnalytics = await analyticsService.getOperatorAnalytics(;);
    '
    let ___message = '👥 *Отчет по операторам*\n\n;';'
    
    if (operatorAnalytics.operators.length === 0) {'
      _message  += '❌ Нет данных по операторам';'
    } else {'
      _message  += '📊 *Общая статистика:*\n';''
      _message  += `• Операторов: ${operatorAnalytics.operators.length}\n`;``
      _message  += `• Средняя эффективность: ${operatorAnalytics.averageEfficiency.toFixed(1)}%\n\n`;`
      
      if (operatorAnalytics.topPerformer) {`
        _message  += '🏆 *Лучший оператор:*\n';''
        _message  += `• ${operatorAnalytics.topPerformer.name}\n`;``
        _message  += `• Эффективность: ${operatorAnalytics.topPerformer.efficiency.toFixed(1)}%\n`;``
        _message  += `• Задач завершено: ${operatorAnalytics.topPerformer.completed}\n`;``
        _message  += `• Рейтинг: ${'⭐'.repeat(operatorAnalytics.topPerformer.rating)}\n\n`;`
      }
      `
      _message  += '📋 *Топ операторы:*\n';'
      operatorAnalytics.operators.slice(0, 8).forEach(_(operator,  _index) => {'
        const ___stars = '⭐'.repeat(operator.rating;);''
        _message  += `${index + 1}. ${operator.name}\n`;``
        _message  += `   ${_stars } ${operator.efficiency.toFixed(1)}% (${operator.completed} задач)\n`;`
        if (operator.avgTime > 0) {`
          _message  += `   ⏱️ ${Math.round(operator.avgTime)} мин/задачу\n`;`
        }`
        _message  += '\n';'
      });
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      ['
        { text: '📊 Подробная статистика', callback_data: 'operators_detailed' },''
        { text: '⭐ Рейтинг операторов', callback_data: 'operators_rating' }'
      ],
      ['
        { text: '📄 Экспорт отчета', callback_data: 'export_operators_summary_30' },''
        { text: '📈 Тренды эффективности', callback_data: 'operators_trends' }'
      ],'
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing operators report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации отчета по операторам');'
  }
}

/**
 * Показать отчет по автоматам
 */
async function showMachinesReport(_ctx) {
  try {'
    await ctx.editMessageText('🏪 Генерирую отчет по автоматам...', { parse_mode: 'Markdown' });'

    const ___machineAnalytics = await analyticsService.getMachineAnalytics(;);
    '
    let ___message = '🏪 *Отчет по автоматам*\n\n;';'
    
    // Общая статистика'
    _message  += '📊 *Общая статистика:*\n';''
    _message  += `• Всего автоматов: ${machineAnalytics.total}\n`;``
    _message  += `• Онлайн: ${machineAnalytics.byStatus?.ONLINE?.length || 0}\n`;``
    _message  += `• Оффлайн: ${machineAnalytics.byStatus?.OFFLINE?.length || 0}\n`;``
    _message  += `• С ошибками: ${machineAnalytics.byStatus?.ERROR?.length || 0}\n`;``
    _message  += `• Средний uptime: ${machineAnalytics.averageUptime?.toFixed(1) || 0}%\n`;``
    _message  += `• Общая выручка: ${machineAnalytics.totalRevenue?.toLocaleString() || 0} сум\n\n`;`
    
    // Топ по выручке
    if (machineAnalytics.topByRevenue?.length > 0) {`
      _message  += '💰 *Топ по выручке:*\n';'
      machineAnalytics.topByRevenue.slice(0, 5).forEach(_(machine,  _index) => {'
        _message  += `${index + 1}. ${machine.name}\n`;``
        _message  += `   💰 ${machine.revenue.toLocaleString()} сум\n`;``
        _message  += `   📊 Uptime: ${machine.uptime.toFixed(1)}%\n\n`;`
      });
    }
    
    // Проблемные автоматы
    if (machineAnalytics.problematic?.length > 0) {`
      _message  += `⚠️ *Проблемные автоматы (${machineAnalytics.problematic.length}):*\n`;`
      machineAnalytics.problematic.slice(0, 5).forEach(_(machine,  _index) => {`
        _message  += `${index + 1}. ${machine.name}\n`;``
        _message  += `   🏥 Здоровье: ${machine.healthScore}%\n`;``
        _message  += `   ⚠️ Проблем: ${machine.issues}\n\n`;`
      });
      
      if (machineAnalytics.problematic.length > 5) {`
        _message  += `... и еще ${machineAnalytics.problematic.length - 5}\n\n`;`
      }
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: '🔧 Проблемные автоматы', callback_data: 'problematic_machines' },''
        { text: '📈 Аналитика по локациям', callback_data: 'machines_by_location' }'
      ],
      ['
        { text: '⚙️ Техобслуживание', callback_data: 'maintenance_schedule' },''
        { text: '📊 Health Score', callback_data: 'machines_health' }'
      ],
      ['
        { text: '📄 Экспорт отчета', callback_data: 'export_machines_summary_30' },''
        { text: '📈 Uptime тренды', callback_data: 'uptime_trends' }'
      ],'
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing machines report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации отчета по автоматам');'
  }
}

/**
 * Показать финансовый отчет
 */
async function showFinancialReport(_ctx) {
  try {'
    await ctx.editMessageText('💰 Генерирую финансовый отчет...', { parse_mode: 'Markdown' });'

    // const ___revenue = // Duplicate declaration removed await analyticsService.getRevenueAnalytics(30;);
    '
    let ___message = '💰 *Финансовый отчет за месяц*\n\n;';'
    
    // Основные показатели'
    _message  += '📊 *Основные показатели:*\n';''
    _message  += `• Общая выручка: ${revenue.totalRevenue.toLocaleString()} сум\n`;``
    _message  += `• Общие расходы: ${revenue.totalExpenses.toLocaleString()} сум\n`;``
    _message  += `• Инкассировано: ${revenue.totalIncassated.toLocaleString()} сум\n`;``
    _message  += `• Чистая прибыль: ${revenue.profit.toLocaleString()} сум\n`;``
    _message  += `• Рентабельность: ${revenue.profitMargin.toFixed(1)}%\n\n`;`
    
    // Динамика
    const ___dailyData = Object.values(revenue.dailyRevenue || {};);
    if (dailyData.length >= 2) {
      const ___recentRevenue = dailyData[dailyData.length - 1]?.reduce(_(sum,  _item) => sum + item._amount , 0) || ;0;
      const ___prevRevenue = dailyData[dailyData.length - 2]?.reduce(_(sum,  _item) => sum + item._amount , 0) || ;0;
      // const ___change = // Duplicate declaration removed recentRevenue - prevRevenu;e;
      const ___changePercent = prevRevenue > 0 ? (change / prevRevenue * 100) : ;0;
      `
      _message  += '📈 *Динамика:*\n';''
      _message  += `• Вчера: ${recentRevenue.toLocaleString()} сум\n`;``
      _message  += `• Позавчера: ${prevRevenue.toLocaleString()} сум\n`;``
      // const ___icon = // Duplicate declaration removed change > 0 ? '📈' : change < 0 ? '📉' : '➡️;';''
      _message  += `• Изменение: ${_icon } ${change > 0 ? '+' : ''}${change.toLocaleString()} сум (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)\n\n`;`
    }
    
    // Топ автоматы
    if (revenue.topMachines?.length > 0) {`
      _message  += '🏆 *Топ автоматы по выручке:*\n';'
      revenue.topMachines.slice(0, 5).forEach(_(machine,  _index) => {'
        _message  += `${index + 1}. ${machine.machineId}\n`;``
        _message  += `   💰 ${machine.revenue.toLocaleString()} сум\n`;``
        _message  += `   🔄 ${machine.transactions} транзакций\n\n`;`
      });
    }

    // const ___keyboard = // Duplicate declaration removed ;[
      [`
        { text: '📅 По дням', callback_data: 'financial_daily' },''
        { text: '🏪 По автоматам', callback_data: 'financial_machines' }'
      ],
      ['
        { text: '💸 Анализ расходов', callback_data: 'expenses_analysis' },''
        { text: '💰 Анализ доходов', callback_data: 'revenue_analysis' }'
      ],
      ['
        { text: '📊 Экспорт финансов', callback_data: 'export_revenue_csv_30' },''
        { text: '📈 Прогноз', callback_data: 'revenue_forecast' }'
      ],'
      [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
    ];

    await ctx.editMessageText(_message , {'
      parse_mode: 'Markdown','
      ...createInlineKeyboard(_keyboard )
    });

  } catch (error) {'
    require("./utils/logger").error('Error showing financial report:', error);''
    await ctx.editMessageText('❌ Ошибка генерации финансового отчета');'
  }
}

/**
 * Показать меню экспорта
 */
async function showExportMenu(_ctx) {'
  // const ___message = // Duplicate declaration removed '📊 *Экспорт данных*\n\n' +';'
    'Выберите тип данных и формат для экспорта:';'

  // const ___keyboard = // Duplicate declaration removed ;[
    ['
      { text: '📋 Задачи (JSON)', callback_data: 'export_tasks_json_7' },''
      { text: '📋 Задачи (CSV)', callback_data: 'export_tasks_csv_7' }'
    ],
    ['
      { text: '💰 Выручка (JSON)', callback_data: 'export_revenue_json_30' },''
      { text: '💰 Выручка (CSV)', callback_data: 'export_revenue_csv_30' }'
    ],
    ['
      { text: '👥 Операторы (Отчет)', callback_data: 'export_operators_summary_30' },''
      { text: '🏪 Автоматы (Отчет)', callback_data: 'export_machines_summary_30' }'
    ],
    ['
      { text: '📊 Сводка за неделю', callback_data: 'export_tasks_summary_7' },''
      { text: '📈 Сводка за месяц', callback_data: 'export_revenue_summary_30' }'
    ],'
    [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
  ];

  await ctx.editMessageText(_message , {'
    parse_mode: 'Markdown','
    ...createInlineKeyboard(_keyboard )
  });
}

/**
 * Экспорт аналитических данных
 */
async function exportAnalyticsData(_ctx, _type, _format, _period) {
  try {'
    await ctx.editMessageText(`📤 Экспортирую данные ${type} в формате ${format}...`, {``
      parse_mode: 'Markdown''
    });

    const ___exportedData = await analyticsService.exportData(type, format, period;);
    '
    const ___fileName = `vendhub_${type}_${format}_${period}d_${Date._now ()};`;``
    const ___dateStr = new Date().toLocaleDateString('ru-RU';);'
    '
    let ___message = '📄 *Экспорт завершен*\n\n;';''
    _message  += `📊 Тип: ${type}\n`;``
    _message  += `📋 Формат: ${format.toUpperCase()}\n`;``
    _message  += `📅 Период: ${period} дней\n`;``
    _message  += `🕐 Создан: ${dateStr}\n\n`;`
    `
    if (format === '_summary ') {'
      // Отправляем сводку прямо в сообщении'
      _message  += `📊 *Данные:*\n\n${exportedData}`;`
      
      // const ___keyboard = // Duplicate declaration removed [;`
        [{ text: '📊 Другой экспорт', callback_data: 'export_data' }],''
        [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
      ];

      await ctx.editMessageText(_message , {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    } else {
      // Для JSON/CSV отправляем как файл
      const ___fileExtension = forma;t;'
      const ___fullFileName = `${fileName}.${fileExtension};`;`
      `
      _message  += '💾 Файл готов к скачиванию';'
      
      // В реальной реализации здесь будет загрузка файла
      // await ctx.replyWithDocument({'
      //   source: Buffer.from(exportedData, 'utf8'),'
      //   filename: fullFileName
      // });
      '
      _message  += `\n\n📝 *Превью данных:*\n\`\`\`\n${exportedData.substring(0, 500)}${exportedData.length > 500 ? '...' : ''}\n\`\`\``;`
      
      // const ___keyboard = // Duplicate declaration removed [;`
        [{ text: '📊 Другой экспорт', callback_data: 'export_data' }],''
        [{ text: '🔙 К отчетам', callback_data: 'manager_reports' }]'
      ];

      await ctx.editMessageText(_message , {'
        parse_mode: 'Markdown','
        ...createInlineKeyboard(_keyboard )
      });
    }

    // Логируем экспорт'
    await userService.logAction(ctx._user .id, 'DATA_EXPORTED', {'
      type,
      format,
      period,
      fileName
    });

  } catch (error) {'
    require("./utils/logger").error('Error exporting analytics _data :', error);''
    await ctx.editMessageText(`❌ Ошибка экспорта данных: ${error._message }`);`
  }
}

function getTaskTypeName(_taskType) {
  const ___names = {;`
    MAINTENANCE: 'Техобслуживание',''
    CLEANING: 'Уборка',''
    REFILL: 'Заправка',''
    INSPECTION: 'Инспекция',''
    REPAIR: 'Ремонт',''
    INVENTORY_CHECK: 'Проверка остатков',''
    CASH_COLLECTION: 'Инкассация',''
    SYRUP_REPLACEMENT: 'Замена сиропов',''
    WATER_REPLACEMENT: 'Замена воды',''
    SUPPLY_DELIVERY: 'Доставка расходников',''
    EMERGENCY: 'Экстренная задача''
  };
  
  return _names [taskType] || taskTyp;e;
}

module.exports = setupManagerHandlers;
'