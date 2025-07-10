/**
 * VHM24 Registration Handler with FSM
 * Упрощенный процесс регистрации через Telegram
 */

const fsmManager = require('../fsm/manager');
const { REGISTRATION_STATES, COMMON_STATES } = require('../fsm/states');

/**
 * Начать процесс регистрации
 */
async function startRegistration(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name || 'Пользователь';

  try {
    // Проверяем, не зарегистрирован ли уже пользователь
    const response = await global.apiClient.post('/auth/login', {
      telegramId: userId.toString()
    });

    if (response.data.success) {
      // Пользователь уже зарегистрирован
      global.userTokens.set(userId, response.data.token);
      global.currentUserId = userId;
      
      await bot.sendMessage(chatId, 
        `✅ Вы уже зарегистрированы в системе VHM24!\n\n` +
        `👤 ${response.data.user.name}\n` +
        `🔑 Роли: ${response.data.user.roles.join(', ')}\n\n` +
        `Используйте /help для просмотра команд.`,
        { parse_mode: 'Markdown' }
      );
      
      await fsmManager.setUserState(userId, COMMON_STATES.IDLE);
      return;
    }
  } catch (error) {
    // Пользователь не найден, продолжаем регистрацию
  }

  // Начинаем процесс регистрации
  await fsmManager.setUserData(userId, {
    username,
    telegramId: userId.toString(),
    telegramUsername: msg.from.username || null,
    startTime: new Date().toISOString()
  });

  await fsmManager.setUserState(userId, REGISTRATION_STATES.WAITING_PHONE);

  await bot.sendMessage(chatId,
    `🎉 *Добро пожаловать в VHM24!*\n\n` +
    `⏰ Система управления кофейными автоматами 24/7\n\n` +
    `📋 *Упрощенный процесс регистрации:*\n` +
    `1️⃣ Подтверждение номера телефона\n` +
    `2️⃣ Ожидание одобрения администратора\n\n` +
    `📱 *Шаг 1:* Пожалуйста, поделитесь вашим номером телефона:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{
          text: '📱 Отправить номер телефона',
          request_contact: true
        }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );

  // Устанавливаем таймаут на 10 минут
  await fsmManager.setStateTimeout(userId, 10 * 60 * 1000);
}

/**
 * Обработка контакта (номера телефона)
 */
async function handlePhoneNumber(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const currentState = await fsmManager.getUserState(userId);
    
    if (currentState !== REGISTRATION_STATES.WAITING_PHONE) {
      return false; // Не наше состояние
    }

    if (!msg.contact || msg.contact.user_id !== userId) {
      await bot.sendMessage(chatId,
        `❌ Пожалуйста, отправьте именно ваш номер телефона, используя кнопку "📱 Отправить номер телефона".`,
        {
          reply_markup: {
            keyboard: [[{
              text: '📱 Отправить номер телефона',
              request_contact: true
            }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      return true;
    }

    const phoneNumber = msg.contact.phone_number;
    
    // Нормализуем номер телефона
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('998')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('8')) {
      normalizedPhone = '+7' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // Проверяем, не используется ли уже этот номер
    try {
      const existingUser = await global.apiClient.post('/auth/login', {
        phoneNumber: normalizedPhone
      });
      
      if (existingUser.data.success) {
        await bot.sendMessage(chatId,
          `❌ Этот номер телефона уже зарегистрирован в системе.\n\n` +
          `Если это ваш номер, обратитесь к администратору для восстановления доступа.`,
          { reply_markup: { remove_keyboard: true } }
        );
        await fsmManager.clearUserState(userId);
        return true;
      }
    } catch (error) {
      // Номер не найден, продолжаем
    }

    // Сохраняем номер телефона и данные пользователя
    await fsmManager.updateUserData(userId, {
      phoneNumber: normalizedPhone,
      firstName: msg.from.first_name || '',
      lastName: msg.from.last_name || ''
    });

    // Получаем данные пользователя
    const userData = await fsmManager.getUserData(userId);

    // Создаем пользователя в системе через API
    try {
      // Формируем данные для создания пользователя
      const apiData = {
        telegramId: userId.toString(),
        telegramUsername: userData.telegramUsername,
        name: `${userData.firstName} ${userData.lastName}`.trim() || userData.username,
        phoneNumber: userData.phoneNumber,
        email: `telegram_${userId}@vhm24.local`, // Временный email
        roles: ['OPERATOR'] // Роль по умолчанию
      };

      // Отправляем запрос на создание пользователя
      const response = await global.apiClient.post('/users', apiData);

      if (response.data.success) {
        // Получаем токен для пользователя
        const loginResponse = await global.apiClient.post('/auth/login', {
          telegramId: userId.toString()
        });

        if (loginResponse.data.success) {
          // Сохраняем токен
          global.userTokens.set(userId, loginResponse.data.token);
          global.currentUserId = userId;

          // Обновляем состояние FSM
          await fsmManager.setUserState(userId, REGISTRATION_STATES.WAITING_ADMIN_APPROVAL);
          await fsmManager.updateUserData(userId, {
            userId: response.data.data.id,
            registrationCompleted: true
          });

          // Отправляем сообщение пользователю
          await bot.sendMessage(chatId,
            `✅ *Регистрация завершена!*\n\n` +
            `👤 Имя: ${response.data.data.name}\n` +
            `📱 Телефон: ${userData.phoneNumber}\n` +
            `🆔 Telegram: @${userData.telegramUsername || 'не указан'}\n` +
            `🆔 ID: ${response.data.data.id}\n\n` +
            `⏳ *Ожидание одобрения администратора*\n\n` +
            `Ваша заявка отправлена администратору для одобрения. ` +
            `Вы получите уведомление, когда доступ будет активирован.\n\n` +
            `📞 Для срочных вопросов обращайтесь к администратору.`,
            { 
              parse_mode: 'Markdown',
              reply_markup: { remove_keyboard: true }
            }
          );

          // Уведомляем администраторов
          await notifyAdminsAboutNewUser(bot, response.data.data, userData);
        } else {
          throw new Error('Failed to login after registration');
        }
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      global.logger.error('Registration API error:', error);
      await bot.sendMessage(chatId,
        `❌ Ошибка при создании аккаунта. Попробуйте позже или обратитесь к администратору.`,
        { reply_markup: { remove_keyboard: true } }
      );
      await fsmManager.clearUserState(userId);
    }

    return true;
  } catch (error) {
    global.logger.error('Registration phone error:', error);
    await bot.sendMessage(chatId,
      `❌ Ошибка при обработке номера телефона. Попробуйте еще раз или обратитесь к администратору.`,
      { reply_markup: { remove_keyboard: true } }
    );
    return true;
  }
}

/**
 * Уведомление администраторов о новом пользователе
 */
async function notifyAdminsAboutNewUser(bot, user, userData) {
  try {
    const adminIds = global.config.adminIds || [];
    
    const message = 
      `🆕 *Новая заявка на регистрацию*\n\n` +
      `👤 Имя: ${user.name}\n` +
      `📱 Телефон: ${userData.phoneNumber}\n` +
      `🆔 Telegram: @${userData.telegramUsername || 'не указан'}\n` +
      `🆔 User ID: ${user.id}\n` +
      `📅 Дата: ${new Date().toLocaleString('ru-RU')}\n\n` +
      `Одобрить регистрацию?`;

    for (const adminId of adminIds) {
      try {
        await bot.sendMessage(adminId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Одобрить', callback_data: `approve_user:${user.id}` },
                { text: '❌ Отклонить', callback_data: `reject_user:${user.id}` }
              ],
              [
                { text: '👤 Профиль', callback_data: `user_profile:${user.id}` }
              ]
            ]
          }
        });
      } catch (error) {
        global.logger.error(`Failed to notify admin ${adminId}:`, error);
      }
    }
  } catch (error) {
    global.logger.error('Failed to notify admins:', error);
  }
}

/**
 * Одобрение пользователя администратором
 */
async function approveUser(bot, callbackQuery) {
  const adminId = callbackQuery.from.id;
  const userId = callbackQuery.data.split(':')[1];

  try {
    // Проверяем права администратора
    if (!global.config.adminIds.includes(adminId.toString())) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ У вас нет прав администратора',
        show_alert: true
      });
      return;
    }

    // Обновляем статус пользователя
    const response = await global.apiClient.patch(`/users/${userId}`, {
      registrationStatus: 'APPROVED',
      isActive: true
    });

    if (response.data.success) {
      // Находим пользователя в FSM
      const usersInWaiting = await fsmManager.getUsersInState(REGISTRATION_STATES.WAITING_ADMIN_APPROVAL);
      let targetTelegramId = null;

      for (const telegramId of usersInWaiting) {
        const userData = await fsmManager.getUserData(telegramId);
        if (userData.userId === userId) {
          targetTelegramId = telegramId;
          break;
        }
      }

      if (targetTelegramId) {
        await fsmManager.setUserState(targetTelegramId, REGISTRATION_STATES.COMPLETED);
        
        // Уведомляем пользователя
        await bot.sendMessage(targetTelegramId,
          `🎉 *Поздравляем! Ваша регистрация одобрена!*\n\n` +
          `✅ Доступ к системе VHM24 активирован\n` +
          `🔑 Теперь вы можете использовать все функции бота\n\n` +
          `Используйте /help для просмотра доступных команд.`,
          { parse_mode: 'Markdown' }
        );

        await fsmManager.clearUserState(targetTelegramId);
      }

      // Обновляем сообщение администратора
      await bot.editMessageText(
        callbackQuery.message.text + `\n\n✅ *Одобрено администратором*`,
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '✅ Пользователь одобрен'
      });

    } else {
      throw new Error('Failed to approve user');
    }
  } catch (error) {
    global.logger.error('Approve user error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при одобрении пользователя',
      show_alert: true
    });
  }
}

/**
 * Отклонение пользователя администратором
 */
async function rejectUser(bot, callbackQuery) {
  const adminId = callbackQuery.from.id;
  const userId = callbackQuery.data.split(':')[1];

  try {
    // Проверяем права администратора
    if (!global.config.adminIds.includes(adminId.toString())) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ У вас нет прав администратора',
        show_alert: true
      });
      return;
    }

    // Обновляем статус пользователя
    const response = await global.apiClient.patch(`/users/${userId}`, {
      registrationStatus: 'REJECTED',
      isActive: false
    });

    if (response.data.success) {
      // Находим пользователя в FSM
      const usersInWaiting = await fsmManager.getUsersInState(REGISTRATION_STATES.WAITING_ADMIN_APPROVAL);
      let targetTelegramId = null;

      for (const telegramId of usersInWaiting) {
        const userData = await fsmManager.getUserData(telegramId);
        if (userData.userId === userId) {
          targetTelegramId = telegramId;
          break;
        }
      }

      if (targetTelegramId) {
        // Уведомляем пользователя
        await bot.sendMessage(targetTelegramId,
          `❌ *Регистрация отклонена*\n\n` +
          `К сожалению, ваша заявка на регистрацию была отклонена администратором.\n\n` +
          `📞 Для получения дополнительной информации обратитесь к администратору.`
        );

        await fsmManager.clearUserState(targetTelegramId);
      }

      // Обновляем сообщение администратора
      await bot.editMessageText(
        callbackQuery.message.text + `\n\n❌ *Отклонено администратором*`,
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Пользователь отклонен'
      });

    } else {
      throw new Error('Failed to reject user');
    }
  } catch (error) {
    global.logger.error('Reject user error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка при отклонении пользователя',
      show_alert: true
    });
  }
}

// Заглушка для обратной совместимости
function handlePassword(bot, msg) {
  return false; // Больше не используется
}

module.exports = {
  startRegistration,
  handlePhoneNumber,
  handlePassword, // Оставляем для обратной совместимости
  approveUser,
  rejectUser,
  REGISTRATION_STATES
};
