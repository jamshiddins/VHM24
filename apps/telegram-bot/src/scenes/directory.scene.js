/**
 * FSM: directory_fsm
 * Назначение: Управление всеми справочниками в системе (создание, редактирование, удаление объектов).
 * Роли: Менеджер, Администратор.
 * Состояния:
 *   - dir_select_category: выбор категории справочника
 *   - dir_list_entries: просмотр списка записей
 *   - dir_view_entry: просмотр записи
 *   - dir_add_entry: добавление записи
 *   - dir_edit_entry: редактирование записи
 *   - dir_delete_entry: удаление записи
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('directory_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[directory_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или MANAGER
  if (!ctx.session.user || !['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к управлению справочниками.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные справочника
    ctx.session.directoryData = {
      category: null,
      entryId: null,
      entryData: {},
      page: 1,
      itemsPerPage: 10
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'dir_select_category';
    
    // Переходим к выбору категории справочника
    await handleDirSelectCategory(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену directory_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния dir_select_category
async function handleDirSelectCategory(ctx) {
  try {
    const message = `
📚 Управление справочниками

Выберите категорию справочника:
`;
    
    // Создаем клавиатуру с категориями справочников
    const buttons = [
      [Markup.button.callback('🏢 Локации', 'category_locations')],
      [Markup.button.callback('🤖 Автоматы', 'category_machines')],
      [Markup.button.callback('🧂 Ингредиенты', 'category_ingredients')],
      [Markup.button.callback('💧 Типы воды', 'category_water_types')],
      [Markup.button.callback('🧴 Сиропы', 'category_syrups')],
      [Markup.button.callback('🧰 Дополнительные предметы', 'category_extra_items')],
      [Markup.button.callback('📋 Шаблоны чек-листов', 'category_checklist_templates')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выборе категории справочника:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора категории справочника
scene.action(/^category_(.+)$/, async (ctx) => {
  try {
    const category = ctx.match[1];
    
    // Сохраняем категорию справочника
    ctx.session.directoryData.category = category;
    
    // Отображаем выбранную категорию
    let categoryName = '';
    switch (category) {
      case 'locations':
        categoryName = '🏢 Локации';
        break;
      case 'machines':
        categoryName = '🤖 Автоматы';
        break;
      case 'ingredients':
        categoryName = '🧂 Ингредиенты';
        break;
      case 'water_types':
        categoryName = '💧 Типы воды';
        break;
      case 'syrups':
        categoryName = '🧴 Сиропы';
        break;
      case 'extra_items':
        categoryName = '🧰 Дополнительные предметы';
        break;
      case 'checklist_templates':
        categoryName = '📋 Шаблоны чек-листов';
        break;
    }
    
    await ctx.editMessageText(`Выбрана категория: ${categoryName}`);
    
    // Переходим к просмотру списка записей
    ctx.session.state = 'dir_list_entries';
    await handleDirListEntries(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора категории справочника:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния dir_list_entries
async function handleDirListEntries(ctx) {
  try {
    const category = ctx.session.directoryData.category;
    const page = ctx.session.directoryData.page;
    const itemsPerPage = ctx.session.directoryData.itemsPerPage;
    
    // Получаем список записей в зависимости от категории
    let entries = [];
    let totalEntries = 0;
    let categoryName = '';
    
    switch (category) {
      case 'locations':
        entries = await prisma.location.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.location.count();
        categoryName = '🏢 Локации';
        break;
      case 'machines':
        entries = await prisma.machine.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          include: { location: true },
          orderBy: { internalCode: 'asc' }
        });
        totalEntries = await prisma.machine.count();
        categoryName = '🤖 Автоматы';
        break;
      case 'ingredients':
        entries = await prisma.ingredient.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.ingredient.count();
        categoryName = '🧂 Ингредиенты';
        break;
      case 'water_types':
        entries = await prisma.waterType.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.waterType.count();
        categoryName = '💧 Типы воды';
        break;
      case 'syrups':
        entries = await prisma.syrup.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.syrup.count();
        categoryName = '🧴 Сиропы';
        break;
      case 'extra_items':
        entries = await prisma.extraItem.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.extraItem.count();
        categoryName = '🧰 Дополнительные предметы';
        break;
      case 'checklist_templates':
        entries = await prisma.checklistTemplate.findMany({
          skip: (page - 1) * itemsPerPage,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        });
        totalEntries = await prisma.checklistTemplate.count();
        categoryName = '📋 Шаблоны чек-листов';
        break;
    }
    
    // Формируем сообщение со списком записей
    let message = `
📚 ${categoryName} (${totalEntries} записей)

`;
    
    if (entries.length === 0) {
      message += 'Записи не найдены.';
    } else {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const index = (page - 1) * itemsPerPage + i + 1;
        
        switch (category) {
          case 'locations':
            message += `${index}. ${entry.name}\n`;
            break;
          case 'machines':
            const locationName = entry.location ? entry.location.name : 'Без локации';
            message += `${index}. ${entry.internalCode} - ${locationName}\n`;
            break;
          case 'ingredients':
            message += `${index}. ${entry.name} (${entry.code})\n`;
            break;
          case 'water_types':
            message += `${index}. ${entry.name} (${entry.volume} л)\n`;
            break;
          case 'syrups':
            message += `${index}. ${entry.name} (${entry.volume} мл)\n`;
            break;
          case 'extra_items':
            message += `${index}. ${entry.name}\n`;
            break;
          case 'checklist_templates':
            message += `${index}. ${entry.name}\n`;
            break;
        }
      }
    }
    
    // Создаем клавиатуру с кнопками навигации и действий
    const buttons = [];
    
    // Кнопки для просмотра записей
    if (entries.length > 0) {
      const entryButtons = entries.map((entry, i) => {
        const index = (page - 1) * itemsPerPage + i + 1;
        let buttonText = '';
        
        switch (category) {
          case 'locations':
            buttonText = `${index}. ${entry.name}`;
            break;
          case 'machines':
            buttonText = `${index}. ${entry.internalCode}`;
            break;
          case 'ingredients':
            buttonText = `${index}. ${entry.name}`;
            break;
          case 'water_types':
            buttonText = `${index}. ${entry.name}`;
            break;
          case 'syrups':
            buttonText = `${index}. ${entry.name}`;
            break;
          case 'extra_items':
            buttonText = `${index}. ${entry.name}`;
            break;
          case 'checklist_templates':
            buttonText = `${index}. ${entry.name}`;
            break;
        }
        
        return [Markup.button.callback(buttonText, `view_${entry.id}`)];
      });
      
      buttons.push(...entryButtons);
    }
    
    // Кнопки пагинации
    const paginationButtons = [];
    
    if (page > 1) {
      paginationButtons.push(Markup.button.callback('⬅️ Назад', 'prev_page'));
    }
    
    if (page * itemsPerPage < totalEntries) {
      paginationButtons.push(Markup.button.callback('➡️ Вперед', 'next_page'));
    }
    
    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons);
    }
    
    // Кнопки действий
    buttons.push([Markup.button.callback('➕ Добавить запись', 'add_entry')]);
    buttons.push([Markup.button.callback('🔙 Назад к категориям', 'back_to_categories')]);
    buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при просмотре списка записей:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики пагинации
scene.action('prev_page', async (ctx) => {
  try {
    ctx.session.directoryData.page--;
    await ctx.deleteMessage();
    await handleDirListEntries(ctx);
  } catch (error) {
    console.error('Ошибка при переходе на предыдущую страницу:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

scene.action('next_page', async (ctx) => {
  try {
    ctx.session.directoryData.page++;
    await ctx.deleteMessage();
    await handleDirListEntries(ctx);
  } catch (error) {
    console.error('Ошибка при переходе на следующую страницу:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата к категориям
scene.action('back_to_categories', async (ctx) => {
  try {
    // Сбрасываем данные
    ctx.session.directoryData = {
      category: null,
      entryId: null,
      entryData: {},
      page: 1,
      itemsPerPage: 10
    };
    
    ctx.session.state = 'dir_select_category';
    await ctx.deleteMessage();
    await handleDirSelectCategory(ctx);
  } catch (error) {
    console.error('Ошибка при возврате к категориям:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики просмотра записи
scene.action(/^view_(.+)$/, async (ctx) => {
  try {
    const entryId = ctx.match[1];
    const category = ctx.session.directoryData.category;
    
    // Сохраняем ID записи
    ctx.session.directoryData.entryId = entryId;
    
    // Получаем информацию о записи в зависимости от категории
    let entry = null;
    
    switch (category) {
      case 'locations':
        entry = await prisma.location.findUnique({
          where: { id: entryId }
        });
        break;
      case 'machines':
        entry = await prisma.machine.findUnique({
          where: { id: entryId },
          include: { location: true }
        });
        break;
      case 'ingredients':
        entry = await prisma.ingredient.findUnique({
          where: { id: entryId }
        });
        break;
      case 'water_types':
        entry = await prisma.waterType.findUnique({
          where: { id: entryId }
        });
        break;
      case 'syrups':
        entry = await prisma.syrup.findUnique({
          where: { id: entryId }
        });
        break;
      case 'extra_items':
        entry = await prisma.extraItem.findUnique({
          where: { id: entryId }
        });
        break;
      case 'checklist_templates':
        entry = await prisma.checklistTemplate.findUnique({
          where: { id: entryId },
          include: { items: true }
        });
        break;
    }
    
    if (!entry) {
      await ctx.reply('❌ Запись не найдена. Попробуйте снова.');
      return await handleDirListEntries(ctx);
    }
    
    // Формируем сообщение с информацией о записи
    let message = '';
    
    switch (category) {
      case 'locations':
        message = `
🏢 Локация: ${entry.name}

📍 Адрес: ${entry.address || 'Не указан'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'machines':
        message = `
🤖 Автомат: ${entry.internalCode}

🏢 Локация: ${entry.location ? entry.location.name : 'Не указана'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Модель: ${entry.model || 'Не указана'}
🔹 Серийный номер: ${entry.serialNumber || 'Не указан'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'ingredients':
        message = `
🧂 Ингредиент: ${entry.name}

🔹 Код: ${entry.code || 'Не указан'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'water_types':
        message = `
💧 Тип воды: ${entry.name}

🔹 Объем: ${entry.volume} л
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'syrups':
        message = `
🧴 Сироп: ${entry.name}

🔹 Объем: ${entry.volume} мл
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'extra_items':
        message = `
🧰 Дополнительный предмет: ${entry.name}

📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'checklist_templates':
        message = `
📋 Шаблон чек-листа: ${entry.name}

📝 Описание: ${entry.description || 'Не указано'}
🔹 Тип: ${getChecklistTypeName(entry.type)}
🔹 Статус: ${getStatusName(entry.status)}

📋 Пункты чек-листа:
`;
        
        if (entry.items && entry.items.length > 0) {
          entry.items.forEach((item, index) => {
            message += `${index + 1}. ${item.text}\n`;
          });
        } else {
          message += 'Пункты не добавлены.';
        }
        break;
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('✏️ Редактировать', 'edit_entry')],
      [Markup.button.callback('🗑️ Удалить', 'delete_entry')],
      [Markup.button.callback('🔙 Назад к списку', 'back_to_list')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.deleteMessage();
    await ctx.reply(message, keyboard);
    
    // Переходим к просмотру записи
    ctx.session.state = 'dir_view_entry';
  } catch (error) {
    console.error('Ошибка при просмотре записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата к списку
scene.action('back_to_list', async (ctx) => {
  try {
    // Сбрасываем ID записи
    ctx.session.directoryData.entryId = null;
    
    ctx.session.state = 'dir_list_entries';
    await ctx.deleteMessage();
    await handleDirListEntries(ctx);
  } catch (error) {
    console.error('Ошибка при возврате к списку:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик добавления записи
scene.action('add_entry', async (ctx) => {
  try {
    const category = ctx.session.directoryData.category;
    
    // Сбрасываем данные записи
    ctx.session.directoryData.entryData = {};
    
    // Формируем сообщение с запросом данных
    let message = '';
    
    switch (category) {
      case 'locations':
        message = `
➕ Добавление новой локации

Введите название локации:
`;
        break;
      case 'machines':
        message = `
➕ Добавление нового автомата

Введите внутренний код автомата:
`;
        break;
      case 'ingredients':
        message = `
➕ Добавление нового ингредиента

Введите название ингредиента:
`;
        break;
      case 'water_types':
        message = `
➕ Добавление нового типа воды

Введите название типа воды:
`;
        break;
      case 'syrups':
        message = `
➕ Добавление нового сиропа

Введите название сиропа:
`;
        break;
      case 'extra_items':
        message = `
➕ Добавление нового дополнительного предмета

Введите название предмета:
`;
        break;
      case 'checklist_templates':
        message = `
➕ Добавление нового шаблона чек-листа

Введите название шаблона:
`;
        break;
    }
    
    await ctx.deleteMessage();
    await ctx.reply(message);
    
    // Переходим к добавлению записи
    ctx.session.state = 'dir_add_entry';
    ctx.session.directoryData.addStep = 'name';
  } catch (error) {
    console.error('Ошибка при добавлении записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик редактирования записи
scene.action('edit_entry', async (ctx) => {
  try {
    const category = ctx.session.directoryData.category;
    const entryId = ctx.session.directoryData.entryId;
    
    // Получаем информацию о записи в зависимости от категории
    let entry = null;
    
    switch (category) {
      case 'locations':
        entry = await prisma.location.findUnique({
          where: { id: entryId }
        });
        break;
      case 'machines':
        entry = await prisma.machine.findUnique({
          where: { id: entryId },
          include: { location: true }
        });
        break;
      case 'ingredients':
        entry = await prisma.ingredient.findUnique({
          where: { id: entryId }
        });
        break;
      case 'water_types':
        entry = await prisma.waterType.findUnique({
          where: { id: entryId }
        });
        break;
      case 'syrups':
        entry = await prisma.syrup.findUnique({
          where: { id: entryId }
        });
        break;
      case 'extra_items':
        entry = await prisma.extraItem.findUnique({
          where: { id: entryId }
        });
        break;
      case 'checklist_templates':
        entry = await prisma.checklistTemplate.findUnique({
          where: { id: entryId },
          include: { items: true }
        });
        break;
    }
    
    if (!entry) {
      await ctx.reply('❌ Запись не найдена. Попробуйте снова.');
      return await handleDirListEntries(ctx);
    }
    
    // Сохраняем данные записи
    ctx.session.directoryData.entryData = entry;
    
    // Формируем сообщение с запросом данных
    let message = '';
    
    switch (category) {
      case 'locations':
        message = `
✏️ Редактирование локации

Текущее название: ${entry.name}

Введите новое название локации или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'machines':
        message = `
✏️ Редактирование автомата

Текущий внутренний код: ${entry.internalCode}

Введите новый внутренний код автомата или отправьте /skip, чтобы оставить текущий:
`;
        break;
      case 'ingredients':
        message = `
✏️ Редактирование ингредиента

Текущее название: ${entry.name}

Введите новое название ингредиента или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'water_types':
        message = `
✏️ Редактирование типа воды

Текущее название: ${entry.name}

Введите новое название типа воды или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'syrups':
        message = `
✏️ Редактирование сиропа

Текущее название: ${entry.name}

Введите новое название сиропа или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'extra_items':
        message = `
✏️ Редактирование дополнительного предмета

Текущее название: ${entry.name}

Введите новое название предмета или отправьте /skip, чтобы оставить текущее:
`;
        break;
      case 'checklist_templates':
        message = `
✏️ Редактирование шаблона чек-листа

Текущее название: ${entry.name}

Введите новое название шаблона или отправьте /skip, чтобы оставить текущее:
`;
        break;
    }
    
    await ctx.deleteMessage();
    await ctx.reply(message);
    
    // Переходим к редактированию записи
    ctx.session.state = 'dir_edit_entry';
    ctx.session.directoryData.editStep = 'name';
  } catch (error) {
    console.error('Ошибка при редактировании записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик удаления записи
scene.action('delete_entry', async (ctx) => {
  try {
    const category = ctx.session.directoryData.category;
    const entryId = ctx.session.directoryData.entryId;
    
    // Получаем информацию о записи в зависимости от категории
    let entry = null;
    let entryName = '';
    
    switch (category) {
      case 'locations':
        entry = await prisma.location.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
      case 'machines':
        entry = await prisma.machine.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.internalCode : '';
        break;
      case 'ingredients':
        entry = await prisma.ingredient.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
      case 'water_types':
        entry = await prisma.waterType.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
      case 'syrups':
        entry = await prisma.syrup.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
      case 'extra_items':
        entry = await prisma.extraItem.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
      case 'checklist_templates':
        entry = await prisma.checklistTemplate.findUnique({
          where: { id: entryId }
        });
        entryName = entry ? entry.name : '';
        break;
    }
    
    if (!entry) {
      await ctx.reply('❌ Запись не найдена. Попробуйте снова.');
      return await handleDirListEntries(ctx);
    }
    
    // Формируем сообщение с подтверждением удаления
    const message = `
🗑️ Удаление записи

Вы действительно хотите удалить запись "${entryName}"?

⚠️ Это действие нельзя отменить.
`;
    
    // Создаем клавиатуру для подтверждения удаления
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Да, удалить', 'confirm_delete')],
      [Markup.button.callback('❌ Нет, отмена', 'cancel_delete')]
    ]);
    
    await ctx.deleteMessage();
    await ctx.reply(message, keyboard);
    
    // Переходим к удалению записи
    ctx.session.state = 'dir_delete_entry';
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик подтверждения удаления
scene.action('confirm_delete', async (ctx) => {
  try {
    const category = ctx.session.directoryData.category;
    const entryId = ctx.session.directoryData.entryId;
    
    // Удаляем запись в зависимости от категории
    switch (category) {
      case 'locations':
        await prisma.location.delete({
          where: { id: entryId }
        });
        break;
      case 'machines':
        await prisma.machine.delete({
          where: { id: entryId }
        });
        break;
      case 'ingredients':
        await prisma.ingredient.delete({
          where: { id: entryId }
        });
        break;
      case 'water_types':
        await prisma.waterType.delete({
          where: { id: entryId }
        });
        break;
      case 'syrups':
        await prisma.syrup.delete({
          where: { id: entryId }
        });
        break;
      case 'extra_items':
        await prisma.extraItem.delete({
          where: { id: entryId }
        });
        break;
      case 'checklist_templates':
        await prisma.checklistTemplate.delete({
          where: { id: entryId }
        });
        break;
    }
    
    await ctx.editMessageText('✅ Запись успешно удалена.');
    
    // Возвращаемся к списку записей
    ctx.session.directoryData.entryId = null;
    ctx.session.state = 'dir_list_entries';
    await handleDirListEntries(ctx);
  } catch (error) {
    console.error('Ошибка при подтверждении удаления записи:', error);
    await ctx.reply('❌ Произошла ошибка при удалении записи. Возможно, она используется в других объектах.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены удаления
scene.action('cancel_delete', async (ctx) => {
  try {
    await ctx.editMessageText('❌ Удаление отменено.');
    
    // Возвращаемся к просмотру записи
    ctx.session.state = 'dir_view_entry';
    
    // Получаем информацию о записи и отображаем ее
    const category = ctx.session.directoryData.category;
    const entryId = ctx.session.directoryData.entryId;
    
    // Получаем информацию о записи в зависимости от категории
    let entry = null;
    
    switch (category) {
      case 'locations':
        entry = await prisma.location.findUnique({
          where: { id: entryId }
        });
        break;
      case 'machines':
        entry = await prisma.machine.findUnique({
          where: { id: entryId },
          include: { location: true }
        });
        break;
      case 'ingredients':
        entry = await prisma.ingredient.findUnique({
          where: { id: entryId }
        });
        break;
      case 'water_types':
        entry = await prisma.waterType.findUnique({
          where: { id: entryId }
        });
        break;
      case 'syrups':
        entry = await prisma.syrup.findUnique({
          where: { id: entryId }
        });
        break;
      case 'extra_items':
        entry = await prisma.extraItem.findUnique({
          where: { id: entryId }
        });
        break;
      case 'checklist_templates':
        entry = await prisma.checklistTemplate.findUnique({
          where: { id: entryId },
          include: { items: true }
        });
        break;
    }
    
    if (!entry) {
      await ctx.reply('❌ Запись не найдена. Попробуйте снова.');
      return await handleDirListEntries(ctx);
    }
    
    // Формируем сообщение с информацией о записи
    let message = '';
    
    switch (category) {
      case 'locations':
        message = `
🏢 Локация: ${entry.name}

📍 Адрес: ${entry.address || 'Не указан'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'machines':
        message = `
🤖 Автомат: ${entry.internalCode}

🏢 Локация: ${entry.location ? entry.location.name : 'Не указана'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Модель: ${entry.model || 'Не указана'}
🔹 Серийный номер: ${entry.serialNumber || 'Не указан'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'ingredients':
        message = `
🧂 Ингредиент: ${entry.name}

🔹 Код: ${entry.code || 'Не указан'}
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'water_types':
        message = `
💧 Тип воды: ${entry.name}

🔹 Объем: ${entry.volume} л
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'syrups':
        message = `
🧴 Сироп: ${entry.name}

🔹 Объем: ${entry.volume} мл
📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'extra_items':
        message = `
🧰 Дополнительный предмет: ${entry.name}

📝 Описание: ${entry.description || 'Не указано'}
🔹 Статус: ${getStatusName(entry.status)}
`;
        break;
      case 'checklist_templates':
        message = `
📋 Шаблон чек-листа: ${entry.name}

📝 Описание: ${entry.description || 'Не указано'}
🔹 Тип: ${getChecklistTypeName(entry.type)}
🔹 Статус: ${getStatusName(entry.status)}

📋 Пункты чек-листа:
`;
        
        if (entry.items && entry.items.length > 0) {
          entry.items.forEach((item, index) => {
            message += `${index + 1}. ${item.text}\n`;
          });
        } else {
          message += 'Пункты не добавлены.';
        }
        break;
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('✏️ Редактировать', 'edit_entry')],
      [Markup.button.callback('🗑️ Удалить', 'delete_entry')],
      [Markup.button.callback('🔙 Назад к списку', 'back_to_list')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при отмене удаления записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Управление справочниками отменено.');
  await ctx.scene.leave();
});

// Обработчик ввода текста для добавления и редактирования записей
scene.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    // Обработка команды пропуска
    if (text === '/skip') {
      if (ctx.session.state === 'dir_edit_entry') {
        // Переходим к следующему шагу редактирования
        await handleEditNextStep(ctx);
      } else if (ctx.session.state === 'dir_add_entry') {
        // Переходим к следующему шагу добавления
        await handleAddNextStep(ctx, null);
      }
      return;
    }
    
    // Обработка ввода текста для добавления записи
    if (ctx.session.state === 'dir_add_entry') {
      await handleAddNextStep(ctx, text);
    }
    
    // Обработка ввода текста для редактирования записи
    if (ctx.session.state === 'dir_edit_entry') {
      await handleEditNextStep(ctx, text);
    }
  } catch (error) {
    console.error('Ошибка при обработке ввода текста:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для обработки следующего шага добавления записи
async function handleAddNextStep(ctx, text) {
  try {
    const category = ctx.session.directoryData.category;
    const step = ctx.session.directoryData.addStep;
    
    // Если текст не null, сохраняем его в данных записи
    if (text !== null) {
      switch (step) {
        case 'name':
          ctx.session.directoryData.entryData.name = text;
          break;
        case 'code':
          ctx.session.directoryData.entryData.code = text;
          break;
        case 'address':
          ctx.session.directoryData.entryData.address = text;
          break;
        case 'description':
          ctx.session.directoryData.entryData.description = text;
          break;
        case 'model':
          ctx.session.directoryData.entryData.model = text;
          break;
        case 'serialNumber':
          ctx.session.directoryData.entryData.serialNumber = text;
          break;
        case 'volume':
          const volume = parseFloat(text.replace(',', '.'));
          if (isNaN(volume) || volume <= 0) {
            await ctx.reply('❌ Пожалуйста, введите корректное число.');
            return;
          }
          ctx.session.directoryData.entryData.volume = volume;
          break;
        case 'location':
          // Сохраняем ID локации
          const locationId = text;
          ctx.session.directoryData.entryData.locationId = locationId;
          break;
        case 'type':
          // Сохраняем тип чек-листа
          ctx.session.directoryData.entryData.type = text;
          break;
        case 'items':
          // Сохраняем пункты чек-листа
          const items = text.split('\n').filter(item => item.trim() !== '').map(item => ({ text: item.trim() }));
          ctx.session.directoryData.entryData.items = items;
          break;
      }
    }
    
    // Определяем следующий шаг в зависимости от категории и текущего шага
    let nextStep = '';
    let message = '';
    
    switch (category) {
      case 'locations':
        switch (step) {
          case 'name':
            nextStep = 'address';
            message = `
Введите адрес локации или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'address':
            nextStep = 'description';
            message = `
Введите описание локации или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const location = await prisma.location.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                address: ctx.session.directoryData.entryData.address || null,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Локация "${location.name}" успешно добавлена.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'machines':
        switch (step) {
          case 'name':
            nextStep = 'model';
            message = `
Введите модель автомата или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'model':
            nextStep = 'serialNumber';
            message = `
Введите серийный номер автомата или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'serialNumber':
            nextStep = 'location';
            
            // Получаем список локаций
            const locations = await prisma.location.findMany({
              where: { status: 'ACTIVE' },
              orderBy: { name: 'asc' }
            });
            
            if (locations.length === 0) {
              await ctx.reply('❌ Нет доступных локаций. Сначала добавьте локацию.');
              
              // Возвращаемся к списку записей
              ctx.session.state = 'dir_list_entries';
              return await handleDirListEntries(ctx);
            }
            
            message = `
Выберите локацию для автомата:
`;
            
            // Создаем клавиатуру с локациями
            const locationButtons = locations.map(location => {
              return [Markup.button.callback(location.name, `location_${location.id}`)];
            });
            
            // Добавляем кнопку "Без локации"
            locationButtons.push([Markup.button.callback('Без локации', 'location_none')]);
            
            const locationKeyboard = Markup.inlineKeyboard(locationButtons);
            
            await ctx.reply(message, locationKeyboard);
            return;
          case 'location':
            nextStep = 'description';
            message = `
Введите описание автомата или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const machine = await prisma.machine.create({
              data: {
                internalCode: ctx.session.directoryData.entryData.name,
                model: ctx.session.directoryData.entryData.model || null,
                serialNumber: ctx.session.directoryData.entryData.serialNumber || null,
                locationId: ctx.session.directoryData.entryData.locationId || null,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Автомат "${machine.internalCode}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'ingredients':
        switch (step) {
          case 'name':
            nextStep = 'code';
            message = `
Введите код ингредиента или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'code':
            nextStep = 'description';
            message = `
Введите описание ингредиента или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const ingredient = await prisma.ingredient.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                code: ctx.session.directoryData.entryData.code || null,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Ингредиент "${ingredient.name}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'water_types':
        switch (step) {
          case 'name':
            nextStep = 'volume';
            message = `
Введите объем (в литрах):
`;
            break;
          case 'volume':
            nextStep = 'description';
            message = `
Введите описание типа воды или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const waterType = await prisma.waterType.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                volume: ctx.session.directoryData.entryData.volume,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Тип воды "${waterType.name}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'syrups':
        switch (step) {
          case 'name':
            nextStep = 'volume';
            message = `
Введите объем (в миллилитрах):
`;
            break;
          case 'volume':
            nextStep = 'description';
            message = `
Введите описание сиропа или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const syrup = await prisma.syrup.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                volume: ctx.session.directoryData.entryData.volume,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Сироп "${syrup.name}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'extra_items':
        switch (step) {
          case 'name':
            nextStep = 'description';
            message = `
Введите описание предмета или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            // Создаем запись в базе данных
            const extraItem = await prisma.extraItem.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE'
              }
            });
            
            await ctx.reply(`✅ Дополнительный предмет "${extraItem.name}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
      case 'checklist_templates':
        switch (step) {
          case 'name':
            nextStep = 'type';
            
            // Создаем клавиатуру с типами чек-листов
            const typeButtons = [
              [Markup.button.callback('🔄 Оператор', 'type_OPERATOR')],
              [Markup.button.callback('🔧 Техник', 'type_TECHNICIAN')],
              [Markup.button.callback('📦 Склад', 'type_WAREHOUSE')]
            ];
            
            const typeKeyboard = Markup.inlineKeyboard(typeButtons);
            
            await ctx.reply('Выберите тип чек-листа:', typeKeyboard);
            return;
          case 'type':
            nextStep = 'description';
            message = `
Введите описание шаблона или отправьте /skip, чтобы пропустить:
`;
            break;
          case 'description':
            nextStep = 'items';
            message = `
Введите пункты чек-листа, каждый с новой строки:
`;
            break;
          case 'items':
            // Создаем запись в базе данных
            const checklistTemplate = await prisma.checklistTemplate.create({
              data: {
                name: ctx.session.directoryData.entryData.name,
                type: ctx.session.directoryData.entryData.type,
                description: ctx.session.directoryData.entryData.description || null,
                status: 'ACTIVE',
                items: {
                  create: ctx.session.directoryData.entryData.items
                }
              }
            });
            
            await ctx.reply(`✅ Шаблон чек-листа "${checklistTemplate.name}" успешно добавлен.`);
            
            // Возвращаемся к списку записей
            ctx.session.state = 'dir_list_entries';
            return await handleDirListEntries(ctx);
        }
        break;
    }
    
    // Обновляем шаг
    ctx.session.directoryData.addStep = nextStep;
    
    // Отправляем сообщение с запросом данных для следующего шага
    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка при обработке следующего шага добавления записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Функция для обработки следующего шага редактирования записи
async function handleEditNextStep(ctx, text) {
  try {
    const category = ctx.session.directoryData.category;
    const step = ctx.session.directoryData.editStep;
    const entryId = ctx.session.directoryData.entryId;
    
    // Если текст не null, сохраняем его в данных записи
    if (text !== null) {
      switch (step) {
        case 'name':
          ctx.session.directoryData.entryData.name = text;
          break;
        case 'code':
          ctx.session.directoryData.entryData.code = text;
          break;
        case 'address':
          ctx.session.directoryData.entryData.address = text;
          break;
        case 'description':
          ctx.session.directoryData.entryData.description = text;
          break;
        case 'model':
          ctx.session.directoryData.entryData.model = text;
          break;
        case 'serialNumber':
          ctx.session.directoryData.entryData.serialNumber = text;
          break;
        case 'volume':
          const volume = parseFloat(text.replace(',', '.'));
          if (isNaN(volume) || volume <= 0) {
            await ctx.reply('❌ Пожалуйста, введите корректное число.');
            return;
          }
          ctx.session.directoryData.entryData.volume = volume;
          break;
        case 'location':
          // Сохраняем ID локации
          const locationId = text;
          ctx.session.directoryData.entryData.locationId = locationId;
          break;
        case 'type':
          // Сохраняем тип чек-листа
          ctx.session.directoryData.entryData.type = text;
          break;
        case 'items':
          // Сохраняем пункты чек-листа
          const items = text.split('\n').filter(item => item.trim() !== '').map(item => ({ text: item.trim() }));
          ctx.session.directoryData.entryData.items = items;
          break;
      }
    }
    
    // Определяем следующий шаг в зависимости от категории и текущего шага
    let nextStep = '';
    let message = '';
    
    switch (category) {
      case 'locations':
        switch (step) {
          case 'name':
            nextStep = 'address';
            message = `
Текущий адрес: ${ctx.session.directoryData.entryData.address || 'Не указан'}

Введите новый адрес локации или отправьте /skip, чтобы оставить текущий:
`;
            break;
          case 'address':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание локации или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const location = await prisma.location.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                address: ctx.session.directoryData.entryData.address,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Локация "${location.name}" успешно обновлена.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'machines':
        switch (step) {
          case 'name':
            nextStep = 'model';
            message = `
Текущая модель: ${ctx.session.directoryData.entryData.model || 'Не указана'}

Введите новую модель автомата или отправьте /skip, чтобы оставить текущую:
`;
            break;
          case 'model':
            nextStep = 'serialNumber';
            message = `
Текущий серийный номер: ${ctx.session.directoryData.entryData.serialNumber || 'Не указан'}

Введите новый серийный номер автомата или отправьте /skip, чтобы оставить текущий:
`;
            break;
          case 'serialNumber':
            nextStep = 'location';
            
            // Получаем список локаций
            const locations = await prisma.location.findMany({
              where: { status: 'ACTIVE' },
              orderBy: { name: 'asc' }
            });
            
            message = `
Текущая локация: ${ctx.session.directoryData.entryData.location ? ctx.session.directoryData.entryData.location.name : 'Не указана'}

Выберите новую локацию для автомата:
`;
            
            // Создаем клавиатуру с локациями
            const locationButtons = locations.map(location => {
              return [Markup.button.callback(location.name, `location_${location.id}`)];
            });
            
            // Добавляем кнопку "Без локации"
            locationButtons.push([Markup.button.callback('Без локации', 'location_none')]);
            
            const locationKeyboard = Markup.inlineKeyboard(locationButtons);
            
            await ctx.reply(message, locationKeyboard);
            return;
          case 'location':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание автомата или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const machine = await prisma.machine.update({
              where: { id: entryId },
              data: {
                internalCode: ctx.session.directoryData.entryData.name,
                model: ctx.session.directoryData.entryData.model,
                serialNumber: ctx.session.directoryData.entryData.serialNumber,
                locationId: ctx.session.directoryData.entryData.locationId,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Автомат "${machine.internalCode}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'ingredients':
        switch (step) {
          case 'name':
            nextStep = 'code';
            message = `
Текущий код: ${ctx.session.directoryData.entryData.code || 'Не указан'}

Введите новый код ингредиента или отправьте /skip, чтобы оставить текущий:
`;
            break;
          case 'code':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание ингредиента или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const ingredient = await prisma.ingredient.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                code: ctx.session.directoryData.entryData.code,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Ингредиент "${ingredient.name}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'water_types':
        switch (step) {
          case 'name':
            nextStep = 'volume';
            message = `
Текущий объем: ${ctx.session.directoryData.entryData.volume} л

Введите новый объем (в литрах):
`;
            break;
          case 'volume':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание типа воды или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const waterType = await prisma.waterType.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                volume: ctx.session.directoryData.entryData.volume,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Тип воды "${waterType.name}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'syrups':
        switch (step) {
          case 'name':
            nextStep = 'volume';
            message = `
Текущий объем: ${ctx.session.directoryData.entryData.volume} мл

Введите новый объем (в миллилитрах):
`;
            break;
          case 'volume':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание сиропа или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const syrup = await prisma.syrup.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                volume: ctx.session.directoryData.entryData.volume,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Сироп "${syrup.name}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'extra_items':
        switch (step) {
          case 'name':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание предмета или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            // Обновляем запись в базе данных
            const extraItem = await prisma.extraItem.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                description: ctx.session.directoryData.entryData.description
              }
            });
            
            await ctx.reply(`✅ Дополнительный предмет "${extraItem.name}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
      case 'checklist_templates':
        switch (step) {
          case 'name':
            nextStep = 'type';
            
            // Создаем клавиатуру с типами чек-листов
            const typeButtons = [
              [Markup.button.callback('🔄 Оператор', 'type_OPERATOR')],
              [Markup.button.callback('🔧 Техник', 'type_TECHNICIAN')],
              [Markup.button.callback('📦 Склад', 'type_WAREHOUSE')]
            ];
            
            const typeKeyboard = Markup.inlineKeyboard(typeButtons);
            
            await ctx.reply(`
Текущий тип: ${getChecklistTypeName(ctx.session.directoryData.entryData.type)}

Выберите новый тип чек-листа:
`, typeKeyboard);
            return;
          case 'type':
            nextStep = 'description';
            message = `
Текущее описание: ${ctx.session.directoryData.entryData.description || 'Не указано'}

Введите новое описание шаблона или отправьте /skip, чтобы оставить текущее:
`;
            break;
          case 'description':
            nextStep = 'items';
            
            // Получаем текущие пункты чек-листа
            const items = ctx.session.directoryData.entryData.items || [];
            let itemsText = '';
            
            if (items.length > 0) {
              itemsText = items.map(item => item.text).join('\n');
            }
            
            message = `
Текущие пункты чек-листа:
${itemsText || 'Пункты не добавлены.'}

Введите новые пункты чек-листа, каждый с новой строки:
`;
            break;
          case 'items':
            // Обновляем запись в базе данных
            
            // Сначала удаляем все существующие пункты
            await prisma.checklistItem.deleteMany({
              where: { checklistTemplateId: entryId }
            });
            
            // Затем обновляем шаблон и создаем новые пункты
            const checklistTemplate = await prisma.checklistTemplate.update({
              where: { id: entryId },
              data: {
                name: ctx.session.directoryData.entryData.name,
                type: ctx.session.directoryData.entryData.type,
                description: ctx.session.directoryData.entryData.description,
                items: {
                  create: ctx.session.directoryData.entryData.items
                }
              }
            });
            
            await ctx.reply(`✅ Шаблон чек-листа "${checklistTemplate.name}" успешно обновлен.`);
            
            // Возвращаемся к просмотру записи
            ctx.session.state = 'dir_view_entry';
            return await ctx.scene.reenter();
        }
        break;
    }
    
    // Обновляем шаг
    ctx.session.directoryData.editStep = nextStep;
    
    // Отправляем сообщение с запросом данных для следующего шага
    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка при обработке следующего шага редактирования записи:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выбора локации
scene.action(/^location_(.+)$/, async (ctx) => {
  try {
    const locationId = ctx.match[1] === 'none' ? null : ctx.match[1];
    
    // Сохраняем ID локации
    if (ctx.session.state === 'dir_add_entry') {
      ctx.session.directoryData.entryData.locationId = locationId;
      await handleAddNextStep(ctx, locationId);
    } else if (ctx.session.state === 'dir_edit_entry') {
      ctx.session.directoryData.entryData.locationId = locationId;
      await handleEditNextStep(ctx, locationId);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора локации:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора типа чек-листа
scene.action(/^type_(.+)$/, async (ctx) => {
  try {
    const type = ctx.match[1];
    
    // Сохраняем тип чек-листа
    if (ctx.session.state === 'dir_add_entry') {
      ctx.session.directoryData.entryData.type = type;
      await handleAddNextStep(ctx, type);
    } else if (ctx.session.state === 'dir_edit_entry') {
      ctx.session.directoryData.entryData.type = type;
      await handleEditNextStep(ctx, type);
    }
  } catch (error) {
    console.error('Ошибка при обработке выбора типа чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для получения названия статуса
function getStatusName(status) {
  const statuses = {
    'ACTIVE': '✅ Активен',
    'INACTIVE': '❌ Неактивен',
    'DELETED': '🗑️ Удален'
  };
  
  return statuses[status] || status;
}

// Функция для получения названия типа чек-листа
function getChecklistTypeName(type) {
  const types = {
    'OPERATOR': '🔄 Оператор',
    'TECHNICIAN': '🔧 Техник',
    'WAREHOUSE': '📦 Склад'
  };
  
  return types[type] || type;
}

module.exports = scene;
