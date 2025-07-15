/**
 * Утилиты для работы с FSM-сценариями
 * Содержит общие FSM-состояния и логику, которые могут быть интегрированы в различные сценарии
 */

const { Markup } = require('telegraf');

/**
 * Типы ввода для FSM-сценариев
 */
const InputTypes = {
  TEXT_INPUT: 'text_input',
  NUM_INPUT: 'num_input',
  SELECT: 'select',
  MEDIA_UPLOAD: 'media_upload',
  CONFIRM: 'confirm',
  SUBMIT: 'submit',
  REDIRECT: 'redirect'
};

/**
 * Создает клавиатуру с универсальными кнопками
 * @param {Object} options - Опции для создания клавиатуры
 * @param {boolean} options.showBack - Показывать кнопку "Назад"
 * @param {boolean} options.showFinish - Показывать кнопку "Завершить"
 * @param {boolean} options.showCancel - Показывать кнопку "Отменить"
 * @param {Array} options.additionalButtons - Дополнительные кнопки
 * @returns {Object} Клавиатура с универсальными кнопками
 */
function createUniversalKeyboard(options = {}) {
  const { showBack = true, showFinish = true, showCancel = true, additionalButtons = [] } = options;
  
  const buttons = [...additionalButtons];
  
  const navigationButtons = [];
  
  if (showBack) {
    navigationButtons.push(Markup.button.callback('🔙 Назад', 'back'));
  }
  
  if (showFinish) {
    navigationButtons.push(Markup.button.callback('✅ Завершить', 'finish'));
  }
  
  if (showCancel) {
    navigationButtons.push(Markup.button.callback('❌ Отменить', 'cancel'));
  }
  
  if (navigationButtons.length > 0) {
    buttons.push(navigationButtons);
  }
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Создает обработчик для текстового ввода
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Function} onInput - Функция, вызываемая при вводе текста
 * @param {Object} options - Дополнительные опции
 * @returns {Promise} Промис, который разрешается после ввода текста
 */
async function createTextInput(ctx, message, onInput, options = {}) {
  const { showKeyboard = true, keyboardOptions = {} } = options;
  
  // Отправляем сообщение с запросом текста
  if (showKeyboard) {
    await ctx.reply(message, createUniversalKeyboard(keyboardOptions));
  } else {
    await ctx.reply(message);
  }
  
  // Устанавливаем состояние для ожидания текстового ввода
  ctx.session.waitingFor = InputTypes.TEXT_INPUT;
  ctx.session.onInput = onInput;
}

/**
 * Создает обработчик для числового ввода
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Function} onInput - Функция, вызываемая при вводе числа
 * @param {Object} options - Дополнительные опции
 * @returns {Promise} Промис, который разрешается после ввода числа
 */
async function createNumInput(ctx, message, onInput, options = {}) {
  const { showKeyboard = true, keyboardOptions = {}, min, max, allowFloat = false } = options;
  
  // Создаем цифровую клавиатуру
  const numKeyboard = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [allowFloat ? '.' : '', '0', '⌫']
  ];
  
  const numButtons = numKeyboard.map(row => {
    return row.map(key => {
      if (key === '') return Markup.button.callback(' ', 'num_none');
      if (key === '⌫') return Markup.button.callback('⌫', 'num_backspace');
      return Markup.button.callback(key, `num_${key}`);
    });
  });
  
  // Добавляем кнопку подтверждения
  numButtons.push([Markup.button.callback('✅ Готово', 'num_done')]);
  
  // Добавляем универсальные кнопки
  if (showKeyboard) {
    const universalKeyboard = createUniversalKeyboard(keyboardOptions);
    numButtons.push(...universalKeyboard.reply_markup.inline_keyboard);
  }
  
  // Отправляем сообщение с запросом числа
  await ctx.reply(message, Markup.inlineKeyboard(numButtons));
  
  // Устанавливаем состояние для ожидания числового ввода
  ctx.session.waitingFor = InputTypes.NUM_INPUT;
  ctx.session.numInput = '';
  ctx.session.onInput = onInput;
  ctx.session.numInputOptions = { min, max, allowFloat };
}

