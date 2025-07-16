const createInlineKeyboard = (buttons) => {
  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
};

const ROLE_KEYBOARDS = {
  OPERATOR: [
    [{ text: '📋 Мои задачи', callback_data: 'operator_tasks' }],
    [{ text: '📝 Чек-листы', callback_data: 'operator_checklist' }],
    [{ text: '👤 Профиль', callback_data: 'profile' }]
  ],
  WAREHOUSE: [
    [{ text: '📦 Управление запасами', callback_data: 'warehouse_inventory' }],
    [{ text: '👜 Управление сумками', callback_data: 'warehouse_bags' }],
    [{ text: '🧼 Мойка бункеров', callback_data: 'warehouse_wash' }],
    [{ text: '👤 Профиль', callback_data: 'profile' }]
  ],
  MANAGER: [
    [{ text: '📊 Аналитика', callback_data: 'manager_analytics' }],
    [{ text: '📝 Создать задачу', callback_data: 'manager_create_task' }],
    [{ text: '🚗 Управление маршрутами', callback_data: 'manager_routes' }],
    [{ text: '📅 Планирование задач', callback_data: 'manager_schedule' }],
    [{ text: '👤 Профиль', callback_data: 'profile' }]
  ],
  TECHNICIAN: [
    [{ text: '🔧 Мои задачи', callback_data: 'technician_tasks' }],
    [{ text: '🔍 Диагностика', callback_data: 'technician_diagnostics' }],
    [{ text: '📋 Чек-листы', callback_data: 'technician_checklists' }],
    [{ text: '📜 История ремонтов', callback_data: 'technician_repair_history' }],
    [{ text: '👤 Профиль', callback_data: 'profile' }]
  ],
  ADMIN: [
    [{ text: '📊 Аналитика', callback_data: 'manager_analytics' }],
    [{ text: '📝 Создать задачу', callback_data: 'manager_create_task' }],
    [{ text: '👥 Управление пользователями', callback_data: 'admin_users' }],
    [{ text: '⚙️ Настройки системы', callback_data: 'admin_settings' }],
    [{ text: '📋 Медиа-контент', callback_data: 'view_media' }],
    [{ text: '👤 Профиль', callback_data: 'profile' }]
  ],
  DEFAULT: [
    [{ text: '👤 Профиль', callback_data: 'profile' }],
    [{ text: '❓ Помощь', callback_data: 'help' }]
  ]
};

module.exports = {
  createInlineKeyboard,
  ROLE_KEYBOARDS
};
