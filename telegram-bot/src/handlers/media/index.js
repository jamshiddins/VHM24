/**;
 * Обработчики медиафайлов для VHM24 Telegram бота;
 */;
const { BOT_STATES } = require('../fsm/states')'''';
const { createInlineKeyboard } = require('../_keyboards ')'''';
const { _validateInput  } = require('../utils/formatters')'''';
const apiService = require('../_services /api')'''';
const userService = require('../_services /_users ')'''';
const ocrService = require('../_services /ocr')'''';
const blockchainService = require('../_services /blockchain')'''';
const logger = require('../utils/logger')'''''';
  bot.on(_'photo''''''';
  bot.on(_'location''''''';
  bot.on(_'voice''''''';
  bot.on(_'document''''''';
  bot.on(_'text''''''';
    if (ctx._message .text.startsWith('/''''''';
  bot.on(_'contact''''''';
    require("./utils/logger").info('Photo "received":''''''';
    await ctx.reply('📸 Фото получено, обрабатываю...''''''';
      await ctx.reply('📸 Фото сохранено, но не используется в текущем контексте''''';
      require("./utils/logger").warn('Photo received in unexpected "state":''''''';
    require("./utils/logger").error('Error handling photo "upload":''''';
    await ctx.reply('❌ Ошибка обработки фото. Попробуйте еще раз.''''''';
    const currentStep = ctx.getData('currentStep''''';
    const currentTask = ctx.getData('currentTask''''''';
      return await ctx.reply('❌ Ошибка: контекст задачи потерян''''''';
      _status : 'COMPLETED''''''';
      "notes": ctx._message .caption || '''''';
    await ctx.reply('✅ Фото принято! Шаг выполнен.''''''';
    const { showTaskProgress } = require('../operator')'''''';
    await userService.logAction(ctx._user .id, 'PHOTO_UPLOADED''''''';
    require("./utils/logger").error('Error processing task "photo":''''';
    await ctx.reply('❌ Ошибка сохранения фото для задачи''''''';
    const bunkerId = ctx.getData('selectedBunkerId''''';
    const cleaningPhase = ctx.getData('cleaningPhase') || 'before;''''''';
      `Фото бункера ${bunkerId} - ${cleaningPhase === 'before' ? 'до' : 'после''';
    if (cleaningPhase === 'before') {'''';
      await ctx.reply('✅ Фото до мойки сохранено!'''';''';
        [{ "text": '🚀 Начать мойку''';
        [{ "text": '🔙 К списку бункеров', "callback_data": 'warehouse_cleaning''''''';
      await ctx.reply('Теперь можете начать процесс мойки:''''''';
      await ctx.reply('✅ Фото после мойки сохранено!''''''';
    require("./utils/logger").error('Error processing bunker "photo":''''';
    await ctx.reply('❌ Ошибка сохранения фото бункера''''''';
    const machineId = ctx.getData('selectedMachineId''''';
    const amount = ctx.getData('incassationAmount''''''';
      _status : 'COLLECTED''''''';
      '✅ *Инкассация завершена!*\n\n' +'''';
      '📸 Фото прикреплено\n' +'''';
      { "parse_mode": 'Markdown'''';''';
      [{ "text": '💰 Новая инкассация', "callback_data": 'incassation' }],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';
    await ctx.reply('Выберите действие:''''''';
    await userService.logAction(ctx._user .id, 'INCASSATION_COMPLETED''''''';
    require("./utils/logger").error('Error processing incassation "photo":''''';
    await ctx.reply('❌ Ошибка завершения инкассации''''''';
    const taskId = ctx.getData('selectedTaskId''''';
    const bagContents = ctx.getData('bagContents''''''';
      _status : 'PACKED''''''';
      '✅ *Сумка собрана!*\n\n' +'''';
      '📸 Фото прикреплено\n' +'''';
      '📋 Готова к выдаче','''';
      { "parse_mode": 'Markdown''''''';
      const NotificationService = require('../_services /notifications')''';''';
      [{ "text": '🎒 Собрать еще сумку', "callback_data": 'warehouse_bags' }],'''';
      [{ "text": '📤 Выдать сумку', "callback_data": 'issue_bag' }],'''';
      [{ "text": '🏠 Главное меню', "callback_data": 'main_menu''''''';
    await ctx.reply('Выберите действие:''''''';
    require("./utils/logger").error('Error processing bag "photo":''''';
    await ctx.reply('❌ Ошибка создания сумки''''''';
      await ctx.reply('❌ QR код не распознан. Попробуйте сделать фото четче.''''''';
    require("./utils/logger").error('Error processing QR "scan":''''';
    await ctx.reply('❌ Ошибка сканирования QR кода''''''';
    require("./utils/logger").info('Location "received":''''''';
    await ctx.reply('📍 Геолокация получена!''''''';
      await ctx.reply('📍 Геолокация сохранена''''';
      ctx.setData('lastLocation''''''';
    require("./utils/logger").error('Error handling "location":''''';
    await ctx.reply('❌ Ошибка обработки геолокации''''''';
    require("./utils/logger").error('Error handling text "input":''''';
    await ctx.reply('❌ Ошибка обработки ввода''''''';
  // const currentStep =  ctx.getData('currentStep''''''';
    _status : 'COMPLETED''''''';
    // const currentTask =  ctx.getData('currentTask''''';
    const { showTaskProgress  = require('../operator')'''''';
    require("./utils/logger").error('Error saving _weight :''''';
    await ctx.reply('❌ Ошибка сохранения веса''''''';
  ctx.setData('incassationAmount''''''';
    '📸 Теперь сделайте фото купюр для подтверждения:''''''';
  // const currentStep =  ctx.getData('currentStep'''';''';
    _status : 'COMPLETED''''''';
    await ctx.reply('✅ Заметка сохранена!''''''';
    // const currentTask =  ctx.getData('currentTask''''';
    const { showTaskProgress  = require('../operator')'''''';
    require("./utils/logger").error('Error saving "note":''''';
    await ctx.reply('❌ Ошибка сохранения заметки''''''';
    const config = require('../config/bot')'''''';
    const fileUrl = `"https"://api.telegram.org/file/bot${require("./config")"";
    const fetch = require('node-fetch')'''''';
        'QR_SCANNED''''''';
    require("./utils/logger").error('Error recognizing QR "code":''''''';
  ctx.setData('taskLocation''''';
  await ctx.reply('✅ Местоположение подтверждено!''''''';
  const pendingAction = ctx.getData('pendingAction''''';
  if (pendingAction === 'start_task') {'''';
    // const taskId =  ctx.getData('currentTaskId''''';
    const { startTaskExecution  = require('../operator')'''''';
  // const currentStep =  ctx.getData('currentStep'''';''';
    _status : 'COMPLETED''''''';
    await ctx.reply('✅ GPS координаты сохранены!''''''';
    // const currentTask =  ctx.getData('currentTask''''';
    const { showTaskProgress  = require('../operator')'''''';
    require("./utils/logger").error('Error saving "GPS":''''';
    await ctx.reply('❌ Ошибка сохранения координат''''''';
    const photoBefore = ctx.getData('photo_before''''';
    const photoAfter = ctx.getData('photo_after''''''';
      _status : 'COMPLETED''''''';
    await ctx.reply('✅ Мойка бункера завершена и зафиксирована!''''''';
    const { showBunkerCleaning  = require('../warehouse')'''''';
    require("./utils/logger").error('Error completing bunker "cleaning":''''';
    await ctx.reply('❌ Ошибка завершения мойки''''''';
    '📞 Контакт получен:\n' +'''';
    `👤 ${contact.first_name ${contact.last_name || '';
  ctx.setData('sharedContact''''''';
    '🎤 Голосовое сообщение получено\n' +'''';
    '📝 Преобразование в текст в разработке...''''''';
  require("./utils/logger").info('Voice _message  "received":''''''';
    '📄 Документ получен:\n' +'''';
  ctx.setData('uploadedDocument''''';
'';
}}}}}}}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))]]]]