/**
 * Создает обработчик для выбора из списка
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Array} items - Элементы для выбора
 * @param {Function} onSelect - Функция, вызываемая при выборе элемента
 * @param {Object} options - Дополнительные опции
 * @returns {Promise} Промис, который разрешается после выбора элемента
 */
async function createSelect(ctx, message, items, onSelect, options = {}) {
  const { showKeyboard = true, keyboardOptions = {}, multiSelect = false } = options;
  
  // Создаем кнопки для выбора
  const selectButtons = items.map(item => {
    const prefix = multiSelect ? (item.selected ? '✅ ' : '❌ ') : '';
    return [Markup.button.callback(`${prefix}${item.name}`, `select_${item.id}`)];
  });
  
  // Добавляем кнопку подтверждения для мультивыбора
  if (multiSelect) {
    selectButtons.push([Markup.button.callback('✅ Готово', 'select_done')]);
  }
  
  // Добавляем универсальные кнопки
  if (showKeyboard) {
    const universalKeyboard = createUniversalKeyboard(keyboardOptions);
    selectButtons.push(...universalKeyboard.reply_markup.inline_keyboard);
  }
  
  // Отправляем сообщение с запросом выбора
  await ctx.reply(message, Markup.inlineKeyboard(selectButtons));
  
  // Устанавливаем состояние для ожидания выбора
  ctx.session.waitingFor = InputTypes.SELECT;
  ctx.session.selectItems = items;
  ctx.session.onSelect = onSelect;
  ctx.session.selectOptions = { multiSelect };
}

/**
 * Создает обработчик для загрузки медиафайлов
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Function} onUpload - Функция, вызываемая при загрузке медиафайла
 * @param {Object} options - Дополнительные опции
 * @returns {Promise} Промис, который разрешается после загрузки медиафайла
 */
async function createMediaUpload(ctx, message, onUpload, options = {}) {
  const { showKeyboard = true, keyboardOptions = {}, mediaTypes = ['photo'] } = options;
  
  // Отправляем сообщение с запросом медиафайла
  if (showKeyboard) {
    await ctx.reply(message, createUniversalKeyboard(keyboardOptions));
  } else {
    await ctx.reply(message);
  }
  
  // Устанавливаем состояние для ожидания загрузки медиафайла
  ctx.session.waitingFor = InputTypes.MEDIA_UPLOAD;
  ctx.session.onUpload = onUpload;
  ctx.session.mediaTypes = mediaTypes;
}

/**
 * Создает обработчик для подтверждения действия
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Function} onConfirm - Функция, вызываемая при подтверждении
 * @param {Function} onCancel - Функция, вызываемая при отмене
 * @param {Function} onBack - Функция, вызываемая при нажатии кнопки "Назад"
 * @returns {Promise} Промис, который разрешается после подтверждения или отмены
 */
async function createConfirm(ctx, message, onConfirm, onCancel, onBack) {
  // Создаем кнопки для подтверждения
  const buttons = [
    [Markup.button.callback('✅ Подтвердить', 'confirm')],
    [Markup.button.callback('🔙 Назад', 'back')],
    [Markup.button.callback('❌ Отменить', 'cancel')]
  ];
  
  // Отправляем сообщение с запросом подтверждения
  await ctx.reply(message, Markup.inlineKeyboard(buttons));
  
  // Устанавливаем состояние для ожидания подтверждения
  ctx.session.waitingFor = InputTypes.CONFIRM;
  ctx.session.onConfirm = onConfirm;
  ctx.session.onCancel = onCancel;
  ctx.session.onBack = onBack;
}

/**
 * Создает обработчик для автоматической отправки данных
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {Function} onSubmit - Функция, вызываемая при отправке данных
 * @param {Object} data - Данные для отправки
 * @returns {Promise} Промис, который разрешается после отправки данных
 */
async function createSubmit(ctx, message, onSubmit, data) {
  // Отправляем сообщение об успехе
  await ctx.reply(message);
  
  // Вызываем функцию отправки данных
  await onSubmit(data);
  
  // Устанавливаем состояние для автоматической отправки данных
  ctx.session.waitingFor = InputTypes.SUBMIT;
}

/**
 * Создает обработчик для перенаправления к другому FSM
 * @param {Object} ctx - Контекст Telegraf
 * @param {string} message - Сообщение для пользователя
 * @param {string} sceneName - Имя сцены для перенаправления
 * @param {Object} sceneState - Состояние для передачи в сцену
 * @returns {Promise} Промис, который разрешается после перенаправления
 */
