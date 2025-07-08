async function handleTasks(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    // Получаем задачи через API
    const response = await global.apiClient.get('/tasks');
    
    if (response.data.success && response.data.data.items.length > 0) {
      const tasks = response.data.data.items.slice(0, 10);
      let message = '📋 *Задачи VHM24*\n\n';
      
      tasks.forEach((task, index) => {
        const statusIcon = task.status === 'COMPLETED' ? '✅' : 
                          task.status === 'IN_PROGRESS' ? '🔄' : 
                          task.status === 'ASSIGNED' ? '👤' : '📝';
        
        const priorityIcon = task.priority === 'URGENT' ? '🚨' : 
                            task.priority === 'HIGH' ? '🔴' : 
                            task.priority === 'MEDIUM' ? '🟡' : '🟢';
        
        message += `${index + 1}. ${statusIcon} ${priorityIcon} *${task.title}*\n`;
        message += `   📝 ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}\n`;
        message += `   👤 ${task.assignedTo?.name || 'Не назначено'}\n`;
        message += `   🏭 ${task.machine?.name || 'Общая задача'}\n\n`;
      });
      
      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Обновить', callback_data: 'tasks_refresh' },
              { text: '👤 Мои задачи', callback_data: 'tasks_my' }
            ],
            [
              { text: '🚨 Срочные', callback_data: 'tasks_urgent' },
              { text: '📝 Создать задачу', callback_data: 'tasks_create' }
            ]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, '✅ Задач нет или сервис недоступен');
    }
  } catch (error) {
    global.logger.error('Tasks handler error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка получения задач');
  }
}

module.exports = { handleTasks };
