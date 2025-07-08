// Error handling utilities

export async function errorHandler(bot, msg, error) {
  global.logger.error('Error handling message:', {
    userId: msg.from?.id,
    username: msg.from?.username,
    text: msg.text,
    error: error.message,
    stack: error.stack
  });

  let errorMessage = '❌ An error occurred';
  
  // User-friendly error messages
  if (error.response) {
    // API error
    const status = error.response.status;
    const message = error.response.data?.message;
    
    switch (status) {
      case 401:
        errorMessage = '🔒 Authentication expired. Please use /start to login again.';
        // Clear user token
        global.userTokens?.delete(msg.from.id);
        break;
      case 403:
        errorMessage = '⛔ You don\'t have permission to perform this action.';
        break;
      case 404:
        errorMessage = '🔍 The requested resource was not found.';
        break;
      case 422:
        errorMessage = `⚠️ Invalid data: ${message || 'Please check your input'}`;
        break;
      case 500:
        errorMessage = '🚨 Server error. Please try again later.';
        break;
      default:
        errorMessage = `❌ Error: ${message || 'Something went wrong'}`;
    }
  } else if (error.code === 'ECONNREFUSED') {
    errorMessage = '🔌 Cannot connect to the server. Please try again later.';
  } else if (error.code === 'ETIMEDOUT') {
    errorMessage = '⏱️ Request timeout. Please try again.';
  }

  try {
    await bot.sendMessage(msg.chat.id, errorMessage, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Try Again', callback_data: 'retry_last_action' },
          { text: '🏠 Main Menu', callback_data: 'main_menu' }
        ]]
      }
    });
  } catch (sendError) {
    global.logger.error('Failed to send error message:', sendError);
  }
}

export function formatError(error) {
  if (error.response?.data?.errors) {
    // Validation errors
    const errors = error.response.data.errors;
    let message = '⚠️ Validation errors:\n';
    
    for (const [field, messages] of Object.entries(errors)) {
      message += `• ${field}: ${messages.join(', ')}\n`;
    }
    
    return message;
  }
  
  return error.response?.data?.message || error.message || 'Unknown error';
}

export class BotError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'BotError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleApiError(error) {
  if (error.response) {
    throw new BotError(
      formatError(error),
      'API_ERROR',
      error.response.status
    );
  } else if (error.request) {
    throw new BotError(
      'No response from server',
      'NO_RESPONSE',
      503
    );
  } else {
    throw new BotError(
      error.message,
      'REQUEST_ERROR',
      500
    );
  }
}
