/**
 * VHM24 Operator Handler with FSM
 * Обработчик для операторов с поддержкой установки бункеров, фиксации остатков и проблем
 */

const fsmManager = require('../fsm/manager');
const { OPERATOR_STATES, COMMON_STATES } = require('../fsm/states');

/**
 * Главное меню оператора
 */
async function showOperatorMenu(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Проверяем роль пользователя
    const userInfo = await getUserInfo(userId);
    if (!userInfo || !userInfo.roles.includes('OPERATOR')) {
      await bot.sendMessage(chatId,
        `❌ У вас нет прав оператора. Обратитесь к администратору.`
      );
      return;
    }

    // Получаем статистику оператора
    const stats = await getOperatorStats(userId);

    let message = `🎯 *Меню оператора*\n\n`;
    message += `📊 *Статистика:*\n`;
    message += `✅ Задач выполнено сегодня: ${stats.tasksCompleted || 0}\n`;
    message += `📋 Активных задач: ${stats.activeTasks || 0}\n`;
    message += `🗃️ Бункеров установлено: ${stats.bunkersInstalled || 0}\n`;
    message += `⚠️ Проблем зафиксировано: ${stats.problemsReported || 0}\n\n`;

    const keyboards = [
      [
        { text: '🗃️ Установить бункер', callback_data: 'operator_install_bunker' },
        { text: '📊 Указать остатки', callback_data: 'operator_set_remains' }
      ],
      [
        { text: '📸 Фото ДО', callback_data: 'operator_photo_before' },
        { text: '📸 Фото ПОСЛЕ', callback_data: 'operator_photo_after' }
      ],
      [
        { text: '⚠️ Сообщить о проблеме', callback_data: 'operator_report_problem' },
        { text: '📋 Мои задачи', callback_data: 'operator_my_tasks' }
      ],
      [
        { text: '🏭 Выбрать автомат', callback_data: 'operator_select_machine' },
        { text: '🔄 Обновить', callback_data: 'operator_refresh' }
      ],
      [
        { text: '🔙 Главное меню', callback_data: 'main_menu' }
      ]
    ];

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    });

  } catch (error) {
    global.logger.error('Operator menu error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при загрузке меню оператора. Попробуйте позже.`
    );
  }
}

/**
 * Выбор автомата
 */
async function selectMachine(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    // Получаем список доступных автоматов
    const machines = await getAvailableMachines();

    if (machines.length === 0) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Нет доступных автоматов',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, OPERATOR_STATES.WAITING_MACHINE_SELECTION);

    let message = `🏭 *Выбор автомата*\n\n`;
    message += `Выберите автомат для работы:\n\n`;

    const keyboards = [];
    machines.forEach((machine, index) => {
      const statusIcon = getStatusIcon(machine.status);
      keyboards.push([{
        text: `${statusIcon} ${machine.name} - ${machine.location?.address || 'Адрес не указан'}`,
        callback_data: `operator_machine_selected:${machine.id}`
      }]);
    });

    keyboards.push([{ text: '❌ Отмена', callback_data: 'operator_cancel' }]);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Select machine error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при загрузке автоматов',
      show_alert: true
    });
  }
}

/**
 * Обработка выбора автомата
 */
async function handleMachineSelection(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const machineId = callbackQuery.data.split(':')[1];

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== OPERATOR_STATES.WAITING_MACHINE_SELECTION) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Неверное состояние',
        show_alert: true
      });
      return;
    }

    // Получаем информацию об автомате
    const machine = await getMachineInfo(machineId);
    
    if (!machine) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Автомат не найден',
        show_alert: true
      });
      return;
    }

    // Сохраняем выбранный автомат
    await fsmManager.updateUserData(userId, {
      selectedMachine: machine
    });

    await fsmManager.setUserState(userId, COMMON_STATES.IDLE);

    await bot.editMessageText(
      `✅ *Автомат выбран*\n\n` +
      `🏭 ${machine.name}\n` +
      `📍 ${machine.location?.address || 'Адрес не указан'}\n` +
      `🔧 Статус: ${getStatusText(machine.status)}\n\n` +
      `Теперь вы можете выполнять операции с этим автоматом.`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown'
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '✅ Автомат выбран'
    });

    // Показываем обновленное меню
    setTimeout(() => {
      showOperatorMenu(bot, { chat: { id: chatId }, from: { id: userId } });
    }, 2000);

  } catch (error) {
    global.logger.error('Handle machine selection error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при выборе автомата',
      show_alert: true
    });
  }
}

/**
 * Установка бункера
 */
