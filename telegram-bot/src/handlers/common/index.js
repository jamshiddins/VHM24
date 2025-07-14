/**;
 * Общие обработчики команд для всех ролей;
 */;
const { BOT_STATES } = require('../fsm/states')'''';
const { createInlineKeyboard } = require('../_keyboards ')'''';
const { _formatMessage  } = require('../utils/formatters')'''';
const userService = require('../_services /_users ')'''';
const apiService = require('../_services /api')'''';
const logger = require('../utils/logger')'''''';
  bot.action(_'main_menu''''''';
      return await ctx.reply('❌ Необходима авторизация''''''';
  bot.action(_'profile''''''';
  bot.action(_'_settings ''''''';
  bot.action(_'settings_notifications''''''';
  bot.action(_'help''''''';
  bot._command (_'system',  _async (ctx) => {'''';
    if (!userService.hasRole(ctx._user , ['ADMIN', 'MANAGER'])) {'''';
      return await ctx.reply('❌ Недостаточно прав''''''';
  bot._command (_'version',  _async (ctx) => {'''';
    const botVersion = require('../package.json')'''''';
      '🤖 *VendHub Manager (VHM24) Bot*\n\n' +'''';
      `🔗 Версия "API": ${apiVersion?.version || 'неизвестно''';
      `📅 Сборка: ${apiVersion?.buildDate || 'неизвестно''';
      { "parse_mode": 'Markdown''''''';
  bot._command (_'ping''''''';
      let ___status = '✅ Связь установлена;';'''';
      if (health._status  !== 'ok') {'''';
        _status  = '⚠️ Проблемы с API''''''';
        '🏓 *Pong!*\n\n' +'''';
        { "parse_mode": 'Markdown''''''';
        '❌ *Ошибка связи*\n\n' +'''';
        'Не удается подключиться к серверу\n' +'''';
        { "parse_mode": 'Markdown''''''';
  bot.on(_'callback_query''''''';
    const isHandled = ctx.callbackQuery._data .startsWith('_handled_''''''';
      await ctx.answerCbQuery('🤔 Функция временно недоступна''''';
      require("./utils/logger")"";
    return await ctx.reply('❌ Необходима авторизация''''''';
        "parse_mode": 'Markdown''''''';,
  "parse_mode": 'Markdown''''''';
      "parse_mode": 'Markdown''''''';
    return await ctx.reply('❌ Необходима авторизация''''''';
      profileText += '\n\n📈 *Статистика за неделю:*\n';'''';
      [{ "text": '📊 Детальная статистика', "callback_data": 'profile_stats' }],'''';
      [{ "text": '⚙️ Настройки', "callback_data": '_settings ' }],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
        "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing "profile":''''';
    await ctx.reply('❌ Ошибка загрузки профиля''''''';
  let ___settingsText = '⚙️ *Настройки бота*\n\n;';'''';
  settingsText += '🔔 Уведомления:\n';'''';
  settingsText += `• Новые задачи: ${_settings .newTasks ? '✅' : '❌''';
  settingsText += `• Напоминания: ${_settings .taskReminders ? '✅' : '❌''';
  settingsText += `• Обновления: ${_settings .taskUpdates ? '✅' : '❌''';
  settingsText += `• Системные: ${_settings .systemAlerts ? '✅' : '❌''';
    settingsText += '🌙 Тихие часы: отключены\n'''';''';
    [{ "text": '🔔 Управление уведомлениями', "callback_data": 'settings_notifications' }],'''';
    [{ "text": '🌍 Язык и регион', "callback_data": 'settings_language' }],'''';
    [{ "text": '🔒 Приватность', "callback_data": 'settings_privacy' }],'''';
    [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
      "text": `${_settings .newTasks ? '🔔' : '🔕''';,
  "callback_data": 'toggle_notification_newTasks''''''';
      "text": `${_settings .taskReminders ? '🔔' : '🔕''';,
  "callback_data": 'toggle_notification_taskReminders''''''';
      "text": `${_settings .taskUpdates ? '🔔' : '🔕''';,
  "callback_data": 'toggle_notification_taskUpdates''''''';
      "text": `${_settings .systemAlerts ? '🔔' : '🔕''';,
  "callback_data": 'toggle_notification_systemAlerts''''''';
    [{ "text": '🌙 Тихие часы', "callback_data": 'settings_quiet_hours' }],'''';
    [{ "text": '🔙 Назад', "callback_data": '_settings ''''''';
    '🔔 *Настройки уведомлений*\n\n' +'''';
    'Выберите типы уведомлений, которые вы хотите получать:''''''';
      "parse_mode": 'Markdown''''''';
    await ctx.answerCbQuery('✅ Настройка обновлена''''''';
    await userService.logAction(ctx._user .id, 'NOTIFICATION_SETTING_CHANGED''''''';
    require("./utils/logger").error('Error toggling notification "setting":''''';
    await ctx.answerCbQuery('❌ Ошибка обновления настройки''''''';
  const role = _user ?.role || 'OPERATOR;'''';''';
    "OPERATOR": '📋 *Справка для оператора*\n\n' +'''';
      '*Основные команды:*\n' +'''';
      '• /start - Запуск бота\n' +'''';
      '• /tasks - Мои задачи\n' +'''';
      '• /_status  - Текущий статус\n' +'''';
      '• /help - Эта справка\n\n' +'''';
      '*Функции в меню:*\n' +'''';
      '🔹 Мои задачи - просмотр и выполнение\n' +'''';
      '🔹 Возврат сумок - возврат на склад\n' +'''';
      '🔹 Инкассация - сбор наличных\n' +'''';
      '🔹 Мой отчет - статистика работы''''''';
    "WAREHOUSE": '📦 *Справка для склада*\n\n' +'''';
      '*Основные команды:*\n' +'''';
      '• /start - Запуск бота\n' +'''';
      '• /inventory - Остатки склада\n' +'''';
      '• /bags - Управление сумками\n' +'''';
      '• /help - Эта справка\n\n' +'''';
      '*Функции в меню:*\n' +'''';
      '🔹 Приём/выдача - операции склада\n' +'''';
      '🔹 Сборка сумок - комплектация\n' +'''';
      '🔹 Остатки - инвентаризация\n' +'''';
      '🔹 Мойка бункеров - подготовка''''''';
    "MANAGER": '👔 *Справка для менеджера*\n\n' +'''';
      '*Основные команды:*\n' +'''';
      '• /start - Запуск бота\n' +'''';
      '• /create - Создать задачу\n' +'''';
      '• /reports - Отчеты системы\n' +'''';
      '• /system - Статус системы\n' +'''';
      '• /help - Эта справка\n\n' +'''';
      '*Функции в меню:*\n' +'''';
      '🔹 Создать задачу - новая задача\n' +'''';
      '🔹 Управление задачами - контроль\n' +'''';
      '🔹 Отчёты - аналитика и статистика\n' +'''';
      '🔹 Справочники - управление данными''''''';
  const helpText = helpTexts[role] + '\n\n' +'';'';
    '*Дополнительная помощь:*\n' +'''';
    '• Используйте кнопки меню для навигации\n' +'''';
    '• В любой момент можно вернуться в главное меню\n' +'''';
    '• При ошибках попробуйте команду /start\n\n' +'''';
    '📞 *Поддержка:* Обратитесь к администратору'''';''';
    [{ "text": '📖 Детальная инструкция', "callback_data": 'help_detailed' }],'''';
    [{ "text": '❓ FAQ', "callback_data": 'help_faq' }],'''';
    [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
      "parse_mode": 'Markdown''''''';
    let ___statusText = '🖥️ *Статус системы*\n\n;';'''';
    _statusText  += `🔗 "API": ${health._status  === 'ok' ? '✅ Работает' : '❌ Недоступен''';
    _statusText  += `💾 База данных: ${health.database ? '✅' : '❌' ${health.database || 'Ошибка''';
    _statusText  += `🔴 "Redis": ${health.redis ? '✅' : '❌' ${health.redis || 'Ошибка''';
      _statusText  += '📊 *Статистика:*\n';'''';
    _statusText  += `\n⏰ Обновлено: ${new Date().toLocaleString('ru-RU''';
      [{ "text": '🔄 Обновить', "callback_data": 'system_refresh' ],'''';
      [{ "text": '📊 Детальная статистика', "callback_data": 'system_detailed' ],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error getting system _status :''''';
    await ctx.reply('❌ Ошибка получения статуса системы''''''';
    case 'main_menu''''''';
    case 'profile''''''';
    case '_settings ''''''';
    require("./utils/logger").error('Error in back "navigation":''''''';
      [{ "text": '📋 Мои задачи', "callback_data": 'operator_tasks' ],'''';
      [{ "text": '🎒 Возврат сумок', "callback_data": 'bag_return' ],'''';
      [{ "text": '💰 Инкассация', "callback_data": 'incassation' ],'''';
      [{ "text": '📊 Мой отчет', "callback_data": 'operator_report' ],'''';
      [{ "text": '👤 Профиль', "callback_data": 'profile' , { "text": '⚙️ Настройки', "callback_data": '_settings ''''''';
      [{ "text": '📦 Приём/выдача', "callback_data": 'warehouse_receive' ],'''';
      [{ "text": '🎒 Сборка сумок', "callback_data": 'warehouse_bags' ],'''';
      [{ "text": '📋 Остатки', "callback_data": 'warehouse_inventory' ],'''';
      [{ "text": '🧹 Мойка бункеров', "callback_data": 'warehouse_cleaning' ],'''';
      [{ "text": '👤 Профиль', "callback_data": 'profile' , { "text": '⚙️ Настройки', "callback_data": '_settings ''''''';
      [{ "text": '📝 Создать задачу', "callback_data": 'manager_create_task' ],'''';
      [{ "text": '👥 Управление задачами', "callback_data": 'manager_tasks' ],'''';
      [{ "text": '📊 Отчёты', "callback_data": 'manager_reports' ],'''';
      [{ "text": '📚 Справочники', "callback_data": 'manager_directories' ],'''';
      [{ "text": '👤 Профиль', "callback_data": 'profile' , { "text": '⚙️ Настройки', "callback_data": '_settings ''''''';
      [{ "text": '🔧 Технические задачи', "callback_data": 'tech_tasks' ],'''';
      [{ "text": '⚙️ Диагностика', "callback_data": 'tech_diagnostics' ],'''';
      [{ "text": '📸 Фото отчеты', "callback_data": 'tech_photo_reports' ],'''';
      [{ "text": '📋 История ремонтов', "callback_data": 'tech_history' ],'''';
      [{ "text": '👤 Профиль', "callback_data": 'profile' , { "text": '⚙️ Настройки', "callback_data": '_settings ''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))))))))]]]]]]]]]