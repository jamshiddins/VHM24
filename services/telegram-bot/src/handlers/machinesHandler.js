async function handleMachines(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    // Получаем список машин через API
    const response = await global.apiClient.get('/machines');
    
    if (response.data.success && response.data.data.items.length > 0) {
      const machines = response.data.data.items.slice(0, 10); // Показываем первые 10
      let message = '🏭 *Автоматы VHM24 (24/7)*\n\n';
      
      machines.forEach((machine, index) => {
        const statusIcon = machine.status === 'ONLINE' ? '🟢' : 
                          machine.status === 'OFFLINE' ? '🔴' : 
                          machine.status === 'MAINTENANCE' ? '🟡' : '🔴';
        
        message += `${index + 1}. ${statusIcon} *${machine.name}*\n`;
        message += `   📍 ${machine.location?.name || 'Не указано'}\n`;
        message += `   🔧 ${machine.status}\n`;
        message += `   📊 Код: ${machine.code}\n\n`;
      });
      
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Обновить', callback_data: 'machines_refresh' },
              { text: '📊 Статистика', callback_data: 'machines_stats' }
            ],
            [
              { text: '🚨 Только ошибки', callback_data: 'machines_errors' },
              { text: '🟢 Только онлайн', callback_data: 'machines_online' }
            ]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, '❌ Автоматы не найдены или сервис недоступен');
    }
  } catch (error) {
    global.logger.error('Machines handler error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка получения данных об автоматах');
  }
}

module.exports = { handleMachines };
