/**
 * FSM: admin_fsm
 * Назначение: Системные настройки и управление (права доступа, уведомления, сброс данных).
 * Роли: Администратор.
 * Состояния:
 *   - admin_menu: главное меню администратора
 *   - settings_system: системные настройки
 *   - settings_roles: настройки ролей
 *   - settings_users: управление пользователями
 *   - settings_logs: просмотр системных логов
 *   - settings_notifications: настройки уведомлений
 *   - settings_reset_data: сброс данных
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');
const fs = require('fs');
const path = require('path');

// Создание сцены
const scene = new Scenes.BaseScene('admin_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[admin_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN
  if (!ctx.session.user || ctx.session.user.role !== 'ADMIN') {
    await ctx.reply('⚠️ У вас нет доступа к системным настройкам.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные администратора
    ctx.session.adminData = {
      section: null,
      setting: null,
      value: null,
      step: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'admin_menu';
    
    // Переходим к главному меню администратора
    await handleAdminMenu(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену admin_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния admin_menu
async function handleAdminMenu(ctx) {
  try {
    const message = `
⚙️ Системные настройки и управление

Выберите раздел:
`;
    
    // Создаем клавиатуру с разделами
    const buttons = [
      [Markup.button.callback('🔧 Системные настройки', 'section_system')],
      [Markup.button.callback('👑 Настройки ролей', 'section_roles')],
      [Markup.button.callback('👥 Управление пользователями', 'section_users')],
      [Markup.button.callback('📋 Системные логи', 'section_logs')],
      [Markup.button.callback('🔔 Настройки уведомлений', 'section_notifications')],
      [Markup.button.callback('🗑️ Сброс данных', 'section_reset_data')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при отображении главного меню администратора:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Системные настройки отменены.');
  await ctx.scene.leave();
});

// Обработчики выбора раздела
scene.action(/^section_(.+)$/, async (ctx) => {
  try {
    const section = ctx.match[1];
    
    // Сохраняем выбранный раздел
    ctx.session.adminData.section = section;
    
    // Переходим к соответствующему разделу
    switch (section) {
      case 'system':
        ctx.session.state = 'settings_system';
        await handleSystemSettings(ctx);
        break;
      case 'roles':
        ctx.session.state = 'settings_roles';
        await handleRolesSettings(ctx);
        break;
      case 'users':
        // Переходим к сцене управления пользователями
        await ctx.editMessageText('👥 Переход к управлению пользователями...');
        await ctx.scene.enter('user_fsm');
        break;
      case 'logs':
        ctx.session.state = 'settings_logs';
        await handleLogsSettings(ctx);
        break;
      case 'notifications':
        ctx.session.state = 'settings_notifications';
        await handleNotificationsSettings(ctx);
        break;
      case 'reset_data':
        ctx.session.state = 'settings_reset_data';
        await handleResetDataSettings(ctx);
        break;
    }
  } catch (error) {
    console.error('Ошибка при выборе раздела:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния settings_system
async function handleSystemSettings(ctx) {
  try {
    // Получаем текущие системные настройки
    const settings = await getSystemSettings();
    
    const message = `
🔧 Системные настройки

<b>Текущие настройки:</b>
<b>Название системы:</b> ${settings.systemName}
<b>Версия:</b> ${settings.version}
<b>Режим работы:</b> ${getWorkModeName(settings.workMode)}
<b>Максимальное количество задач в день:</b> ${settings.maxTasksPerDay}
<b>Время автоматического выхода (мин):</b> ${settings.autoLogoutTime}
<b>Включить логирование:</b> ${settings.enableLogging ? '✅' : '❌'}
<b>Включить уведомления:</b> ${settings.enableNotifications ? '✅' : '❌'}
<b>Включить резервное копирование:</b> ${settings.enableBackup ? '✅' : '❌'}

Выберите настройку для изменения:
`;
    
    // Создаем клавиатуру с настройками
    const buttons = [
      [Markup.button.callback('📝 Название системы', 'setting_systemName')],
      [Markup.button.callback('🔢 Версия', 'setting_version')],
      [Markup.button.callback('⚙️ Режим работы', 'setting_workMode')],
      [Markup.button.callback('📊 Максимальное количество задач', 'setting_maxTasksPerDay')],
      [Markup.button.callback('⏱️ Время автоматического выхода', 'setting_autoLogoutTime')],
      [Markup.button.callback(`${settings.enableLogging ? '✅' : '❌'} Логирование`, 'setting_enableLogging')],
      [Markup.button.callback(`${settings.enableNotifications ? '✅' : '❌'} Уведомления`, 'setting_enableNotifications')],
      [Markup.button.callback(`${settings.enableBackup ? '✅' : '❌'} Резервное копирование`, 'setting_enableBackup')],
      [Markup.button.callback('🔙 Назад', 'back_to_admin_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Ошибка при отображении системных настроек:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния settings_roles
async function handleRolesSettings(ctx) {
  try {
    // Получаем текущие настройки ролей
    const roles = await getRoles();
    
    let message = `
👑 Настройки ролей

<b>Доступные роли:</b>
`;
    
    // Добавляем информацию о ролях
    for (const role of roles) {
      message += `
<b>${getRoleName(role.code)}</b>
Описание: ${role.description}
Права доступа: ${role.permissions.join(', ')}
`;
    }
    
    message += `
Выберите роль для изменения:
`;
    
    // Создаем клавиатуру с ролями
    const buttons = roles.map(role => {
      return [Markup.button.callback(getRoleName(role.code), `role_${role.code}`)];
    });
    
    // Добавляем кнопки навигации
    buttons.push([Markup.button.callback('🔙 Назад', 'back_to_admin_menu')]);
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Ошибка при отображении настроек ролей:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния settings_logs
async function handleLogsSettings(ctx) {
  try {
    // Получаем последние системные логи
    const logs = await getSystemLogs(20);
    
    let message = `
📋 Системные логи

<b>Последние 20 записей:</b>
`;
    
    if (logs.length === 0) {
      message += '\nЛоги отсутствуют.';
    } else {
      for (const log of logs) {
        const date = new Date(log.createdAt).toLocaleString('ru-RU');
        message += `\n<b>${date}</b> - ${log.level}: ${log.message}`;
      }
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('📥 Экспортировать логи', 'export_logs')],
      [Markup.button.callback('🗑️ Очистить логи', 'clear_logs')],
      [Markup.button.callback('🔙 Назад', 'back_to_admin_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Ошибка при отображении системных логов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния settings_notifications
async function handleNotificationsSettings(ctx) {
  try {
    // Получаем текущие настройки уведомлений
    const settings = await getNotificationSettings();
    
    const message = `
🔔 Настройки уведомлений

<b>Текущие настройки:</b>
<b>Уведомления о новых задачах:</b> ${settings.newTaskNotifications ? '✅' : '❌'}
<b>Уведомления о выполненных задачах:</b> ${settings.completedTaskNotifications ? '✅' : '❌'}
<b>Уведомления о просроченных задачах:</b> ${settings.overdueTaskNotifications ? '✅' : '❌'}
<b>Уведомления о низком уровне запасов:</b> ${settings.lowInventoryNotifications ? '✅' : '❌'}
<b>Уведомления о финансовых операциях:</b> ${settings.financialNotifications ? '✅' : '❌'}
<b>Уведомления о системных событиях:</b> ${settings.systemNotifications ? '✅' : '❌'}
<b>Время отправки ежедневного отчета:</b> ${settings.dailyReportTime}

Выберите настройку для изменения:
`;
    
    // Создаем клавиатуру с настройками
    const buttons = [
      [Markup.button.callback(`${settings.newTaskNotifications ? '✅' : '❌'} Новые задачи`, 'notification_newTaskNotifications')],
      [Markup.button.callback(`${settings.completedTaskNotifications ? '✅' : '❌'} Выполненные задачи`, 'notification_completedTaskNotifications')],
      [Markup.button.callback(`${settings.overdueTaskNotifications ? '✅' : '❌'} Просроченные задачи`, 'notification_overdueTaskNotifications')],
      [Markup.button.callback(`${settings.lowInventoryNotifications ? '✅' : '❌'} Низкий уровень запасов`, 'notification_lowInventoryNotifications')],
      [Markup.button.callback(`${settings.financialNotifications ? '✅' : '❌'} Финансовые операции`, 'notification_financialNotifications')],
      [Markup.button.callback(`${settings.systemNotifications ? '✅' : '❌'} Системные события`, 'notification_systemNotifications')],
      [Markup.button.callback('⏰ Время ежедневного отчета', 'notification_dailyReportTime')],
      [Markup.button.callback('🔙 Назад', 'back_to_admin_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Ошибка при отображении настроек уведомлений:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния settings_reset_data
async function handleResetDataSettings(ctx) {
  try {
    const message = `
🗑️ Сброс данных

⚠️ <b>Внимание!</b> Эти операции необратимы и могут привести к потере данных.
Перед выполнением рекомендуется создать резервную копию.

Выберите действие:
`;
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('📦 Очистить данные о задачах', 'reset_tasks')],
      [Markup.button.callback('🧂 Очистить данные о запасах', 'reset_inventory')],
      [Markup.button.callback('💰 Очистить финансовые данные', 'reset_finance')],
      [Markup.button.callback('📋 Очистить логи', 'reset_logs')],
      [Markup.button.callback('⚠️ Сбросить все данные', 'reset_all')],
      [Markup.button.callback('💾 Создать резервную копию', 'create_backup')],
      [Markup.button.callback('🔙 Назад', 'back_to_admin_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Ошибка при отображении настроек сброса данных:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик возврата к главному меню администратора
scene.action('back_to_admin_menu', async (ctx) => {
  try {
    // Сбрасываем данные администратора
    ctx.session.adminData = {
      section: null,
      setting: null,
      value: null,
      step: null
    };
    
    // Переходим к главному меню администратора
    ctx.session.state = 'admin_menu';
    await ctx.deleteMessage();
    await handleAdminMenu(ctx);
  } catch (error) {
    console.error('Ошибка при возврате к главному меню администратора:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Вспомогательные функции

// Получение системных настроек
async function getSystemSettings() {
  try {
    // Получаем настройки из базы данных
    const settings = await prisma.systemSettings.findFirst();
    
    // Если настройки не найдены, создаем их
    if (!settings) {
      return await prisma.systemSettings.create({
        data: {
          systemName: 'VendHubBot',
          version: '1.0.0',
          workMode: 'PRODUCTION',
          maxTasksPerDay: 10,
          autoLogoutTime: 30,
          enableLogging: true,
          enableNotifications: true,
          enableBackup: true
        }
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Ошибка при получении системных настроек:', error);
    throw error;
  }
}

// Получение названия режима работы
function getWorkModeName(workMode) {
  switch (workMode) {
    case 'PRODUCTION':
      return '🟢 Рабочий';
    case 'TESTING':
      return '🟠 Тестовый';
    case 'DEBUG':
      return '🔴 Отладка';
    default:
      return workMode;
  }
}

// Получение ролей
async function getRoles() {
  try {
    // Получаем роли из базы данных
    const roles = await prisma.role.findMany();
    
    // Если роли не найдены, создаем их
    if (roles.length === 0) {
      return await createDefaultRoles();
    }
    
    return roles;
  } catch (error) {
    console.error('Ошибка при получении ролей:', error);
    throw error;
  }
}

// Создание ролей по умолчанию
async function createDefaultRoles() {
  try {
    const roles = [
      {
        code: 'ADMIN',
        name: 'Администратор',
        description: 'Полный доступ к системе',
        permissions: ['ADMIN', 'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_SETTINGS', 'MANAGE_TASKS', 'VIEW_REPORTS']
      },
      {
        code: 'MANAGER',
        name: 'Менеджер',
        description: 'Управление задачами и отчетами',
        permissions: ['MANAGE_TASKS', 'VIEW_REPORTS']
      },
      {
        code: 'OPERATOR',
        name: 'Оператор',
        description: 'Выполнение задач',
        permissions: ['EXECUTE_TASKS']
      },
      {
        code: 'WAREHOUSE',
        name: 'Кладовщик',
        description: 'Управление складом',
        permissions: ['MANAGE_INVENTORY']
      },
      {
        code: 'TECHNICIAN',
        name: 'Техник',
        description: 'Техническое обслуживание',
        permissions: ['EXECUTE_TASKS', 'MANAGE_EQUIPMENT']
      }
    ];
    
    // Создаем роли
    const createdRoles = [];
    
    for (const role of roles) {
      createdRoles.push(await prisma.role.create({ data: role }));
    }
    
    return createdRoles;
  } catch (error) {
    console.error('Ошибка при создании ролей по умолчанию:', error);
    throw error;
  }
}

// Получение названия роли
function getRoleName(code) {
  switch (code) {
    case 'ADMIN':
      return '👑 Администратор';
    case 'MANAGER':
      return '📊 Менеджер';
    case 'OPERATOR':
      return '👨‍💼 Оператор';
    case 'WAREHOUSE':
      return '🏭 Кладовщик';
    case 'TECHNICIAN':
      return '🔧 Техник';
    default:
      return code;
  }
}

// Получение системных логов
async function getSystemLogs(limit = 20) {
  try {
    return await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Ошибка при получении системных логов:', error);
    throw error;
  }
}

// Получение настроек уведомлений
async function getNotificationSettings() {
  try {
    // Получаем настройки из базы данных
    const settings = await prisma.notificationSettings.findFirst();
    
    // Если настройки не найдены, создаем их
    if (!settings) {
      return await prisma.notificationSettings.create({
        data: {
          newTaskNotifications: true,
          completedTaskNotifications: true,
          overdueTaskNotifications: true,
          lowInventoryNotifications: true,
          financialNotifications: true,
          systemNotifications: true,
          dailyReportTime: '09:00'
        }
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Ошибка при получении настроек уведомлений:', error);
    throw error;
  }
}

module.exports = scene;
