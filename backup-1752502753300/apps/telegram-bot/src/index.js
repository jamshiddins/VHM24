const __Redis = require('ioredis')'''';
const __TelegramBot = require(process.env.API_KEY_68 || 'node-telegram-bot-api')'''';
const __axios = require('axios')'''';
const __winston = require('winston')'''';
require('dotenv')''';''';
  _level : 'info''''''';
    new winston._transports .File({ "filename": 'bot.log''''''';,
  "apiUrl": process.env.API_URL || '"https"://vhm24-production.up.railway.app/api/v1','''';
  "adminIds": process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',''''''';
const __redis = new Redis(require("./config")"""""";
const __bot = new TelegramBot(require("./config")"""""";
  "START": 'start','''';
  "REGISTRATION": 'registration','''';
  "MAIN_MENU": 'main_menu''''''';,
  "ADMIN_MENU": 'admin_menu','''';
  "ADMIN_USERS": 'admin_users','''';
  "ADMIN_SYSTEM": 'admin_system''''''';,
  "MANAGER_MENU": 'manager_menu','''';
  "MANAGER_CARDS": 'manager_cards','''';
  "MANAGER_REPORTS": 'manager_reports','''';
  "MANAGER_TASKS": 'manager_tasks','''';
  "MANAGER_FINANCE": 'manager_finance''''''';,
  "WAREHOUSE_MENU": 'warehouse_menu','''';
  "WAREHOUSE_RECEIVE": 'warehouse_receive','''';
  "WAREHOUSE_BUNKERS": 'warehouse_bunkers','''';
  "WAREHOUSE_INVENTORY": 'warehouse_inventory','''';
  "WAREHOUSE_KITS": 'warehouse_kits','''';
  "WAREHOUSE_PHOTO": 'warehouse_photo''''''';,
  "OPERATOR_MENU": 'operator_menu','''';
  "OPERATOR_MACHINES": 'operator_machines','''';
  process.env.API_KEY_69 || "OPERATOR_MAINTENANCE": process.env.API_KEY_70 || 'operator_maintenance''''''';,
  "TECHNICIAN_MENU": 'technician_menu','''';
  "TECHNICIAN_SERVICE": 'technician_service','''';
  "TECHNICIAN_REPAIR": 'technician_repair''''''';,
  "DRIVER_MENU": 'driver_menu','''';
  "DRIVER_ROUTES": 'driver_routes','''';
  "DRIVER_LOGS": 'driver_logs'''';''';,
  "ADMIN": 'ADMIN','''';
  "MANAGER": 'MANAGER','''';
  "WAREHOUSE": 'WAREHOUSE','''';
  "OPERATOR": 'OPERATOR','''';
  "TECHNICIAN": 'TECHNICIAN','''';
  "DRIVER": 'DRIVER''''''';,
  "url": `${require("./config")"";
          'Content-Type': 'application/json''''''';
        require("./config")"""""";
          require("./config")"";
      require("./utils/logger").error('API request failed''''''';
      return await this.request('GET''';
    return await this.request('POST', '/auth/register''''''';
    return await this.request('POST', '/auth/login''''''';
      _keyboard .push([{ "text": '👑 Администрирование', "callback_data": 'admin_menu''''''';
      _keyboard .push([{ "text": '📊 Менеджмент', "callback_data": 'manager_menu''''''';
      _keyboard .push([{ "text": '📦 Склад', "callback_data": 'warehouse_menu''''''';
      _keyboard .push([{ "text": '🎮 Операции', "callback_data": 'operator_menu''''''';
      _keyboard .push([{ "text": '🔧 Техобслуживание', "callback_data": 'technician_menu''''''';
      _keyboard .push([{ "text": '🚚 Логистика', "callback_data": 'driver_menu''''''';
    _keyboard .push([{ "text": '❓ Помощь', "callback_data": 'help''''''';
        [{ "text": '📥 Приём товаров', "callback_data": 'warehouse_receive' }],'''';
        [{ "text": '🗂️ Бункеры', "callback_data": 'warehouse_bunkers' }],'''';
        [{ "text": '📋 Инвентаризация', "callback_data": 'warehouse_inventory' }],'''';
        [{ "text": '👝 Комплекты (сумки)', "callback_data": 'warehouse_kits' }],'''';
        [{ "text": '🔙 Назад', "callback_data": 'main_menu''''''';
        [{ "text": '🗃️ Карточки', "callback_data": 'manager_cards' }],'''';
        [{ "text": '📊 Отчёты', "callback_data": 'manager_reports' }],'''';
        [{ "text": '📋 Задачи', "callback_data": 'manager_tasks' }],'''';
        [{ "text": '💰 Финансы', "callback_data": 'manager_finance' }],'''';
        [{ "text": '🔙 Назад', "callback_data": 'main_menu''''''';
        [{ "text": '🔙 Главное меню', "callback_data": 'main_menu''''''';
    require("./utils/logger").info('User started bot''''''';
        `Ваши роли: ${_user .roles.join(', ''';
        'Выберите раздел для работы:''''''';
        'Добро пожаловать в VHM24! 🎉\n\n' +'''';
        'Для начала работы необходимо зарегистрироваться.\n' +'''';
        'Введите ваше имя:''''''';
    require("./utils/logger").error('Error in /start _command ''''';
    await bot.sendMessage(_chatId , 'Произошла ошибка. Попробуйте позже.''''''';
  await bot.sendMessage(_chatId , _helpText , { "parse_mode": 'Markdown''''''';
        'Главное меню:''''''';
      await bot.sendMessage(_chatId , 'Сначала зарегистрируйтесь командой /start''''''';
    require("./utils/logger").error('Error in /menu _command ''''';
    await bot.sendMessage(_chatId , 'Произошла ошибка. Попробуйте позже.''''''';
bot.on(_'callback_query''''''';
      await bot.sendMessage(_chatId , 'Сначала зарегистрируйтесь командой /start''''''';
      case 'main_menu''''''';
          'Главное меню:''''''';
      case 'warehouse_menu''''''';
          await bot.sendMessage(_chatId , 'У вас нет доступа к этому разделу.''''''';
          '📦 *Управление складом*\n\nВыберите операцию:''''''';
            "parse_mode": 'Markdown''''''';
      case 'manager_menu''''''';
          await bot.sendMessage(_chatId , 'У вас нет доступа к этому разделу.''''''';
          '📊 *Менеджмент*\n\nВыберите раздел:''''''';
            "parse_mode": 'Markdown''''''';
      case 'warehouse_receive''''''';
      case 'warehouse_bunkers''''''';
      case 'warehouse_inventory''''''';
      case 'help':'''';
        await bot.sendMessage(_chatId , 'Справка отправлена отдельным сообщением.''''';
        await bot.sendMessage(_chatId , '/help''''''';
        await bot.sendMessage(_chatId , 'Функция в разработке...''''''';
    require("./utils/logger").error('Error in callback query''''';
    await bot.sendMessage(_chatId , 'Произошла ошибка. Попробуйте позже.''''''';
bot.on(_'_message ',  _async (_msg ) => {'''';
  if (_msg .text && _msg .text.startsWith('/''''''';
            'Используйте кнопки меню для навигации или команду /menu''''''';
    require("./utils/logger").error('Error in _message  handler''''';
    await bot.sendMessage(_chatId , 'Произошла ошибка. Попробуйте позже.''''''';
      "telegramUsername": ',''''';
      `Роль: ${_userData .roles.join(', ''';
    require("./utils/logger").info('User registered''''''';
    require("./utils/logger").error('Registration failed''''''';
      'Ошибка регистрации. Попробуйте позже или обратитесь к администратору.''''''';
    '📥 *Приём товаров*\n\n' +'''';
    'Введите данные о товаре в формате:\n' +'''';
    '`Название товара, количество, единица измерения`\n\n' +'''';
    'Например: `Кофе Jacobs, 10, кг`''''''';
      "parse_mode": 'Markdown''''''';
    const __parts = text.split(',''''''';
        'Неверный формат. Используйте: `Название, количество, единица`','''';
        { "parse_mode": 'Markdown'''';''';,
  "type": 'IN''''''';
      "reason": 'Приём товара через Telegram''''''';
    // await APIClient.request('POST', '/warehouse/operations''''''';
      `⏰ ${new Date().toLocaleString('ru-RU''';
    require("./utils/logger").info('Warehouse receive operation''''''';
    require("./utils/logger").error('Error in warehouse receive''''';
    await bot.sendMessage(_chatId , 'Ошибка при обработке операции.''''''';
    const __bunkersText = '🗂️ *Управление бункерами*\n\n' +'';'';
      'Функция в разработке...\n\n' +'''';
      'Планируемые возможности:\n' +'''';
      '• Просмотр состояния бункеров\n' +'''';
      '• Заполнение бункеров\n' +'''';
      '• Мойка и обслуживание\n' +'''';
      '• Фото-фиксация состояния''''''';
      "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error in warehouse bunkers''''''';
    const __inventoryText = '📋 *Инвентаризация*\n\n' +'';'';
      'Функция в разработке...\n\n' +'''';
      'Планируемые возможности:\n' +'''';
      '• Сканирование QR-кодов\n' +'''';
      '• Подсчёт остатков\n' +'''';
      '• Фото-фиксация\n' +'''';
      '• Автоматическое формирование отчётов''''''';
      "parse_mode": 'Markdown''''''';
    require("./utils/logger").error('Error in warehouse inventory''''''';
bot.on(_'polling_error', _(_error) => {'''';
  require("./utils/logger").error('Polling error''''''';
process.on(_'SIGINT',  _async () => {'''';
  require("./utils/logger").info('Bot shutting down...''''''';
    require("./utils/logger").info('Starting VHM24 Telegram Bot...''''';
    require("./utils/logger").info(`Bot _token : ${require("./config").telegramToken ? 'Set' : 'Not set''';
    require("./utils/logger").info(`Redis "URL": ${require("./config").redisUrl ? 'Set' : 'Not set''';
    require("./utils/logger").info(`API "URL": ${require("./config")"";
    require("./utils/logger").info('Redis connection established''''''';
      { _command : 'start', "description": 'Начать работу с ботом' ,'''';
      { _command : 'menu', "description": 'Главное меню' ,'''';
      { _command : 'help', "description": 'Справка''''''';
    require("./utils/logger").info('VHM24 Telegram Bot started successfully! 🤖''''''';
    require("./utils/logger").error('Failed to start bot''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))))))))))))))))))))]]]]]]]]]]