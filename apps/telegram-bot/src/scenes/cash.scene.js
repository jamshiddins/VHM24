/**
 * FSM: cash_fsm
 * Назначение: Учёт инкассации и сверка наличности.
 * Роли: Оператор (ввод), Менеджер (проверка).
 * Состояния:
 *   - cash_select_machine: выбор автомата
 *   - cash_input_amount: ввод суммы инкассации
 *   - cash_upload_photo: загрузка фото чека/купюр
 *   - cash_confirm: подтверждение
 *   - cash_reconciliation_manager: сверка менеджером
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('cash_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[cash_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN, MANAGER или OPERATOR
  if (!ctx.session.user || !['ADMIN', 'MANAGER', 'OPERATOR'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к учету инкассации.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные инкассации
    ctx.session.cashData = {
      machineId: null,
      amount: 0,
      photo: null,
      notes: null,
      reconciled: false,
      reconciledBy: null,
      reconciledAt: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'cash_select_machine';
    
    // Переходим к выбору автомата
    await handleCashSelectMachine(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену cash_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния cash_select_machine
async function handleCashSelectMachine(ctx) {
  try {
    // Получаем список автоматов
    const machines = await prisma.machine.findMany({
      where: { status: 'ACTIVE' },
      include: { location: true },
      orderBy: { internalCode: 'asc' }
    });
    
    if (machines.length === 0) {
      await ctx.reply('❌ Нет доступных автоматов. Невозможно провести инкассацию.');
      return await ctx.scene.leave();
    }
    
    const message = `
💰 Учет инкассации

Выберите автомат для инкассации:
`;
    
    // Создаем клавиатуру с автоматами
    const buttons = machines.map(machine => {
      const locationName = machine.location ? machine.location.name : 'Без локации';
      return [Markup.button.callback(
        `${machine.internalCode} - ${locationName}`,
        `machine_${machine.id}`
      )];
    });
    
    // Добавляем кнопку отмены
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора автомата
scene.action(/^machine_(.+)$/, async (ctx) => {
  try {
    const machineId = ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.cashData.machineId = machineId;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleCashSelectMachine(ctx);
    }
    
    const locationName = machine.location ? machine.location.name : 'Без локации';
    await ctx.editMessageText(`Выбран автомат: ${machine.internalCode} - ${locationName}`);
    
    // Получаем последнюю инкассацию для этого автомата
    const lastCash = await prisma.cash.findFirst({
      where: { machineId: machineId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (lastCash) {
      const lastCashDate = lastCash.createdAt.toLocaleDateString('ru-RU');
      const lastCashAmount = lastCash.amount;
      
      await ctx.reply(`
ℹ️ Информация о последней инкассации:

📅 Дата: ${lastCashDate}
💰 Сумма: ${lastCashAmount} руб.
`);
    }
    
    // Переходим к вводу суммы инкассации
    ctx.session.state = 'cash_input_amount';
    await handleCashInputAmount(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния cash_input_amount
async function handleCashInputAmount(ctx) {
  try {
    await ctx.reply(`
💰 Введите сумму инкассации (в рублях):
`);
    
    // Ожидаем ввод суммы от пользователя
  } catch (error) {
    console.error('Ошибка при запросе суммы инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик ввода суммы инкассации
scene.on('text', async (ctx) => {
  if (ctx.session.state === 'cash_input_amount') {
    try {
      // Получаем введенную сумму
      const amount = parseFloat(ctx.message.text.trim().replace(',', '.'));
      
      if (isNaN(amount) || amount < 0) {
        return await ctx.reply('❌ Пожалуйста, введите корректное число (сумму в рублях).');
      }
      
      // Сохраняем сумму
      ctx.session.cashData.amount = amount;
      
      await ctx.reply(`✅ Сумма инкассации (${amount} руб.) сохранена.`);
      
      // Переходим к загрузке фото
      ctx.session.state = 'cash_upload_photo';
      await handleCashUploadPhoto(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода суммы инкассации:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  } else if (ctx.session.state === 'cash_input_notes') {
    try {
      // Сохраняем примечания
      ctx.session.cashData.notes = ctx.message.text.trim();
      
      await ctx.reply('✅ Примечания сохранены.');
      
      // Переходим к подтверждению
      ctx.session.state = 'cash_confirm';
      await handleCashConfirm(ctx);
    } catch (error) {
      console.error('Ошибка при обработке ввода примечаний:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния cash_upload_photo
async function handleCashUploadPhoto(ctx) {
  try {
    await ctx.reply(`
📸 Фото инкассации

Пожалуйста, сделайте фото чека или купюр.
Отправьте фото или нажмите /skip, чтобы пропустить этот шаг.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'cash_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения фото инкассации
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'cash_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Сохраняем ID фото
      ctx.session.cashData.photo = photoId;
      
      await ctx.reply('✅ Фото инкассации получено.');
      
      // Запрашиваем примечания
      await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
      
      // Ожидаем ввод примечаний от пользователя
      ctx.session.state = 'cash_input_notes';
    } catch (error) {
      console.error('Ошибка при получении фото инкассации:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'cash_wait_photo') {
    // Запрашиваем примечания
    await ctx.reply(`
📝 Примечания

Введите дополнительные примечания или отправьте /skip, чтобы пропустить этот шаг:
`);
    
    // Ожидаем ввод примечаний от пользователя
    ctx.session.state = 'cash_input_notes';
  } else if (ctx.session.state === 'cash_input_notes') {
    ctx.session.cashData.notes = null;
    
    // Переходим к подтверждению
    ctx.session.state = 'cash_confirm';
    await handleCashConfirm(ctx);
  }
});

// Обработка состояния cash_confirm
async function handleCashConfirm(ctx) {
  try {
    const cashData = ctx.session.cashData;
    
    // Получаем информацию об автомате
    const machine = await prisma.machine.findUnique({
      where: { id: cashData.machineId },
      include: { location: true }
    });
    
    if (!machine) {
      await ctx.reply('❌ Автомат не найден. Попробуйте снова.');
      return await handleCashSelectMachine(ctx);
    }
    
    // Формируем текст подтверждения
    let confirmText = `
💰 Подтверждение инкассации

🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Сумма: ${cashData.amount} руб.
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}
`;
    
    // Добавляем примечания, если они есть
    if (cashData.notes) {
      confirmText += `\n📝 Примечания: ${cashData.notes}\n`;
    }
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'confirm_cash')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения инкассации
scene.action('confirm_cash', async (ctx) => {
  try {
    const cashData = ctx.session.cashData;
    
    // Создаем запись об инкассации в базе данных
    const cash = await prisma.cash.create({
      data: {
        machineId: cashData.machineId,
        amount: cashData.amount,
        photo: cashData.photo,
        notes: cashData.notes,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        reconciled: false
      }
    });
    
    // Отправляем уведомление менеджерам
    try {
      // Получаем список менеджеров
      const managers = await prisma.user.findMany({
        where: { 
          role: { in: ['ADMIN', 'MANAGER'] },
          status: 'ACTIVE'
        },
        select: { telegramId: true }
      });
      
      // Получаем информацию об автомате
      const machine = await prisma.machine.findUnique({
        where: { id: cashData.machineId },
        include: { location: true }
      });
      
      // Формируем текст уведомления
      const notificationText = `
💰 Новая инкассация!

🔹 ID: ${cash.id}
🔹 Автомат: ${machine.internalCode} - ${machine.location?.name || 'Без локации'}
🔹 Сумма: ${cashData.amount} руб.
🔹 Оператор: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Требуется сверка.
`;
      
      // Отправляем уведомление каждому менеджеру
      for (const manager of managers) {
        if (manager.telegramId) {
          await ctx.telegram.sendMessage(manager.telegramId, notificationText);
        }
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления менеджерам:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    // Отображаем сообщение об успешной инкассации
    await ctx.editMessageText(`
✅ Инкассация успешно зарегистрирована!

🔹 ID: ${cash.id}
🔹 Сумма: ${cashData.amount} руб.
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}

Менеджеры получили уведомление о необходимости сверки.
`);
    
    // Если пользователь - менеджер, предлагаем сразу провести сверку
    if (['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Провести сверку', `reconcile_${cash.id}`)],
        [Markup.button.callback('📋 Зарегистрировать еще инкассацию', 'cash_another')],
        [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
      ]);
      
      await ctx.reply('Что вы хотите сделать дальше?', keyboard);
    } else {
      // Если пользователь - оператор, предлагаем зарегистрировать еще инкассацию или вернуться в главное меню
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📋 Зарегистрировать еще инкассацию', 'cash_another')],
        [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
      ]);
      
      await ctx.reply('Что вы хотите сделать дальше?', keyboard);
    }
  } catch (error) {
    console.error('Ошибка при регистрации инкассации:', error);
    await ctx.reply('❌ Произошла ошибка при регистрации инкассации. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик сверки инкассации
scene.action(/^reconcile_(.+)$/, async (ctx) => {
  try {
    // Проверяем, имеет ли пользователь права на сверку
    if (!['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
      await ctx.answerCbQuery('⚠️ У вас нет прав на сверку инкассации.');
      return;
    }
    
    const cashId = ctx.match[1];
    
    // Получаем информацию об инкассации
    const cash = await prisma.cash.findUnique({
      where: { id: cashId },
      include: {
        machine: {
          include: { location: true }
        },
        user: true
      }
    });
    
    if (!cash) {
      await ctx.answerCbQuery('❌ Инкассация не найдена.');
      return;
    }
    
    // Если инкассация уже сверена, сообщаем об этом
    if (cash.reconciled) {
      await ctx.answerCbQuery('ℹ️ Эта инкассация уже сверена.');
      return;
    }
    
    // Переходим к сверке
    ctx.session.state = 'cash_reconciliation_manager';
    ctx.session.cashData.cashId = cashId;
    
    await ctx.editMessageText(`
💰 Сверка инкассации #${cash.id}

🔹 Автомат: ${cash.machine.internalCode} - ${cash.machine.location?.name || 'Без локации'}
🔹 Сумма: ${cash.amount} руб.
🔹 Оператор: ${cash.user.firstName} ${cash.user.lastName || ''}
🔹 Дата: ${cash.createdAt.toLocaleDateString('ru-RU')}

Подтвердите сверку инкассации:
`, Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить сверку', `confirm_reconcile_${cashId}`)],
      [Markup.button.callback('❌ Отклонить', `reject_reconcile_${cashId}`)],
      [Markup.button.callback('🔙 Назад', 'back_from_reconcile')]
    ]));
  } catch (error) {
    console.error('Ошибка при сверке инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик подтверждения сверки
scene.action(/^confirm_reconcile_(.+)$/, async (ctx) => {
  try {
    // Проверяем, имеет ли пользователь права на сверку
    if (!['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
      await ctx.answerCbQuery('⚠️ У вас нет прав на сверку инкассации.');
      return;
    }
    
    const cashId = ctx.match[1];
    
    // Обновляем статус инкассации
    await prisma.cash.update({
      where: { id: cashId },
      data: {
        reconciled: true,
        reconciledById: ctx.session.user.id,
        reconciledAt: new Date()
      }
    });
    
    // Получаем обновленную информацию об инкассации
    const cash = await prisma.cash.findUnique({
      where: { id: cashId },
      include: {
        machine: {
          include: { location: true }
        },
        user: true
      }
    });
    
    // Отправляем уведомление оператору
    try {
      if (cash.user.telegramId) {
        const notificationText = `
✅ Инкассация #${cash.id} сверена!

🔹 Автомат: ${cash.machine.internalCode} - ${cash.machine.location?.name || 'Без локации'}
🔹 Сумма: ${cash.amount} руб.
🔹 Дата: ${cash.createdAt.toLocaleDateString('ru-RU')}
🔹 Сверил: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}
`;
        
        await ctx.telegram.sendMessage(cash.user.telegramId, notificationText);
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления оператору:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    await ctx.editMessageText(`
✅ Инкассация #${cash.id} успешно сверена!

🔹 Автомат: ${cash.machine.internalCode} - ${cash.machine.location?.name || 'Без локации'}
🔹 Сумма: ${cash.amount} руб.
🔹 Оператор: ${cash.user.firstName} ${cash.user.lastName || ''}
🔹 Дата: ${cash.createdAt.toLocaleDateString('ru-RU')}
`);
    
    // Предлагаем зарегистрировать еще инкассацию или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Зарегистрировать инкассацию', 'cash_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении сверки инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отклонения сверки
scene.action(/^reject_reconcile_(.+)$/, async (ctx) => {
  try {
    // Проверяем, имеет ли пользователь права на сверку
    if (!['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
      await ctx.answerCbQuery('⚠️ У вас нет прав на сверку инкассации.');
      return;
    }
    
    const cashId = ctx.match[1];
    
    // Получаем информацию об инкассации
    const cash = await prisma.cash.findUnique({
      where: { id: cashId },
      include: {
        machine: {
          include: { location: true }
        },
        user: true
      }
    });
    
    // Отправляем уведомление оператору
    try {
      if (cash.user.telegramId) {
        const notificationText = `
❌ Инкассация #${cash.id} отклонена!

🔹 Автомат: ${cash.machine.internalCode} - ${cash.machine.location?.name || 'Без локации'}
🔹 Сумма: ${cash.amount} руб.
🔹 Дата: ${cash.createdAt.toLocaleDateString('ru-RU')}
🔹 Отклонил: ${ctx.session.user.firstName} ${ctx.session.user.lastName || ''}

Пожалуйста, свяжитесь с менеджером для уточнения деталей.
`;
        
        await ctx.telegram.sendMessage(cash.user.telegramId, notificationText);
      }
    } catch (notificationError) {
      console.error('Ошибка при отправке уведомления оператору:', notificationError);
      // Не прерываем выполнение, если не удалось отправить уведомление
    }
    
    await ctx.editMessageText(`
❌ Инкассация #${cash.id} отклонена.

🔹 Автомат: ${cash.machine.internalCode} - ${cash.machine.location?.name || 'Без локации'}
🔹 Сумма: ${cash.amount} руб.
🔹 Оператор: ${cash.user.firstName} ${cash.user.lastName || ''}
🔹 Дата: ${cash.createdAt.toLocaleDateString('ru-RU')}

Оператор получил уведомление об отклонении инкассации.
`);
    
    // Предлагаем зарегистрировать еще инкассацию или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Зарегистрировать инкассацию', 'cash_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при отклонении сверки инкассации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата из сверки
scene.action('back_from_reconcile', async (ctx) => {
  try {
    await ctx.editMessageText('🔙 Возврат из сверки инкассации.');
    
    // Предлагаем зарегистрировать инкассацию или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Зарегистрировать инкассацию', 'cash_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при возврате из сверки:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Регистрация инкассации отменена.');
  await ctx.scene.leave();
});

// Обработчик регистрации еще одной инкассации
scene.action('cash_another', async (ctx) => {
  // Сбрасываем данные и начинаем сначала
  ctx.session.cashData = {
    machineId: null,
    amount: 0,
    photo: null,
    notes: null,
    reconciled: false,
    reconciledBy: null,
    reconciledAt: null
  };
  
  ctx.session.state = 'cash_select_machine';
  await ctx.editMessageText('💰 Регистрация новой инкассации...');
  await handleCashSelectMachine(ctx);
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

module.exports = scene;
