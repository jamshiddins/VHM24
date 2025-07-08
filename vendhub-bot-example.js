
// Пример состояний Telegram бота

const { Telegraf, Scenes } = require('telegraf');
const LocalSession = require('telegraf-session-local');

// Создание сцены заполнения бункера
const fillBunkerScene = new Scenes.WizardScene(
  'FILL_BUNKER',
  // Шаг 1: Выбор бункера
  async (ctx) => {
    await ctx.reply('🗃 Выберите бункер или отправьте фото QR-кода', {
      reply_markup: {
        inline_keyboard: [
          [{text: 'SET-005-1CO (Кофе)', callback_data: 'bunker:SET-005-1CO'}],
          [{text: 'SET-005-2CR (Сливки)', callback_data: 'bunker:SET-005-2CR'}],
          [{text: '📷 Сканировать QR', callback_data: 'scan_qr'}]
        ]
      }
    });
    return ctx.wizard.next();
  },
  
  // Шаг 2: Взвешивание пустого
  async (ctx) => {
    ctx.wizard.state.bunkerCode = ctx.callbackQuery?.data.split(':')[1];
    await ctx.reply('⚖️ Введите вес пустого бункера (г):');
    return ctx.wizard.next();
  },
  
  // Шаг 3: Выбор партии и заполнение
  async (ctx) => {
    ctx.wizard.state.emptyWeight = parseInt(ctx.message.text);
    // ... остальные шаги
  }
);

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([fillBunkerScene]);

bot.use(new LocalSession().middleware());
bot.use(stage.middleware());

bot.command('fill_bunker', (ctx) => ctx.scene.enter('FILL_BUNKER'));

bot.launch();
