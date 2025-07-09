/**
 * VHM24 Driver Handler with FSM
 * Обработчик для водителей с поддержкой маршрутов, GPS, пробега и топлива
 */

const fsmManager = require('../fsm/manager');
const { DRIVER_STATES, COMMON_STATES } = require('../fsm/states');

/**
 * Главное меню водителя
 */
async function showDriverMenu(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Проверяем, что пользователь имеет роль водителя
    const userInfo = await getUserInfo(userId);
    if (!userInfo || !userInfo.isDriver) {
      await bot.sendMessage(chatId,
        `❌ У вас нет прав водителя. Обратитесь к администратору для получения доступа.`
      );
      return;
    }

    // Получаем активный маршрут
    const activeRoute = await getActiveRoute(userId);

    let message = `🚛 *Меню водителя*\n\n`;
    
    if (activeRoute) {
      message += `📍 *Активный маршрут:* ${activeRoute.name}\n`;
      message += `🎯 Статус: ${getRouteStatusText(activeRoute.status)}\n`;
      message += `📊 Остановок: ${activeRoute.completedStops}/${activeRoute.totalStops}\n\n`;
    } else {
      message += `📍 Активных маршрутов нет\n\n`;
    }

    const keyboards = [];

    if (activeRoute) {
      if (activeRoute.status === 'PLANNED') {
        keyboards.push([
          { text: '🚀 Начать маршрут', callback_data: 'driver_start_route' }
        ]);
      } else if (activeRoute.status === 'IN_PROGRESS') {
        keyboards.push([
          { text: '📍 Прибыл на точку', callback_data: 'driver_arrived' },
          { text: '✅ Завершить остановку', callback_data: 'driver_complete_stop' }
        ]);
        keyboards.push([
          { text: '🏁 Завершить маршрут', callback_data: 'driver_finish_route' }
        ]);
      }
    }

    keyboards.push([
      { text: '⛽ Заправка', callback_data: 'driver_fuel' },
      { text: '🛣️ Пробег', callback_data: 'driver_mileage' }
    ]);

    keyboards.push([
      { text: '📍 Отправить GPS', callback_data: 'driver_gps' },
      { text: '📋 Мои маршруты', callback_data: 'driver_routes' }
    ]);

    keyboards.push([
      { text: '🔙 Главное меню', callback_data: 'main_menu' }
    ]);

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    });

  } catch (error) {
    global.logger.error('Driver menu error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при загрузке меню водителя. Попробуйте позже.`
    );
  }
}

/**
 * Начать маршрут
 */
async function startRoute(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const activeRoute = await getActiveRoute(userId);
    
    if (!activeRoute || activeRoute.status !== 'PLANNED') {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет запланированного маршрута',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, DRIVER_STATES.WAITING_MILEAGE);
    await fsmManager.setUserData(userId, {
      routeId: activeRoute.id,
      action: 'start_route'
    });

    await bot.editMessageText(
      `🚛 *Начало маршрута: ${activeRoute.name}*\n\n` +
      `📊 Введите текущий пробег автомобиля (в км):`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'driver_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Start route error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале маршрута',
      show_alert: true
    });
  }
}

/**
 * Обработка пробега
 */