async function installBunker(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const userData = await fsmManager.getUserData(userId);
    
    if (!userData.selectedMachine) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Сначала выберите автомат',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, OPERATOR_STATES.WAITING_BUNKER_INSTALLATION);
    await fsmManager.updateUserData(userId, {
      action: 'install_bunker'
    });

    await bot.editMessageText(
      `🗃️ *Установка бункера*\n\n` +
      `🏭 Автомат: ${userData.selectedMachine.name}\n\n` +
      `📸 Сделайте фото бункера ДО установки:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⏭️ Пропустить фото', callback_data: 'operator_skip_photo_before' }],
            [{ text: '❌ Отмена', callback_data: 'operator_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Install bunker error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале установки бункера',
      show_alert: true
    });
  }
}

/**
 * Обработка фото установки бункера
 */
async function handleBunkerPhoto(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== OPERATOR_STATES.WAITING_BUNKER_INSTALLATION) {
      return false;
    }

    if (!msg.photo || msg.photo.length === 0) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте фото бункера.`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    const machine = userData.selectedMachine;

    // Получаем URL фото
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const photoUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

    // Сохраняем действие
    const taskAction = await global.apiClient.post('/task-actions', {
      taskId: userData.currentTaskId || null,
      action: 'BUNKER_INSTALLED',
      comment: `Установка бункера в автомате ${machine.name}`,
      location: machine.location?.address || '',
      photoUrls: [photoUrl],
      metadata: {
        machineId: machine.id,
        telegramUserId: userId,
        telegramFileId: photo.file_id
      }
    });

    await bot.sendMessage(chatId,
      `✅ *Бункер установлен!*\n\n` +
      `🏭 Автомат: ${machine.name}\n` +
      `📸 Фото сохранено\n` +
      `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
      `🆔 Номер операции: ${taskAction.data.data?.id || 'N/A'}`,
      { parse_mode: 'Markdown' }
    );

    await fsmManager.clearUserState(userId);
    await showOperatorMenu(bot, msg);

    return true;
  } catch (error) {
    global.logger.error('Handle bunker photo error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении фото. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Указание остатков
 */
async function setRemains(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const userData = await fsmManager.getUserData(userId);
    
    if (!userData.selectedMachine) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Сначала выберите автомат',
        show_alert: true
      });
      return;
    }

    // Получаем бункеры автомата
    const bunkers = await getMachineBunkers(userData.selectedMachine.id);

    if (bunkers.length === 0) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ У автомата нет бункеров',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, OPERATOR_STATES.WAITING_REMAINS_INPUT);
    await fsmManager.updateUserData(userId, {
      action: 'set_remains',
      bunkers: bunkers,
      currentBunkerIndex: 0,
      remainsData: []
    });

    const currentBunker = bunkers[0];

    await bot.editMessageText(
      `📊 *Указание остатков*\n\n` +
      `🏭 Автомат: ${userData.selectedMachine.name}\n` +
      `🗃️ Бункер: ${currentBunker.item.name}\n` +
      `📦 Текущий остаток: ${currentBunker.quantity} ${currentBunker.item.unit}\n\n` +
      `📝 Введите фактический остаток (${1}/${bunkers.length}):`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'operator_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Set remains error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале указания остатков',
      show_alert: true
    });
  }
}

/**
 * Обработка ввода остатков
 */
async function handleRemainsInput(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== OPERATOR_STATES.WAITING_REMAINS_INPUT) {
      return false;
    }

    const remainsText = msg.text;
    const remains = parseFloat(remainsText);

    if (isNaN(remains) || remains < 0) {
      await bot.sendMessage(chatId,
        `❌ Некорректное значение остатка. Введите положительное число или 0:`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    const bunkers = userData.bunkers;
    const currentBunkerIndex = userData.currentBunkerIndex;
    const currentBunker = bunkers[currentBunkerIndex];

    // Сохраняем остаток
    userData.remainsData.push({
      bunkerId: currentBunker.id,
      itemName: currentBunker.item.name,
      oldQuantity: currentBunker.quantity,
      newQuantity: remains
    });

    // Переходим к следующему бункеру
    const nextIndex = currentBunkerIndex + 1;
    
    if (nextIndex < bunkers.length) {
      // Есть еще бункеры
      await fsmManager.updateUserData(userId, {
        currentBunkerIndex: nextIndex,
        remainsData: userData.remainsData
      });

      const nextBunker = bunkers[nextIndex];

      await bot.sendMessage(chatId,
        `✅ Остаток сохранен: ${remains} ${currentBunker.item.unit}\n\n` +
        `📊 *Следующий бункер:*\n\n` +
        `🗃️ Бункер: ${nextBunker.item.name}\n` +
        `📦 Текущий остаток: ${nextBunker.quantity} ${nextBunker.item.unit}\n\n` +
        `📝 Введите фактический остаток (${nextIndex + 1}/${bunkers.length}):`,
        { parse_mode: 'Markdown' }
      );
    } else {
      // Все бункеры обработаны
      await saveAllRemains(userId, userData);
      
      let summary = `✅ *Все остатки обновлены!*\n\n`;
      summary += `🏭 Автомат: ${userData.selectedMachine.name}\n\n`;
      summary += `📊 *Сводка изменений:*\n`;
      
      userData.remainsData.forEach((item, index) => {
        const change = item.newQuantity - item.oldQuantity;
        const changeIcon = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
        summary += `${index + 1}. ${item.itemName}: ${item.oldQuantity} → ${item.newQuantity} ${changeIcon}\n`;
      });

      await bot.sendMessage(chatId, summary, { parse_mode: 'Markdown' });

      await fsmManager.clearUserState(userId);
      await showOperatorMenu(bot, msg);
    }

    return true;
  } catch (error) {
    global.logger.error('Handle remains input error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при обработке остатка. Попробуйте еще раз.`
    );
    return true;
  }
}

