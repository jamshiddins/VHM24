const { Telegraf, Scenes, session } = require('telegraf');
const { createClient } = require('redis');

// Мокаем модули
jest.mock('telegraf');
jest.mock('redis');

// Импортируем FSM-сценарии
// Предполагаем, что сценарии находятся в apps/telegram-bot/src/scenes
const { registerScenes } = require('../apps/telegram-bot/src/scenes');

describe('Telegram Bot FSM', () => {
  let bot;
  let stage;
  let redisClient;
  
  beforeEach(() => {
    // Создаем экземпляр бота для тестов
    bot = new Telegraf('test_token');
    
    // Создаем экземпляр Stage для тестов
    stage = new Scenes.Stage();
    stage.middleware = jest.fn().mockReturnValue(() => {});
    
    // Создаем экземпляр Redis клиента для тестов
    redisClient = createClient();
    
    // Регистрируем middleware
    bot.use(session());
    bot.use(stage.middleware());
  });
  
  afterEach(() => {
    // Очищаем моки
    jest.clearAllMocks();
  });
  
  it('should register all scenes', () => {
    // Регистрируем сцены
    registerScenes(stage);
    
    // Проверяем, что stage.register был вызван
    expect(stage.register).toHaveBeenCalled();
  });
  
  it('should handle /start command', () => {
    // Мокаем обработчик команды /start
    bot.command('start', (ctx) => {
      ctx.reply('Welcome!');
      return ctx.scene.enter('main_menu');
    });
    
    // Создаем контекст для тестирования
    const ctx = {
      reply: jest.fn(),
      scene: {
        enter: jest.fn(),
      },
    };
    
    // Вызываем обработчик команды /start
    bot.command.mock.calls[0][1](ctx);
    
    // Проверяем, что ctx.reply был вызван с правильным сообщением
    expect(ctx.reply).toHaveBeenCalledWith('Welcome!');
    
    // Проверяем, что ctx.scene.enter был вызван с правильной сценой
    expect(ctx.scene.enter).toHaveBeenCalledWith('main_menu');
  });
  
  it('should handle /cancel command', () => {
    // Мокаем обработчик команды /cancel
    bot.command('cancel', (ctx) => {
      ctx.reply('Operation cancelled');
      return ctx.scene.leave();
    });
    
    // Создаем контекст для тестирования
    const ctx = {
      reply: jest.fn(),
      scene: {
        leave: jest.fn(),
      },
    };
    
    // Вызываем обработчик команды /cancel
    bot.command.mock.calls[0][1](ctx);
    
    // Проверяем, что ctx.reply был вызван с правильным сообщением
    expect(ctx.reply).toHaveBeenCalledWith('Operation cancelled');
    
    // Проверяем, что ctx.scene.leave был вызван
    expect(ctx.scene.leave).toHaveBeenCalled();
  });
  
  it('should handle scene transitions', () => {
    // Создаем сцену для тестирования
    const scene = new Scenes.BaseScene('test_scene');
    
    // Добавляем обработчик события enter
    scene.enter((ctx) => {
      ctx.reply('Welcome to the test scene');
    });
    
    // Добавляем обработчик текстового сообщения
    scene.hears('next', (ctx) => {
      ctx.reply('Moving to the next scene');
      return ctx.scene.enter('next_scene');
    });
    
    // Регистрируем сцену
    stage.register(scene);
    
    // Создаем контекст для тестирования
    const ctx = {
      reply: jest.fn(),
      scene: {
        enter: jest.fn(),
      },
    };
    
    // Вызываем обработчик события enter
    scene.enter.mock.calls[0][0](ctx);
    
    // Проверяем, что ctx.reply был вызван с правильным сообщением
    expect(ctx.reply).toHaveBeenCalledWith('Welcome to the test scene');
    
    // Создаем контекст для тестирования текстового сообщения
    const ctxNext = {
      reply: jest.fn(),
      scene: {
        enter: jest.fn(),
      },
    };
    
    // Вызываем обработчик текстового сообщения
    scene.hears.mock.calls[0][1](ctxNext);
    
    // Проверяем, что ctx.reply был вызван с правильным сообщением
    expect(ctxNext.reply).toHaveBeenCalledWith('Moving to the next scene');
    
    // Проверяем, что ctx.scene.enter был вызван с правильной сценой
    expect(ctxNext.scene.enter).toHaveBeenCalledWith('next_scene');
  });
  
  it('should handle validation errors', () => {
    // Создаем сцену для тестирования
    const scene = new Scenes.BaseScene('validation_scene');
    
    // Добавляем обработчик события enter
    scene.enter((ctx) => {
      ctx.reply('Please enter a number');
    });
    
    // Добавляем обработчик текстового сообщения
    scene.on('text', (ctx) => {
      const text = ctx.message.text;
      
      // Проверяем, что введенный текст является числом
      if (isNaN(text)) {
        ctx.reply('Please enter a valid number');
        return;
      }
      
      ctx.reply(`You entered: ${text}`);
      return ctx.scene.leave();
    });
    
    // Регистрируем сцену
    stage.register(scene);
    
    // Создаем контекст для тестирования
    const ctx = {
      reply: jest.fn(),
      message: {
        text: 'not a number',
      },
      scene: {
        leave: jest.fn(),
      },
    };
    
    // Вызываем обработчик текстового сообщения
    scene.on.mock.calls[0][1](ctx);
    
    // Проверяем, что ctx.reply был вызван с сообщением об ошибке
    expect(ctx.reply).toHaveBeenCalledWith('Please enter a valid number');
    
    // Проверяем, что ctx.scene.leave не был вызван
    expect(ctx.scene.leave).not.toHaveBeenCalled();
    
    // Создаем контекст для тестирования с правильным числом
    const ctxValid = {
      reply: jest.fn(),
      message: {
        text: '42',
      },
      scene: {
        leave: jest.fn(),
      },
    };
    
    // Вызываем обработчик текстового сообщения
    scene.on.mock.calls[0][1](ctxValid);
    
    // Проверяем, что ctx.reply был вызван с правильным сообщением
    expect(ctxValid.reply).toHaveBeenCalledWith('You entered: 42');
    
    // Проверяем, что ctx.scene.leave был вызван
    expect(ctxValid.scene.leave).toHaveBeenCalled();
  });
});
