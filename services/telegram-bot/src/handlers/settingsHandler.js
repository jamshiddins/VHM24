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

module.exports = { handleSettings };
