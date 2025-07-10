const registrationHandler = require('./registrationHandler.js');

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'Operator';
  
  // Проверяем, есть ли пользователь в системе
  try {
    const response = await global.apiClient.post('/auth/login', {
      telegramId: userId.toString()
    });
    
    if (response.data.success) {
      // Пользователь найден, сохраняем токен
      global.userTokens.set(userId, response.data.token);
      global.currentUserId = userId;
      
      await bot.sendMessage(chatId, 
        `🎉 Добро пожаловать в *VHM24 - VendHub Manager 24/7*!\n\n` +
        `⏰ Система работает круглосуточно без выходных\n\n` +
        `👤 ${response.data.user.name}\n` +
        `🆔 Telegram: @${response.data.user.telegramUsername || username}\n` +
        `🔑 Роли: ${response.data.user.roles.join(', ')}\n\n` +
        `Используйте /help для просмотра доступных команд.`,
        { parse_mode: 'Markdown' }
      );
      
      // Показываем главное меню в зависимости от роли
      await showMainMenu(bot, chatId, response.data.user.roles, response.data.user);
    } else {
      // Новый пользователь - запускаем процесс регистрации через FSM
      await registrationHandler.startRegistration(bot, msg);
    }
  } catch (error) {
    // Пользователь не найден - запускаем процесс регистрации через FSM
    await registrationHandler.startRegistration(bot, msg);
  }
}

async function showMainMenu(bot, chatId, roles, userInfo) {
  const keyboards = [];
  
  // Меню в зависимости от роли
  if (roles.includes('ADMIN') || roles.includes('MANAGER')) {
    keyboards.push([
      { text: '🏭 Автоматы 24/7', callback_data: 'menu_machines' },
      { text: '📊 Отчеты', callback_data: 'menu_reports' }
    ]);
  }
  
  // Роль водителя (может быть дополнительной к любой роли)
  if (userInfo?.isDriver) {
    keyboards.push([
      { text: '🚛 Меню водителя', callback_data: 'menu_driver' }
    ]);
  }
  
  // Роль складского работника
  if (roles.includes('WAREHOUSE')) {
    keyboards.push([
      { text: '📦 Меню склада', callback_data: 'menu_warehouse' }
    ]);
  }
  
  // Роль оператора
  if (roles.includes('OPERATOR')) {
    keyboards.push([
      { text: '🎯 Меню оператора', callback_data: 'menu_operator' }
    ]);
  }
  
  // Роль техника
  if (roles.includes('TECHNICIAN')) {
    keyboards.push([
      { text: '🔧 Меню техника', callback_data: 'menu_technician' }
    ]);
  }
  
  // Общие разделы
  keyboards.push([
    { text: '📋 Задачи', callback_data: 'menu_tasks' },
    { text: '📦 Склад', callback_data: 'menu_inventory' }
  ]);
  
  keyboards.push([
    { text: '🚨 Экстренные', callback_data: 'menu_urgent' },
    { text: '📞 Поддержка 24/7', callback_data: 'menu_support' }
  ]);
  
  keyboards.push([
    { text: '⚙️ Настройки', callback_data: 'menu_settings' }
  ]);
  
  let menuText = `🏠 *Главное меню VHM24*\n⏰ Система работает 24/7\n\n`;
  menuText += `👤 ${userInfo?.name || 'Пользователь'}\n`;
  
  if (userInfo?.telegramUsername) {
    menuText += `🆔 Telegram: @${userInfo.telegramUsername}\n`;
  }
  
  menuText += `🔑 Роли: ${roles.join(', ')}`;
  
  if (userInfo?.isDriver) {
    menuText += ` + Водитель`;
  }
  
  menuText += `\n\nВыберите раздел:`;
  
  await bot.sendMessage(chatId, menuText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboards
    }
  });
}

module.exports = { handleStart, showMainMenu };
