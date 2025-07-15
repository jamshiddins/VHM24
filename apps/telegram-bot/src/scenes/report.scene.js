/**
 * FSM: report_fsm
 * Назначение: Генерация и просмотр отчетов на основе собранных данных.
 * Роли: Менеджер, Администратор.
 * Состояния:
 *   - report_select_type: выбор типа отчета
 *   - report_filter_period: выбор периода для отчета
 *   - report_filter_machine: выбор автомата для отчета
 *   - report_filter_item: выбор товара для отчета
 *   - report_export_format: выбор формата экспорта
 *   - report_generate_result: генерация и отображение результата
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');

// Создание сцены
const scene = new Scenes.BaseScene('report_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[report_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или MANAGER
  if (!ctx.session.user || !['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к отчетам.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные отчета
    ctx.session.reportData = {
      type: null,
      period: {
        start: null,
        end: null
      },
      machineId: null,
      itemId: null,
      exportFormat: null,
      results: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'report_select_type';
    
    // Переходим к выбору типа отчета
    await handleReportSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену report_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_select_type
async function handleReportSelectType(ctx) {
  try {
    const message = `
📊 Генерация отчетов

Выберите тип отчета:
`;
    
    // Создаем клавиатуру с типами отчетов
    const buttons = [
      [Markup.button.callback('💰 Отчет о продажах', 'type_sales')],
      [Markup.button.callback('📦 Отчет о запасах', 'type_inventory')],
      [Markup.button.callback('🔧 Отчет о техническом обслуживании', 'type_maintenance')],
      [Markup.button.callback('👥 Отчет о пользователях', 'type_users')],
      [Markup.button.callback('⚠️ Отчет об ошибках', 'type_errors')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе типа отчета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора типа отчета
scene.action(/^type_(.+)$/, async (ctx) => {
  try {
    const type = ctx.match[1];
    
    // Сохраняем тип отчета
    ctx.session.reportData.type = type;
    
    // Отображаем выбранный тип отчета
    let typeName = '';
    switch (type) {
      case 'sales':
        typeName = '💰 Отчет о продажах';
        break;
      case 'inventory':
        typeName = '📦 Отчет о запасах';
        break;
      case 'maintenance':
        typeName = '🔧 Отчет о техническом обслуживании';
        break;
      case 'users':
        typeName = '👥 Отчет о пользователях';
        break;
      case 'errors':
        typeName = '⚠️ Отчет об ошибках';
        break;
    }
    
    await ctx.editMessageText(`Выбран тип отчета: ${typeName}`);
    
    // Переходим к выбору периода
    ctx.session.state = 'report_filter_period';
    await handleReportFilterPeriod(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа отчета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_filter_period
async function handleReportFilterPeriod(ctx) {
  try {
    const message = `
📅 Выберите период для отчета:
`;
    
    // Создаем клавиатуру с периодами
    const buttons = [
      [Markup.button.callback('📅 Сегодня', 'period_today')],
      [Markup.button.callback('📅 Вчера', 'period_yesterday')],
      [Markup.button.callback('📅 Текущая неделя', 'period_current_week')],
      [Markup.button.callback('📅 Прошлая неделя', 'period_last_week')],
      [Markup.button.callback('📅 Текущий месяц', 'period_current_month')],
      [Markup.button.callback('📅 Прошлый месяц', 'period_last_month')],
      [Markup.button.callback('📅 Произвольный период', 'period_custom')],
      [Markup.button.callback('🔙 Назад', 'back_to_type')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе периода:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора периода
scene.action(/^period_(.+)$/, async (ctx) => {
  try {
    const period = ctx.match[1];
    
    // Определяем даты начала и конца периода
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let periodName = '';
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        periodName = 'Сегодня';
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        periodName = 'Вчера';
        break;
      case 'current_week':
        startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));
        startDate.setHours(0, 0, 0, 0);
        periodName = 'Текущая неделя';
        break;
      case 'last_week':
        startDate.setDate(startDate.getDate() - startDate.getDay() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - endDate.getDay());
        endDate.setHours(23, 59, 59, 999);
        periodName = 'Прошлая неделя';
        break;
      case 'current_month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        periodName = 'Текущий месяц';
        break;
      case 'last_month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        periodName = 'Прошлый месяц';
        break;
      case 'custom':
        // Переходим к вводу произвольного периода
        ctx.session.state = 'report_filter_period_custom';
        await ctx.editMessageText(`
📅 Произвольный период

Введите дату начала периода в формате ДД.ММ.ГГГГ:
`);
        return;
    }
    
    // Сохраняем период
    ctx.session.reportData.period.start = startDate;
    ctx.session.reportData.period.end = endDate;
    
    await ctx.editMessageText(`Выбран период: ${periodName} (${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')})`);
    
    // Переходим к следующему шагу в зависимости от типа отчета
    const type = ctx.session.reportData.type;
    
    if (['sales', 'inventory', 'maintenance', 'errors'].includes(type)) {
      // Для этих типов отчетов нужно выбрать автомат
      ctx.session.state = 'report_filter_machine';
      await handleReportFilterMachine(ctx);
    } else if (type === 'users') {
      // Для отчета о пользователях переходим к выбору формата экспорта
      ctx.session.state = 'report_export_format';
      await handleReportExportFormat(ctx);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора периода:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик ввода произвольного периода
scene.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    if (ctx.session.state === 'report_filter_period_custom') {
      // Проверяем формат даты
      const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const match = text.match(dateRegex);
      
      if (!match) {
        await ctx.reply('❌ Пожалуйста, введите дату в формате ДД.ММ.ГГГГ.');
        return;
      }
      
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Месяцы в JavaScript начинаются с 0
      const year = parseInt(match[3], 10);
      
      const date = new Date(year, month, day);
      
      // Проверяем корректность даты
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        await ctx.reply('❌ Пожалуйста, введите корректную дату.');
        return;
      }
      
      if (!ctx.session.reportData.period.start) {
        // Сохраняем дату начала периода
        date.setHours(0, 0, 0, 0);
        ctx.session.reportData.period.start = date;
        
        await ctx.reply(`
📅 Дата начала периода: ${date.toLocaleDateString('ru-RU')}

Введите дату окончания периода в формате ДД.ММ.ГГГГ:
`);
      } else {
        // Сохраняем дату окончания периода
        date.setHours(23, 59, 59, 999);
        ctx.session.reportData.period.end = date;
        
        // Проверяем, что дата окончания не раньше даты начала
        if (date < ctx.session.reportData.period.start) {
          await ctx.reply('❌ Дата окончания не может быть раньше даты начала периода.');
          ctx.session.reportData.period.end = null;
          return;
        }
        
        await ctx.reply(`
📅 Выбран период: ${ctx.session.reportData.period.start.toLocaleDateString('ru-RU')} - ${date.toLocaleDateString('ru-RU')}
`);
        
        // Переходим к следующему шагу в зависимости от типа отчета
        const type = ctx.session.reportData.type;
        
        if (['sales', 'inventory', 'maintenance', 'errors'].includes(type)) {
          // Для этих типов отчетов нужно выбрать автомат
          ctx.session.state = 'report_filter_machine';
          await handleReportFilterMachine(ctx);
        } else if (type === 'users') {
          // Для отчета о пользователях переходим к выбору формата экспорта
          ctx.session.state = 'report_export_format';
          await handleReportExportFormat(ctx);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке ввода произвольного периода:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_filter_machine
async function handleReportFilterMachine(ctx) {
  try {
    // Получаем список автоматов
    const machines = await prisma.machine.findMany({
      where: { status: 'ACTIVE' },
      include: { location: true },
      orderBy: { internalCode: 'asc' }
    });
    
    if (machines.length === 0) {
      await ctx.reply('❌ Нет доступных автоматов.');
      return await ctx.scene.leave();
    }
    
    const message = `
🤖 Выберите автомат для отчета:
`;
    
    // Создаем клавиатуру с автоматами
    const buttons = machines.map(machine => {
      const locationName = machine.location ? machine.location.name : 'Без локации';
      return [Markup.button.callback(`${machine.internalCode} - ${locationName}`, `machine_${machine.id}`)];
    });
    
    // Добавляем кнопку "Все автоматы"
    buttons.push([Markup.button.callback('🔄 Все автоматы', 'machine_all')]);
    
    // Добавляем кнопки навигации
    buttons.push([Markup.button.callback('🔙 Назад', 'back_to_period')]);
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
    const machineId = ctx.match[1] === 'all' ? null : ctx.match[1];
    
    // Сохраняем ID автомата
    ctx.session.reportData.machineId = machineId;
    
    let machineName = 'Все автоматы';
    
    if (machineId) {
      // Получаем информацию об автомате
      const machine = await prisma.machine.findUnique({
        where: { id: machineId },
        include: { location: true }
      });
      
      if (machine) {
        const locationName = machine.location ? machine.location.name : 'Без локации';
        machineName = `${machine.internalCode} - ${locationName}`;
      }
    }
    
    await ctx.editMessageText(`Выбран автомат: ${machineName}`);
    
    // Переходим к следующему шагу в зависимости от типа отчета
    const type = ctx.session.reportData.type;
    
    if (type === 'inventory') {
      // Для отчета о запасах нужно выбрать товар
      ctx.session.state = 'report_filter_item';
      await handleReportFilterItem(ctx);
    } else {
      // Для остальных отчетов переходим к выбору формата экспорта
      ctx.session.state = 'report_export_format';
      await handleReportExportFormat(ctx);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора автомата:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_filter_item
async function handleReportFilterItem(ctx) {
  try {
    // Получаем список ингредиентов
    const ingredients = await prisma.ingredient.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    if (ingredients.length === 0) {
      await ctx.reply('❌ Нет доступных ингредиентов.');
      return await ctx.scene.leave();
    }
    
    const message = `
🧂 Выберите ингредиент для отчета:
`;
    
    // Создаем клавиатуру с ингредиентами
    const buttons = ingredients.map(ingredient => {
      return [Markup.button.callback(`${ingredient.name}`, `item_${ingredient.id}`)];
    });
    
    // Добавляем кнопку "Все ингредиенты"
    buttons.push([Markup.button.callback('🔄 Все ингредиенты', 'item_all')]);
    
    // Добавляем кнопки навигации
    buttons.push([Markup.button.callback('🔙 Назад', 'back_to_machine')]);
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе ингредиента:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора ингредиента
scene.action(/^item_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1] === 'all' ? null : ctx.match[1];
    
    // Сохраняем ID ингредиента
    ctx.session.reportData.itemId = itemId;
    
    let itemName = 'Все ингредиенты';
    
    if (itemId) {
      // Получаем информацию об ингредиенте
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: itemId }
      });
      
      if (ingredient) {
        itemName = ingredient.name;
      }
    }
    
    await ctx.editMessageText(`Выбран ингредиент: ${itemName}`);
    
    // Переходим к выбору формата экспорта
    ctx.session.state = 'report_export_format';
    await handleReportExportFormat(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора ингредиента:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_export_format
async function handleReportExportFormat(ctx) {
  try {
    const message = `
📄 Выберите формат экспорта:
`;
    
    // Создаем клавиатуру с форматами экспорта
    const buttons = [
      [Markup.button.callback('📊 Excel', 'format_excel')],
      [Markup.button.callback('📝 Текст', 'format_text')],
      [Markup.button.callback('🔙 Назад', 'back_to_previous')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе формата экспорта:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора формата экспорта
scene.action(/^format_(.+)$/, async (ctx) => {
  try {
    const format = ctx.match[1];
    
    // Сохраняем формат экспорта
    ctx.session.reportData.exportFormat = format;
    
    let formatName = '';
    switch (format) {
      case 'excel':
        formatName = '📊 Excel';
        break;
      case 'text':
        formatName = '📝 Текст';
        break;
    }
    
    await ctx.editMessageText(`Выбран формат экспорта: ${formatName}`);
    
    // Переходим к генерации отчета
    ctx.session.state = 'report_generate_result';
    await handleReportGenerateResult(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора формата экспорта:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния report_generate_result
async function handleReportGenerateResult(ctx) {
  try {
    await ctx.reply('⏳ Генерация отчета...');
    
    const reportData = ctx.session.reportData;
    const type = reportData.type;
    const startDate = reportData.period.start;
    const endDate = reportData.period.end;
    const machineId = reportData.machineId;
    const itemId = reportData.itemId;
    const format = reportData.exportFormat;
    
    // Генерируем отчет в зависимости от типа
    let results = null;
    
    switch (type) {
      case 'sales':
        results = await generateSalesReport(startDate, endDate, machineId);
        break;
      case 'inventory':
        results = await generateInventoryReport(startDate, endDate, machineId, itemId);
        break;
      case 'maintenance':
        results = await generateMaintenanceReport(startDate, endDate, machineId);
        break;
      case 'users':
        results = await generateUsersReport(startDate, endDate);
        break;
      case 'errors':
        results = await generateErrorsReport(startDate, endDate, machineId);
        break;
    }
    
    // Сохраняем результаты
    ctx.session.reportData.results = results;
    
    // Экспортируем отчет в выбранном формате
    if (format === 'excel') {
      // Экспорт в Excel
      const filePath = await exportToExcel(results, type);
      
      // Отправляем файл
      await ctx.replyWithDocument({ source: filePath, filename: `report_${type}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx` });
      
      // Удаляем временный файл
      fs.unlinkSync(filePath);
    } else {
      // Экспорт в текст
      const text = exportToText(results, type);
      
      // Отправляем текст
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
    
    // Предлагаем сгенерировать еще отчет или вернуться в главное меню
    const buttons = [
      [Markup.button.callback('📊 Сгенерировать еще отчет', 'generate_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при генерации отчета:', error);
    await ctx.reply('❌ Произошла ошибка при генерации отчета. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик генерации еще одного отчета
scene.action('generate_another', async (ctx) => {
  try {
    // Сбрасываем данные отчета
    ctx.session.reportData = {
      type: null,
      period: {
        start: null,
        end: null
      },
      machineId: null,
      itemId: null,
      exportFormat: null,
      results: null
    };
    
    // Переходим к выбору типа отчета
    ctx.session.state = 'report_select_type';
    await ctx.editMessageText('📊 Генерация нового отчета...');
    await handleReportSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при генерации нового отчета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
  await ctx.scene.enter('main_menu_fsm');
});

// Обработчики навигации
scene.action('back_to_type', async (ctx) => {
  ctx.session.state = 'report_select_type';
  await ctx.deleteMessage();
  await handleReportSelectType(ctx);
});

scene.action('back_to_period', async (ctx) => {
  ctx.session.state = 'report_filter_period';
  await ctx.deleteMessage();
  await handleReportFilterPeriod(ctx);
});

scene.action('back_to_machine', async (ctx) => {
  ctx.session.state = 'report_filter_machine';
  await ctx.deleteMessage();
  await handleReportFilterMachine(ctx);
});

scene.action('back_to_previous', async (ctx) => {
  const type = ctx.session.reportData.type;
  
  if (type === 'inventory' && ctx.session.reportData.machineId !== null) {
    // Возвращаемся к выбору ингредиента
    ctx.session.state = 'report_filter_item';
    await ctx.deleteMessage();
    await handleReportFilterItem(ctx);
  } else if (['sales', 'inventory', 'maintenance', 'errors'].includes(type)) {
    // Возвращаемся к выбору автомата
    ctx.session.state = 'report_filter_machine';
    await ctx.deleteMessage();
    await handleReportFilterMachine(ctx);
  } else {
    // Возвращаемся к выбору периода
    ctx.session.state = 'report_filter_period';
    await ctx.deleteMessage();
    await handleReportFilterPeriod(ctx);
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Генерация отчета отменена.');
  await ctx.scene.leave();
});

// Функция для генерации отчета о продажах
async function generateSalesReport(startDate, endDate, machineId) {
  try {
    // Формируем условие для запроса
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (machineId) {
      where.machineId = machineId;
    }
    
    // Получаем данные о продажах
    const sales = await prisma.sale.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Группируем продажи по автоматам и продуктам
    const salesByMachine = {};
    const salesByProduct = {};
    let totalAmount = 0;
    let totalQuantity = 0;
    
    for (const sale of sales) {
      const machineCode = sale.machine.internalCode;
      const productName = sale.product.name;
      
      // Группировка по автоматам
      if (!salesByMachine[machineCode]) {
        salesByMachine[machineCode] = {
          machine: sale.machine,
          totalAmount: 0,
          totalQuantity: 0,
          products: {}
        };
      }
      
      salesByMachine[machineCode].totalAmount += sale.amount;
      salesByMachine[machineCode].totalQuantity += sale.quantity;
      
      if (!salesByMachine[machineCode].products[productName]) {
        salesByMachine[machineCode].products[productName] = {
          amount: 0,
          quantity: 0
        };
      }
      
      salesByMachine[machineCode].products[productName].amount += sale.amount;
      salesByMachine[machineCode].products[productName].quantity += sale.quantity;
      
      // Группировка по продуктам
      if (!salesByProduct[productName]) {
        salesByProduct[productName] = {
          product: sale.product,
          totalAmount: 0,
          totalQuantity: 0,
          machines: {}
        };
      }
      
      salesByProduct[productName].totalAmount += sale.amount;
      salesByProduct[productName].totalQuantity += sale.quantity;
      
      if (!salesByProduct[productName].machines[machineCode]) {
        salesByProduct[productName].machines[machineCode] = {
          amount: 0,
          quantity: 0
        };
      }
      
      salesByProduct[productName].machines[machineCode].amount += sale.amount;
      salesByProduct[productName].machines[machineCode].quantity += sale.quantity;
      
      // Общие суммы
      totalAmount += sale.amount;
      totalQuantity += sale.quantity;
    }
    
    return {
      type: 'sales',
      startDate,
      endDate,
      machineId,
      sales,
      salesByMachine,
      salesByProduct,
      totalAmount,
      totalQuantity
    };
  } catch (error) {
    console.error('Ошибка при генерации отчета о продажах:', error);
    throw error;
  }
}

// Функция для генерации отчета о запасах
async function generateInventoryReport(startDate, endDate, machineId, itemId) {
  try {
    // Формируем условие для запроса
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (machineId) {
      where.machineId = machineId;
    }
    
    if (itemId) {
      where.ingredientId = itemId;
    }
    
    // Получаем данные о запасах
    const inventoryRecords = await prisma.inventoryRecord.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        ingredient: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Группируем записи по автоматам и ингредиентам
    const inventoryByMachine = {};
    const inventoryByIngredient = {};
    
    for (const record of inventoryRecords) {
      const machineCode = record.machine.internalCode;
      const ingredientName = record.ingredient.name;
      
      // Группировка по автоматам
      if (!inventoryByMachine[machineCode]) {
        inventoryByMachine[machineCode] = {
          machine: record.machine,
          ingredients: {}
        };
      }
      
      if (!inventoryByMachine[machineCode].ingredients[ingredientName]) {
        inventoryByMachine[machineCode].ingredients[ingredientName] = {
          ingredient: record.ingredient,
          records: []
        };
      }
      
      inventoryByMachine[machineCode].ingredients[ingredientName].records.push(record);
      
      // Группировка по ингредиентам
      if (!inventoryByIngredient[ingredientName]) {
        inventoryByIngredient[ingredientName] = {
          ingredient: record.ingredient,
          machines: {}
        };
      }
      
      if (!inventoryByIngredient[ingredientName].machines[machineCode]) {
        inventoryByIngredient[ingredientName].machines[machineCode] = {
          machine: record.machine,
          records: []
        };
      }
      
      inventoryByIngredient[ingredientName].machines[machineCode].records.push(record);
    }
    
    return {
      type: 'inventory',
      startDate,
      endDate,
      machineId,
      itemId,
      inventoryRecords,
      inventoryByMachine,
      inventoryByIngredient
    };
  } catch (error) {
    console.error('Ошибка при генерации отчета о запасах:', error);
    throw error;
  }
}

// Функция для генерации отчета о техническом обслуживании
async function generateMaintenanceReport(startDate, endDate, machineId) {
  try {
    // Формируем условие для запроса
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      type: 'REPAIR'
    };
    
    if (machineId) {
      where.machineId = machineId;
    }
    
    // Получаем данные о задачах по техническому обслуживанию
    const tasks = await prisma.task.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        assignedUser: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Группируем задачи по автоматам и статусам
    const tasksByMachine = {};
    const tasksByStatus = {
      PENDING: [],
      ASSIGNED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: []
    };
    
    for (const task of tasks) {
      const machineCode = task.machine.internalCode;
      
      // Группировка по автоматам
      if (!tasksByMachine[machineCode]) {
        tasksByMachine[machineCode] = {
          machine: task.machine,
          tasks: []
        };
      }
      
      tasksByMachine[machineCode].tasks.push(task);
      
      // Группировка по статусам
      tasksByStatus[task.status].push(task);
    }
    
    return {
      type: 'maintenance',
      startDate,
      endDate,
      machineId,
      tasks,
      tasksByMachine,
      tasksByStatus
    };
  } catch (error) {
    console.error('Ошибка при генерации отчета о техническом обслуживании:', error);
    throw error;
  }
}

// Функция для генерации отчета о пользователях
async function generateUsersReport(startDate, endDate) {
  try {
    // Получаем данные о пользователях
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { lastName: 'asc' }
    });
    
    // Группируем пользователей по ролям
    const usersByRole = {
      ADMIN: [],
      MANAGER: [],
      OPERATOR: [],
      TECHNICIAN: [],
      WAREHOUSE: []
    };
    
    for (const user of users) {
      usersByRole[user.role].push(user);
    }
    
    // Получаем статистику по активности пользователей
    const userLogs = await prisma.userLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Группируем логи по пользователям
    const logsByUser = {};
    
    for (const log of userLogs) {
      const userId = log.userId;
      
      if (!logsByUser[userId]) {
        logsByUser[userId] = {
          user: log.user,
          logs: []
        };
      }
      
      logsByUser[userId].logs.push(log);
    }
    
    return {
      type: 'users',
      startDate,
      endDate,
      users,
      usersByRole,
      userLogs,
      logsByUser
    };
  } catch (error) {
    console.error('Ошибка при генерации отчета о пользователях:', error);
    throw error;
  }
}

// Функция для генерации отчета об ошибках
async function generateErrorsReport(startDate, endDate, machineId) {
  try {
    // Формируем условие для запроса
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (machineId) {
      where.machineId = machineId;
    }
    
    // Получаем данные об ошибках
    const errors = await prisma.errorReport.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        user: true,
        task: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Группируем ошибки по автоматам и причинам
    const errorsByMachine = {};
    const errorsByReason = {};
    
    for (const error of errors) {
      const machineCode = error.machine ? error.machine.internalCode : 'Без автомата';
      const reason = error.reason;
      
      // Группировка по автоматам
      if (!errorsByMachine[machineCode]) {
        errorsByMachine[machineCode] = {
          machine: error.machine,
          errors: []
        };
      }
      
      errorsByMachine[machineCode].errors.push(error);
      
      // Группировка по причинам
      if (!errorsByReason[reason]) {
        errorsByReason[reason] = [];
      }
      
      errorsByReason[reason].push(error);
    }
    
    return {
      type: 'errors',
      startDate,
      endDate,
      machineId,
      errors,
      errorsByMachine,
      errorsByReason
    };
  } catch (error) {
    console.error('Ошибка при генерации отчета об ошибках:', error);
    throw error;
  }
}

// Функция для экспорта отчета в Excel
async function exportToExcel(results, type) {
  try {
    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook();
    
    // Добавляем метаданные
    workbook.creator = 'VendHubBot';
    workbook.lastModifiedBy = 'VendHubBot';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Создаем листы в зависимости от типа отчета
    switch (type) {
      case 'sales':
        createSalesWorksheets(workbook, results);
        break;
      case 'inventory':
        createInventoryWorksheets(workbook, results);
        break;
      case 'maintenance':
        createMaintenanceWorksheets(workbook, results);
        break;
      case 'users':
        createUsersWorksheets(workbook, results);
        break;
      case 'errors':
        createErrorsWorksheets(workbook, results);
        break;
    }
    
    // Создаем директорию для временных файлов, если она не существует
    const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Генерируем уникальное имя файла
    const fileName = `report_${type}_${uuidv4()}.xlsx`;
    const filePath = path.join(tempDir, fileName);
    
    // Сохраняем файл
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  } catch (error) {
    console.error('Ошибка при экспорте отчета в Excel:', error);
    throw error;
  }
}

// Функция для создания листов отчета о продажах
function createSalesWorksheets(workbook, results) {
  // Лист с общей информацией
  const summarySheet = workbook.addWorksheet('Общая информация');
  
  summarySheet.columns = [
    { header: 'Параметр', key: 'parameter', width: 30 },
    { header: 'Значение', key: 'value', width: 30 }
  ];
  
  summarySheet.addRows([
    { parameter: 'Тип отчета', value: 'Отчет о продажах' },
    { parameter: 'Период', value: `${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}` },
    { parameter: 'Общая сумма продаж', value: `${results.totalAmount} руб.` },
    { parameter: 'Общее количество продаж', value: results.totalQuantity }
  ]);
  
  // Лист с продажами по автоматам
  const machinesSheet = workbook.addWorksheet('По автоматам');
  
  machinesSheet.columns = [
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Сумма продаж', key: 'amount', width: 15 },
    { header: 'Количество продаж', key: 'quantity', width: 15 }
  ];
  
  for (const machineCode in results.salesByMachine) {
    const machineData = results.salesByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    machinesSheet.addRow({
      machine: machineCode,
      location: locationName,
      amount: machineData.totalAmount,
      quantity: machineData.totalQuantity
    });
  }
  
  // Лист с продажами по продуктам
  const productsSheet = workbook.addWorksheet('По продуктам');
  
  productsSheet.columns = [
    { header: 'Продукт', key: 'product', width: 30 },
    { header: 'Сумма продаж', key: 'amount', width: 15 },
    { header: 'Количество продаж', key: 'quantity', width: 15 }
  ];
  
  for (const productName in results.salesByProduct) {
    const productData = results.salesByProduct[productName];
    
    productsSheet.addRow({
      product: productName,
      amount: productData.totalAmount,
      quantity: productData.totalQuantity
    });
  }
  
  // Лист с детальной информацией
  const detailsSheet = workbook.addWorksheet('Детали');
  
  detailsSheet.columns = [
    { header: 'Дата', key: 'date', width: 20 },
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Продукт', key: 'product', width: 30 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Сумма', key: 'amount', width: 15 }
  ];
  
  for (const sale of results.sales) {
    const locationName = sale.machine.location ? sale.machine.location.name : 'Без локации';
    
    detailsSheet.addRow({
      date: new Date(sale.createdAt).toLocaleString('ru-RU'),
      machine: sale.machine.internalCode,
      location: locationName,
      product: sale.product.name,
      quantity: sale.quantity,
      amount: sale.amount
    });
  }
}

// Функция для создания листов отчета о запасах
function createInventoryWorksheets(workbook, results) {
  // Лист с общей информацией
  const summarySheet = workbook.addWorksheet('Общая информация');
  
  summarySheet.columns = [
    { header: 'Параметр', key: 'parameter', width: 30 },
    { header: 'Значение', key: 'value', width: 30 }
  ];
  
  summarySheet.addRows([
    { parameter: 'Тип отчета', value: 'Отчет о запасах' },
    { parameter: 'Период', value: `${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}` },
    { parameter: 'Количество записей', value: results.inventoryRecords.length }
  ]);
  
  // Лист с запасами по автоматам
  const machinesSheet = workbook.addWorksheet('По автоматам');
  
  machinesSheet.columns = [
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Ингредиент', key: 'ingredient', width: 30 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Дата', key: 'date', width: 20 }
  ];
  
  for (const machineCode in results.inventoryByMachine) {
    const machineData = results.inventoryByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    for (const ingredientName in machineData.ingredients) {
      const ingredientData = machineData.ingredients[ingredientName];
      
      for (const record of ingredientData.records) {
        machinesSheet.addRow({
          machine: machineCode,
          location: locationName,
          ingredient: ingredientName,
          quantity: record.quantity,
          date: new Date(record.createdAt).toLocaleString('ru-RU')
        });
      }
    }
  }
  
  // Лист с запасами по ингредиентам
  const ingredientsSheet = workbook.addWorksheet('По ингредиентам');
  
  ingredientsSheet.columns = [
    { header: 'Ингредиент', key: 'ingredient', width: 30 },
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Дата', key: 'date', width: 20 }
  ];
  
  for (const ingredientName in results.inventoryByIngredient) {
    const ingredientData = results.inventoryByIngredient[ingredientName];
    
    for (const machineCode in ingredientData.machines) {
      const machineData = ingredientData.machines[machineCode];
      const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
      
      for (const record of machineData.records) {
        ingredientsSheet.addRow({
          ingredient: ingredientName,
          machine: machineCode,
          location: locationName,
          quantity: record.quantity,
          date: new Date(record.createdAt).toLocaleString('ru-RU')
        });
      }
    }
  }
}

// Функция для создания листов отчета о техническом обслуживании
function createMaintenanceWorksheets(workbook, results) {
  // Лист с общей информацией
  const summarySheet = workbook.addWorksheet('Общая информация');
  
  summarySheet.columns = [
    { header: 'Параметр', key: 'parameter', width: 30 },
    { header: 'Значение', key: 'value', width: 30 }
  ];
  
  summarySheet.addRows([
    { parameter: 'Тип отчета', value: 'Отчет о техническом обслуживании' },
    { parameter: 'Период', value: `${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}` },
    { parameter: 'Количество задач', value: results.tasks.length },
    { parameter: 'Ожидающие', value: results.tasksByStatus.PENDING.length },
    { parameter: 'Назначенные', value: results.tasksByStatus.ASSIGNED.length },
    { parameter: 'В процессе', value: results.tasksByStatus.IN_PROGRESS.length },
    { parameter: 'Завершенные', value: results.tasksByStatus.COMPLETED.length },
    { parameter: 'Отмененные', value: results.tasksByStatus.CANCELLED.length }
  ]);
  
  // Лист с задачами по автоматам
  const machinesSheet = workbook.addWorksheet('По автоматам');
  
  machinesSheet.columns = [
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Задача', key: 'task', width: 50 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Исполнитель', key: 'assignee', width: 30 },
    { header: 'Дата создания', key: 'createdAt', width: 20 },
    { header: 'Срок', key: 'deadline', width: 20 }
  ];
  
  for (const machineCode in results.tasksByMachine) {
    const machineData = results.tasksByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    for (const task of machineData.tasks) {
      const assigneeName = task.assignedUser ? `${task.assignedUser.lastName} ${task.assignedUser.firstName}` : 'Не назначен';
      
      machinesSheet.addRow({
        machine: machineCode,
        location: locationName,
        task: task.description,
        status: getTaskStatusName(task.status),
        assignee: assigneeName,
        createdAt: new Date(task.createdAt).toLocaleString('ru-RU'),
        deadline: task.deadline ? new Date(task.deadline).toLocaleString('ru-RU') : 'Не указан'
      });
    }
  }
  
  // Лист с задачами по статусам
  const statusesSheet = workbook.addWorksheet('По статусам');
  
  statusesSheet.columns = [
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Задача', key: 'task', width: 50 },
    { header: 'Исполнитель', key: 'assignee', width: 30 },
    { header: 'Дата создания', key: 'createdAt', width: 20 },
    { header: 'Срок', key: 'deadline', width: 20 }
  ];
  
  for (const status in results.tasksByStatus) {
    for (const task of results.tasksByStatus[status]) {
      const locationName = task.machine.location ? task.machine.location.name : 'Без локации';
      const assigneeName = task.assignedUser ? `${task.assignedUser.lastName} ${task.assignedUser.firstName}` : 'Не назначен';
      
      statusesSheet.addRow({
        status: getTaskStatusName(status),
        machine: task.machine.internalCode,
        location: locationName,
        task: task.description,
        assignee: assigneeName,
        createdAt: new Date(task.createdAt).toLocaleString('ru-RU'),
        deadline: task.deadline ? new Date(task.deadline).toLocaleString('ru-RU') : 'Не указан'
      });
    }
  }
}

// Функция для создания листов отчета о пользователях
function createUsersWorksheets(workbook, results) {
  // Лист с общей информацией
  const summarySheet = workbook.addWorksheet('Общая информация');
  
  summarySheet.columns = [
    { header: 'Параметр', key: 'parameter', width: 30 },
    { header: 'Значение', key: 'value', width: 30 }
  ];
  
  summarySheet.addRows([
    { parameter: 'Тип отчета', value: 'Отчет о пользователях' },
    { parameter: 'Период', value: `${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}` },
    { parameter: 'Количество пользователей', value: results.users.length },
    { parameter: 'Администраторы', value: results.usersByRole.ADMIN.length },
    { parameter: 'Менеджеры', value: results.usersByRole.MANAGER.length },
    { parameter: 'Операторы', value: results.usersByRole.OPERATOR.length },
    { parameter: 'Техники', value: results.usersByRole.TECHNICIAN.length },
    { parameter: 'Кладовщики', value: results.usersByRole.WAREHOUSE.length }
  ]);
  
  // Лист с пользователями
  const usersSheet = workbook.addWorksheet('Пользователи');
  
  usersSheet.columns = [
    { header: 'Фамилия', key: 'lastName', width: 20 },
    { header: 'Имя', key: 'firstName', width: 20 },
    { header: 'Роль', key: 'role', width: 15 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Telegram ID', key: 'telegramId', width: 15 },
    { header: 'Телефон', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Дата регистрации', key: 'createdAt', width: 20 },
    { header: 'Последний вход', key: 'lastLoginAt', width: 20 }
  ];
  
  for (const user of results.users) {
    usersSheet.addRow({
      lastName: user.lastName,
      firstName: user.firstName,
      role: getRoleName(user.role),
      status: getStatusName(user.status),
      telegramId: user.telegramId || '',
      phone: user.phone || '',
      email: user.email || '',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString('ru-RU') : '',
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : ''
    });
  }
  
  // Лист с логами пользователей
  const logsSheet = workbook.addWorksheet('Логи');
  
  logsSheet.columns = [
    { header: 'Дата', key: 'date', width: 20 },
    { header: 'Пользователь', key: 'user', width: 30 },
    { header: 'Действие', key: 'action', width: 50 },
    { header: 'Детали', key: 'details', width: 50 }
  ];
  
  for (const log of results.userLogs) {
    const userName = log.user ? `${log.user.lastName} ${log.user.firstName}` : 'Неизвестный пользователь';
    
    logsSheet.addRow({
      date: new Date(log.createdAt).toLocaleString('ru-RU'),
      user: userName,
      action: log.action,
      details: log.details || ''
    });
  }
}

// Функция для создания листов отчета об ошибках
function createErrorsWorksheets(workbook, results) {
  // Лист с общей информацией
  const summarySheet = workbook.addWorksheet('Общая информация');
  
  summarySheet.columns = [
    { header: 'Параметр', key: 'parameter', width: 30 },
    { header: 'Значение', key: 'value', width: 30 }
  ];
  
  summarySheet.addRows([
    { parameter: 'Тип отчета', value: 'Отчет об ошибках' },
    { parameter: 'Период', value: `${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}` },
    { parameter: 'Количество ошибок', value: results.errors.length }
  ]);
  
  // Лист с ошибками по автоматам
  const machinesSheet = workbook.addWorksheet('По автоматам');
  
  machinesSheet.columns = [
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Причина', key: 'reason', width: 30 },
    { header: 'Комментарий', key: 'comment', width: 50 },
    { header: 'Пользователь', key: 'user', width: 30 },
    { header: 'Дата', key: 'date', width: 20 }
  ];
  
  for (const machineCode in results.errorsByMachine) {
    const machineData = results.errorsByMachine[machineCode];
    const locationName = machineData.machine ? (machineData.machine.location ? machineData.machine.location.name : 'Без локации') : 'Без локации';
    
    for (const error of machineData.errors) {
      const userName = error.user ? `${error.user.lastName} ${error.user.firstName}` : 'Неизвестный пользователь';
      
      machinesSheet.addRow({
        machine: machineCode,
        location: locationName,
        reason: getErrorReasonName(error.reason),
        comment: error.comment,
        user: userName,
        date: new Date(error.createdAt).toLocaleString('ru-RU')
      });
    }
  }
  
  // Лист с ошибками по причинам
  const reasonsSheet = workbook.addWorksheet('По причинам');
  
  reasonsSheet.columns = [
    { header: 'Причина', key: 'reason', width: 30 },
    { header: 'Автомат', key: 'machine', width: 20 },
    { header: 'Локация', key: 'location', width: 30 },
    { header: 'Комментарий', key: 'comment', width: 50 },
    { header: 'Пользователь', key: 'user', width: 30 },
    { header: 'Дата', key: 'date', width: 20 }
  ];
  
  for (const reason in results.errorsByReason) {
    for (const error of results.errorsByReason[reason]) {
      const machineCode = error.machine ? error.machine.internalCode : 'Без автомата';
      const locationName = error.machine ? (error.machine.location ? error.machine.location.name : 'Без локации') : 'Без локации';
      const userName = error.user ? `${error.user.lastName} ${error.user.firstName}` : 'Неизвестный пользователь';
      
      reasonsSheet.addRow({
        reason: getErrorReasonName(reason),
        machine: machineCode,
        location: locationName,
        comment: error.comment,
        user: userName,
        date: new Date(error.createdAt).toLocaleString('ru-RU')
      });
    }
  }
}

// Функция для экспорта отчета в текст
function exportToText(results, type) {
  try {
    let text = '';
    
    switch (type) {
      case 'sales':
        text = exportSalesToText(results);
        break;
      case 'inventory':
        text = exportInventoryToText(results);
        break;
      case 'maintenance':
        text = exportMaintenanceToText(results);
        break;
      case 'users':
        text = exportUsersToText(results);
        break;
      case 'errors':
        text = exportErrorsToText(results);
        break;
    }
    
    return text;
  } catch (error) {
    console.error('Ошибка при экспорте отчета в текст:', error);
    throw error;
  }
}

// Функция для экспорта отчета о продажах в текст
function exportSalesToText(results) {
  let text = `
<b>📊 Отчет о продажах</b>

<b>Период:</b> ${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}
<b>Общая сумма продаж:</b> ${results.totalAmount} руб.
<b>Общее количество продаж:</b> ${results.totalQuantity}

<b>Продажи по автоматам:</b>
`;
  
  for (const machineCode in results.salesByMachine) {
    const machineData = results.salesByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    text += `
<b>${machineCode} - ${locationName}</b>
Сумма продаж: ${machineData.totalAmount} руб.
Количество продаж: ${machineData.totalQuantity}
`;
  }
  
  text += `
<b>Продажи по продуктам:</b>
`;
  
  for (const productName in results.salesByProduct) {
    const productData = results.salesByProduct[productName];
    
    text += `
<b>${productName}</b>
Сумма продаж: ${productData.totalAmount} руб.
Количество продаж: ${productData.totalQuantity}
`;
  }
  
  return text;
}

// Функция для экспорта отчета о запасах в текст
function exportInventoryToText(results) {
  let text = `
<b>📊 Отчет о запасах</b>

<b>Период:</b> ${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}
<b>Количество записей:</b> ${results.inventoryRecords.length}

<b>Запасы по автоматам:</b>
`;
  
  for (const machineCode in results.inventoryByMachine) {
    const machineData = results.inventoryByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    text += `
<b>${machineCode} - ${locationName}</b>
`;
    
    for (const ingredientName in machineData.ingredients) {
      const ingredientData = machineData.ingredients[ingredientName];
      const latestRecord = ingredientData.records[0];
      
      text += `${ingredientName}: ${latestRecord.quantity} г (${new Date(latestRecord.createdAt).toLocaleDateString('ru-RU')})\n`;
    }
  }
  
  return text;
}

// Функция для экспорта отчета о техническом обслуживании в текст
function exportMaintenanceToText(results) {
  let text = `
<b>📊 Отчет о техническом обслуживании</b>

<b>Период:</b> ${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}
<b>Количество задач:</b> ${results.tasks.length}
<b>Ожидающие:</b> ${results.tasksByStatus.PENDING.length}
<b>Назначенные:</b> ${results.tasksByStatus.ASSIGNED.length}
<b>В процессе:</b> ${results.tasksByStatus.IN_PROGRESS.length}
<b>Завершенные:</b> ${results.tasksByStatus.COMPLETED.length}
<b>Отмененные:</b> ${results.tasksByStatus.CANCELLED.length}

<b>Задачи по автоматам:</b>
`;
  
  for (const machineCode in results.tasksByMachine) {
    const machineData = results.tasksByMachine[machineCode];
    const locationName = machineData.machine.location ? machineData.machine.location.name : 'Без локации';
    
    text += `
<b>${machineCode} - ${locationName}</b>
`;
    
    for (const task of machineData.tasks) {
      const assigneeName = task.assignedUser ? `${task.assignedUser.lastName} ${task.assignedUser.firstName}` : 'Не назначен';
      const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'Не указан';
      
      text += `${getTaskStatusName(task.status)}: ${task.description} (${assigneeName}, срок: ${deadline})\n`;
    }
  }
  
  return text;
}

// Функция для экспорта отчета о пользователях в текст
function exportUsersToText(results) {
  let text = `
<b>📊 Отчет о пользователях</b>

<b>Период:</b> ${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}
<b>Количество пользователей:</b> ${results.users.length}
<b>Администраторы:</b> ${results.usersByRole.ADMIN.length}
<b>Менеджеры:</b> ${results.usersByRole.MANAGER.length}
<b>Операторы:</b> ${results.usersByRole.OPERATOR.length}
<b>Техники:</b> ${results.usersByRole.TECHNICIAN.length}
<b>Кладовщики:</b> ${results.usersByRole.WAREHOUSE.length}

<b>Список пользователей:</b>
`;
  
  for (const user of results.users) {
    text += `
<b>${user.lastName} ${user.firstName}</b>
Роль: ${getRoleName(user.role)}
Статус: ${getStatusName(user.status)}
Telegram ID: ${user.telegramId || 'Не указан'}
Телефон: ${user.phone || 'Не указан'}
Email: ${user.email || 'Не указан'}
Дата регистрации: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
`;
  }
  
  return text;
}

// Функция для экспорта отчета об ошибках в текст
function exportErrorsToText(results) {
  let text = `
<b>📊 Отчет об ошибках</b>

<b>Период:</b> ${results.startDate.toLocaleDateString('ru-RU')} - ${results.endDate.toLocaleDateString('ru-RU')}
<b>Количество ошибок:</b> ${results.errors.length}

<b>Ошибки по автоматам:</b>
`;
  
  for (const machineCode in results.errorsByMachine) {
    const machineData = results.errorsByMachine[machineCode];
    const locationName = machineData.machine ? (machineData.machine.location ? machineData.machine.location.name : 'Без локации') : 'Без локации';
    
    text += `
<b>${machineCode} - ${locationName}</b>
`;
    
    for (const error of machineData.errors) {
      const userName = error.user ? `${error.user.lastName} ${error.user.firstName}` : 'Неизвестный пользователь';
      const date = new Date(error.createdAt).toLocaleDateString('ru-RU');
      
      text += `${getErrorReasonName(error.reason)}: ${error.comment} (${userName}, ${date})\n`;
    }
  }
  
  return text;
}

// Функция для получения названия статуса задачи
function getTaskStatusName(status) {
  const statuses = {
    'PENDING': '⏳ Ожидает',
    'ASSIGNED': '📋 Назначена',
    'IN_PROGRESS': '🔄 В процессе',
    'COMPLETED': '✅ Завершена',
    'CANCELLED': '❌ Отменена'
  };
  
  return statuses[status] || status;
}

// Функция для получения названия причины ошибки
function getErrorReasonName(reason) {
  const reasons = {
    'MISSED_PHOTO': '📸 Пропущено фото',
    'QUANTITY_MISMATCH': '⚖️ Несоответствие веса/количества',
    'TECHNICAL_ISSUE': '🔧 Техническая неисправность',
    'TASK_IMPOSSIBLE': '🚫 Невозможность выполнения задачи',
    'DEADLINE_MISSED': '⏱️ Нарушение сроков',
    'DATA_ERROR': '📋 Ошибка в данных',
    'OTHER': '🔄 Другая причина'
  };
  
  return reasons[reason] || reason;
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
