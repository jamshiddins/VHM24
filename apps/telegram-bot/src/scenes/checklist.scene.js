/**
 * FSM: checklist_fsm
 * Назначение: Пошаговое прохождение чек-листа в рамках задачи.
 * Роли: Все исполнители задач (Оператор, Кладовщик, Техник).
 * Состояния:
 *   - checklist_load_template: загрузка шаблона чек-листа
 *   - checklist_item_check: циклическое выполнение каждого пункта
 *   - checklist_confirm: подтверждение выполнения чек-листа
 *   - checklist_reject: отклонение чек-листа
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('checklist_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[checklist_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Проверяем, передан ли ID задачи
    if (!ctx.scene.state.taskId) {
      await ctx.reply('❌ Не указан ID задачи для чек-листа.');
      return await ctx.scene.leave();
    }
    
    // Инициализируем данные чек-листа
    ctx.session.checklistData = {
      taskId: ctx.scene.state.taskId,
      currentItemIndex: 0,
      completedItems: [],
      skippedItems: [],
      photos: []
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'checklist_load_template';
    
    // Загружаем шаблон чек-листа
    await handleChecklistLoadTemplate(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену checklist_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния checklist_load_template
async function handleChecklistLoadTemplate(ctx) {
  try {
    const taskId = ctx.session.checklistData.taskId;
    
    // Получаем информацию о задаче и чек-листе
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        },
        machine: {
          include: { location: true }
        }
      }
    });
    
    if (!task) {
      await ctx.reply('❌ Задача не найдена.');
      return await ctx.scene.leave();
    }
    
    // Проверяем, есть ли чек-лист у задачи
    if (!task.checklist) {
      // Если чек-листа нет, но есть шаблон, создаем чек-лист
      if (task.checklistTemplateId) {
        const template = await prisma.checklistTemplate.findUnique({
          where: { id: task.checklistTemplateId },
          include: { items: { orderBy: { order: 'asc' } } }
        });
        
        if (!template) {
          await ctx.reply('❌ Шаблон чек-листа не найден.');
          return await ctx.scene.leave();
        }
        
        // Создаем чек-лист
        const checklist = await prisma.checklist.create({
          data: {
            taskId: task.id,
            templateId: template.id,
            status: 'PENDING'
          }
        });
        
        // Создаем элементы чек-листа
        for (const templateItem of template.items) {
          await prisma.checklistItem.create({
            data: {
              checklistId: checklist.id,
              text: templateItem.text,
              order: templateItem.order,
              status: 'PENDING'
            }
          });
        }
        
        // Получаем обновленную задачу с чек-листом
        const updatedTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            checklist: {
              include: {
                items: {
                  orderBy: { order: 'asc' }
                }
              }
            },
            machine: {
              include: { location: true }
            }
          }
        });
        
        // Обновляем переменную task
        task = updatedTask;
      } else {
        await ctx.reply('❌ У задачи нет чек-листа.');
        return await ctx.scene.leave();
      }
    }
    
    // Отображаем информацию о задаче и чек-листе
    const message = `
📋 Чек-лист для задачи:

🔹 Тип: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Всего пунктов: ${task.checklist.items.length}

Пожалуйста, выполните каждый пункт чек-листа и отметьте его статус.
`;
    
    await ctx.reply(message);
    
    // Переходим к выполнению первого пункта чек-листа
    ctx.session.state = 'checklist_item_check';
    await handleChecklistItemCheck(ctx);
  } catch (error) {
    console.error('Ошибка при загрузке шаблона чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния checklist_item_check
async function handleChecklistItemCheck(ctx) {
  try {
    const taskId = ctx.session.checklistData.taskId;
    const currentItemIndex = ctx.session.checklistData.currentItemIndex;
    
    // Получаем информацию о чек-листе
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    
    if (!task || !task.checklist || !task.checklist.items || task.checklist.items.length === 0) {
      await ctx.reply('❌ Чек-лист не найден или пуст.');
      return await ctx.scene.leave();
    }
    
    // Проверяем, все ли пункты выполнены
    if (currentItemIndex >= task.checklist.items.length) {
      // Все пункты выполнены, переходим к подтверждению
      ctx.session.state = 'checklist_confirm';
      return await handleChecklistConfirm(ctx);
    }
    
    // Получаем текущий пункт чек-листа
    const currentItem = task.checklist.items[currentItemIndex];
    
    // Отображаем текущий пункт
    const message = `
📝 Пункт ${currentItemIndex + 1} из ${task.checklist.items.length}:

${currentItem.text}

Выполните этот пункт и отметьте его статус:
`;
    
    // Создаем клавиатуру с вариантами ответа
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Выполнено', `checklist_done_${currentItem.id}`)],
      [Markup.button.callback('⏩ Пропустить', `checklist_skip_${currentItem.id}`)],
      [Markup.button.callback('📸 Добавить фото', `checklist_photo_${currentItem.id}`)],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при выполнении пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчики выполнения пунктов чек-листа
scene.action(/^checklist_done_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Обновляем статус пункта чек-листа
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { status: 'COMPLETED' }
    });
    
    // Добавляем ID пункта в список выполненных
    ctx.session.checklistData.completedItems.push(itemId);
    
    await ctx.editMessageText(`✅ Пункт выполнен.`);
    
    // Переходим к следующему пункту
    ctx.session.checklistData.currentItemIndex++;
    await handleChecklistItemCheck(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выполнения пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

scene.action(/^checklist_skip_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Обновляем статус пункта чек-листа
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { status: 'SKIPPED' }
    });
    
    // Добавляем ID пункта в список пропущенных
    ctx.session.checklistData.skippedItems.push(itemId);
    
    await ctx.editMessageText(`⏩ Пункт пропущен.`);
    
    // Переходим к следующему пункту
    ctx.session.checklistData.currentItemIndex++;
    await handleChecklistItemCheck(ctx);
  } catch (error) {
    console.error('Ошибка при обработке пропуска пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

scene.action(/^checklist_photo_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    
    // Сохраняем ID текущего пункта для привязки фото
    ctx.session.checklistData.currentPhotoItemId = itemId;
    
    await ctx.editMessageText(`
📸 Пожалуйста, отправьте фото для этого пункта чек-листа.

Отправьте фото или нажмите /skip, чтобы продолжить без фото.
`);
    
    // Ожидаем фото от пользователя
    ctx.session.state = 'checklist_wait_photo';
  } catch (error) {
    console.error('Ошибка при запросе фото для пункта чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик получения фото для пункта чек-листа
scene.on('photo', async (ctx) => {
  if (ctx.session.state === 'checklist_wait_photo') {
    try {
      // Получаем ID фото
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const itemId = ctx.session.checklistData.currentPhotoItemId;
      
      // Сохраняем фото
      ctx.session.checklistData.photos.push({
        itemId,
        photoId
      });
      
      await ctx.reply('✅ Фото получено и прикреплено к пункту чек-листа.');
      
      // Возвращаемся к выполнению пунктов чек-листа
      ctx.session.state = 'checklist_item_check';
      await handleChecklistItemCheck(ctx);
    } catch (error) {
      console.error('Ошибка при получении фото для пункта чек-листа:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработчик пропуска фото
scene.command('skip', async (ctx) => {
  if (ctx.session.state === 'checklist_wait_photo') {
    await ctx.reply('⏩ Отправка фото пропущена.');
    
    // Возвращаемся к выполнению пунктов чек-листа
    ctx.session.state = 'checklist_item_check';
    await handleChecklistItemCheck(ctx);
  }
});

// Обработка состояния checklist_confirm
async function handleChecklistConfirm(ctx) {
  try {
    const taskId = ctx.session.checklistData.taskId;
    
    // Получаем информацию о чек-листе
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: true,
        machine: {
          include: { location: true }
        }
      }
    });
    
    if (!task || !task.checklist) {
      await ctx.reply('❌ Чек-лист не найден.');
      return await ctx.scene.leave();
    }
    
    // Формируем статистику по выполнению чек-листа
    const completedCount = ctx.session.checklistData.completedItems.length;
    const skippedCount = ctx.session.checklistData.skippedItems.length;
    const totalCount = completedCount + skippedCount;
    
    // Обновляем статус чек-листа
    await prisma.checklist.update({
      where: { id: task.checklist.id },
      data: { status: 'COMPLETED' }
    });
    
    // Отображаем результаты выполнения чек-листа
    const message = `
✅ Чек-лист выполнен!

🔹 Тип задачи: ${getTaskTypeName(task.type)}
🔹 Автомат: ${task.machine.internalCode} - ${task.machine.location?.name || 'Без локации'}
🔹 Выполнено пунктов: ${completedCount} из ${totalCount}
🔹 Пропущено пунктов: ${skippedCount}
🔹 Добавлено фото: ${ctx.session.checklistData.photos.length}

Чек-лист успешно завершен и сохранен в системе.
`;
    
    await ctx.reply(message);
    
    // Если это был чек-лист в рамках выполнения задачи, возвращаемся к выполнению задачи
    if (ctx.scene.state.returnScene) {
      await ctx.reply('Возвращаемся к выполнению задачи...');
      return await ctx.scene.enter(ctx.scene.state.returnScene, { taskId });
    }
    
    // Иначе завершаем сцену
    await ctx.scene.leave();
  } catch (error) {
    console.error('Ошибка при подтверждении чек-листа:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Выполнение чек-листа отменено.');
  
  // Если это был чек-лист в рамках выполнения задачи, возвращаемся к выполнению задачи
  if (ctx.scene.state.returnScene) {
    await ctx.reply('Возвращаемся к выполнению задачи...');
    return await ctx.scene.enter(ctx.scene.state.returnScene, { taskId: ctx.session.checklistData.taskId });
  }
  
  await ctx.scene.leave();
});

// Функция для получения названия типа задачи
function getTaskTypeName(type) {
  const taskTypes = {
    'INGREDIENTS': '🔄 Замена ингредиентов',
    'WATER': '💧 Замена воды',
    'CLEANING': '🧹 Чистка автомата',
    'REPAIR': '🔧 Ремонт',
    'CASH': '💰 Инкассация'
  };
  
  return taskTypes[type] || type;
}

module.exports = scene;
