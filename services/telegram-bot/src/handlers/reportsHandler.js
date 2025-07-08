async function handleReports(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, 
      '📊 *Отчеты VHM24*\n\n' +
      'Выберите тип отчета:',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📈 Продажи за день', callback_data: 'report_sales_day' },
              { text: '📊 Продажи за неделю', callback_data: 'report_sales_week' }
            ],
            [
              { text: '🏭 Статус автоматов', callback_data: 'report_machines' },
              { text: '📦 Остатки товаров', callback_data: 'report_inventory' }
            ],
            [
              { text: '📋 Выполненные задачи', callback_data: 'report_tasks' },
              { text: '💰 Финансовый отчет', callback_data: 'report_finance' }
            ],
            [
              { text: '📄 Полный отчет', callback_data: 'report_full' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    global.logger.error('Reports handler error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка получения отчетов');
  }
}

module.exports = { handleReports };
