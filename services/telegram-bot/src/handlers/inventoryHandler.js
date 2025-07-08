async function handleInventory(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    // Получаем инвентарь через API
    const response = await global.apiClient.get('/inventory');
    
    if (response.data.success && response.data.data.items.length > 0) {
      const items = response.data.data.items.slice(0, 10);
      let message = '📦 *Склад VHM24*\n\n';
      
      items.forEach((item, index) => {
        const lowStock = item.quantity <= (item.minQuantity || 10);
        const stockIcon = lowStock ? '🔴' : '🟢';
        
        message += `${index + 1}. ${stockIcon} *${item.name}*\n`;
        message += `   📊 Остаток: ${item.quantity} ${item.unit}\n`;
        message += `   📋 SKU: ${item.sku}\n`;
        if (lowStock) {
          message += `   ⚠️ Низкий остаток!\n`;
        }
        message += '\n';
      });
      
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Обновить', callback_data: 'inventory_refresh' },
              { text: '🔴 Низкие остатки', callback_data: 'inventory_low' }
            ],
            [
              { text: '📊 Статистика', callback_data: 'inventory_stats' },
              { text: '📝 Добавить товар', callback_data: 'inventory_add' }
            ]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, '❌ Товары не найдены или сервис недоступен');
    }
  } catch (error) {
    global.logger.error('Inventory handler error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка получения данных о складе');
  }
}

module.exports = { handleInventory };
