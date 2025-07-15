/**
 * FSM: import_fsm
 * Назначение: Загрузка отчётов из внешних систем (например, Excel-файлов по продажам) для сверки.
 * Роли: Менеджер.
 * Состояния:
 *   - import_select_type: выбор типа отчета
 *   - import_upload_file: загрузка файла
 *   - import_auto_reconciliation: автоматическая сверка
 *   - import_auto_generate_tasks: автоматическое создание задач
 *   - import_confirm_finish: подтверждение и завершение
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const excelImport = require('../../utils/excelImport');

// Создание сцены
const scene = new Scenes.BaseScene('import_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[import_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или MANAGER
  if (!ctx.session.user || !['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к загрузке отчетов.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные импорта
    ctx.session.importData = {
      type: null,
      filePath: null,
      fileName: null,
      fileId: null,
      reconciliationResults: null,
      generatedTasks: []
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'import_select_type';
    
    // Переходим к выбору типа отчета
    await handleImportSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену import_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния import_select_type
async function handleImportSelectType(ctx) {
  try {
    const message = `
📊 Загрузка отчетов из внешних систем

Выберите тип отчета для загрузки:
`;
    
    // Создаем клавиатуру с типами отчетов
    const buttons = [
      [Markup.button.callback('💰 Отчет о продажах', 'type_sales')],
      [Markup.button.callback('🔄 Отчет о транзакциях', 'type_transactions')],
      [Markup.button.callback('📦 Отчет о запасах', 'type_inventory')],
      [Markup.button.callback('🔧 Отчет о техническом состоянии', 'type_technical')],
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
    ctx.session.importData.type = type;
    
    // Отображаем выбранный тип отчета
    let typeName = '';
    switch (type) {
      case 'sales':
        typeName = '💰 Отчет о продажах';
        break;
      case 'transactions':
        typeName = '🔄 Отчет о транзакциях';
        break;
      case 'inventory':
        typeName = '📦 Отчет о запасах';
        break;
      case 'technical':
        typeName = '🔧 Отчет о техническом состоянии';
        break;
    }
    
    await ctx.editMessageText(`Выбран тип отчета: ${typeName}`);
    
    // Переходим к загрузке файла
    ctx.session.state = 'import_upload_file';
    await handleImportUploadFile(ctx);
  } catch (error) {
    console.error('Ошибка при обработке выбора типа отчета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния import_upload_file
async function handleImportUploadFile(ctx) {
  try {
    const type = ctx.session.importData.type;
    let formatMessage = '';
    
    // Формируем сообщение о формате файла в зависимости от типа отчета
    switch (type) {
      case 'sales':
        formatMessage = `
Формат файла отчета о продажах:
- Excel-файл (.xlsx)
- Столбцы: Дата, Автомат, Продукт, Количество, Сумма
`;
        break;
      case 'transactions':
        formatMessage = `
Формат файла отчета о транзакциях:
- Excel-файл (.xlsx)
- Столбцы: Дата, Время, Автомат, Тип транзакции, Сумма
`;
        break;
      case 'inventory':
        formatMessage = `
Формат файла отчета о запасах:
- Excel-файл (.xlsx)
- Столбцы: Автомат, Ингредиент, Остаток (г), Дата проверки
`;
        break;
      case 'technical':
        formatMessage = `
Формат файла отчета о техническом состоянии:
- Excel-файл (.xlsx)
- Столбцы: Автомат, Статус, Ошибки, Дата проверки
`;
        break;
    }
    
    await ctx.reply(`
📄 Загрузка файла

Пожалуйста, загрузите файл отчета.
${formatMessage}
`);
    
    // Ожидаем загрузку файла от пользователя
  } catch (error) {
    console.error('Ошибка при запросе файла:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик получения документа (файла)
scene.on('document', async (ctx) => {
  if (ctx.session.state === 'import_upload_file') {
    try {
      const fileId = ctx.message.document.file_id;
      const fileName = ctx.message.document.file_name;
      
      // Проверяем формат файла
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        return await ctx.reply('❌ Пожалуйста, загрузите файл в формате Excel (.xlsx или .xls).');
      }
      
      // Сохраняем информацию о файле
      ctx.session.importData.fileId = fileId;
      ctx.session.importData.fileName = fileName;
      
      await ctx.reply('⏳ Загрузка файла...');
      
      // Получаем ссылку на файл
      const fileLink = await ctx.telegram.getFileLink(fileId);
      
      // Создаем директорию для временных файлов, если она не существует
      const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Генерируем уникальное имя файла
      const uniqueFileName = `${uuidv4()}_${fileName}`;
      const filePath = path.join(tempDir, uniqueFileName);
      
      // Сохраняем путь к файлу
      ctx.session.importData.filePath = filePath;
      
      // Загружаем файл
      const response = await fetch(fileLink);
      const fileStream = fs.createWriteStream(filePath);
      
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
      });
      
      await ctx.reply('✅ Файл успешно загружен.');
      
      // Переходим к автоматической сверке
      ctx.session.state = 'import_auto_reconciliation';
      await handleImportAutoReconciliation(ctx);
    } catch (error) {
      console.error('Ошибка при получении файла:', error);
      await ctx.reply('❌ Произошла ошибка при загрузке файла. Попробуйте позже.');
      await ctx.scene.leave();
    }
  }
});

// Обработка состояния import_auto_reconciliation
async function handleImportAutoReconciliation(ctx) {
  try {
    const type = ctx.session.importData.type;
    const filePath = ctx.session.importData.filePath;
    
    await ctx.reply('⏳ Выполняется автоматическая сверка данных...');
    
    // Выполняем сверку данных в зависимости от типа отчета
    let reconciliationResults;
    
    switch (type) {
      case 'sales':
        reconciliationResults = await excelImport.processSalesReport(filePath);
        break;
      case 'transactions':
        reconciliationResults = await excelImport.processTransactionsReport(filePath);
        break;
      case 'inventory':
        reconciliationResults = await excelImport.processInventoryReport(filePath);
        break;
      case 'technical':
        reconciliationResults = await excelImport.processTechnicalReport(filePath);
        break;
    }
    
    // Сохраняем результаты сверки
    ctx.session.importData.reconciliationResults = reconciliationResults;
    
    // Формируем сообщение с результатами сверки
    let resultsMessage = `
📊 Результаты автоматической сверки:

✅ Успешно обработано строк: ${reconciliationResults.success}
⚠️ Строк с предупреждениями: ${reconciliationResults.warnings}
❌ Строк с ошибками: ${reconciliationResults.errors}
`;
    
    if (reconciliationResults.warnings > 0 || reconciliationResults.errors > 0) {
      resultsMessage += `\n⚠️ Обнаружены предупреждения или ошибки. Проверьте лог сверки для получения подробной информации.`;
    }
    
    // Сохраняем лог сверки в файл
    const logDir = path.join(__dirname, '..', '..', '..', '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFileName = `reconciliation_log_${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const logFilePath = path.join(logDir, logFileName);
    
    fs.writeFileSync(logFilePath, reconciliationResults.log);
    
    // Отправляем результаты сверки
    await ctx.reply(resultsMessage);
    
    // Отправляем файл с логом сверки
    await ctx.replyWithDocument({ source: logFilePath, filename: logFileName });
    
    // Переходим к автоматическому созданию задач
    ctx.session.state = 'import_auto_generate_tasks';
    await handleImportAutoGenerateTasks(ctx);
  } catch (error) {
    console.error('Ошибка при автоматической сверке данных:', error);
    await ctx.reply('❌ Произошла ошибка при сверке данных. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния import_auto_generate_tasks
async function handleImportAutoGenerateTasks(ctx) {
  try {
    const type = ctx.session.importData.type;
    const reconciliationResults = ctx.session.importData.reconciliationResults;
    
    // Проверяем, можно ли создать задачи на основе результатов сверки
    if (reconciliationResults.errors > 0) {
      await ctx.reply(`
⚠️ Автоматическое создание задач невозможно из-за наличия ошибок в отчете.
Пожалуйста, исправьте ошибки и загрузите отчет повторно.
`);
      
      // Предлагаем завершить импорт или начать заново
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Загрузить другой отчет', 'import_another')],
        [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
      ]);
      
      await ctx.reply('Что вы хотите сделать дальше?', keyboard);
      return;
    }
    
    await ctx.reply('⏳ Выполняется автоматическое создание задач...');
    
    // Создаем задачи в зависимости от типа отчета
    let generatedTasks = [];
    
    switch (type) {
      case 'sales':
        // Создаем задачи на основе отчета о продажах
        // Например, задачи на пополнение ингредиентов, если продажи высокие
        generatedTasks = await generateTasksFromSalesReport(reconciliationResults.data);
        break;
      case 'transactions':
        // Создаем задачи на основе отчета о транзакциях
        // Например, задачи на инкассацию, если сумма транзакций высокая
        generatedTasks = await generateTasksFromTransactionsReport(reconciliationResults.data);
        break;
      case 'inventory':
        // Создаем задачи на основе отчета о запасах
        // Например, задачи на пополнение ингредиентов, если запасы низкие
        generatedTasks = await generateTasksFromInventoryReport(reconciliationResults.data);
        break;
      case 'technical':
        // Создаем задачи на основе отчета о техническом состоянии
        // Например, задачи на ремонт, если есть ошибки
        generatedTasks = await generateTasksFromTechnicalReport(reconciliationResults.data);
        break;
    }
    
    // Сохраняем созданные задачи
    ctx.session.importData.generatedTasks = generatedTasks;
    
    // Формируем сообщение с результатами создания задач
    let tasksMessage = `
📋 Результаты автоматического создания задач:

✅ Создано задач: ${generatedTasks.length}
`;
    
    if (generatedTasks.length > 0) {
      tasksMessage += `\nСписок созданных задач:\n`;
      
      for (const task of generatedTasks) {
        tasksMessage += `- ${getTaskTypeName(task.type)} для автомата ${task.machine.internalCode}\n`;
      }
    } else {
      tasksMessage += `\nНа основе данного отчета не требуется создание задач.`;
    }
    
    await ctx.reply(tasksMessage);
    
    // Переходим к подтверждению и завершению
    ctx.session.state = 'import_confirm_finish';
    await handleImportConfirmFinish(ctx);
  } catch (error) {
    console.error('Ошибка при автоматическом создании задач:', error);
    await ctx.reply('❌ Произошла ошибка при создании задач. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработка состояния import_confirm_finish
async function handleImportConfirmFinish(ctx) {
  try {
    const type = ctx.session.importData.type;
    const fileName = ctx.session.importData.fileName;
    const reconciliationResults = ctx.session.importData.reconciliationResults;
    const generatedTasks = ctx.session.importData.generatedTasks;
    
    // Формируем текст подтверждения
    let confirmText = `
📊 Подтверждение импорта отчета

🔹 Тип отчета: ${getReportTypeName(type)}
🔹 Файл: ${fileName}
🔹 Обработано строк: ${reconciliationResults.success + reconciliationResults.warnings + reconciliationResults.errors}
🔹 Создано задач: ${generatedTasks.length}
`;
    
    // Создаем клавиатуру для подтверждения
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить и завершить', 'confirm_import')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ]);
    
    await ctx.reply(confirmText, keyboard);
  } catch (error) {
    console.error('Ошибка при подтверждении импорта:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
}

// Обработчик подтверждения импорта
scene.action('confirm_import', async (ctx) => {
  try {
    const type = ctx.session.importData.type;
    const fileName = ctx.session.importData.fileName;
    const filePath = ctx.session.importData.filePath;
    const reconciliationResults = ctx.session.importData.reconciliationResults;
    const generatedTasks = ctx.session.importData.generatedTasks;
    
    // Создаем запись об импорте в базе данных
    const importRecord = await prisma.importRecord.create({
      data: {
        type: type.toUpperCase(),
        fileName: fileName,
        processedRows: reconciliationResults.success + reconciliationResults.warnings + reconciliationResults.errors,
        successRows: reconciliationResults.success,
        warningRows: reconciliationResults.warnings,
        errorRows: reconciliationResults.errors,
        generatedTasks: generatedTasks.length,
        userId: ctx.session.user.id,
        createdAt: new Date()
      }
    });
    
    // Удаляем временный файл
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Отображаем сообщение об успешном импорте
    await ctx.editMessageText(`
✅ Импорт отчета успешно завершен!

🔹 ID: ${importRecord.id}
🔹 Тип отчета: ${getReportTypeName(type)}
🔹 Файл: ${fileName}
🔹 Обработано строк: ${reconciliationResults.success + reconciliationResults.warnings + reconciliationResults.errors}
🔹 Создано задач: ${generatedTasks.length}
🔹 Дата: ${new Date().toLocaleDateString('ru-RU')}
`);
    
    // Предлагаем загрузить еще отчет или вернуться в главное меню
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📊 Загрузить еще отчет', 'import_another')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')]
    ]);
    
    await ctx.reply('Что вы хотите сделать дальше?', keyboard);
  } catch (error) {
    console.error('Ошибка при завершении импорта:', error);
    await ctx.reply('❌ Произошла ошибка при завершении импорта. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены
scene.action('cancel', async (ctx) => {
  try {
    // Удаляем временный файл, если он существует
    if (ctx.session.importData && ctx.session.importData.filePath && fs.existsSync(ctx.session.importData.filePath)) {
      fs.unlinkSync(ctx.session.importData.filePath);
    }
    
    await ctx.editMessageText('❌ Импорт отчета отменен.');
    await ctx.scene.leave();
  } catch (error) {
    console.error('Ошибка при отмене импорта:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик загрузки еще одного отчета
scene.action('import_another', async (ctx) => {
  try {
    // Удаляем временный файл, если он существует
    if (ctx.session.importData && ctx.session.importData.filePath && fs.existsSync(ctx.session.importData.filePath)) {
      fs.unlinkSync(ctx.session.importData.filePath);
    }
    
    // Сбрасываем данные и начинаем сначала
    ctx.session.importData = {
      type: null,
      filePath: null,
      fileName: null,
      fileId: null,
      reconciliationResults: null,
      generatedTasks: []
    };
    
    ctx.session.state = 'import_select_type';
    await ctx.editMessageText('📊 Загрузка нового отчета...');
    await handleImportSelectType(ctx);
  } catch (error) {
    console.error('Ошибка при загрузке нового отчета:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата в главное меню
scene.action('back_to_menu', async (ctx) => {
  try {
    // Удаляем временный файл, если он существует
    if (ctx.session.importData && ctx.session.importData.filePath && fs.existsSync(ctx.session.importData.filePath)) {
      fs.unlinkSync(ctx.session.importData.filePath);
    }
    
    await ctx.editMessageText('🔙 Возвращаемся в главное меню...');
    await ctx.scene.enter('main_menu_fsm');
  } catch (error) {
    console.error('Ошибка при возврате в главное меню:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для генерации задач на основе отчета о продажах
async function generateTasksFromSalesReport(data) {
  const tasks = [];
  
  // Анализируем данные о продажах и создаем задачи
  // Например, если продажи ингредиента высокие, создаем задачу на пополнение
  
  for (const row of data) {
    // Получаем автомат
    const machine = await prisma.machine.findFirst({
      where: { internalCode: row.machine },
      include: { location: true }
    });
    
    if (!machine) continue;
    
    // Проверяем, нужно ли создать задачу на пополнение ингредиентов
    if (row.product && row.quantity > 10) {
      // Получаем ингредиент
      const ingredient = await prisma.ingredient.findFirst({
        where: { name: { contains: row.product } }
      });
      
      if (ingredient) {
        // Создаем задачу на пополнение ингредиентов
        const task = await prisma.task.create({
          data: {
            type: 'INGREDIENTS',
            status: 'PENDING',
            machineId: machine.id,
            createdById: 'SYSTEM',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Срок - 1 день
            description: `Автоматически созданная задача на пополнение ингредиента "${ingredient.name}" на основе отчета о продажах.`
          },
          include: {
            machine: true
          }
        });
        
        tasks.push(task);
      }
    }
  }
  
  return tasks;
}

// Функция для генерации задач на основе отчета о транзакциях
async function generateTasksFromTransactionsReport(data) {
  const tasks = [];
  
  // Анализируем данные о транзакциях и создаем задачи
  // Например, если сумма транзакций высокая, создаем задачу на инкассацию
  
  // Группируем транзакции по автоматам и суммируем
  const machineTransactions = {};
  
  for (const row of data) {
    if (!machineTransactions[row.machine]) {
      machineTransactions[row.machine] = 0;
    }
    
    machineTransactions[row.machine] += parseFloat(row.amount);
  }
  
  // Создаем задачи на инкассацию для автоматов с высокой суммой транзакций
  for (const [machineCode, amount] of Object.entries(machineTransactions)) {
    if (amount > 5000) { // Пороговое значение для создания задачи
      // Получаем автомат
      const machine = await prisma.machine.findFirst({
        where: { internalCode: machineCode }
      });
      
      if (machine) {
        // Создаем задачу на инкассацию
        const task = await prisma.task.create({
          data: {
            type: 'CASH',
            status: 'PENDING',
            machineId: machine.id,
            createdById: 'SYSTEM',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Срок - 1 день
            description: `Автоматически созданная задача на инкассацию на основе отчета о транзакциях. Сумма: ${amount} руб.`
          },
          include: {
            machine: true
          }
        });
        
        tasks.push(task);
      }
    }
  }
  
  return tasks;
}

// Функция для генерации задач на основе отчета о запасах
async function generateTasksFromInventoryReport(data) {
  const tasks = [];
  
  // Анализируем данные о запасах и создаем задачи
  // Например, если запасы ингредиента низкие, создаем задачу на пополнение
  
  for (const row of data) {
    // Получаем автомат
    const machine = await prisma.machine.findFirst({
      where: { internalCode: row.machine },
      include: { location: true }
    });
    
    if (!machine) continue;
    
    // Проверяем, нужно ли создать задачу на пополнение ингредиентов
    if (row.ingredient && row.stock < 500) { // Пороговое значение для создания задачи
      // Получаем ингредиент
      const ingredient = await prisma.ingredient.findFirst({
        where: { name: { contains: row.ingredient } }
      });
      
      if (ingredient) {
        // Создаем задачу на пополнение ингредиентов
        const task = await prisma.task.create({
          data: {
            type: 'INGREDIENTS',
            status: 'PENDING',
            machineId: machine.id,
            createdById: ctx.session.user.id,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Срок - 1 день
            description: `Автоматически созданная задача на пополнение ингредиента "${ingredient.name}" на основе отчета о запасах.`
          },
          include: {
            machine: true
          }
        });
        
        tasks.push(task);
      }
    }
  }
  
  return tasks;
}

// Функция для генерации задач на основе отчета о техническом состоянии
async function generateTasksFromTechnicalReport(data) {
  const tasks = [];
  
  // Анализируем данные о техническом состоянии и создаем задачи
  // Например, если есть ошибки, создаем задачу на ремонт
  
  for (const row of data) {
    // Получаем автомат
    const machine = await prisma.machine.findFirst({
      where: { internalCode: row.machine },
      include: { location: true }
    });
    
    if (!machine) continue;
    
    // Проверяем, нужно ли создать задачу на ремонт
    if (row.status === 'ERROR' || (row.errors && row.errors.length > 0)) {
      // Создаем задачу на ремонт
      const task = await prisma.task.create({
        data: {
          type: 'REPAIR',
          status: 'PENDING',
          machineId: machine.id,
          createdById: ctx.session.user.id,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Срок - 1 день
          description: `Автоматически созданная задача на ремонт на основе отчета о техническом состоянии. Ошибки: ${row.errors || 'Не указаны'}`
        },
        include: {
          machine: true
        }
      });
      
      tasks.push(task);
    }
  }
  
  return tasks;
}

// Функция для получения названия типа отчета
function getReportTypeName(type) {
  const reportTypes = {
    'sales': '💰 Отчет о продажах',
    'transactions': '🔄 Отчет о транзакциях',
    'inventory': '📦 Отчет о запасах',
    'technical': '🔧 Отчет о техническом состоянии'
  };
  
  return reportTypes[type] || type;
}

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
