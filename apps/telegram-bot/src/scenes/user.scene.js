/**
 * FSM: user_fsm
 * Назначение: Управление пользователями системы (создание, редактирование, назначение ролей, блокировка).
 * Роли: Администратор.
 * Состояния:
 *   - user_list: просмотр списка пользователей
 *   - user_view_details: просмотр информации о пользователе
 *   - user_add: добавление нового пользователя
 *   - user_edit: редактирование пользователя
 *   - user_assign_role: назначение роли пользователю
 *   - user_toggle_status: изменение статуса пользователя
 *   - user_view_logs: просмотр логов действий пользователя
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('user_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[user_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN
  if (!ctx.session.user || ctx.session.user.role !== 'ADMIN') {
    await ctx.reply('⚠️ У вас нет доступа к управлению пользователями.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные пользователя
    ctx.session.userData = {
      userId: null,
      userData: {},
      page: 1,
      itemsPerPage: 10
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'user_list';
    
    // Переходим к просмотру списка пользователей
    await handleUserList(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену user_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния user_list
async function handleUserList(ctx) {
  try {
    const page = ctx.session.userData.page;
    const itemsPerPage = ctx.session.userData.itemsPerPage;
    
    // Получаем список пользователей
    const users = await prisma.user.findMany({
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: { lastName: 'asc' }
    });
    
    const totalUsers = await prisma.user.count();
    
    // Формируем сообщение со списком пользователей
    let message = `
👥 Управление пользователями (${totalUsers} пользователей)

`;
    
    if (users.length === 0) {
      message += 'Пользователи не найдены.';
    } else {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const index = (page - 1) * itemsPerPage + i + 1;
        
        message += `${index}. ${user.lastName} ${user.firstName} - ${getRoleName(user.role)} (${getStatusName(user.status)})\n`;
      }
    }
    
    // Создаем клавиатуру с кнопками навигации и действий
    const buttons = [];
    
    // Кнопки для просмотра пользователей
    if (users.length > 0) {
      const userButtons = users.map((user, i) => {
        const index = (page - 1) * itemsPerPage + i + 1;
        return [Markup.button.callback(`${index}. ${user.lastName} ${user.firstName}`, `view_${user.id}`)];
      });
      
      buttons.push(...userButtons);
    }
    
    // Кнопки пагинации
    const paginationButtons = [];
    
    if (page > 1) {
      paginationButtons.push(Markup.button.callback('⬅️ Назад', 'prev_page'));
    }
    
    if (page * itemsPerPage < totalUsers) {
      paginationButtons.push(Markup.button.callback('➡️ Вперед', 'next_page'));
    }
    
    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons);
    }
    
    // Кнопки действий
    buttons.push([Markup.button.callback('➕ Добавить пользователя', 'add_user')]);
    buttons.push([Markup.button.callback('🔍 Поиск по Telegram ID', 'search_by_telegram_id')]);
    buttons.push([Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при просмотре списка пользователей:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики пагинации
scene.action('prev_page', async (ctx) => {
  try {
    ctx.session.userData.page--;
    await ctx.deleteMessage();
    await handleUserList(ctx);
  } catch (error) {
    console.error('Ошибка при переходе на предыдущую страницу:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

scene.action('next_page', async (ctx) => {
  try {
    ctx.session.userData.page++;
    await ctx.deleteMessage();
    await handleUserList(ctx);
  } catch (error) {
    console.error('Ошибка при переходе на следующую страницу:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

// Обработчики просмотра пользователя
scene.action(/^view_(.+)$/, async (ctx) => {
  try {
    const userId = ctx.match[1];
    
    // Сохраняем ID пользователя
    ctx.session.userData.userId = userId;
    
    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      await ctx.reply('❌ Пользователь не найден. Попробуйте снова.');
      return await handleUserList(ctx);
    }
    
    // Сохраняем данные пользователя
    ctx.session.userData.userData = user;
    
    // Формируем сообщение с информацией о пользователе
    const message = `
👤 Пользователь: ${user.lastName} ${user.firstName}

🔹 Роль: ${getRoleName(user.role)}
🔹 Статус: ${getStatusName(user.status)}
🔹 Telegram ID: ${user.telegramId || 'Не указан'}
🔹 Телефон: ${user.phone || 'Не указан'}
🔹 Email: ${user.email || 'Не указан'}
🔹 Дата регистрации: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
🔹 Последний вход: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU') : 'Не указана'}
`;
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('✏️ Редактировать', 'edit_user')],
      [Markup.button.callback('👑 Изменить роль', 'assign_role')],
      [Markup.button.callback(`${user.status === 'ACTIVE' ? '🔒 Заблокировать' : '🔓 Разблокировать'}`, 'toggle_status')],
      [Markup.button.callback('📋 Просмотреть логи', 'view_logs')],
      [Markup.button.callback('🔙 Назад к списку', 'back_to_list')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, keyboard);
    
    // Переходим к просмотру пользователя
    ctx.session.state = 'user_view_details';
  } catch (error) {
    console.error('Ошибка при просмотре пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата к списку
scene.action('back_to_list', async (ctx) => {
  try {
    // Сбрасываем ID пользователя
    ctx.session.userData.userId = null;
    
    ctx.session.state = 'user_list';
    await ctx.deleteMessage();
    await handleUserList(ctx);
  } catch (error) {
    console.error('Ошибка при возврате к списку:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Управление пользователями отменено.');
  await ctx.scene.leave();
});

// Обработчик добавления пользователя
scene.action('add_user', async (ctx) => {
  try {
    // Сбрасываем данные пользователя
    ctx.session.userData.userData = {};
    
    await ctx.editMessageText(`
➕ Добавление нового пользователя

Введите фамилию пользователя:
`);
    
    // Переходим к добавлению пользователя
    ctx.session.state = 'user_add';
    ctx.session.userData.addStep = 'lastName';
  } catch (error) {
    console.error('Ошибка при добавлении пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик поиска по Telegram ID
scene.action('search_by_telegram_id', async (ctx) => {
  try {
    await ctx.editMessageText(`
🔍 Поиск пользователя по Telegram ID

Введите Telegram ID пользователя:
`);
    
    // Переходим к поиску пользователя
    ctx.session.state = 'user_search_by_telegram_id';
  } catch (error) {
    console.error('Ошибка при поиске пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик редактирования пользователя
scene.action('edit_user', async (ctx) => {
  try {
    const userId = ctx.session.userData.userId;
    const user = ctx.session.userData.userData;
    
    await ctx.editMessageText(`
✏️ Редактирование пользователя

Текущая фамилия: ${user.lastName}

Введите новую фамилию пользователя или отправьте /skip, чтобы оставить текущую:
`);
    
    // Переходим к редактированию пользователя
    ctx.session.state = 'user_edit';
    ctx.session.userData.editStep = 'lastName';
  } catch (error) {
    console.error('Ошибка при редактировании пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик изменения роли пользователя
scene.action('assign_role', async (ctx) => {
  try {
    const userId = ctx.session.userData.userId;
    const user = ctx.session.userData.userData;
    
    // Создаем клавиатуру с ролями
    const buttons = [
      [Markup.button.callback('👤 Оператор', 'role_OPERATOR')],
      [Markup.button.callback('🔧 Техник', 'role_TECHNICIAN')],
      [Markup.button.callback('📦 Кладовщик', 'role_WAREHOUSE')],
      [Markup.button.callback('📊 Менеджер', 'role_MANAGER')],
      [Markup.button.callback('👑 Администратор', 'role_ADMIN')],
      [Markup.button.callback('🔙 Назад', 'back_to_user')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(`
👑 Изменение роли пользователя

Пользователь: ${user.lastName} ${user.firstName}
Текущая роль: ${getRoleName(user.role)}

Выберите новую роль:
`, keyboard);
    
    // Переходим к изменению роли пользователя
    ctx.session.state = 'user_assign_role';
  } catch (error) {
    console.error('Ошибка при изменении роли пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора роли
scene.action(/^role_(.+)$/, async (ctx) => {
  try {
    const role = ctx.match[1];
    const userId = ctx.session.userData.userId;
    
    // Обновляем роль пользователя
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    
    // Обновляем данные пользователя
    ctx.session.userData.userData = user;
    
    await ctx.editMessageText(`
✅ Роль пользователя успешно изменена на "${getRoleName(role)}".

Возвращаемся к просмотру пользователя...
`);
    
    // Возвращаемся к просмотру пользователя
    setTimeout(async () => {
      ctx.session.state = 'user_view_details';
      await ctx.scene.reenter();
    }, 1500);
  } catch (error) {
    console.error('Ошибка при выборе роли:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик изменения статуса пользователя
scene.action('toggle_status', async (ctx) => {
  try {
    const userId = ctx.session.userData.userId;
    const user = ctx.session.userData.userData;
    
    // Определяем новый статус
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    // Обновляем статус пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus }
    });
    
    // Обновляем данные пользователя
    ctx.session.userData.userData = updatedUser;
    
    await ctx.editMessageText(`
✅ Статус пользователя успешно изменен на "${getStatusName(newStatus)}".

Возвращаемся к просмотру пользователя...
`);
    
    // Возвращаемся к просмотру пользователя
    setTimeout(async () => {
      ctx.session.state = 'user_view_details';
      await ctx.scene.reenter();
    }, 1500);
  } catch (error) {
    console.error('Ошибка при изменении статуса пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик просмотра логов пользователя
scene.action('view_logs', async (ctx) => {
  try {
    const userId = ctx.session.userData.userId;
    const user = ctx.session.userData.userData;
    
    // Получаем логи пользователя
    const logs = await prisma.userLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Формируем сообщение с логами
    let message = `
📋 Логи действий пользователя

Пользователь: ${user.lastName} ${user.firstName}

`;
    
    if (logs.length === 0) {
      message += 'Логи не найдены.';
    } else {
      for (const log of logs) {
        const date = new Date(log.createdAt).toLocaleString('ru-RU');
        message += `🔹 ${date}: ${log.action} - ${log.details || 'Без деталей'}\n\n`;
      }
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('🔙 Назад к пользователю', 'back_to_user')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, keyboard);
    
    // Переходим к просмотру логов пользователя
    ctx.session.state = 'user_view_logs';
  } catch (error) {
    console.error('Ошибка при просмотре логов пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата к пользователю
scene.action('back_to_user', async (ctx) => {
  try {
    // Возвращаемся к просмотру пользователя
    ctx.session.state = 'user_view_details';
    await ctx.scene.reenter();
  } catch (error) {
    console.error('Ошибка при возврате к пользователю:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик ввода текста
scene.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    // Обработка команды пропуска
    if (text === '/skip') {
      if (ctx.session.state === 'user_edit') {
        // Переходим к следующему шагу редактирования
        await handleEditNextStep(ctx);
      } else if (ctx.session.state === 'user_add') {
        // Переходим к следующему шагу добавления
        await handleAddNextStep(ctx, null);
      }
      return;
    }
    
    // Обработка поиска по Telegram ID
    if (ctx.session.state === 'user_search_by_telegram_id') {
      await handleSearchByTelegramId(ctx, text);
      return;
    }
    
    // Обработка ввода текста для добавления пользователя
    if (ctx.session.state === 'user_add') {
      await handleAddNextStep(ctx, text);
      return;
    }
    
    // Обработка ввода текста для редактирования пользователя
    if (ctx.session.state === 'user_edit') {
      await handleEditNextStep(ctx, text);
      return;
    }
  } catch (error) {
    console.error('Ошибка при обработке ввода текста:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для обработки поиска по Telegram ID
async function handleSearchByTelegramId(ctx, text) {
  try {
    // Проверяем, что введен числовой ID
    const telegramId = text.replace(/\D/g, '');
    
    if (!telegramId) {
      await ctx.reply('❌ Пожалуйста, введите корректный Telegram ID (только цифры).');
      return;
    }
    
    // Ищем пользователя по Telegram ID
    const user = await prisma.user.findFirst({
      where: { telegramId }
    });
    
    if (!user) {
      await ctx.reply(`❌ Пользователь с Telegram ID ${telegramId} не найден.`);
      
      // Предлагаем создать нового пользователя
      const buttons = [
        [Markup.button.callback('➕ Создать нового пользователя', 'add_user')],
        [Markup.button.callback('🔙 Вернуться к списку', 'back_to_list')]
      ];
      
      const keyboard = Markup.inlineKeyboard(buttons);
      
      await ctx.reply('Что вы хотите сделать?', keyboard);
      return;
    }
    
    // Сохраняем ID пользователя
    ctx.session.userData.userId = user.id;
    
    // Сохраняем данные пользователя
    ctx.session.userData.userData = user;
    
    // Формируем сообщение с информацией о пользователе
    const message = `
👤 Пользователь найден: ${user.lastName} ${user.firstName}

🔹 Роль: ${getRoleName(user.role)}
🔹 Статус: ${getStatusName(user.status)}
🔹 Telegram ID: ${user.telegramId || 'Не указан'}
🔹 Телефон: ${user.phone || 'Не указан'}
🔹 Email: ${user.email || 'Не указан'}
🔹 Дата регистрации: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
🔹 Последний вход: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU') : 'Не указана'}
`;
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('✏️ Редактировать', 'edit_user')],
      [Markup.button.callback('👑 Изменить роль', 'assign_role')],
      [Markup.button.callback(`${user.status === 'ACTIVE' ? '🔒 Заблокировать' : '🔓 Разблокировать'}`, 'toggle_status')],
      [Markup.button.callback('📋 Просмотреть логи', 'view_logs')],
      [Markup.button.callback('🔙 Назад к списку', 'back_to_list')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
    
    // Переходим к просмотру пользователя
    ctx.session.state = 'user_view_details';
  } catch (error) {
    console.error('Ошибка при поиске пользователя по Telegram ID:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Функция для обработки следующего шага добавления пользователя
async function handleAddNextStep(ctx, text) {
  try {
    const step = ctx.session.userData.addStep;
    
    // Если текст не null, сохраняем его в данных пользователя
    if (text !== null) {
      switch (step) {
        case 'lastName':
          ctx.session.userData.userData.lastName = text;
          break;
        case 'firstName':
          ctx.session.userData.userData.firstName = text;
          break;
        case 'telegramId':
          // Проверяем, что введен числовой ID
          const telegramId = text.replace(/\D/g, '');
          
          if (!telegramId) {
            await ctx.reply('❌ Пожалуйста, введите корректный Telegram ID (только цифры).');
            return;
          }
          
          // Проверяем, что пользователь с таким Telegram ID не существует
          const existingUser = await prisma.user.findFirst({
            where: { telegramId }
          });
          
          if (existingUser) {
            await ctx.reply(`❌ Пользователь с Telegram ID ${telegramId} уже существует.`);
            return;
          }
          
          ctx.session.userData.userData.telegramId = telegramId;
          break;
        case 'phone':
          // Проверяем, что введен корректный телефон
          const phone = text.replace(/\D/g, '');
          
          if (phone.length < 10) {
            await ctx.reply('❌ Пожалуйста, введите корректный номер телефона.');
            return;
          }
          
          ctx.session.userData.userData.phone = phone;
          break;
        case 'email':
          // Проверяем, что введен корректный email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          if (!emailRegex.test(text)) {
            await ctx.reply('❌ Пожалуйста, введите корректный email.');
            return;
          }
          
          ctx.session.userData.userData.email = text;
          break;
      }
    }
    
    // Определяем следующий шаг
    let nextStep = '';
    let message = '';
    
    switch (step) {
      case 'lastName':
        nextStep = 'firstName';
        message = `
Введите имя пользователя:
`;
        break;
      case 'firstName':
        nextStep = 'telegramId';
        message = `
Введите Telegram ID пользователя:
`;
        break;
      case 'telegramId':
        nextStep = 'phone';
        message = `
Введите номер телефона пользователя или отправьте /skip, чтобы пропустить:
`;
        break;
      case 'phone':
        nextStep = 'email';
        message = `
Введите email пользователя или отправьте /skip, чтобы пропустить:
`;
        break;
      case 'email':
        nextStep = 'role';
        
        // Создаем клавиатуру с ролями
        const buttons = [
          [Markup.button.callback('👤 Оператор', 'add_role_OPERATOR')],
          [Markup.button.callback('🔧 Техник', 'add_role_TECHNICIAN')],
          [Markup.button.callback('📦 Кладовщик', 'add_role_WAREHOUSE')],
          [Markup.button.callback('📊 Менеджер', 'add_role_MANAGER')],
          [Markup.button.callback('👑 Администратор', 'add_role_ADMIN')]
        ];
        
        const roleKeyboard = Markup.inlineKeyboard(buttons);
        
        await ctx.reply('Выберите роль пользователя:', roleKeyboard);
        return;
    }
    
    // Обновляем шаг
    ctx.session.userData.addStep = nextStep;
    
    // Отправляем сообщение с запросом данных для следующего шага
    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка при обработке следующего шага добавления пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора роли при добавлении пользователя
scene.action(/^add_role_(.+)$/, async (ctx) => {
  try {
    const role = ctx.match[1];
    
    // Сохраняем роль пользователя
    ctx.session.userData.userData.role = role;
    
    // Создаем пользователя в базе данных
    const userData = ctx.session.userData.userData;
    
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        telegramId: userData.telegramId,
        phone: userData.phone || null,
        email: userData.email || null,
        role: userData.role,
        status: 'ACTIVE',
        createdAt: new Date()
      }
    });
    
    await ctx.reply(`
✅ Пользователь "${user.lastName} ${user.firstName}" успешно добавлен.

🔹 Роль: ${getRoleName(user.role)}
🔹 Telegram ID: ${user.telegramId}
`);
    
    // Возвращаемся к списку пользователей
    ctx.session.state = 'user_list';
    await handleUserList(ctx);
  } catch (error) {
    console.error('Ошибка при выборе роли при добавлении пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для обработки следующего шага редактирования пользователя
async function handleEditNextStep(ctx, text) {
  try {
    const step = ctx.session.userData.editStep;
    const userId = ctx.session.userData.userId;
    
    // Если текст не null, сохраняем его в данных пользователя
    if (text !== null) {
      switch (step) {
        case 'lastName':
          ctx.session.userData.userData.lastName = text;
          break;
        case 'firstName':
          ctx.session.userData.userData.firstName = text;
          break;
        case 'telegramId':
          // Проверяем, что введен числовой ID
          const telegramId = text.replace(/\D/g, '');
          
          if (!telegramId) {
            await ctx.reply('❌ Пожалуйста, введите корректный Telegram ID (только цифры).');
            return;
          }
          
          // Проверяем, что пользователь с таким Telegram ID не существует
          const existingUser = await prisma.user.findFirst({
            where: { 
              telegramId,
              id: { not: userId }
            }
          });
          
          if (existingUser) {
            await ctx.reply(`❌ Пользователь с Telegram ID ${telegramId} уже существует.`);
            return;
          }
          
          ctx.session.userData.userData.telegramId = telegramId;
          break;
        case 'phone':
          // Проверяем, что введен корректный телефон
          const phone = text.replace(/\D/g, '');
          
          if (phone.length < 10) {
            await ctx.reply('❌ Пожалуйста, введите корректный номер телефона.');
            return;
          }
          
          ctx.session.userData.userData.phone = phone;
          break;
        case 'email':
          // Проверяем, что введен корректный email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          if (!emailRegex.test(text)) {
            await ctx.reply('❌ Пожалуйста, введите корректный email.');
            return;
          }
          
          ctx.session.userData.userData.email = text;
          break;
      }
    }
    
    // Определяем следующий шаг
    let nextStep = '';
    let message = '';
    
    switch (step) {
      case 'lastName':
        nextStep = 'firstName';
        message = `
Текущее имя: ${ctx.session.userData.userData.firstName}

Введите новое имя пользователя или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'firstName':
        nextStep = 'telegramId';
        message = `
Текущий Telegram ID: ${ctx.session.userData.userData.telegramId || 'Не указан'}

Введите новый Telegram ID пользователя или отправьте /skip, чтобы оставить текущий:
`;
        break;
      case 'telegramId':
        nextStep = 'phone';
        message = `
Текущий номер телефона: ${ctx.session.userData.userData.phone || 'Не указан'}

Введите новый номер телефона пользователя или отправьте /skip, чтобы оставить текущий:
`;
        break;
      case 'phone':
        nextStep = 'email';
        message = `
Текущий email: ${ctx.session.userData.userData.email || 'Не указан'}

Введите новый email пользователя или отправьте /skip, чтобы оставить текущий:
`;
        break;
      case 'email':
        // Обновляем пользователя в базе данных
        const userData = ctx.session.userData.userData;
        
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            telegramId: userData.telegramId,
            phone: userData.phone,
            email: userData.email
          }
        });
        
        await ctx.reply(`
✅ Пользователь "${user.lastName} ${user.firstName}" успешно обновлен.
`);
        
        // Возвращаемся к просмотру пользователя
        ctx.session.state = 'user_view_details';
        return await ctx.scene.reenter();
    }
    
    // Обновляем шаг
    ctx.session.userData.editStep = nextStep;
    
    // Отправляем сообщение с запросом данных для следующего шага
    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка при обработке следующего шага редактирования пользователя:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Функция для получения названия роли
function getRoleName(role) {
  const roles = {
    'ADMIN': '👑 Администратор',
    'MANAGER': '📊 Менеджер',
    'OPERATOR': '👤 Оператор',
    'TECHNICIAN': '🔧 Техник',
    'WAREHOUSE': '📦 Кладовщик'
  };
  
  return roles[role] || role;
}

// Функция для получения названия статуса
function getStatusName(status) {
  const statuses = {
    'ACTIVE': '✅ Активен',
    'INACTIVE': '❌ Заблокирован',
    'DELETED': '🗑️ Удален'
  };
  
  return statuses[status] || status;
}

module.exports = scene;