/**
 * Сообщение о проблеме
 */
async function reportProblem(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  try {
    const userData = await fsmManager.getUserData(userId);
    
    if (!userData.selectedMachine) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Сначала выберите автомат',
        show_alert: true
      });
      return;
    }

    await fsmManager.setUserState(userId, OPERATOR_STATES.WAITING_PROBLEM_DESCRIPTION);
    await fsmManager.updateUserData(userId, {
      action: 'report_problem'
    });

    await bot.editMessageText(
      `⚠️ *Сообщение о проблеме*\n\n` +
      `🏭 Автомат: ${userData.selectedMachine.name}\n\n` +
      `📝 Опишите проблему подробно:`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'operator_cancel' }]
          ]
        }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    global.logger.error('Report problem error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при начале сообщения о проблеме',
      show_alert: true
    });
  }
}

/**
 * Обработка описания проблемы
 */
async function handleProblemDescription(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== OPERATOR_STATES.WAITING_PROBLEM_DESCRIPTION) {
      return false;
    }

    const description = msg.text;

    if (!description || description.trim().length < 10) {
      await bot.sendMessage(chatId,
        `❌ Описание слишком короткое. Опишите проблему подробнее (минимум 10 символов):`
      );
      return true;
    }

    const userData = await fsmManager.getUserData(userId);
    const machine = userData.selectedMachine;

    // Создаем задачу для решения проблемы
    const task = await global.apiClient.post('/tasks', {
      title: `Проблема с автоматом ${machine.name}`,
      description: description.trim(),
      priority: 'HIGH',
      machineId: machine.id,
      status: 'CREATED'
    });

    if (task.data.success) {
      await bot.sendMessage(chatId,
        `✅ *Проблема зафиксирована!*\n\n` +
        `🏭 Автомат: ${machine.name}\n` +
        `📝 Описание: ${description.trim()}\n` +
        `🆔 Номер задачи: ${task.data.data.id}\n` +
        `⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
        `Задача передана техническим специалистам.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      throw new Error('Failed to create task');
    }

    await fsmManager.clearUserState(userId);
    await showOperatorMenu(bot, msg);

    return true;
  } catch (error) {
    global.logger.error('Handle problem description error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при сохранении проблемы. Попробуйте еще раз.`
    );
    return true;
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

    await showOperatorMenu(bot, {
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

async function getOperatorStats(userId) {
  try {
    const response = await global.apiClient.get(`/operators/${userId}/stats`);
    return response.data.data || {};
  } catch (error) {
    return {};
  }
}

async function getAvailableMachines() {
  try {
    const response = await global.apiClient.get('/machines?status=ONLINE,OFFLINE,MAINTENANCE');
    return response.data.data || [];
  } catch (error) {
    return [];
  }
}

async function getMachineInfo(machineId) {
  try {
    const response = await global.apiClient.get(`/machines/${machineId}`);
    return response.data.data;
  } catch (error) {
    return null;
  }
}

async function getMachineBunkers(machineId) {
  try {
    const response = await global.apiClient.get(`/machine-inventory?machineId=${machineId}`);
    return response.data.data || [];
  } catch (error) {
    return [];
  }
}

async function saveAllRemains(userId, userData) {
  try {
    for (const item of userData.remainsData) {
      await global.apiClient.patch(`/machine-inventory/${item.bunkerId}`, {
        quantity: item.newQuantity
      });

      // Создаем лог изменения
      await global.apiClient.post('/stock-movements', {
        itemId: item.itemId,
        type: 'ADJUSTMENT',
        quantity: item.newQuantity - item.oldQuantity,
        quantityBefore: item.oldQuantity,
        quantityAfter: item.newQuantity,
        reason: 'Корректировка остатков оператором',
        reference: `Operator-${userId}-${Date.now()}`,
        machineId: userData.selectedMachine.id,
        metadata: {
          telegramUserId: userId,
          operatorAdjustment: true
        }
      });
    }
  } catch (error) {
    global.logger.error('Save all remains error:', error);
    throw error;
  }
}

function getStatusIcon(status) {
  const icons = {
    'ONLINE': '🟢',
    'OFFLINE': '🔴',
    'MAINTENANCE': '🟡',
    'ERROR': '🚨'
  };
  return icons[status] || '⚪';
}

function getStatusText(status) {
  const texts = {
    'ONLINE': 'Онлайн',
    'OFFLINE': 'Офлайн',
    'MAINTENANCE': 'На обслуживании',
    'ERROR': 'Ошибка'
  };
  return texts[status] || status;
}

module.exports = {
  showOperatorMenu,
  selectMachine,
  handleMachineSelection,
  installBunker,
  handleBunkerPhoto,
  setRemains,
  handleRemainsInput,
  reportProblem,
  handleProblemDescription,
  cancelAction,
  OPERATOR_STATES
};
