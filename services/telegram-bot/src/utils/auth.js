// Authentication utilities

export async function checkAuth(bot, msg) {
  const userId = msg.from.id;
  const token = global.userTokens.get(userId);
  
  if (!token) {
    await bot.sendMessage(msg.chat.id, 
      '🔒 You need to authenticate first.\n' +
      'Please use /start command to login.',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Start', callback_data: 'start' }
          ]]
        }
      }
    );
    return false;
  }
  
  // Set current user for API requests
  global.currentUserId = userId;
  return true;
}

export async function authenticate(username, password) {
  try {
    const response = await global.apiClient.post('/auth/login', {
      username,
      password
    });
    
    return {
      success: true,
      token: response.data.data.access_token,
      user: response.data.data.user
    };
  } catch (error) {
    global.logger.error('Authentication failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Authentication failed'
    };
  }
}

export function isAdmin(userId) {
  return global.config.adminIds.includes(String(userId));
}

export async function requireAdmin(bot, msg) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, 
      '⛔ This command requires administrator privileges.'
    );
    return false;
  }
  return true;
}

export function getUserData(userId) {
  return global.userData?.get(userId) || null;
}

export function setUserData(userId, data) {
  if (!global.userData) {
    global.userData = new Map();
  }
  global.userData.set(userId, data);
}

export function clearUserData(userId) {
  global.userData?.delete(userId);
  global.userTokens?.delete(userId);
}
