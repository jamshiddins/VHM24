async function handleSettings(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, 
      '⚙️ *Настройки VHM24*\n\n' +
      'Управление настройками бота:',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔔 Уведомления', callback_data: 'settings_notifications' },
              { text: '🌐 Язык', callback_data: 'settings_language' }
            ],
            [
              { text: '📍 Локация', callback_data: 'settings_location' },
              { text: '⏰ Часовой пояс', callback_data: 'settings_timezone' }
            ],
            [
              { text: '👤 Профиль', callback_data: 'settings_profile' },
              { text: '🔐 Безопасность', callback_data: 'settings_security' }
            ],
            [
              { text: '🔗 Привязать аккаунт', callback_data: 'settings_link_account' },
              { text: '📞 Поддержка 24/7', callback_data: 'settings_support' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    global.logger.error('Settings handler error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка настроек');
  }
}

// Обработчик привязки аккаунта
async function handleLinkAccount(bot, msg, email) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  try {
    // Получаем токен пользователя
    const token = global.userTokens.get(msg.from.id);
    
    if (!token) {
      await bot.sendMessage(chatId, 
        '⚠️ Для привязки аккаунта необходимо авторизоваться.\n' +
        'Пожалуйста, введите email и пароль:',
        {
          reply_markup: {
            force_reply: true,
            selective: true
          }
        }
      );
      return;
    }
    
    // Отправляем запрос на привязку Telegram ID
    const response = await global.apiClient.post('/auth/link-telegram', {
      telegramId
    });
    
    if (response.data.success) {
      await bot.sendMessage(chatId, 
        '✅ Ваш Telegram аккаунт успешно привязан к системе VHM24!\n\n' +
        'Теперь вы можете использовать Telegram для быстрого входа в систему 24/7.'
      );
    } else {
      await bot.sendMessage(chatId, 
        '❌ Не удалось привязать аккаунт.\n' +
        'Пожалуйста, попробуйте позже или обратитесь в поддержку.'
      );
    }
  } catch (error) {
    global.logger.error('Link account error:', error);
    await bot.sendMessage(chatId, 
      '❌ Ошибка при привязке аккаунта.\n' +
      'Пожалуйста, попробуйте позже или обратитесь в поддержку.'
    );
  }
}

module.exports = { handleSettings, handleLinkAccount };
