/**;
 * Обработчики команд для техников VHM24;
 */;
const { BOT_STATES } = require('../fsm/states')'''';
const { createInlineKeyboard } = require('../_keyboards ')'''';
const { requireRole } = require('../middleware/auth')'''';
const apiService = require('../_services /api')'''';
const userService = require('../_services /_users ')'''';
const logger = require('../utils/logger')'''''';
  bot.action('tech_tasks', requireRole(['TECHNICIAN', 'ADMIN''''''';
  bot.action('tech_diagnostics', requireRole(['TECHNICIAN', 'ADMIN''''''';
  bot.action('tech_photo_reports', requireRole(['TECHNICIAN', 'ADMIN''''''';
  bot.action('tech_history', requireRole(['TECHNICIAN', 'ADMIN''''''';
    ctx.setData('selectedMachineId''''''';
    ctx.setData('selectedTaskId''''''';
  bot._command ('diagnostics', requireRole(['TECHNICIAN', 'ADMIN''''''';
  bot._command ('repair', requireRole(['TECHNICIAN', 'ADMIN'''';''';
      "type": ['REPAIR', 'MAINTENANCE', 'INSPECTION', 'EMERGENCY'],'''';
      _status : ['ASSIGNED', 'IN_PROGRESS''''''';
    let ___message = '🔧 *Технические задачи*\n\n;''''''';
      _message  += '✅ Нет активных технических задач'''';''';
        [{ "text": '📊 Диагностика', "callback_data": 'tech_diagnostics' }],'''';
        [{ "text": '📸 Фото отчеты', "callback_data": 'tech_photo_reports' }],'''';
        [{ "text": '🔄 Обновить', "callback_data": 'tech_tasks' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
      const urgencyIcon = task.priority === 'URGENT' ? '🚨' : task.priority === 'HIGH' ? '🔴' : '🟡;';'''';
      _message  += '\n'''';''';
      { "text": '📊 Диагностика', "callback_data": 'tech_diagnostics' },'''';
      { "text": '📸 Фото отчеты', "callback_data": 'tech_photo_reports''''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing tech "tasks":''''';
    await ctx.reply('❌ Ошибка загрузки технических задач''''''';
    let ___message = '📊 *Диагностика автоматов*\n\n;''''''';
      _message  += '✅ Все автоматы работают штатно'''';''';
        [{ "text": '🔧 Технические задачи', "callback_data": 'tech_tasks' }],'''';
        [{ "text": '📈 Общая статистика', "callback_data": 'system_stats' }],'''';
        [{ "text": '🔄 Обновить', "callback_data": 'tech_diagnostics' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
    const offline = machines.filter(m => m._status  === 'OFFLINE''''';
    const errors = machines.filter(m => m._status  === 'ERROR''''';
    const warnings = machines.filter(m => m._status  === 'WARNING''''''';
      _message  += '\n''''''';
      _message  += '\n''''''';
      { "text": '📈 Подробная диагностика', "callback_data": 'detailed_diagnostics' },'''';
      { "text": '📊 Статистика системы', "callback_data": 'system_stats''''''';
    _keyboard .push([{ "text": '🔄 Обновить', "callback_data": 'tech_diagnostics''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing "diagnostics":''''';
    await ctx.reply('❌ Ошибка загрузки диагностики''''''';
    let ___message = '📸 *Фото отчеты за неделю*\n\n;''''''';
      _message  += '📁 Нет фото отчетов за последние 7 дней'''';''';
        [{ "text": '📋 Создать отчет', "callback_data": 'create_photo_report' }],'''';
        [{ "text": '📊 Архив отчетов', "callback_data": 'photo_reports_archive' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
      const type = report.type || 'OTHER;''''''';
      _message  += '\n''''''';
        { "text": '📋 Создать отчет', "callback_data": 'create_photo_report' },'''';
        { "text": '📊 Архив отчетов', "callback_data": 'photo_reports_archive''''''';
        { "text": '📈 Статистика отчетов', "callback_data": 'reports_stats' },'''';
        { "text": '🔍 Поиск отчетов', "callback_data": 'search_reports''''''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing photo "reports":''''';
    await ctx.reply('❌ Ошибка загрузки фото отчетов''''''';
    let ___message = '📋 *История ремонтов*\n\n;''''''';
      _message  += '📁 История ремонтов пуста'''';''';
        [{ "text": '🔧 Технические задачи', "callback_data": 'tech_tasks' }],'''';
        [{ "text": '📊 Диагностика', "callback_data": 'tech_diagnostics' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
      _message  += '📊 *Статистика за месяц:*\n';'''';
    _message  += '📋 *Последние ремонты:*\n\n''''''';
      const statusIcon = repair._status  === 'COMPLETED' ? '✅' : repair._status  === 'FAILED' ? '❌' : '🔄;';'''';
      _message  += '\n''''''';
        { "text": '📊 Подробная статистика', "callback_data": 'repair_detailed_stats' },'''';
        { "text": '🔍 Поиск ремонтов', "callback_data": 'search_repairs''''''';
        { "text": '📈 Экспорт отчета', "callback_data": 'export_repair_history' },'''';
        { "text": '🔧 Активные задачи', "callback_data": 'tech_tasks''''''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing repair "history":''''';
    await ctx.reply('❌ Ошибка загрузки истории ремонтов''''''';
    await ctx.editMessageText('🔍 Запускаю диагностику автомата...', {'''';
      "parse_mode": 'Markdown''''''';
      _message  += '📋 *Результаты проверки:*\n\n''''''';
        const icon = result._status  === 'OK' ? '✅' : result._status  === 'WARNING' ? '⚠️' : '❌;';'''';
          _message  += `   Значение: ${result.value} ${result.unit || '';
        _message  += '\n''''''';
      _message  += '💡 *Рекомендации:*\n''''''';
      [{ "text": '📄 Подробный отчет''';
      [{ "text": '🔧 Создать задачу ремонта''';
      [{ "text": '🔄 Повторить диагностику''';
      [{ "text": '🔙 К диагностике', "callback_data": 'tech_diagnostics''''''';,
  "parse_mode": 'Markdown''''''';
    await userService.logAction(ctx._user .id, 'DIAGNOSTIC_COMPLETED''''''';
    require("./utils/logger").error('Error running machine "diagnostics":''''';
    await ctx.editMessageText('❌ Ошибка запуска диагностики''''''';
    let ___message = '📊 *Детальная диагностика*\n\n;';'''';
    _message  += `📍 Локация: ${diagnostic.machine?.location || 'не указана''';
      _message  += '🖥️ *Система:*\n';'''';
      _message  += '⚙️ *Оборудование:*\n''''''';
        // const icon =  hw._status  === 'OK' ? '✅' : hw._status  === 'WARNING' ? '⚠️' : '❌;';'''';
      _message  += '\n''''''';
      _message  += '📦 *Расходники:*\n''''''';
        // const icon =  _level  > 50 ? '🟢' : _level  > 20 ? '🟡' : '🔴;';'''';
      [{ "text": '📄 Экспорт отчета''';
      [{ "text": '📸 Добавить фото''';
      [{ "text": '🔙 К диагностике', "callback_data": 'tech_diagnostics''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing detailed "diagnostic":''''';
    await ctx.reply('❌ Ошибка загрузки детальной диагностики'''';''';
    "REPAIR": '🔧','''';
    "MAINTENANCE": '⚙️','''';
    "INSPECTION": '🔍','''';
    "EMERGENCY": '🚨','''';
    "CLEANING": '🧹','''';
    "REFILL": '⛽''''''';
  return icons[type] || '📋;'''';''';
    "ONLINE": '🟢','''';
    "OFFLINE": '🔴','''';
    "ERROR": '❌','''';
    "WARNING": '⚠️','''';
    "MAINTENANCE": '🔧''''''';
  return icons[_status ] || '⚪;'''';''';
    "ONLINE": 'В сети','''';
    "OFFLINE": 'Не в сети','''';
    "ERROR": 'Ошибка','''';
    "WARNING": 'Предупреждение','''';
    "MAINTENANCE": 'Обслуживание'''';''';,
  "pump": 'Насос','''';
    "valve": 'Клапан','''';
    "sensor": 'Датчик','''';
    "display": 'Дисплей','''';
    "payment": 'Оплата','''';
    "dispenser": 'Дозатор','''';
    "cooling": 'Охлаждение','''';
    "heating": 'Нагрев'''';''';,
  "REPAIR": 'Ремонт','''';
    "MAINTENANCE": 'ТО','''';
    "INSPECTION": 'Осмотр','''';
    "ISSUE": 'Проблема','''';
    "OTHER": 'Прочее'''';''';,
  "REPAIR": '🔧','''';
    "MAINTENANCE": '⚙️','''';
    "INSPECTION": '🔍','''';
    "ISSUE": '⚠️','''';
    "OTHER": '📄''''''';
  return icons[type] || '📄;''''''';
    return '🔴 Просрочена;''''''';
  if (!lastSeen) return 'неизвестно''''''';
    let ___message = '🔧 *Отчет о ремонте*\n\n;';'''';
    _message  += '📝 Опишите выполненные работы:'''';''';
      [{ "text": '📸 Добавить фото''';
      [{ "text": '✅ Завершить отчет''';
      [{ "text": '🔙 Назад', "callback_data": 'tech_tasks''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error starting repair "report":''''';
    await ctx.reply('❌ Ошибка создания отчета о ремонте''''''';
  if (!date) return 'не указана''''''';
  return d.toLocaleDateString('ru-RU', {'';'';
    "day": '2-digit','''';
    "month": '2-digit','''';
    _hour : '2-digit','''';
    "minute": '2-digit''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))))))))))))))))))))]]]]]]]]]]]]]]]]]]]]]]]]]]