async function createRedirect(ctx, message, sceneName, sceneState = {}) {
  // Отправляем сообщение о перенаправлении
  await ctx.reply(message);
  
  // Устанавливаем состояние для перенаправления
  ctx.session.waitingFor = InputTypes.REDIRECT;
  
  // Сохраняем состояние для передачи в сцену
  ctx.session.redirectState = sceneState;
  
  // Перенаправляем к другой сцене
  await ctx.scene.enter(sceneName);
}

/**
 * Обработчик универсальных кнопок
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если кнопка была обработана, false в противном случае
 */
async function handleUniversalButtons(ctx) {
  // Обработка кнопки "Назад"
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'back') {
    if (ctx.session.onBack) {
      await ctx.session.onBack(ctx);
    } else {
      await ctx.reply('🔙 Возврат к предыдущему шагу.');
    }
    return true;
  }
  
  // Обработка кнопки "Завершить"
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'finish') {
    // Предупреждение о несохраненных данных
    await ctx.reply('⚠️ Вы уверены, что хотите завершить? Несохраненные данные будут потеряны.');
    
    // Создаем кнопки для подтверждения
    const buttons = [
      [Markup.button.callback('✅ Да, завершить', 'confirm_finish')],
      [Markup.button.callback('❌ Нет, продолжить', 'cancel_finish')]
    ];
    
    await ctx.reply('Выберите действие:', Markup.inlineKeyboard(buttons));
    return true;
  }
  
  // Обработка кнопки "Отменить"
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'cancel') {
    if (ctx.session.onCancel) {
      await ctx.session.onCancel(ctx);
    } else {
      await ctx.reply('❌ Операция отменена.');
      await ctx.scene.leave();
    }
    return true;
  }
  
  // Обработка подтверждения завершения
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'confirm_finish') {
    await ctx.reply('✅ Операция завершена.');
    await ctx.scene.enter('main_menu_fsm');
    return true;
  }
  
  // Обработка отмены завершения
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'cancel_finish') {
    await ctx.reply('✅ Продолжаем работу.');
    return true;
  }
  
  return false;
}

/**
 * Обработчик числового ввода
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если ввод был обработан, false в противном случае
 */
async function handleNumInput(ctx) {
  if (ctx.session.waitingFor !== InputTypes.NUM_INPUT) {
    return false;
  }
  
  // Обработка числового ввода
  if (ctx.callbackQuery && ctx.callbackQuery.data.startsWith('num_')) {
    const key = ctx.callbackQuery.data.replace('num_', '');
    
    // Обработка кнопки "Готово"
    if (key === 'done') {
      const { min, max, allowFloat } = ctx.session.numInputOptions || {};
      const value = parseFloat(ctx.session.numInput);
      
      // Проверка на корректность ввода
      if (isNaN(value)) {
        await ctx.reply('❌ Пожалуйста, введите число.');
        return true;
      }
      
      // Проверка на минимальное значение
      if (min !== undefined && value < min) {
        await ctx.reply(`❌ Число должно быть не меньше ${min}.`);
        return true;
      }
      
      // Проверка на максимальное значение
      if (max !== undefined && value > max) {
        await ctx.reply(`❌ Число должно быть не больше ${max}.`);
        return true;
      }
      
      // Проверка на целое число
      if (!allowFloat && !Number.isInteger(value)) {
        await ctx.reply('❌ Пожалуйста, введите целое число.');
        return true;
      }
      
      // Вызываем функцию обработки ввода
      if (ctx.session.onInput) {
        await ctx.session.onInput(value);
      }
      
      // Сбрасываем состояние
      ctx.session.waitingFor = null;
      ctx.session.numInput = '';
      ctx.session.onInput = null;
      ctx.session.numInputOptions = null;
      
      return true;
    }
    
    // Обработка кнопки "Backspace"
    if (key === 'backspace') {
      ctx.session.numInput = ctx.session.numInput.slice(0, -1);
      await ctx.reply(`Текущий ввод: ${ctx.session.numInput || '0'}`);
      return true;
    }
    
    // Обработка кнопки "None"
    if (key === 'none') {
      return true;
    }
    
    // Обработка ввода точки
    if (key === '.') {
      // Проверяем, что точка еще не введена
      if (!ctx.session.numInput.includes('.')) {
        ctx.session.numInput += '.';
        await ctx.reply(`Текущий ввод: ${ctx.session.numInput}`);
      }
      return true;
    }
    
    // Обработка ввода цифры
    ctx.session.numInput += key;
    await ctx.reply(`Текущий ввод: ${ctx.session.numInput}`);
    return true;
  }
  
  return false;
}

