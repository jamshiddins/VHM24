// Start command handler
import { authenticate, setUserData } from '../utils/auth.js';

// Store user states for authentication flow
const userStates = new Map();

export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Check if already authenticated
  if (global.userTokens.has(userId)) {
    await showMainMenu(bot, chatId);
    return;
  }
  
  // Start authentication flow
  userStates.set(userId, { step: 'username' });
  
  await bot.sendMessage(chatId, 
    '👋 Welcome to VHM24 Vending Management Bot!\n\n' +
    '🔐 Please enter your username:',
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: 'Username'
      }
    }
  );
  
  // Set up message listener for authentication
  const authListener = async (authMsg) => {
    if (authMsg.from.id !== userId) return;
    
    const state = userStates.get(userId);
    if (!state) return;
    
    if (state.step === 'username') {
      state.username = authMsg.text;
      state.step = 'password';
      userStates.set(userId, state);
      
      await bot.sendMessage(chatId, 
        '🔑 Please enter your password:',
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: 'Password'
          }
        }
      );
      
      // Delete username message for security
      try {
        await bot.deleteMessage(chatId, authMsg.message_id);
      } catch (e) {
        // Ignore if can't delete
      }
    } else if (state.step === 'password') {
      const password = authMsg.text;
      
      // Delete password message immediately for security
      try {
        await bot.deleteMessage(chatId, authMsg.message_id);
      } catch (e) {
        // Ignore if can't delete
      }
      
      // Show loading message
      const loadingMsg = await bot.sendMessage(chatId, '🔄 Authenticating...');
      
      // Attempt authentication
      const result = await authenticate(state.username, password);
      
      // Delete loading message
      try {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
      } catch (e) {
        // Ignore
      }
      
      if (result.success) {
        // Store token and user data
        global.userTokens.set(userId, result.token);
        setUserData(userId, result.user);
        
        // Clean up state
        userStates.delete(userId);
        bot.removeListener('message', authListener);
        
        await bot.sendMessage(chatId, 
          `✅ Welcome, ${result.user.name || result.user.username}!\n\n` +
          `👤 Role: ${result.user.role}\n` +
          `📧 Email: ${result.user.email || 'Not set'}`,
          {
            reply_markup: {
              remove_keyboard: true
            }
          }
        );
        
        // Show main menu after a short delay
        setTimeout(() => showMainMenu(bot, chatId), 1000);
      } else {
        // Authentication failed
        userStates.delete(userId);
        bot.removeListener('message', authListener);
        
        await bot.sendMessage(chatId, 
          `❌ Authentication failed: ${result.error}\n\n` +
          'Please try again with /start',
          {
            reply_markup: {
              inline_keyboard: [[
                { text: '🔄 Try Again', callback_data: 'start' }
              ]]
            }
          }
        );
      }
    }
  };
  
  bot.on('message', authListener);
  
  // Clean up listener after 5 minutes
  setTimeout(() => {
    if (userStates.has(userId)) {
      userStates.delete(userId);
      bot.removeListener('message', authListener);
      bot.sendMessage(chatId, '⏱️ Authentication timeout. Please use /start to try again.');
    }
  }, 5 * 60 * 1000);
}

export async function showMainMenu(bot, chatId) {
  const menuKeyboard = {
    inline_keyboard: [
      [
        { text: '🏭 Machines', callback_data: 'menu_machines' },
        { text: '📦 Inventory', callback_data: 'menu_inventory' }
      ],
      [
        { text: '📋 Tasks', callback_data: 'menu_tasks' },
        { text: '📊 Reports', callback_data: 'menu_reports' }
      ],
      [
        { text: '⚙️ Settings', callback_data: 'menu_settings' },
        { text: '❓ Help', callback_data: 'menu_help' }
      ],
      [
        { text: '🚪 Logout', callback_data: 'logout' }
      ]
    ]
  };
  
  await bot.sendMessage(chatId, 
    '🏠 *Main Menu*\n\n' +
    'Choose an option from the menu below:',
    {
      parse_mode: 'Markdown',
      reply_markup: menuKeyboard
    }
  );
}
