/**
 * FSM: finance_fsm
 * Назначение: Учет доходов, расходов и баланса компании.
 * Роли: Менеджер, Администратор.
 * Состояния:
 *   - finance_menu: главное меню финансов
 *   - finance_add_income: добавление дохода
 *   - finance_add_expense: добавление расхода
 *   - finance_view_balance: просмотр баланса
 *   - finance_view_history: просмотр истории операций
 */

const { Scenes, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const states = require('../states');

// Создание сцены
const scene = new Scenes.BaseScene('finance_fsm');

// Middleware для логирования
scene.use(async (ctx, next) => {
  console.log(`[finance_fsm] Пользователь ${ctx.from.id} в состоянии ${ctx.session.state || 'начало'}`);
  return next();
});

// Middleware для проверки прав доступа
scene.use(async (ctx, next) => {
  // Проверяем, есть ли у пользователя роль ADMIN или MANAGER
  if (!ctx.session.user || !['ADMIN', 'MANAGER'].includes(ctx.session.user.role)) {
    await ctx.reply('⚠️ У вас нет доступа к финансовому учету.');
    return await ctx.scene.leave();
  }
  return next();
});

// Вход в сцену
scene.enter(async (ctx) => {
  try {
    // Инициализируем данные финансов
    ctx.session.financeData = {
      type: null,
      amount: null,
      category: null,
      description: null,
      date: null
    };
    
    // Устанавливаем начальное состояние
    ctx.session.state = 'finance_menu';
    
    // Переходим к главному меню финансов
    await handleFinanceMenu(ctx);
  } catch (error) {
    console.error('Ошибка при входе в сцену finance_fsm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработка состояния finance_menu
async function handleFinanceMenu(ctx) {
  try {
    // Получаем текущий баланс
    const balance = await getBalance();
    
    const message = `
💰 Финансовый учет

Текущий баланс: ${balance.toFixed(2)} руб.

Выберите действие:
`;
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('➕ Добавить доход', 'add_income')],
      [Markup.button.callback('➖ Добавить расход', 'add_expense')],
      [Markup.button.callback('💼 Просмотреть баланс', 'view_balance')],
      [Markup.button.callback('📋 История операций', 'view_history')],
      [Markup.button.callback('🔙 Вернуться в главное меню', 'back_to_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Ошибка при отображении главного меню финансов:', error);
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
  await ctx.editMessageText('❌ Финансовый учет отменен.');
  await ctx.scene.leave();
});

// Обработчик добавления дохода
scene.action('add_income', async (ctx) => {
  try {
    // Сохраняем тип операции
    ctx.session.financeData.type = 'INCOME';
    
    await ctx.editMessageText(`
➕ Добавление дохода

Введите сумму дохода (только число):
`);
    
    // Переходим к добавлению дохода
    ctx.session.state = 'finance_add_income';
    ctx.session.financeData.step = 'amount';
  } catch (error) {
    console.error('Ошибка при добавлении дохода:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик добавления расхода
scene.action('add_expense', async (ctx) => {
  try {
    // Сохраняем тип операции
    ctx.session.financeData.type = 'EXPENSE';
    
    await ctx.editMessageText(`
➖ Добавление расхода

Введите сумму расхода (только число):
`);
    
    // Переходим к добавлению расхода
    ctx.session.state = 'finance_add_expense';
    ctx.session.financeData.step = 'amount';
  } catch (error) {
    console.error('Ошибка при добавлении расхода:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик просмотра баланса
scene.action('view_balance', async (ctx) => {
  try {
    // Получаем текущий баланс
    const balance = await getBalance();
    
    // Получаем суммы доходов и расходов
    const totalIncome = await getTotalByType('INCOME');
    const totalExpense = await getTotalByType('EXPENSE');
    
    // Получаем суммы по категориям
    const incomeByCategory = await getAmountByCategory('INCOME');
    const expenseByCategory = await getAmountByCategory('EXPENSE');
    
    let message = `
💰 Финансовый баланс

<b>Текущий баланс:</b> ${balance.toFixed(2)} руб.
<b>Всего доходов:</b> ${totalIncome.toFixed(2)} руб.
<b>Всего расходов:</b> ${totalExpense.toFixed(2)} руб.

<b>Доходы по категориям:</b>
`;
    
    // Добавляем доходы по категориям
    for (const category in incomeByCategory) {
      message += `${getCategoryName(category)}: ${incomeByCategory[category].toFixed(2)} руб.\n`;
    }
    
    message += `
<b>Расходы по категориям:</b>
`;
    
    // Добавляем расходы по категориям
    for (const category in expenseByCategory) {
      message += `${getCategoryName(category)}: ${expenseByCategory[category].toFixed(2)} руб.\n`;
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('🔙 Назад', 'back_to_finance_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
    
    // Переходим к просмотру баланса
    ctx.session.state = 'finance_view_balance';
  } catch (error) {
    console.error('Ошибка при просмотре баланса:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик просмотра истории операций
scene.action('view_history', async (ctx) => {
  try {
    // Получаем историю операций
    const transactions = await getTransactions(10);
    
    let message = `
📋 История финансовых операций

`;
    
    if (transactions.length === 0) {
      message += 'История операций пуста.';
    } else {
      for (const transaction of transactions) {
        const date = new Date(transaction.createdAt).toLocaleDateString('ru-RU');
        const type = transaction.type === 'INCOME' ? '➕ Доход' : '➖ Расход';
        const category = getCategoryName(transaction.category);
        const amount = transaction.amount.toFixed(2);
        const description = transaction.description || 'Без описания';
        
        message += `<b>${date} - ${type}</b>\n`;
        message += `Категория: ${category}\n`;
        message += `Сумма: ${amount} руб.\n`;
        message += `Описание: ${description}\n\n`;
      }
    }
    
    // Создаем клавиатуру с действиями
    const buttons = [
      [Markup.button.callback('🔙 Назад', 'back_to_finance_menu')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ];
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
    
    // Переходим к просмотру истории операций
    ctx.session.state = 'finance_view_history';
  } catch (error) {
    console.error('Ошибка при просмотре истории операций:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик возврата к главному меню финансов
scene.action('back_to_finance_menu', async (ctx) => {
  try {
    // Сбрасываем данные финансов
    ctx.session.financeData = {
      type: null,
      amount: null,
      category: null,
      description: null,
      date: null
    };
    
    // Переходим к главному меню финансов
    ctx.session.state = 'finance_menu';
    await ctx.deleteMessage();
    await handleFinanceMenu(ctx);
  } catch (error) {
    console.error('Ошибка при возврате к главному меню финансов:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик ввода текста
scene.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    // Обработка ввода суммы
    if ((ctx.session.state === 'finance_add_income' || ctx.session.state === 'finance_add_expense') && 
        ctx.session.financeData.step === 'amount') {
      // Проверяем, что введено число
      const amount = parseFloat(text.replace(',', '.'));
      
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Пожалуйста, введите корректную сумму (положительное число).');
        return;
      }
      
      // Сохраняем сумму
      ctx.session.financeData.amount = amount;
      
      // Переходим к выбору категории
      ctx.session.financeData.step = 'category';
      
      // Определяем категории в зависимости от типа операции
      const categories = ctx.session.financeData.type === 'INCOME' ? getIncomeCategories() : getExpenseCategories();
      
      // Создаем клавиатуру с категориями
      const buttons = categories.map(category => {
        return [Markup.button.callback(category.name, `category_${category.code}`)];
      });
      
      // Добавляем кнопку "Другое"
      buttons.push([Markup.button.callback('🔄 Другое', 'category_OTHER')]);
      
      const keyboard = Markup.inlineKeyboard(buttons);
      
      await ctx.reply(`
Выберите категорию:
`, keyboard);
    }
    // Обработка ввода описания
    else if ((ctx.session.state === 'finance_add_income' || ctx.session.state === 'finance_add_expense') && 
             ctx.session.financeData.step === 'description') {
      // Сохраняем описание
      ctx.session.financeData.description = text;
      
      // Переходим к подтверждению
      ctx.session.financeData.step = 'confirm';
      
      const type = ctx.session.financeData.type === 'INCOME' ? 'дохода' : 'расхода';
      const amount = ctx.session.financeData.amount.toFixed(2);
      const category = getCategoryName(ctx.session.financeData.category);
      
      // Создаем клавиатуру для подтверждения
      const buttons = [
        [Markup.button.callback('✅ Подтвердить', 'confirm_transaction')],
        [Markup.button.callback('❌ Отмена', 'cancel_transaction')]
      ];
      
      const keyboard = Markup.inlineKeyboard(buttons);
      
      await ctx.reply(`
Подтвердите добавление ${type}:

Сумма: ${amount} руб.
Категория: ${category}
Описание: ${text}
`, keyboard);
    }
    // Обработка ввода другой категории
    else if ((ctx.session.state === 'finance_add_income' || ctx.session.state === 'finance_add_expense') && 
             ctx.session.financeData.step === 'custom_category') {
      // Сохраняем категорию
      ctx.session.financeData.category = 'OTHER';
      ctx.session.financeData.customCategory = text;
      
      // Переходим к вводу описания
      ctx.session.financeData.step = 'description';
      
      await ctx.reply(`
Введите описание:
`);
    }
  } catch (error) {
    console.error('Ошибка при обработке ввода текста:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчики выбора категории
scene.action(/^category_(.+)$/, async (ctx) => {
  try {
    const category = ctx.match[1];
    
    // Сохраняем категорию
    ctx.session.financeData.category = category;
    
    // Если выбрана категория "Другое", запрашиваем ввод своей категории
    if (category === 'OTHER') {
      ctx.session.financeData.step = 'custom_category';
      
      await ctx.editMessageText(`
Введите название категории:
`);
      return;
    }
    
    // Переходим к вводу описания
    ctx.session.financeData.step = 'description';
    
    await ctx.editMessageText(`
Введите описание:
`);
  } catch (error) {
    console.error('Ошибка при выборе категории:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик подтверждения транзакции
scene.action('confirm_transaction', async (ctx) => {
  try {
    const type = ctx.session.financeData.type;
    const amount = ctx.session.financeData.amount;
    const category = ctx.session.financeData.category;
    const description = ctx.session.financeData.description;
    const customCategory = ctx.session.financeData.customCategory;
    
    // Создаем транзакцию
    const transaction = await prisma.financialTransaction.create({
      data: {
        type,
        amount,
        category,
        description,
        customCategory,
        createdBy: { connect: { id: ctx.session.user.id } }
      }
    });
    
    const typeText = type === 'INCOME' ? 'Доход' : 'Расход';
    
    await ctx.editMessageText(`
✅ ${typeText} успешно добавлен.

Сумма: ${amount.toFixed(2)} руб.
Категория: ${getCategoryName(category)}
Описание: ${description}
`);
    
    // Возвращаемся к главному меню финансов
    setTimeout(async () => {
      // Сбрасываем данные финансов
      ctx.session.financeData = {
        type: null,
        amount: null,
        category: null,
        description: null,
        date: null
      };
      
      // Переходим к главному меню финансов
      ctx.session.state = 'finance_menu';
      await handleFinanceMenu(ctx);
    }, 2000);
  } catch (error) {
    console.error('Ошибка при подтверждении транзакции:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Обработчик отмены транзакции
scene.action('cancel_transaction', async (ctx) => {
  try {
    await ctx.editMessageText('❌ Добавление отменено.');
    
    // Возвращаемся к главному меню финансов
    // Сбрасываем данные финансов
    ctx.session.financeData = {
      type: null,
      amount: null,
      category: null,
      description: null,
      date: null
    };
    
    // Переходим к главному меню финансов
    ctx.session.state = 'finance_menu';
    await handleFinanceMenu(ctx);
  } catch (error) {
    console.error('Ошибка при отмене транзакции:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    await ctx.scene.leave();
  }
});

// Функция для получения текущего баланса
async function getBalance() {
  try {
    // Получаем сумму всех доходов
    const totalIncome = await getTotalByType('INCOME');
    
    // Получаем сумму всех расходов
    const totalExpense = await getTotalByType('EXPENSE');
    
    // Вычисляем баланс
    const balance = totalIncome - totalExpense;
    
    return balance;
  } catch (error) {
    console.error('Ошибка при получении баланса:', error);
    throw error;
  }
}

// Функция для получения суммы по типу транзакции
async function getTotalByType(type) {
  try {
    const result = await prisma.financialTransaction.aggregate({
      where: { type },
      _sum: { amount: true }
    });
    
    return result._sum.amount || 0;
  } catch (error) {
    console.error(`Ошибка при получении суммы по типу ${type}:`, error);
    throw error;
  }
}

// Функция для получения суммы по категориям
async function getAmountByCategory(type) {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      where: { type }
    });
    
    const amountByCategory = {};
    
    for (const transaction of transactions) {
      const category = transaction.category;
      
      if (!amountByCategory[category]) {
        amountByCategory[category] = 0;
      }
      
      amountByCategory[category] += transaction.amount;
    }
    
    return amountByCategory;
  } catch (error) {
    console.error(`Ошибка при получении суммы по категориям для типа ${type}:`, error);
    throw error;
  }
}

// Функция для получения истории транзакций
async function getTransactions(limit = 10) {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { createdBy: true }
    });
    
    return transactions;
  } catch (error) {
    console.error('Ошибка при получении истории транзакций:', error);
    throw error;
  }
}

// Функция для получения категорий доходов
function getIncomeCategories() {
  return [
    { code: 'SALES', name: '💰 Продажи' },
    { code: 'INVESTMENTS', name: '📈 Инвестиции' },
    { code: 'REFUNDS', name: '🔄 Возвраты' },
    { code: 'SERVICES', name: '🛠️ Услуги' }
  ];
}

// Функция для получения категорий расходов
function getExpenseCategories() {
  return [
    { code: 'INGREDIENTS', name: '🧂 Ингредиенты' },
    { code: 'EQUIPMENT', name: '🔧 Оборудование' },
    { code: 'RENT', name: '🏢 Аренда' },
    { code: 'SALARY', name: '👨‍💼 Зарплата' },
    { code: 'TRANSPORT', name: '🚚 Транспорт' },
    { code: 'UTILITIES', name: '💡 Коммунальные услуги' },
    { code: 'MARKETING', name: '📣 Маркетинг' },
    { code: 'TAXES', name: '📝 Налоги' }
  ];
}

// Функция для получения названия категории
function getCategoryName(category) {
  const incomeCategories = getIncomeCategories();
  const expenseCategories = getExpenseCategories();
  
  const allCategories = [...incomeCategories, ...expenseCategories];
  
  const foundCategory = allCategories.find(c => c.code === category);
  
  return foundCategory ? foundCategory.name : '🔄 Другое';
}

module.exports = scene;
