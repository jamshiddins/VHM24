const winston = require('winston');

async function errorHandler(bot, msg, error) {
  const chatId = msg.chat.id;
  
  // Log the error
  if (global.logger) {
    global.logger.error('Telegram bot error:', {
      error: error.message,
      stack: error.stack,
      userId: msg.from?.id,
      username: msg.from?.username,
      command: msg.text
    });
  } else {
    console.error('Telegram bot error:', error);
  }
  
  // User-friendly error messages
  let userMessage = '❌ An error occurred. Please try again later.';
  
  if (error.response?.status === 401) {
    userMessage = '🔐 Authentication required. Please use /start to login.';
  } else if (error.response?.status === 403) {
    userMessage = '🚫 Access denied. You don\'t have permission for this action.';
  } else if (error.response?.status === 404) {
    userMessage = '🔍 Not found. The requested resource doesn\'t exist.';
  } else if (error.code === 'ECONNREFUSED') {
    userMessage = '🔌 Connection error. Services might be temporarily unavailable.';
  } else if (error.message?.includes('timeout')) {
    userMessage = '⏱️ Request timeout. Please try again.';
  }
  
  try {
    await bot.sendMessage(chatId, userMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Try Again', callback_data: 'retry_last_action' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]]
      }
    });
  } catch (sendError) {
    console.error('Failed to send error message:', sendError);
  }
}

module.exports = { errorHandler };