/**
 * Обработчик выбора из списка
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если выбор был обработан, false в противном случае
 */
async function handleSelect(ctx) {
  if (ctx.session.waitingFor !== InputTypes.SELECT) {
    return false;
  }
  
  // Обработка выбора из списка
  if (ctx.callbackQuery && ctx.callbackQuery.data.startsWith('select_')) {
    const id = ctx.callbackQuery.data.replace('select_', '');
    
    // Обработка кнопки "Готово"
    if (id === 'done') {
      const { multiSelect } = ctx.session.selectOptions || {};
      
      // Проверка, что выбран хотя бы один элемент
      if (multiSelect) {
        const selectedItems = ctx.session.selectItems.filter(item => item.selected);
        
        if (selectedItems.length === 0) {
          await ctx.reply('❌ Пожалуйста, выберите хотя бы один элемент.');
          return true;
        }
        
        // Вызываем функцию обработки выбора
        if (ctx.session.onSelect) {
          await ctx.session.onSelect(selectedItems);
        }
      }
      
      // Сбрасываем состояние
      ctx.session.waitingFor = null;
      ctx.session.selectItems = null;
      ctx.session.onSelect = null;
      ctx.session.selectOptions = null;
      
      return true;
    }
    
    // Обработка выбора элемента
    const { multiSelect } = ctx.session.selectOptions || {};
    
    if (multiSelect) {
      // Обновляем состояние выбранного элемента
      ctx.session.selectItems = ctx.session.selectItems.map(item => {
        if (item.id === id) {
          return { ...item, selected: !item.selected };
        }
        return item;
      });
      
      // Обновляем сообщение с выбором
      const selectButtons = ctx.session.selectItems.map(item => {
        const prefix = item.selected ? '✅ ' : '❌ ';
        return [Markup.button.callback(`${prefix}${item.name}`, `select_${item.id}`)];
      });
      
      // Добавляем кнопку подтверждения
      selectButtons.push([Markup.button.callback('✅ Готово', 'select_done')]);
      
      // Добавляем универсальные кнопки
      const universalKeyboard = createUniversalKeyboard();
      selectButtons.push(...universalKeyboard.reply_markup.inline_keyboard);
      
      await ctx.editMessageReplyMarkup({ inline_keyboard: selectButtons });
    } else {
      // Находим выбранный элемент
      const selectedItem = ctx.session.selectItems.find(item => item.id === id);
      
      // Вызываем функцию обработки выбора
      if (ctx.session.onSelect && selectedItem) {
        await ctx.session.onSelect(selectedItem);
      }
      
      // Сбрасываем состояние
      ctx.session.waitingFor = null;
      ctx.session.selectItems = null;
      ctx.session.onSelect = null;
      ctx.session.selectOptions = null;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Обработчик загрузки медиафайлов
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если загрузка была обработана, false в противном случае
 */
async function handleMediaUpload(ctx) {
  if (ctx.session.waitingFor !== InputTypes.MEDIA_UPLOAD) {
    return false;
  }
  
  // Обработка загрузки фото
  if (ctx.message && ctx.message.photo && ctx.session.mediaTypes.includes('photo')) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    
    // Вызываем функцию обработки загрузки
    if (ctx.session.onUpload) {
      await ctx.session.onUpload({ type: 'photo', fileId: photo.file_id });
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onUpload = null;
    ctx.session.mediaTypes = null;
    
    return true;
  }
  
  // Обработка загрузки видео
  if (ctx.message && ctx.message.video && ctx.session.mediaTypes.includes('video')) {
    // Вызываем функцию обработки загрузки
    if (ctx.session.onUpload) {
      await ctx.session.onUpload({ type: 'video', fileId: ctx.message.video.file_id });
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onUpload = null;
    ctx.session.mediaTypes = null;
    
    return true;
  }
  
  // Обработка загрузки аудио
  if (ctx.message && ctx.message.audio && ctx.session.mediaTypes.includes('audio')) {
    // Вызываем функцию обработки загрузки
    if (ctx.session.onUpload) {
      await ctx.session.onUpload({ type: 'audio', fileId: ctx.message.audio.file_id });
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onUpload = null;
    ctx.session.mediaTypes = null;
    
    return true;
  }
  
  // Обработка загрузки документа
  if (ctx.message && ctx.message.document && ctx.session.mediaTypes.includes('document')) {
    // Вызываем функцию обработки загрузки
    if (ctx.session.onUpload) {
      await ctx.session.onUpload({ type: 'document', fileId: ctx.message.document.file_id });
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onUpload = null;
    ctx.session.mediaTypes = null;
    
    return true;
  }
  
  return false;
}

/**
 * Обработчик подтверждения
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если подтверждение было обработано, false в противном случае
 */
async function handleConfirm(ctx) {
  if (ctx.session.waitingFor !== InputTypes.CONFIRM) {
    return false;
  }
  
  // Обработка подтверждения
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'confirm') {
    // Вызываем функцию обработки подтверждения
    if (ctx.session.onConfirm) {
      await ctx.session.onConfirm();
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onConfirm = null;
    ctx.session.onCancel = null;
    ctx.session.onBack = null;
    
    return true;
  }
  
  // Обработка отмены
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'cancel') {
    // Вызываем функцию обработки отмены
    if (ctx.session.onCancel) {
      await ctx.session.onCancel();
    } else {
      await ctx.reply('❌ Операция отменена.');
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onConfirm = null;
    ctx.session.onCancel = null;
    ctx.session.onBack = null;
    
    return true;
  }
  
  // Обработка кнопки "Назад"
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'back') {
    // Вызываем функцию обработки кнопки "Назад"
    if (ctx.session.onBack) {
      await ctx.session.onBack();
    } else {
      await ctx.reply('🔙 Возврат к предыдущему шагу.');
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onConfirm = null;
    ctx.session.onCancel = null;
    ctx.session.onBack = null;
    
    return true;
  }
  
  return false;
}

/**
 * Обработчик ввода текста
 * @param {Object} ctx - Контекст Telegraf
 * @returns {boolean} true, если ввод был обработан, false в противном случае
 */
async function handleTextInput(ctx) {
  if (ctx.session.waitingFor !== InputTypes.TEXT_INPUT) {
    return false;
  }
  
  // Обработка ввода текста
  if (ctx.message && ctx.message.text) {
    // Вызываем функцию обработки ввода
    if (ctx.session.onInput) {
      await ctx.session.onInput(ctx.message.text);
    }
    
    // Сбрасываем состояние
    ctx.session.waitingFor = null;
    ctx.session.onInput = null;
    
    return true;
  }
  
  return false;
}

/**
 * Middleware для обработки всех типов ввода
 * @param {Object} ctx - Контекст Telegraf
 * @param {Function} next - Функция для перехода к следующему middleware
 * @returns {Promise} Промис, который разрешается после обработки ввода
 */
async function inputMiddleware(ctx, next) {
  // Обработка универсальных кнопок
  if (await handleUniversalButtons(ctx)) {
    return;
  }
  
  // Обработка числового ввода
  if (await handleNumInput(ctx)) {
    return;
  }
  
  // Обработка выбора из списка
  if (await handleSelect(ctx)) {
    return;
  }
  
  // Обработка загрузки медиафайлов
  if (await handleMediaUpload(ctx)) {
    return;
  }
  
  // Обработка подтверждения
  if (await handleConfirm(ctx)) {
    return;
  }
  
  // Обработка ввода текста
  if (await handleTextInput(ctx)) {
    return;
  }
  
  // Если ничего не обработано, переходим к следующему middleware
  return next();
}

module.exports = {
  InputTypes,
  createUniversalKeyboard,
  createTextInput,
  createNumInput,
  createSelect,
  createMediaUpload,
  createConfirm,
  createSubmit,
  createRedirect,
  handleUniversalButtons,
  handleNumInput,
  handleSelect,
  handleMediaUpload,
  handleConfirm,
  handleTextInput,
  inputMiddleware
};