async function handleMileage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== DRIVER_STATES.WAITING_MILEAGE) {
      return false;
    }

    const mileageText = msg.text;
    const mileage = parseFloat(mileageText);

    if (isNaN(mileage) || mileage < 0) {
      await bot.sendMessage(chatId,
        `❌ Некорректное значение пробега. Введите число (например: 12345.5):`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    
    // Сохраняем пробег
    await global.apiClient.post('/driver-logs', {
      type: 'MILEAGE',
      description: `Пробег: ${mileage} км`,
      mileage: mileage,
      metadata: {
        routeId: userData.routeId,
        action: userData.action
      }
    });

    if (userData.action === 'start_route') {
      // Обновляем статус маршрута
      await global.apiClient.patch(`/routes/${userData.routeId}`, {
        status: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        startMileage: mileage
      });

      await bot.sendMessage(chatId,
        `✅ *Маршрут начат!*\n\n` +
        `📊 Начальный пробег: ${mileage} км\n` +
        `⏰ Время начала: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
        `🎯 Следуйте к первой точке маршрута.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.sendMessage(chatId,
        `✅ Пробег зафиксирован: ${mileage} км`,
        { parse_mode: 'Markdown' }
      );
    }

    await fsmManager.clearUserState(userId);
    await showDriverMenu(bot, msg);

    return true;
  } catch (error) {
    global.logger.error('Handle mileage error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении пробега. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Заправка
 */
async function handleFuel(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    await fsmManager.setUserState(userId, DRIVER_STATES.WAITING_FUEL_PHOTO);
    await fsmManager.setUserData(userId, {
      action: 'fuel_check'
    });

    await bot.editMessageText(
      `⛽ *Фиксация заправки*\n\n` +
      `📸 Сфотографируйте чек заправки и отправьте фото:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'driver_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Handle fuel error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при обработке заправки',
      show_alert: true
    });
  }
}

/**
 * Обработка фото чека заправки
 */
async function handleFuelPhoto(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== DRIVER_STATES.WAITING_FUEL_PHOTO) {
      return false;
    }

    if (!msg.photo || msg.photo.length === 0) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте фото чека заправки.`
      );
      return true;
    }

    // Получаем самое большое фото
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const photoUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

    // Сохраняем лог заправки
    await global.apiClient.post('/driver-logs', {
      type: 'FUEL_CHECK',
      description: 'Заправка автомобиля',
      photos: [photoUrl],
      metadata: {
        telegramFileId: photo.file_id,
        fileSize: photo.file_size
      }
    });

    await bot.sendMessage(chatId,
      `✅ *Заправка зафиксирована!*\n\n` +
      `📸 Фото чека сохранено\n` +
      `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}`,
      { parse_mode: 'Markdown' }
    );

    await fsmManager.clearUserState(userId);
    await showDriverMenu(bot, { chat: { id: chatId }, from: { id: userId } });

    return true;
  } catch (error) {
    global.logger.error('Handle fuel photo error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении фото. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Прибытие на точку
 */
async function handleArrival(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const activeRoute = await getActiveRoute(userId);
    
    if (!activeRoute || activeRoute.status !== 'IN_PROGRESS') {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет активного маршрута',
        show_alert: true
      });
      return;
    }

    const nextStop = await getNextStop(activeRoute.id);
    
    if (!nextStop) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет следующей остановки',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, DRIVER_STATES.WAITING_GPS_LOCATION);
    await fsmManager.setUserData(userId, {
      routeId: activeRoute.id,
      stopId: nextStop.id,
      action: 'arrival'
    });

    await bot.editMessageText(
      `📍 *Прибытие на точку*\n\n` +
      `🎯 Остановка: ${nextStop.machine.name}\n` +
      `📍 Адрес: ${nextStop.machine.location?.address || 'Не указан'}\n\n` +
      `📱 Отправьте вашу геолокацию для подтверждения прибытия:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📍 Отправить геолокацию', callback_data: 'driver_send_location' }],
            [{ text: '❌ Отмена', callback_data: 'driver_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Handle arrival error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при обработке прибытия',
      show_alert: true
    });
  }
}

/**
 * Обработка GPS локации
 */
async function handleGPSLocation(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== DRIVER_STATES.WAITING_GPS_LOCATION) {
      return false;
    }

    if (!msg.location) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте вашу геолокацию.`,
        {
          reply_markup: {
            keyboard: [[{
              text: '📍 Отправить геолокацию',
              request_location: true
            }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      return true;
    }

    const { latitude, longitude } = msg.location;
    const userData = await fsmManager.getUserData(userId);

    // Обновляем остановку
    await global.apiClient.patch(`/route-stops/${userData.stopId}`, {
      status: 'ARRIVED',
      arrivalTime: new Date().toISOString()
    });

    // Сохраняем GPS лог
    await global.apiClient.post('/driver-logs', {
      type: 'ARRIVAL',
      description: `Прибытие на остановку`,
      latitude,
      longitude,
      metadata: {
        routeId: userData.routeId,
        stopId: userData.stopId
      }
    });

    await bot.sendMessage(chatId,
      `✅ *Прибытие зафиксировано!*\n\n` +
      `📍 GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n` +
      `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
      `🔧 Теперь можете приступать к обслуживанию автомата.`,
      { 
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      }
    );

    await fsmManager.clearUserState(userId);
    await showDriverMenu(bot, msg);

    return true;
  } catch (error) {
    global.logger.error('Handle GPS location error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении геолокации. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Завершение остановки
 */
async function completeStop(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const activeRoute = await getActiveRoute(userId);
    
    if (!activeRoute || activeRoute.status !== 'IN_PROGRESS') {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет активного маршрута',
        show_alert: true
      });
      return;
    }

    const currentStop = await getCurrentStop(activeRoute.id);
    
    if (!currentStop || currentStop.status !== 'ARRIVED') {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Сначала отметьтесь о прибытии',
        show_alert: true
      });
      return;
    }

    // Обновляем остановку
    await global.apiClient.patch(`/route-stops/${currentStop.id}`, {
      status: 'COMPLETED',
      departureTime: new Date().toISOString()
    });

    // Сохраняем лог отъезда
    await global.apiClient.post('/driver-logs', {
      type: 'DEPARTURE',
      description: `Отъезд с остановки`,
      metadata: {
        routeId: activeRoute.id,
        stopId: currentStop.id
      }
    });

    await bot.editMessageText(
      `✅ *Остановка завершена!*\n\n` +
      `🎯 ${currentStop.machine.name}\n` +
      `⏰ Время отъезда: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
      `🚛 Следуйте к следующей точке маршрута.`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown'
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '✅ Остановка завершена'
    });

    // Показываем обновленное меню
    setTimeout(() => {
      showDriverMenu(bot, { chat: { id: chatId }, from: { id: userId } });
    }, 2000);

  } catch (error) {
    global.logger.error('Complete stop error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при завершении остановки',
      show_alert: true
    });
  }
}

/**
 * Отмена текущего действия
 */
async function cancelAction(bot, callbackQuery) {
  const userId = callbackQuery.from.id;
  
  try {
    await fsmManager.clearUserState(userId);
    
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Действие отменено'
    });

    await showDriverMenu(bot, {
      chat: { id: callbackQuery.message.chat.id },
      from: { id: userId }
    });
  } catch (error) {
    global.logger.error('Cancel action error:', error);
  }
}

// Вспомогательные функции

async function getUserInfo(userId) {
  try {
    const response = await global.apiClient.get('/auth/me');
    return response.data.data;
  } catch (error) {
    return null;
  }
}

async function getActiveRoute(userId) {
  try {
    const response = await global.apiClient.get(`/routes?driverId=${userId}&status=PLANNED,IN_PROGRESS`);
    return response.data.data[0] || null;
  } catch (error) {
    return null;
  }
}

async function getNextStop(routeId) {
  try {
    const response = await global.apiClient.get(`/route-stops?routeId=${routeId}&status=PENDING&limit=1`);
    return response.data.data[0] || null;
  } catch (error) {
    return null;
  }
}

async function getCurrentStop(routeId) {
  try {
    const response = await global.apiClient.get(`/route-stops?routeId=${routeId}&status=ARRIVED&limit=1`);
    return response.data.data[0] || null;
  } catch (error) {
    return null;
  }
}

function getRouteStatusText(status) {
  const statusMap = {
    'PLANNED': '📋 Запланирован',
    'IN_PROGRESS': '🚛 В пути',
    'COMPLETED': '✅ Завершен',
    'CANCELLED': '❌ Отменен'
  };
  return statusMap[status] || status;
}

module.exports = {
  showDriverMenu,
  startRoute,
  handleMileage,
  handleFuel,
  handleFuelPhoto,
  handleArrival,
  handleGPSLocation,
  completeStop,
  cancelAction,
  DRIVER_STATES
};
