export async function handleStart(bot, msg) {
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
        `📧 ${response.data.user.email}\n` +
        `🔑 Роли: ${response.data.user.roles.join(', ')}\n\n` +
        `Используйте /help для просмотра доступных команд.`,
        { parse_mode: 'Markdown' }
      );
      
      // Показываем главное меню в зависимости от роли
      await showMainMenu(bot, chatId, response.data.user.roles);
    } else {
      // Новый пользователь - процесс регистрации
      await bot.sendMessage(chatId,
        `👋 Добро пожаловать в *VHM24 - VendHub Manager 24/7*!\n\n` +
        `⏰ Система управления кофейными автоматами,\nработающими 24 часа без перерыва.\n\n` +
        `Для начала работы необходима авторизация.\n` +
        `Пожалуйста, отправьте ваш номер телефона:`,
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
    }
  } catch (error) {
    await bot.sendMessage(chatId,
      `❌ Ошибка подключения к системе VHM24.\n` +
      `Система работает 24/7, но сейчас недоступна.\n` +
      `Попробуйте позже или обратитесь к администратору.`
    );
  }
}

async function showMainMenu(bot, chatId, roles) {
  const keyboards = [];
  
  // Меню в зависимости от роли
  if (roles.includes('ADMIN') || roles.includes('MANAGER')) {
    keyboards.push([
      { text: '🏭 Автоматы 24/7', callback_data: 'menu_machines' },
      { text: '📊 Отчеты', callback_data: 'menu_reports' }
    ]);
  }
  
  if (roles.includes('OPERATOR') || roles.includes('WAREHOUSE')) {
    keyboards.push([
      { text: '🗃️ Бункеры', callback_data: 'menu_bunkers' },
      { text: '📋 Задачи', callback_data: 'menu_tasks' }
    ]);
  }
  
  keyboards.push([
    { text: '📦 Склад', callback_data: 'menu_inventory' },
    { text: '🚨 Экстренные', callback_data: 'menu_urgent' }
  ]);
  
  keyboards.push([
    { text: '⚙️ Настройки', callback_data: 'menu_settings' },
    { text: '📞 Поддержка 24/7', callback_data: 'menu_support' }
  ]);
  
  await bot.sendMessage(chatId, 
    `🏠 *Главное меню VHM24*\n⏰ Система работает 24/7\n\nВыберите раздел:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboards
      }
    }
  );
}

export { showMainMenu };
