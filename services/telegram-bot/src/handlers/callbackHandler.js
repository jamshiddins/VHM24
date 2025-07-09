async function handleCallbackQuery(bot, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  try {
    // Подтверждаем получение callback
    await bot.answerCallbackQuery(callbackQuery.id);
    
    // Обрабатываем различные callback данные
    switch (data) {
      // Главное меню
      case 'menu_machines':
        await bot.sendMessage(chatId, '🏭 Загрузка данных об автоматах...');
        // Здесь можно вызвать handleMachines
        break;
        
      case 'menu_inventory':
        await bot.sendMessage(chatId, '📦 Загрузка данных о складе...');
        // Здесь можно вызвать handleInventory
        break;
        
      case 'menu_tasks':
        await bot.sendMessage(chatId, '📋 Загрузка задач...');
        // Здесь можно вызвать handleTasks
        break;
        
      case 'menu_reports':
        await bot.sendMessage(chatId, '📊 Загрузка отчетов...');
        // Здесь можно вызвать handleReports
        break;
        
      case 'menu_settings':
        await bot.sendMessage(chatId, '⚙️ Загрузка настроек...');
        const { handleSettings } = require('./settingsHandler');
        await handleSettings(bot, callbackQuery.message);
        break;
        
      case 'settings_link_account':
        const { handleLinkAccount } = require('./settingsHandler');
        await handleLinkAccount(bot, callbackQuery.message);
        break;
        
      case 'menu_support':
        await bot.sendMessage(chatId, 
          '📞 *Поддержка VHM24 - 24/7*\n\n' +
          '🕐 Мы работаем круглосуточно!\n\n' +
          '📧 Email: support@vhm24.uz\n' +
          '📱 Telegram: @vhm24_support\n' +
          '☎️ Горячая линия: +998 71 XXX-XX-XX\n\n' +
          '🚨 Для экстренных случаев используйте кнопку "Экстренные"',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 'menu_urgent':
        await bot.sendMessage(chatId, 
          '🚨 *ЭКСТРЕННАЯ СВЯЗЬ*\n\n' +
          '⚠️ Используйте только в критических ситуациях!\n\n' +
          '📞 Экстренная линия: +998 71 XXX-XX-XX\n' +
          '📱 Дежурный администратор: @vhm24_emergency\n\n' +
          'Опишите проблему максимально подробно.',
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🚨 Автомат не работает', callback_data: 'urgent_machine_down' },
                  { text: '💰 Проблемы с деньгами', callback_data: 'urgent_money' }
                ],
                [
                  { text: '🔥 Пожар/ЧС', callback_data: 'urgent_fire' },
                  { text: '🔧 Техническая авария', callback_data: 'urgent_tech' }
                ]
              ]
            }
          }
        );
        break;
        
      // Обновления данных
      case 'machines_refresh':
      case 'inventory_refresh':
      case 'tasks_refresh':
        await bot.sendMessage(chatId, '🔄 Обновление данных...');
        break;
        
      // Статистика
      case 'machines_stats':
        await bot.sendMessage(chatId, 
          '📊 *Статистика автоматов*\n\n' +
          '🟢 Онлайн: 12\n' +
          '🔴 Офлайн: 3\n' +
          '🟡 На обслуживании: 1\n' +
          '🚨 С ошибками: 2\n\n' +
          '📈 Общая загрузка: 85%\n' +
          '💰 Выручка сегодня: 1,250,000 сум',
          { parse_mode: 'Markdown' }
        );
        break;
        
      default:
        await bot.sendMessage(chatId, '⚠️ Функция в разработке');
        break;
    }
  } catch (error) {
    global.logger.error('Callback handler error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Ошибка обработки запроса',
      show_alert: true
    });
  }
}

module.exports = { handleCallbackQuery };
