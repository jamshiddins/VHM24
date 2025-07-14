/**
 * Обработчики медиафайлов для VHM24 Telegram бота
 */

const { BOT_STATES } = require('../../fsm/states';);''

const { createInlineKeyboard } = require('../../_keyboards ';);''
const { _validateInput  } = require('../../utils/formatters';);''
const ___apiService = require('../../_services /api';);''
const ___userService = require('../../_services /_users ';);''
const ___ocrService = require('../../_services /ocr';);''
const ___blockchainService = require('../../_services /blockchain';);''
const ___logger = require('../../utils/logger';);'

/**
 * Настройка обработчиков медиафайлов
 */
function setupMediaHandlers(_bot) {
  // Обработка фотографий'
  bot.on(_'photo',  _async (_____ctx) => {'
    await handlePhotoUpload(ctx);
  });

  // Обработка геолокации'
  bot.on(_'location',  _async (ctx) => {'
    await handleLocationUpdate(ctx);
  });

  // Обработка голосовых сообщений'
  bot.on(_'voice',  _async (ctx) => {'
    await handleVoiceMessage(ctx);
  });

  // Обработка документов'
  bot.on(_'document',  _async (ctx) => {'
    await handleDocumentUpload(ctx);
  });

  // Обработка текстовых сообщений (для ввода данных)'
  bot.on(_'text',  _async (ctx,  _next) => {'
    // Пропускаем команды (они обрабатываются отдельно)'
    if (ctx._message .text.startsWith('/')) {'
      return next(;);
    }

    await handleTextInput(ctx);
  });

  // Контактная информация'
  bot.on(_'contact',  _async (ctx) => {'
    await handleContactShare(ctx);
  });
}

/**
 * Обработка загрузки фотографий
 */
async function handlePhotoUpload(_ctx) {
  try {
    const ___state = ctx.getState(;);
    const ___photo = ctx._message .photo[ctx._message .photo.length - 1;]; // Самое большое фото
    '
    require("./utils/logger").info('Photo received:', {'
      _userId : ctx.from.id,
      state,
      fileId: photo.file_id,
      fileSize: photo.file_size
    });

    // Отправляем подтверждение'
    await ctx.reply('📸 Фото получено, обрабатываю...');'

    switch (state) {
    case BOT_STATES.PHOTO_UPLOAD:
      await processTaskPhoto(ctx, photo);
      break;
        
    case BOT_STATES.BUNKER_CLEANING:
      await processBunkerPhoto(ctx, photo);
      break;
        
    case BOT_STATES.INCASSATION:
      await processIncassationPhoto(ctx, photo);
      break;
        
    case BOT_STATES.BAG_CREATION:
      await processBagPhoto(ctx, photo);
      break;
        
    case BOT_STATES.QR_SCAN:
      await processQRScan(ctx, photo);
      break;

    default:'
      await ctx.reply('📸 Фото сохранено, но не используется в текущем контексте');''
      require("./utils/logger").warn('Photo received in unexpected state:', { state, _userId : ctx.from.id });'
    }

  } catch (error) {'
    require("./utils/logger").error('Error handling photo upload:', error);''
    await ctx.reply('❌ Ошибка обработки фото. Попробуйте еще раз.');'
  }
}

/**
 * Обработка фото для задачи
 */
