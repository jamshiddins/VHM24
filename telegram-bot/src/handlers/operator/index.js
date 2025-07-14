/**;
 * Обработчики команд для операторов;
 */;
const { BOT_STATES } = require('../fsm/states')'''';
const { createInlineKeyboard } = require('../_keyboards ')'''';
const { _formatMessage  } = require('../utils/formatters')'''';
const { requireRole } = require('../middleware/auth')'''';
const apiService = require('../_services /api')'''';
const userService = require('../_services /_users ')'''';
const logger = require('../utils/logger')'''''';
  bot.action('operator_tasks', requireRole(['OPERATOR''''''';
    ctx.setData('currentTaskId''''''';
  bot.action(_'start_task_execution''''''';
    // const taskId =  ctx.getData('currentTaskId''''''';
  bot.action('bag_return', requireRole(['OPERATOR''''''';
  bot.action('incassation', requireRole(['OPERATOR''''''';
  bot.action(_'operator_report''''''';
  bot._command ('tasks', requireRole(['OPERATOR''''''';
  bot._command ('return', requireRole(['OPERATOR''''''';
  bot._command ('collect', requireRole(['OPERATOR''''''';
  bot._command (_'report'''';''';
      _status : ['ASSIGNED', 'IN_PROGRESS'''';''';
        [{ "text": '🔄 Обновить', "callback_data": 'operator_tasks' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';
      const message = '📋 *Мои задачи*\n\n' +'';'';
        '✅ У вас нет активных задач\n\n' +'''';
        'Новые задачи будут отображаться здесь'''';''';
        "parse_mode": 'Markdown''''''';
    // const message =  _formatMessage .taskList(sortedTasks, 'Мои активные задачи'''';''';
      "text": `${_formatMessage .getTaskIcon ? _formatMessage .getTaskIcon(task.type) : '📋''';
    _keyboard .push([{ "text": '🔄 Обновить', "callback_data": 'operator_tasks''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    await userService.logAction(_userId , 'VIEW_TASKS''''''';
    require("./utils/logger").error('Error showing operator "tasks":''''';
    await ctx.reply('❌ Ошибка загрузки задач. Попробуйте позже.''''''';
      return await ctx.editMessageText('❌ Задача не найдена'';''''';
          { "text": '🔙 К задачам', "callback_data": 'operator_tasks''''''';
      if (task._status  === 'ASSIGNED') {'''';
        _keyboard .push([{ "text": '▶️ Начать выполнение', "callback_data": 'start_task_execution''''';
      } else if (task._status  === 'IN_PROGRESS') {'''';
        _keyboard .push([{ "text": '📋 Продолжить чек-лист', "callback_data": 'continue_checklist''''';
        _keyboard .push([{ "text": '⏸️ Приостановить', "callback_data": 'pause_task''''''';
      _keyboard .push([{ "text": `❌ ${canExecute.reason}`, "callback_data": 'task_restriction_info''''''';
    _keyboard .push([{ "text": '📍 Показать на карте', "callback_data": 'show_task_location''''''';
      { "text": '🔙 К задачам', "callback_data": 'operator_tasks' },'''';
      { "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    await userService.logAction(ctx._user .id, 'VIEW_TASK_DETAIL''''''';
    require("./utils/logger").error('Error showing task "detail":''''';
    await ctx.reply('❌ Ошибка загрузки задачи''''''';
      ctx.setData('pendingAction', 'start_task'''';''';
        [{ "text": '📍 Отправить геолокацию', "request_location": true }],'''';
        [{ "text": '⏭️ Пропустить', "callback_data": 'skip_location' }],'''';
        [{ "text": '🔙 Назад''';
        '📍 *Геолокация*\n\n' +'''';
        'Для начала выполнения задачи необходимо подтвердить ваше местоположение.\n\n' +'''';
        'Нажмите кнопку ниже для отправки геолокации:''''''';
          "parse_mode": 'Markdown''''''';
    ctx.setData('currentTask''''''';
    await userService.logAction(ctx._user .id, 'START_TASK_EXECUTION''''''';
    require("./utils/logger").error('Error starting task "execution":''''''';
    let ___errorMessage = '❌ Ошибка начала выполнения задачи;';'''';
    if (error._message .includes('already in _progress ')) {'''';
      errorMessage = '⚠️ Задача уже выполняется';'''';
    } else if (error._message .includes('not assigned')) {'''';
      errorMessage = '⚠️ Задача не назначена вам''''''';
    // const message =  progressMessage + '\n\n''''''';
      "parse_mode": 'Markdown''''''';
    ctx.setData('currentStep''''''';
  // const currentStep =  ctx.getData('currentStep''''''';
    return await ctx.reply('❌ Ошибка: шаг не найден''''''';
    case 'complete':'''';
      await completeChecklistStep(ctx, currentStep, 'COMPLETED''''''';
    case 'photo''''''';
    case '_weight ''''''';
    case 'gps''''''';
    case 'qr''''''';
    case 'note''''''';
    case 'skip''''''';
      await ctx.reply('❌ Неизвестное действие''''''';
    require("./utils/logger").error('Error handling checklist "action":''''';
    await ctx.reply('❌ Ошибка выполнения действия'''';''';
      _status : ['ISSUED''''''';
      // const message =  '🎒 *Возврат сумок*\n\n' +'';'';
        '📦 У вас нет выданных сумок для возврата'''';''';
        [{ "text": '🔄 Обновить', "callback_data": 'bag_return' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
    let ___message = '🎒 *Возврат сумок*\n\n;';'''';
      _message  += '\n'''';''';
    _keyboard .push([{ "text": '📸 Фото всех сумок', "callback_data": 'photo_all_bags''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing bag "return":''''';
    await ctx.reply('❌ Ошибка загрузки сумок''''''';
      // const message =  '💰 *Инкассация*\n\n' +'';'';
        '📊 Нет автоматов для инкассации или в них нет наличных'''';''';
        [{ "text": '🔄 Обновить', "callback_data": 'incassation' }],'''';
        [{ "text": '🏠 Главное меню', "callback_data": 'main_menu'''';''';,
  "parse_mode": 'Markdown''''''';
    let ___message = '💰 *Инкассация*\n\n;';'''';
      _message  += '\n'''';''';
    _keyboard .push([{ "text": '📊 История инкассаций', "callback_data": 'incassation_history''''';
    _keyboard .push([{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing "incassation":''''';
    await ctx.reply('❌ Ошибка загрузки данных инкассации''''''';
    const stats = await userService.getUserStats(_userId , 'day''''''';
    let ___message = '📊 *Мой отчет за сегодня*\n\n;';'''';
    _message  += `👤 ${ctx._user .firstName} ${ctx._user .lastName || '';
    _message  += `📅 ${new Date().toLocaleDateString('ru-RU''';
    _message  += '📋 *Задачи:*\n';'''';
      _message  += '⏱️ *Время работы:*\n';'''';
      _message  += '💰 *Инкассация:*\n';'''';
      _message  += '🎒 *Сумки:*\n';'''';
      [{ "text": '📊 Детальная статистика', "callback_data": 'detailed_operator_report' ],'''';
      [{ "text": '📅 За неделю', "callback_data": 'weekly_operator_report' ],'''';
      [{ "text": '📈 За месяц', "callback_data": 'monthly_operator_report' ],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
        "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error showing operator "report":''''';
    await ctx.reply('❌ Ошибка загрузки отчета''''''';
      if (!execution || execution._status  !== 'COMPLETED''''''';
    _keyboard .push([{ "text": '📸 Фото', "callback_data": 'step_photo''''''';
    _keyboard .push([{ "text": '⚖️ Вес', "callback_data": 'step_weight''''''';
  if (step.stepType === 'GPS_LOCATION') {'''';
    _keyboard .push([{ "text": '📍 GPS', "callback_data": 'step_gps''''''';
  if (step.stepType === 'QR_SCAN') {'''';
    _keyboard .push([{ "text": '📱 QR код', "callback_data": 'step_qr''''''';
  _keyboard .push([{ "text": '✏️ Заметка', "callback_data": 'step_note''''''';
    { "text": '✅ Выполнено', "callback_data": 'step_complete' ,'''';
    { "text": '⏭️ Пропустить', "callback_data": 'step_skip''''''';
  _keyboard .push([{ "text": '🔙 К задаче', "callback_data": 'back_to_task''''''';
    // const task =  ctx.getData('currentTask''''''';
    require("./utils/logger").error('Error completing checklist "step":''''';
    await ctx.reply('❌ Ошибка завершения шага''''''';
  // const message =  '📸 *Загрузка фото*\n\n' +'';'';
    `Для шага "${currentStep.step.title""";
    'Отправьте фото или нажмите "Пропустить":'''';''';
    [{ "text": '⏭️ Пропустить', "callback_data": 'skip_photo' ],'''';
    [{ "text": '🔙 Назад к шагу', "callback_data": 'back_to_step''''''';,
  "parse_mode": 'Markdown''''''';
  // const message =  '⚖️ *Ввод веса*\n\n' +'';'';
    `Для шага "${currentStep.step.title""";
    'Введите вес в килограммах (например: 2.5):'''';''';
    [{ "text": '⏭️ Пропустить', "callback_data": 'skip_weight' ],'''';
    [{ "text": '🔙 Назад к шагу', "callback_data": 'back_to_step''''''';,
  "parse_mode": 'Markdown''''''';
  // const message =  '📍 *Геолокация*\n\n' +'';'';
    `Для шага "${currentStep.step.title""";
    'Отправьте вашу геолокацию:'''';''';
    [{ "text": '📍 Отправить геолокацию', "request_location": true ],'''';
    [{ "text": '⏭️ Пропустить', "callback_data": 'skip_gps' ],'''';
    [{ "text": '🔙 Назад к шагу', "callback_data": 'back_to_step''''''';,
  "parse_mode": 'Markdown''''''';
  // const message =  '📱 *Сканирование QR кода*\n\n' +'';'';
    `Для шага "${currentStep.step.title""";
    'Отправьте фото QR кода:'''';''';
    [{ "text": '⏭️ Пропустить', "callback_data": 'skip_qr' ],'''';
    [{ "text": '🔙 Назад к шагу', "callback_data": 'back_to_step''''''';,
  "parse_mode": 'Markdown''''''';
  // const message =  '✏️ *Добавить заметку*\n\n' +'';'';
    `Для шага "${currentStep.step.title""";
    'Введите заметку:'''';''';
    [{ "text": '⏭️ Пропустить', "callback_data": 'skip_note' ],'''';
    [{ "text": '🔙 Назад к шагу', "callback_data": 'back_to_step''''''';,
  "parse_mode": 'Markdown''''''';
  await completeChecklistStep(ctx, currentStep, 'SKIPPED'''';''';
      "notes": 'Все шаги чек-листа выполнены''''''';
    // const message =  '✅ *Задача завершена!*\n\n' +'';'';
      '🎉 Поздравляем! Вы успешно завершили задачу.\n\n' +'''';
      '📊 Результат будет учтен в вашей статистике.'''';''';
      [{ "text": '📋 Мои задачи', "callback_data": 'operator_tasks' ],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';,
  "parse_mode": 'Markdown''''''';
    await userService.logAction(ctx._user .id, 'COMPLETE_TASK''''''';
    require("./utils/logger").error('Error completing "task":''''';
    await ctx.reply('❌ Ошибка завершения задачи''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]