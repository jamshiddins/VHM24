/**;
 * Обработчики команд для менеджеров;
 */;
const { BOT_STATES } = require('../fsm/states')'''';
const { createInlineKeyboard, TASK_TYPE_KEYBOARD } = require('../_keyboards ')'''';
'';
const { requireRole } = require('../middleware/auth')'''';
const apiService = require('../_services /api')'''';
const userService = require('../_services /_users ')'''';
const analyticsService = require('../_services /analytics')'''';
const logger = require('../utils/logger')'''''';
  bot.action('manager_create_task', requireRole(['MANAGER', 'ADMIN''''''';
  bot.action('manager_tasks', requireRole(['MANAGER', 'ADMIN''''''';
  bot.action('manager_reports', requireRole(['MANAGER', 'ADMIN''''''';
  bot.action('manager_directories', requireRole(['MANAGER', 'ADMIN''''''';
    ctx.setData('taskType''''''';
    ctx.setData('taskPriority''''''';
  bot._command ('create', requireRole(['MANAGER', 'ADMIN''''''';
  bot._command ('reports', requireRole(['MANAGER', 'ADMIN''''''';
  bot.action(_'daily_report''''''';
  bot.action(_'weekly_report''''''';
  bot.action(_'monthly_report''''''';
  bot.action(_'operators_report''''''';
  bot.action(_'machines_report''''''';
  bot.action(_'financial_report''''''';
  bot.action(_'export_data''''''';
  const message = '📝 *Создание новой задачи*\n\n' +'';'';
    'Выберите тип задачи для создания:''''''';
    "parse_mode": 'Markdown'''';''';
        '❌ Нет доступных автоматов''''''';
          { "text": '🔙 Назад', "callback_data": 'manager_create_task''''''';
    // const message =  '🏪 *Выбор автомата*\n\n' +'';'';
      'Выберите автомат для выполнения задачи:'''';''';
    _keyboard .push([{ "text": '🔙 Назад', "callback_data": 'manager_create_task''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error selecting task "machine":''''';
    await ctx.reply('❌ Ошибка загрузки автоматов''''''';
    const operators = await userService.getUsersByRole('OPERATOR'''';''';
        '❌ Нет доступных операторов''''''';
          { "text": '🔙 Назад', "callback_data": 'manager_create_task''''''';
    // const message =  '👤 *Выбор исполнителя*\n\n' +'';'';
      'Выберите оператора для выполнения задачи:'''';''';
      "text": `👤 ${_user .firstName} ${_user .lastName || '';
    _keyboard .push([{ "text": '🎲 Автоназначение', "callback_data": 'auto_assign''''';
    _keyboard .push([{ "text": '🔙 Назад', "callback_data": 'select_task_priority''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error selecting task "assignee":''''';
    await ctx.reply('❌ Ошибка загрузки операторов''''''';
      "orderBy": '"createdAt":desc'''';''';,
  "CREATED": _allTasks .filter(t => t._status  === 'CREATED'),'''';
      "ASSIGNED": _allTasks .filter(t => t._status  === 'ASSIGNED'),'''';
      "IN_PROGRESS": _allTasks .filter(t => t._status  === 'IN_PROGRESS'),'''';
      "COMPLETED": _allTasks .filter(t => t._status  === 'COMPLETED''''''';
    let ___message = '👥 *Управление задачами*\n\n;';'''';
    _message  += '📊 *Статистика:*\n';'''';
      !['COMPLETED', 'CANCELLED''''''';
        { "text": `📋 Созданы (${tasksByStatus.CREATED.length})`, "callback_data": 'status_CREATED' },'''';
        { "text": `👤 Назначены (${tasksByStatus.ASSIGNED.length})`, "callback_data": 'status_ASSIGNED''''''';
        { "text": `🔄 В процессе (${tasksByStatus.IN_PROGRESS.length})`, "callback_data": 'status_IN_PROGRESS' },'''';
        { "text": `✅ Завершены (${tasksByStatus.COMPLETED.length})`, "callback_data": 'status_COMPLETED''''''';
      _keyboard .push([{ "text": `⚠️ Просроченные (${overdueTasks.length})`, "callback_data": 'overdue_tasks''''''';
    _keyboard .push([{ "text": '📝 Создать задачу', "callback_data": 'manager_create_task''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing manage "tasks":''''';
    await ctx.reply('❌ Ошибка загрузки задач''''''';
    let ___message = '📊 *Отчеты и аналитика*\n\n;''''''';
      _message  += '📈 *Основные показатели:*\n';'''';
    _message  += 'Выберите тип отчета:''''''';
        { "text": '📅 Дневной отчет', "callback_data": 'daily_report' },'''';
        { "text": '📊 Недельный отчет', "callback_data": 'weekly_report''''''';
        { "text": '📈 Месячный отчет', "callback_data": 'monthly_report' },'''';
        { "text": '👥 Отчет по операторам', "callback_data": 'operators_report''''''';
        { "text": '🏪 Отчет по автоматам', "callback_data": 'machines_report' },'''';
        { "text": '💰 Финансовый отчет', "callback_data": 'financial_report''''''';
        { "text": '📊 Экспорт данных', "callback_data": 'export_data' },'''';
        { "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing "reports":''''';
    await ctx.reply('❌ Ошибка загрузки отчетов''''''';
  // const message =  '📚 *Справочники*\n\n' +'';'';
    'Управление справочными данными системы:''''''';
      { "text": '🏪 Автоматы', "callback_data": 'directory_machines' },'''';
      { "text": '👥 Пользователи', "callback_data": 'directory_users''''''';
      { "text": '📦 Товары и остатки', "callback_data": 'directory_inventory' },'''';
      { "text": '🏢 Локации', "callback_data": 'directory_locations''''''';
      { "text": '📋 Шаблоны задач', "callback_data": 'directory_templates' },'''';
      { "text": '⚙️ Настройки системы', "callback_data": 'directory_settings''''''';
    [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    await ctx.editMessageText('📊 Генерирую дневной отчет...', { "parse_mode": 'Markdown''''''';
    const today = new Date().toLocaleDateString('ru-RU''''''';
    _message  += '📋 *Задачи:*\n';'''';
    _message  += '💰 *Финансы:*\n';'''';
      _message  += '🏆 *Топ автоматы:*\n''''''';
      [{ "text": '📄 Подробный отчет', "callback_data": 'detailed_daily_report' }],'''';
      [{ "text": '📊 Экспорт', "callback_data": 'export_daily_summary_1' }],'''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing daily "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации дневного отчета''''''';
    await ctx.editMessageText('📊 Генерирую недельный отчет...', { "parse_mode": 'Markdown''''''';
    let ___message = '📊 *Недельный отчет*\n\n;''''''';
    _message  += '📈 *Общие показатели:*\n';'''';
    _message  += '📈 *Тренды выполнения задач:*\n''''''';
      const icon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️;';'''';
      _message  += `• Изменение: ${_icon } ${change > 0 ? '+' : '';
    _message  += '\n''''''';
      _message  += '👥 *Эффективность операторов:*\n''''''';
        { "text": '📊 Детали по дням', "callback_data": 'weekly_details' },'''';
        { "text": '👥 По операторам', "callback_data": 'weekly_operators''''''';
        { "text": '📄 Полный отчет', "callback_data": 'export_tasks_summary_7' },'''';
        { "text": '💰 Финансовый', "callback_data": 'export_revenue_summary_7''''''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing weekly "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации недельного отчета''''''';
    await ctx.editMessageText('📊 Генерирую месячный отчет...', { "parse_mode": 'Markdown''''''';
    let ___message = '📈 *Месячный отчет*\n\n;''''''';
    _message  += '📊 *Ключевые показатели:*\n';'''';
    _message  += '📋 *Задачи:*\n';'''';
    _message  += '🏪 *Автоматы:*\n';'''';
    _message  += '\n''''''';
      _message  += '💰 *Топ автоматы по выручке:*\n''''''';
        { "text": '📊 Детальная аналитика', "callback_data": 'monthly_detailed' },'''';
        { "text": '👥 По операторам', "callback_data": 'operators_report''''''';
        { "text": '🏪 По автоматам', "callback_data": 'machines_report' },'''';
        { "text": '💰 Финансовый', "callback_data": 'financial_report''''''';
        { "text": '📄 Экспорт JSON', "callback_data": 'export_tasks_json_30' },'''';
        { "text": '📊 Экспорт CSV', "callback_data": 'export_revenue_csv_30''''''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing monthly "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации месячного отчета''''''';
    await ctx.editMessageText('👥 Генерирую отчет по операторам...', { "parse_mode": 'Markdown''''''';
    let ___message = '👥 *Отчет по операторам*\n\n;''''''';
      _message  += '❌ Нет данных по операторам''''''';
      _message  += '📊 *Общая статистика:*\n';'''';
        _message  += '🏆 *Лучший оператор:*\n';'''';
        _message  += `• Рейтинг: ${'⭐''';
      _message  += '📋 *Топ операторы:*\n''''''';
        const stars = '⭐''''';
        _message  += '\n''''''';
        { "text": '📊 Подробная статистика', "callback_data": 'operators_detailed' },'''';
        { "text": '⭐ Рейтинг операторов', "callback_data": 'operators_rating''''''';
        { "text": '📄 Экспорт отчета', "callback_data": 'export_operators_summary_30' },'''';
        { "text": '📈 Тренды эффективности', "callback_data": 'operators_trends''''''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing operators "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации отчета по операторам''''''';
    await ctx.editMessageText('🏪 Генерирую отчет по автоматам...', { "parse_mode": 'Markdown''''''';
    let ___message = '🏪 *Отчет по автоматам*\n\n;''''''';
    _message  += '📊 *Общая статистика:*\n';'''';
      _message  += '💰 *Топ по выручке:*\n''''''';
        { "text": '🔧 Проблемные автоматы', "callback_data": 'problematic_machines' },'''';
        { "text": '📈 Аналитика по локациям', "callback_data": 'machines_by_location''''''';
        { "text": '⚙️ Техобслуживание', "callback_data": 'maintenance_schedule' },'''';
        { "text": '📊 Health Score', "callback_data": 'machines_health''''''';
        { "text": '📄 Экспорт отчета', "callback_data": 'export_machines_summary_30' },'''';
        { "text": '📈 Uptime тренды', "callback_data": 'uptime_trends''''''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing machines "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации отчета по автоматам''''''';
    await ctx.editMessageText('💰 Генерирую финансовый отчет...', { "parse_mode": 'Markdown''''''';
    let ___message = '💰 *Финансовый отчет за месяц*\n\n;''''''';
    _message  += '📊 *Основные показатели:*\n';'''';
      _message  += '📈 *Динамика:*\n';'''';
      // const icon =  change > 0 ? '📈' : change < 0 ? '📉' : '➡️;';'''';
      _message  += `• Изменение: ${_icon  ${change > 0 ? '+' : '${change.toLocaleString() сум (${changePercent > 0 ? '+' : ''';
      _message  += '🏆 *Топ автоматы по выручке:*\n''''''';
        { "text": '📅 По дням', "callback_data": 'financial_daily' ,'''';
        { "text": '🏪 По автоматам', "callback_data": 'financial_machines''''''';
        { "text": '💸 Анализ расходов', "callback_data": 'expenses_analysis' ,'''';
        { "text": '💰 Анализ доходов', "callback_data": 'revenue_analysis''''''';
        { "text": '📊 Экспорт финансов', "callback_data": 'export_revenue_csv_30' ,'''';
        { "text": '📈 Прогноз', "callback_data": 'revenue_forecast''''''';
      [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing financial "report":''''';
    await ctx.editMessageText('❌ Ошибка генерации финансового отчета''''''';
  // const message =  '📊 *Экспорт данных*\n\n' +'';'';
    'Выберите тип данных и формат для экспорта:''''''';
      { "text": '📋 Задачи (JSON)', "callback_data": 'export_tasks_json_7' ,'''';
      { "text": '📋 Задачи (CSV)', "callback_data": 'export_tasks_csv_7''''''';
      { "text": '💰 Выручка (JSON)', "callback_data": 'export_revenue_json_30' ,'''';
      { "text": '💰 Выручка (CSV)', "callback_data": 'export_revenue_csv_30''''''';
      { "text": '👥 Операторы (Отчет)', "callback_data": 'export_operators_summary_30' ,'''';
      { "text": '🏪 Автоматы (Отчет)', "callback_data": 'export_machines_summary_30''''''';
      { "text": '📊 Сводка за неделю', "callback_data": 'export_tasks_summary_7' ,'''';
      { "text": '📈 Сводка за месяц', "callback_data": 'export_revenue_summary_30''''''';
    [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
      "parse_mode": 'Markdown''''''';
    const dateStr = new Date().toLocaleDateString('ru-RU''''''';
    let ___message = '📄 *Экспорт завершен*\n\n;';'''';
    if (format === '_summary ''''''';
        [{ "text": '📊 Другой экспорт', "callback_data": 'export_data' ],'''';
        [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
      _message  += '💾 Файл готов к скачиванию''''''';
      //   "source": Buffer.from(exportedData, 'utf8''''''';
      _message  += `\n\n📝 *Превью данных:*\n\`\`\`\n${exportedData.substring(0, 500)${exportedData.length > 500 ? '...' : '';
        [{ "text": '📊 Другой экспорт', "callback_data": 'export_data' ],'''';
        [{ "text": '🔙 К отчетам', "callback_data": 'manager_reports''''''';,
  "parse_mode": 'Markdown''''''';
    await userService.logAction(ctx._user .id, 'DATA_EXPORTED''''''';
    require("./utils/logger").error('Error exporting analytics _data :''''';
    "MAINTENANCE": 'Техобслуживание','''';
    "CLEANING": 'Уборка','''';
    "REFILL": 'Заправка','''';
    "INSPECTION": 'Инспекция','''';
    "REPAIR": 'Ремонт','''';
    "INVENTORY_CHECK": 'Проверка остатков','''';
    "CASH_COLLECTION": 'Инкассация','''';
    "SYRUP_REPLACEMENT": 'Замена сиропов','''';
    "WATER_REPLACEMENT": 'Замена воды','''';
    "SUPPLY_DELIVERY": 'Доставка расходников','''';
    "EMERGENCY": 'Экстренная задача''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))]]]]]]]]]]]]]]]]]]]]]]]