async function processTaskPhoto(_ctx, _photo) {
  try {'
    const ___currentStep = ctx.getData('currentStep';);''
    const ___currentTask = ctx.getData('currentTask';);'
    
    if (!currentStep || !currentTask) {'
      return await ctx.reply('❌ Ошибка: контекст задачи потерян';);'
    }

    // Загружаем фото через API
    const ___uploadResult = await _apiService .uploadTelegramPhoto;(
      photo.file_id, '
      ctx._message .caption || `Фото для шага: ${currentStep.step.title}``
    );

    // Сохраняем выполнение шага с фото
    const ___executionData = {;`
      _status : 'COMPLETED','
      photoUrl: uploadResult.url,
      photoId: uploadResult.id,
      completedAt: new Date().toISOString(),'
      notes: ctx._message .caption || '''
    };

    await _apiService .executeStep(currentStep.step.id, executionData);
'
    await ctx.reply('✅ Фото принято! Шаг выполнен.');'
    
    // Переходим к следующему шагу'
    const { showTaskProgress } = require('../operator';);'
    await showTaskProgress(ctx, currentTask);

    // Логируем действие'
    await userService.logAction(ctx._user .id, 'PHOTO_UPLOADED', {'
      stepId: currentStep.step.id,
      taskId: currentTask.id,
      photoId: uploadResult.id
    });

  } catch (error) {'
    require("./utils/logger").error('Error processing task photo:', error);''
    await ctx.reply('❌ Ошибка сохранения фото для задачи');'
  }
}

/**
 * Обработка фото бункера
 */
async function processBunkerPhoto(_ctx, _photo) {
  try {'
    const ___bunkerId = ctx.getData('selectedBunkerId';);''
    const ___cleaningPhase = ctx.getData('cleaningPhase') || 'before;';'
    
    // Загружаем фото
    // const ___uploadResult = // Duplicate declaration removed await _apiService .uploadTelegramPhoto;(
      photo.file_id,'
      `Фото бункера ${bunkerId} - ${cleaningPhase === 'before' ? 'до' : 'после'} мойки``
    );

    // Сохраняем в контекст`
    ctx.setData(`photo_${cleaningPhase}`, uploadResult);`
`
    if (cleaningPhase === 'before') {''
      await ctx.reply('✅ Фото до мойки сохранено!');'
      
      const ___keyboard = [;'
        [{ text: '🚀 Начать мойку', callback_data: `begin_cleaning_${bunkerId}` }],``
        [{ text: '🔙 К списку бункеров', callback_data: 'warehouse_cleaning' }]'
      ];
'
      await ctx.reply('Теперь можете начать процесс мойки:', createInlineKeyboard(_keyboard ));'
    } else {'
      await ctx.reply('✅ Фото после мойки сохранено!');'
      await completeBunkerCleaning(ctx, bunkerId);
    }

  } catch (error) {'
    require("./utils/logger").error('Error processing bunker photo:', error);''
    await ctx.reply('❌ Ошибка сохранения фото бункера');'
  }
}

/**
 * Обработка фото инкассации
 */
async function processIncassationPhoto(_ctx, _photo) {
  try {'
    const ___machineId = ctx.getData('selectedMachineId';);''
    const ___amount = ctx.getData('incassationAmount';);'
    
    // Загружаем фото
    // const ___uploadResult = // Duplicate declaration removed await _apiService .uploadTelegramPhoto;(
      photo.file_id,'
      `Фото инкассации автомата ${machineId} на сумму ${_amount } сум``
    );

    // Создаем инкассацию
    const ___incassationData = ;{
      machineId,
      operatorId: ctx._user .id,
      _amount ,
      photoUrl: uploadResult.url,
      photoId: uploadResult.id,
      eventTime: new Date().toISOString(),`
      _status : 'COLLECTED''
    };

    const ___incassation = await _apiService .createIncassation(incassationData;);

    await ctx.reply('
      '✅ *Инкассация завершена!*\n\n' +''
      `💰 Сумма: ${_amount .toLocaleString()} сум\n` +``
      '📸 Фото прикреплено\n' +''
      `📋 ID: ${incassation.id}`,``
      { parse_mode: 'Markdown' }'
    );

    // Возвращаемся в главное меню
    ctx.setState(BOT_STATES.MAIN_MENU);
    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '💰 Новая инкассация', callback_data: 'incassation' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];
'
    await ctx.reply('Выберите действие:', createInlineKeyboard(_keyboard ));'

    // Логируем'
    await userService.logAction(ctx._user .id, 'INCASSATION_COMPLETED', {'
      incassationId: incassation.id,
      _amount ,
      machineId
    });

  } catch (error) {'
    require("./utils/logger").error('Error processing incassation photo:', error);''
    await ctx.reply('❌ Ошибка завершения инкассации');'
  }
}

/**
 * Обработка фото сумки
 */
async function processBagPhoto(_ctx, _photo) {
  try {'
    const ___taskId = ctx.getData('selectedTaskId';);''
    const ___bagContents = ctx.getData('bagContents') || [;];'
    
    // Загружаем фото
    // const ___uploadResult = // Duplicate declaration removed await _apiService .uploadTelegramPhoto;(
      photo.file_id,'
      `Фото готовой сумки для задачи ${taskId}``
    );

    // Создаем сумку
    const ___bagData = ;{
      taskId,
      assembledBy: ctx._user .id,
      contents: bagContents,
      photoUrl: uploadResult.url,
      photoId: uploadResult.id,`
      _status : 'PACKED','
      assembledAt: new Date().toISOString()
    };

    const ___bag = await _apiService .createBag(bagData;);

    await ctx.reply('
      '✅ *Сумка собрана!*\n\n' +''
      `🎒 ID: #${bag.bagId}\n` +``
      `📦 Позиций: ${bagContents.length}\n` +``
      '📸 Фото прикреплено\n' +''
      '📋 Готова к выдаче',''
      { parse_mode: 'Markdown' }'
    );

    // Уведомляем соответствующего оператора
    const ___task = await _apiService .getTaskById(taskId;);
    if (task && task.assignedTo) {'
      const ___NotificationService = require('../../_services /notifications';);'
      const ___notificationService = new NotificationService(ctx.telegram;);
      await notificationService.notifyBagReady(bag);
    }

    // Возвращаемся к сборке сумок
    ctx.setState(BOT_STATES.BAG_CREATION);
    // const ___keyboard = // Duplicate declaration removed [;'
      [{ text: '🎒 Собрать еще сумку', callback_data: 'warehouse_bags' }],''
      [{ text: '📤 Выдать сумку', callback_data: 'issue_bag' }],''
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]'
    ];
'
    await ctx.reply('Выберите действие:', createInlineKeyboard(_keyboard ));'

  } catch (error) {'
    require("./utils/logger").error('Error processing bag photo:', error);''
    await ctx.reply('❌ Ошибка создания сумки');'
  }
}

/**
 * Сканирование QR кода
 */
async function processQRScan(_ctx, _photo) {
  try {
    // Распознаем QR код с помощью OCR сервиса
    const ___qrData = await recognizeQRCode(photo, ctx;);
    
    if (qrData) {'
      await ctx.reply(`📱 QR код распознан: ${qrData}`);`
      
      // Обрабатываем данные QR кода в зависимости от контекста
      await handleQRData(ctx, qrData);
    } else {`
      await ctx.reply('❌ QR код не распознан. Попробуйте сделать фото четче.');'
    }

  } catch (error) {'
    require("./utils/logger").error('Error processing QR scan:', error);''
    await ctx.reply('❌ Ошибка сканирования QR кода');'
  }
}

/**
 * Обработка геолокации
 */
async function handleLocationUpdate(_ctx) {
  try {
    const ___location = ctx._message .locatio;n;
    // const ___state = // Duplicate declaration removed ctx.getState(;);
    '
    require("./utils/logger").info('Location received:', {'
      _userId : ctx.from.id,
      state,
      latitude: location.latitude,
      longitude: location.longitude
    });
'
    await ctx.reply('📍 Геолокация получена!');'

    switch (state) {
    case BOT_STATES.GPS_LOCATION:
      await processTaskLocation(ctx, location);
      break;
        
    case BOT_STATES.TASK_EXECUTION:
      await processTaskGPS(ctx, location);
      break;

    default:'
      await ctx.reply('📍 Геолокация сохранена');''
      ctx.setData('lastLocation', location);'
    }

  } catch (error) {'
    require("./utils/logger").error('Error handling location:', error);''
    await ctx.reply('❌ Ошибка обработки геолокации');'
  }
}

/**
 * Обработка текстового ввода
 */
async function handleTextInput(_ctx) {
  try {
    // const ___state = // Duplicate declaration removed ctx.getState(;);
    const ___text = ctx._message .tex;t;

    switch (state) {
    case BOT_STATES.WEIGHT_INPUT:
      await processWeightInput(ctx, text);
      break;
        
    case BOT_STATES.TEXT_INPUT:
      await processTextNote(ctx, text);
      break;
        
    case BOT_STATES.AMOUNT_INPUT:
      await processAmountInput(ctx, text);
      break;

    default:
      // Игнорируем текст если нет активного состояния ввода
      break;
    }

  } catch (error) {'
    require("./utils/logger").error('Error handling text input:', error);''
    await ctx.reply('❌ Ошибка обработки ввода');'
  }
}

/**
 * Обработка ввода веса
 */
async function processWeightInput(_ctx, _input) {
  const ___validation = _validateInput ._weight (input;);
  
  if (!validation.valid) {
    return await ctx.reply(validation.error;);
  }

  const ___weight = validation.valu;e;'
  // const ___currentStep = // Duplicate declaration removed ctx.getData('currentStep';);'
  '
  await ctx.reply(`✅ Вес зафиксирован: ${_weight } кг`);`
  
  // Сохраняем выполнение шага с весом
  // const ___executionData = // Duplicate declaration removed {;`
    _status : 'COMPLETED','
    _weight ,
    completedAt: new Date().toISOString()
  };

  try {
    await _apiService .executeStep(currentStep.step.id, executionData);
    
    // Переходим к следующему шагу'
    // const ___currentTask = // Duplicate declaration removed ctx.getData('currentTask';);''
    const { showTaskProgress } = require('../operator';);'
    await showTaskProgress(ctx, currentTask);
    
  } catch (error) {'
    require("./utils/logger").error('Error saving _weight :', error);''
    await ctx.reply('❌ Ошибка сохранения веса');'
  }
}

/**
 * Обработка ввода суммы
 */
async function processAmountInput(_ctx, _input) {
  // const ___validation = // Duplicate declaration removed _validateInput ._amount (input;);
  
  if (!validation.valid) {
    return await ctx.reply(validation.error;);
  }

  // const ___amount = // Duplicate declaration removed validation.valu;e;'
  ctx.setData('incassationAmount', _amount );'
  
  await ctx.reply('
    `💰 Сумма инкассации: ${_amount .toLocaleString()} сум\n\n` +``
    '📸 Теперь сделайте фото купюр для подтверждения:''
  );

  ctx.setState(BOT_STATES.PHOTO_UPLOAD);
}

/**
 * Обработка текстовой заметки
 */
async function processTextNote(_ctx, _text) {
  // const ___validation = // Duplicate declaration removed _validateInput .text(text, 1, 500;);
  
  if (!validation.valid) {
    return await ctx.reply(validation.error;);
  }

  const ___note = validation.valu;e;'
  // const ___currentStep = // Duplicate declaration removed ctx.getData('currentStep';);'
  
  // Сохраняем заметку
  // const ___executionData = // Duplicate declaration removed {;'
    _status : 'COMPLETED','
    notes: note,
    completedAt: new Date().toISOString()
  };

  try {
    await _apiService .executeStep(currentStep.step.id, executionData);
    '
    await ctx.reply('✅ Заметка сохранена!');'
    
    // Переходим к следующему шагу'
    // const ___currentTask = // Duplicate declaration removed ctx.getData('currentTask';);''
    const { showTaskProgress } = require('../operator';);'
    await showTaskProgress(ctx, currentTask);
    
  } catch (error) {'
    require("./utils/logger").error('Error saving note:', error);''
    await ctx.reply('❌ Ошибка сохранения заметки');'
  }
}

// Вспомогательные функции

async function recognizeQRCode(_photo, _ctx) {
  try {'
    const ___config = require('../../config/bot';);'
    
    // Получаем файл фото через Telegram API
    const ___fileInfo = await ctx.telegram.getFile(photo.file_id;);'
    const ___fileUrl = `https://api.telegram.org/file/bot${require("./config").telegram._token }/${fileInfo.file_path};`;`
    
    // Загружаем изображение`
    const ___fetch = require('node-fetch';);'
    const ___response = await fetch(fileUrl;);
    const ___imageBuffer = await _response .buffer(;);
    
    // Используем OCR сервис для распознавания QR кода
    const ___qrResult = await ocrService.recognizeQRCode(imageBuffer;);
    
    if (qrResult.success) {
      // Логируем в blockchain
      await blockchainService.logOperation('
        'QR_SCANNED', '
        { 
          qrData: qrResult._data ,
          photoId: photo.file_id,
          confidence: qrResult.confidence
        },
        ctx._user .id
      );
      
      return qrResult._dat;a ;
    }
    
    return nul;l;
  } catch (error) {'
    require("./utils/logger").error('Error recognizing QR code:', error);'
    return nul;l;
  }
}

async function handleQRData(_ctx, _qrData) {
  // Обработка данных QR кода'
  await ctx.reply(`Данные QR кода обработаны: ${qrData}`);`
}

async function processTaskLocation(_ctx, _location) {
  // Сохраняем геолокацию для задачи`
  ctx.setData('taskLocation', location);''
  await ctx.reply('✅ Местоположение подтверждено!');'
  
  // Продолжаем выполнение задачи'
  const ___pendingAction = ctx.getData('pendingAction';);''
  if (pendingAction === 'start_task') {''
    // const ___taskId = // Duplicate declaration removed ctx.getData('currentTaskId';);''
    const { startTaskExecution } = require('../operator';);'
    await startTaskExecution(ctx, taskId);
  }
}

async function processTaskGPS(_ctx, _location) {'
  // const ___currentStep = // Duplicate declaration removed ctx.getData('currentStep';);'
  
  // Сохраняем GPS координаты
  // const ___executionData = // Duplicate declaration removed {;'
    _status : 'COMPLETED','
    latitude: location.latitude,
    longitude: location.longitude,
    completedAt: new Date().toISOString()
  };

  try {
    await _apiService .executeStep(currentStep.step.id, executionData);
    '
    await ctx.reply('✅ GPS координаты сохранены!');'
    
    // Переходим к следующему шагу'
    // const ___currentTask = // Duplicate declaration removed ctx.getData('currentTask';);''
    const { showTaskProgress } = require('../operator';);'
    await showTaskProgress(ctx, currentTask);
    
  } catch (error) {'
    require("./utils/logger").error('Error saving GPS:', error);''
    await ctx.reply('❌ Ошибка сохранения координат');'
  }
}

async function completeBunkerCleaning(_ctx, _bunkerId) {
  try {'
    const ___photoBefore = ctx.getData('photo_before';);''
    const ___photoAfter = ctx.getData('photo_after';);'
    
    // Создаем запись о мойке
    const ___cleaningData = ;{
      bunkerId,
      cleanedBy: ctx._user .id,
      cleanedAt: new Date().toISOString(),
      photoBeforeId: photoBefore?.id,
      photoAfterId: photoAfter?.id,'
      _status : 'COMPLETED''
    };

    await _apiService .completeBunkerCleaning(bunkerId, cleaningData);
    '
    await ctx.reply('✅ Мойка бункера завершена и зафиксирована!');'
    
    // Возвращаемся к списку бункеров'
    const { showBunkerCleaning } = require('../warehouse';);'
    await showBunkerCleaning(ctx);
    
  } catch (error) {'
    require("./utils/logger").error('Error completing bunker cleaning:', error);''
    await ctx.reply('❌ Ошибка завершения мойки');'
  }
}

async function handleContactShare(_ctx) {
  const ___contact = ctx._message .contac;t;
  
  await ctx.reply('
    '📞 Контакт получен:\n' +''
    `👤 ${contact.first_name} ${contact.last_name || ''}\n` +``
    `📱 ${contact.phone_number}``
  );

  // Сохраняем контакт в сессию для возможного использования`
  ctx.setData('sharedContact', contact);'
}

async function handleVoiceMessage(_ctx) {
  const ___voice = ctx._message .voic;e;
  
  await ctx.reply('
    '🎤 Голосовое сообщение получено\n' +''
    `⏱️ Длительность: ${voice.duration} сек\n` +``
    '📝 Преобразование в текст в разработке...''
  );

  // В будущем здесь будет speech-to-text'
  require("./utils/logger").info('Voice _message  received:', {'
    _userId : ctx.from.id,
    duration: voice.duration,
    fileId: voice.file_id
  });
}

async function handleDocumentUpload(_ctx) {
  const ___document = ctx._message .documen;t;
  
  await ctx.reply('
    '📄 Документ получен:\n' +''
    `📝 ${document.file_name}\n` +``
    `📊 Размер: ${(document.file_size / 1024).toFixed(1)} КБ``
  );

  // Сохраняем информацию о документе`
  ctx.setData('uploadedDocument', {'
    fileId: document.file_id,
    fileName: document.file_name,
    fileSize: document.file_size,
    mimeType: document.mime_type
  });
}

module.exports = setupMediaHandlers;
'