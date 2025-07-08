async function checkAuth(bot, msg) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  
  // Проверяем, есть ли токен пользователя
  const token = global.userTokens?.get(userId);
  
  if (!token) {
    await bot.sendMessage(chatId, 
      '🔐 *Требуется авторизация*\n\n' +
      'Для использования VHM24 необходимо войти в систему.\n' +
      'Используйте команду /start для авторизации.',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать работу', callback_data: 'start_auth' }]
          ]
        }
      }
    );
    return false;
  }
  
  // Проверяем валидность токена через API
  try {
    const response = await global.apiClient.get('/auth/me');
    
    if (response.data.success) {
      // Токен валиден, обновляем информацию о пользователе
      global.currentUserId = userId;
      return true;
    } else {
      // Токен недействителен, удаляем его
      global.userTokens.delete(userId);
      await bot.sendMessage(chatId, 
        '⚠️ *Сессия истекла*\n\n' +
        'Ваша сессия истекла. Пожалуйста, авторизуйтесь заново.\n' +
        'Используйте команду /start',
        { parse_mode: 'Markdown' }
      );
      return false;
    }
  } catch (error) {
    global.logger.error('Auth check error:', error);
    
    // В случае ошибки API, считаем что пользователь не авторизован
    await bot.sendMessage(chatId, 
      '❌ *Ошибка авторизации*\n\n' +
      'Не удается проверить авторизацию. Система VHM24 может быть временно недоступна.\n' +
      'Попробуйте позже или обратитесь к администратору.',
      { parse_mode: 'Markdown' }
    );
    return false;
  }
}

function getUserToken(userId) {
  return global.userTokens?.get(userId);
}

function setUserToken(userId, token) {
  if (!global.userTokens) {
    global.userTokens = new Map();
  }
  global.userTokens.set(userId, token);
}

function removeUserToken(userId) {
  global.userTokens?.delete(userId);
}

function isAdmin(userId) {
  const adminIds = global.config?.adminIds || [];
  return adminIds.includes(userId.toString());
}

module.exports = {
  checkAuth,
  getUserToken,
  setUserToken,
  removeUserToken,
  isAdmin
};
