/**
 * Скрипт для исправления критических проблем в системе VendHub
 * Этот скрипт проверяет и исправляет все критические проблемы, которые могут возникнуть при развертывании
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    throw error;
  }
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Создана директория: ${dirPath}`, 'success');
  }
}

// Функция для исправления схемы Prisma
function fixPrismaSchema() {
  log('Исправление схемы Prisma...', 'info');
  
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  
  // Проверяем наличие файла
  if (!checkFileExists(schemaPath)) {
    log(`Файл ${schemaPath} не найден`, 'error');
    return false;
  }
  
  // Создаем резервную копию файла
  const backupPath = `${schemaPath}.backup-${Date.now()}`;
  fs.copyFileSync(schemaPath, backupPath);
  log(`Создана резервная копия схемы: ${backupPath}`, 'info');
  
  // Читаем содержимое файла
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Исправляем дублирующиеся значения в enum TaskType
  const taskTypeEnumRegex = /enum\s+TaskType\s+{([^}]*)}/s;
  const match = schemaContent.match(taskTypeEnumRegex);
  
  if (match) {
    const enumContent = match[1];
    const enumValues = enumContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
    
    // Удаляем дублирующиеся значения
    const uniqueValues = [...new Set(enumValues)];
    
    log(`Найдено ${enumValues.length} значений, из них уникальных: ${uniqueValues.length}`, 'info');
    
    // Формируем новое содержимое enum
    const newEnumContent = `enum TaskType {\n  ${uniqueValues.join('\n  ')}\n}`;
    
    // Заменяем старый enum на новый
    schemaContent = schemaContent.replace(taskTypeEnumRegex, newEnumContent);
  } else {
    log('Enum TaskType не найден в схеме', 'warning');
  }
  
  // Исправляем провайдер базы данных
  if (schemaContent.includes('provider = "sqlite"')) {
    log('Изменение провайдера базы данных на PostgreSQL...', 'info');
    
    // Заменяем SQLite на PostgreSQL
    schemaContent = schemaContent.replace(
      /provider = "sqlite"/,
      'provider = "postgresql"'
    );
    
    // Заменяем URL базы данных
    schemaContent = schemaContent.replace(
      /url = "file:\.\/dev\.db"/,
      'url = env("DATABASE_URL")'
    );
  }
  
  // Исправляем модель User
  if (schemaContent.includes('model User {')) {
    // Проверяем наличие поля name
    if (schemaContent.includes('name        String')) {
      // Проверяем наличие полей firstName и lastName
      if (!schemaContent.includes('firstName') && !schemaContent.includes('lastName')) {
        log('Добавление полей firstName и lastName в модель User...', 'info');
        
        // Заменяем поле name на firstName и lastName
        schemaContent = schemaContent.replace(
          /name\s+String/,
          'firstName   String\n  lastName    String\n  name        String @default("")'
        );
      }
    }
  }
  
  // Записываем исправленное содержимое
  fs.writeFileSync(schemaPath, schemaContent);
  
  log('Схема Prisma успешно исправлена', 'success');
  return true;
}

// Функция для исправления файлов FSM-сценариев
function fixFsmScenes() {
  log('Исправление файлов FSM-сценариев...', 'info');
  
  const scenesDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes');
  
  // Проверяем наличие директории
  if (!checkFileExists(scenesDir)) {
    log(`Директория ${scenesDir} не найдена`, 'error');
    return false;
  }
  
  // Проверяем наличие файла index.js
  const indexPath = path.join(scenesDir, 'index.js');
  if (!checkFileExists(indexPath)) {
    log(`Файл ${indexPath} не найден, создаем...`, 'warning');
    
    const indexContent = `/**
 * Индексный файл для всех FSM-сценариев
 * Экспортирует все сцены для использования в Telegram-боте
 */

const { mainMenuScene } = require('./main-menu.scene');
const { taskCreateScene } = require('./task-create.scene');
const { taskExecutionScene } = require('./task-execution.scene');
const { checklistScene } = require('./checklist.scene');
const { bagScene } = require('./bag.scene');
const { warehouseReceiveScene } = require('./warehouse-receive.scene');
const { warehouseReturnScene } = require('./warehouse-return.scene');
const { warehouseInventoryScene } = require('./warehouse-inventory.scene');
const { cashScene } = require('./cash.scene');
const { retroScene } = require('./retro.scene');
const { errorScene } = require('./error.scene');
const { importScene } = require('./import.scene');
const { directoryScene } = require('./directory.scene');
const { userScene } = require('./user.scene');
const { reportScene } = require('./report.scene');
const { financeScene } = require('./finance.scene');
const { adminScene } = require('./admin.scene');

// Экспорт всех сцен
module.exports = {
  mainMenuScene,
  taskCreateScene,
  taskExecutionScene,
  checklistScene,
  bagScene,
  warehouseReceiveScene,
  warehouseReturnScene,
  warehouseInventoryScene,
  cashScene,
  retroScene,
  errorScene,
  importScene,
  directoryScene,
  userScene,
  reportScene,
  financeScene,
  adminScene
};
`;
    
    fs.writeFileSync(indexPath, indexContent);
    log(`Файл ${indexPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла states.js
  const statesPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'states.js');
  if (!checkFileExists(statesPath)) {
    log(`Файл ${statesPath} не найден, создаем...`, 'warning');
    
    const statesContent = `/**
 * Константы состояний для FSM-сценариев
 */

// Главное меню
const MAIN_MENU = {
  AUTH_CHECK: 'main_menu:auth_check',
  MAIN_MENU: 'main_menu:main_menu'
};

// Создание задачи
const TASK_CREATE = {
  SELECT_TYPE: 'task_create:select_type',
  SELECT_MACHINE: 'task_create:select_machine',
  SELECT_ITEMS: 'task_create:select_items',
  SELECT_DEADLINE: 'task_create:select_deadline',
  SELECT_CHECKLIST_TEMPLATE: 'task_create:select_checklist_template',
  ASSIGN_EXECUTOR: 'task_create:assign_executor',
  CONFIRM_CREATE: 'task_create:confirm_create',
  SUCCESS: 'task_create:success',
  ERROR: 'task_create:error'
};

// Выполнение задачи
const TASK_EXECUTION = {
  LIST_ASSIGNED: 'task_execution:list_assigned',
  VIEW_DETAILS: 'task_execution:view_details',
  START: 'task_execution:start',
  PHOTO_BEFORE: 'task_execution:photo_before',
  INPUT_WEIGHTS: 'task_execution:input_weights',
  INPUT_UNITS: 'task_execution:input_units',
  PHOTO_AFTER: 'task_execution:photo_after',
  FINISH: 'task_execution:finish',
  ERROR_REPORT: 'task_execution:error_report'
};

// Чек-лист
const CHECKLIST = {
  LOAD_TEMPLATE: 'checklist:load_template',
  ITEM_CHECK: 'checklist:item_check',
  CONFIRM: 'checklist:confirm',
  REJECT: 'checklist:reject'
};

// Формирование сумок
const BAG = {
  SELECT_MACHINE: 'bag:select_machine',
  ADD_HOPPERS: 'bag:add_hoppers',
  ADD_SYRUPS: 'bag:add_syrups',
  ADD_WATER: 'bag:add_water',
  ADD_EXTRAS: 'bag:add_extras',
  PHOTO: 'bag:photo',
  CONFIRM: 'bag:confirm',
  DISPATCH: 'bag:dispatch'
};

// Приём на склад
const WAREHOUSE_RECEIVE = {
  SELECT_TYPE: 'warehouse_receive:select_type',
  INPUT_QUANTITY_OR_WEIGHT: 'warehouse_receive:input_quantity_or_weight',
  PHOTO: 'warehouse_receive:photo',
  CONFIRM: 'warehouse_receive:confirm'
};

// Возврат на склад
const WAREHOUSE_RETURN = {
  SELECT_TASK: 'warehouse_return:select_task',
  SELECT_BAG: 'warehouse_return:select_bag',
  INPUT_WEIGHTS: 'warehouse_return:input_weights',
  PHOTO: 'warehouse_return:photo',
  FINISH: 'warehouse_return:finish'
};

// Инвентаризация
const WAREHOUSE_INVENTORY = {
  SELECT_TYPE: 'warehouse_inventory:select_type',
  SELECT_ITEM: 'warehouse_inventory:select_item',
  INPUT_DATA: 'warehouse_inventory:input_data',
  PHOTO: 'warehouse_inventory:photo',
  FINISH: 'warehouse_inventory:finish'
};

// Инкассация
const CASH = {
  SELECT_MACHINE: 'cash:select_machine',
  INPUT_AMOUNT: 'cash:input_amount',
  UPLOAD_PHOTO: 'cash:upload_photo',
  CONFIRM: 'cash:confirm',
  RECONCILIATION_MANAGER: 'cash:reconciliation_manager'
};

// Ретроспективный ввод
const RETRO = {
  SELECT_ACTION: 'retro:select_action',
  SELECT_DATE: 'retro:select_date',
  INPUT_DATA: 'retro:input_data',
  PHOTO_OPTIONAL: 'retro:photo_optional',
  CONFIRM: 'retro:confirm'
};

// Ошибки
const ERROR = {
  SELECT_REASON: 'error:select_reason',
  COMMENT: 'error:comment',
  PHOTO_OPTIONAL: 'error:photo_optional',
  SUBMIT: 'error:submit'
};

// Импорт данных
const IMPORT = {
  SELECT_TYPE: 'import:select_type',
  UPLOAD_FILE: 'import:upload_file',
  AUTO_RECONCILIATION: 'import:auto_reconciliation',
  AUTO_GENERATE_TASKS: 'import:auto_generate_tasks',
  CONFIRM_FINISH: 'import:confirm_finish'
};

// Справочники
const DIRECTORY = {
  SELECT_CATEGORY: 'directory:select_category',
  LIST_ENTRIES: 'directory:list_entries',
  VIEW_ENTRY: 'directory:view_entry',
  ADD_ENTRY: 'directory:add_entry',
  EDIT_ENTRY: 'directory:edit_entry',
  DELETE_ENTRY: 'directory:delete_entry'
};

// Пользователи
const USER = {
  LIST: 'user:list',
  VIEW_DETAILS: 'user:view_details',
  ADD: 'user:add',
  EDIT: 'user:edit',
  ASSIGN_ROLE: 'user:assign_role',
  TOGGLE_STATUS: 'user:toggle_status',
  VIEW_LOGS: 'user:view_logs'
};

// Отчеты
const REPORT = {
  SELECT_TYPE: 'report:select_type',
  FILTER_PERIOD: 'report:filter_period',
  FILTER_MACHINE: 'report:filter_machine',
  FILTER_ITEM: 'report:filter_item',
  EXPORT_FORMAT: 'report:export_format',
  GENERATE_RESULT: 'report:generate_result'
};

// Финансы
const FINANCE = {
  MENU: 'finance:menu',
  ADD_INCOME: 'finance:add_income',
  ADD_EXPENSE: 'finance:add_expense',
  VIEW_BALANCE: 'finance:view_balance',
  VIEW_HISTORY: 'finance:view_history'
};

// Администрирование
const ADMIN = {
  MENU: 'admin:menu',
  SETTINGS_SYSTEM: 'admin:settings_system',
  SETTINGS_ROLES: 'admin:settings_roles',
  SETTINGS_USERS: 'admin:settings_users',
  SETTINGS_LOGS: 'admin:settings_logs',
  SETTINGS_NOTIFICATIONS: 'admin:settings_notifications',
  SETTINGS_RESET_DATA: 'admin:settings_reset_data'
};

module.exports = {
  MAIN_MENU,
  TASK_CREATE,
  TASK_EXECUTION,
  CHECKLIST,
  BAG,
  WAREHOUSE_RECEIVE,
  WAREHOUSE_RETURN,
  WAREHOUSE_INVENTORY,
  CASH,
  RETRO,
  ERROR,
  IMPORT,
  DIRECTORY,
  USER,
  REPORT,
  FINANCE,
  ADMIN
};
`;
    
    fs.writeFileSync(statesPath, statesContent);
    log(`Файл ${statesPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла fsm-helpers.js
  const fsmHelpersPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'fsm-helpers.js');
  if (!checkFileExists(fsmHelpersPath)) {
    log(`Файл ${fsmHelpersPath} не найден, создаем...`, 'warning');
    
    // Создаем директорию utils, если она не существует
    ensureDirectoryExists(path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils'));
    
    const fsmHelpersContent = `/**
 * Вспомогательные функции для работы с FSM-сценариями
 */

const { Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Создает клавиатуру с кнопками для Telegram
 * @param {Array<Array<string>>} buttons - Массив массивов с текстом кнопок
 * @param {Object} options - Дополнительные опции
 * @returns {Object} - Объект клавиатуры Telegraf
 */
function createKeyboard(buttons, options = {}) {
  const keyboard = buttons.map(row => 
    row.map(button => Markup.button.text(button))
  );
  
  return Markup.keyboard(keyboard).resize(options.resize !== false);
}

/**
 * Создает инлайн-клавиатуру с кнопками для Telegram
 * @param {Array<Array<{text: string, callback_data: string}>>} buttons - Массив массивов с объектами кнопок
 * @returns {Object} - Объект инлайн-клавиатуры Telegraf
 */
function createInlineKeyboard(buttons) {
  return Markup.inlineKeyboard(buttons);
}

/**
 * Получает список пользователей с определенной ролью
 * @param {string} role - Роль пользователя
 * @returns {Promise<Array>} - Массив пользователей
 */
async function getUsersByRole(role) {
  try {
    const users = await prisma.user.findMany({
      where: {
        role,
        status: 'ACTIVE'
      }
    });
    
    return users;
  } catch (error) {
    console.error('Ошибка при получении пользователей по роли:', error);
    return [];
  }
}

/**
 * Получает список автоматов
 * @returns {Promise<Array>} - Массив автоматов
 */
async function getMachines() {
  try {
    const machines = await prisma.machine.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        location: true
      }
    });
    
    return machines;
  } catch (error) {
    console.error('Ошибка при получении автоматов:', error);
    return [];
  }
}

/**
 * Получает список задач пользователя
 * @param {string} userId - ID пользователя
 * @param {string} status - Статус задачи (опционально)
 * @returns {Promise<Array>} - Массив задач
 */
async function getUserTasks(userId, status = null) {
  try {
    const where = {
      assignedUserId: userId
    };
    
    if (status) {
      where.status = status;
    }
    
    const tasks = await prisma.task.findMany({
      where,
      include: {
        machine: {
          include: {
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return tasks;
  } catch (error) {
    console.error('Ошибка при получении задач пользователя:', error);
    return [];
  }
}

/**
 * Форматирует дату в читаемый формат
 * @param {Date} date - Дата
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
  if (!date) return 'Не указана';
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('ru-RU', options);
}

/**
 * Создает уникальный ID
 * @returns {string} - Уникальный ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

module.exports = {
  createKeyboard,
  createInlineKeyboard,
  getUsersByRole,
  getMachines,
  getUserTasks,
  formatDate,
  generateId
};
`;
    
    fs.writeFileSync(fsmHelpersPath, fsmHelpersContent);
    log(`Файл ${fsmHelpersPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла fsm-integrator.js
  const fsmIntegratorPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'fsm-integrator.js');
  if (!checkFileExists(fsmIntegratorPath)) {
    log(`Файл ${fsmIntegratorPath} не найден, создаем...`, 'warning');
    
    const fsmIntegratorContent = `/**
 * Интегратор FSM-сценариев с Telegram-ботом
 */

const { Scenes, session } = require('telegraf');
const { checkUserRole } = require('./role-sync');

/**
 * Регистрирует все FSM-сцены в Telegram-боте
 * @param {Object} bot - Экземпляр Telegram-бота
 * @param {Array} scenes - Массив сцен
 */
function registerScenes(bot, scenes) {
  // Создаем менеджер сцен
  const stage = new Scenes.Stage(scenes);
  
  // Добавляем middleware для сессии и сцен
  bot.use(session());
  bot.use(stage.middleware());
  
  // Добавляем middleware для проверки роли пользователя
  bot.use(async (ctx, next) => {
    if (!ctx.session) {
      ctx.session = {};
    }
    
    if (!ctx.session.user) {
      const telegramId = ctx.from.id.toString();
      const user = await checkUserRole(telegramId);
      
      if (user) {
        ctx.session.user = user;
      }
    }
    
    return next();
  });
  
  // Обработчик команды /start
  bot.start(async (ctx) => {
    try {
      // Проверяем роль пользователя
      const telegramId = ctx.from.id.toString();
      const user = await checkUserRole(telegramId);
      
      if (!user) {
        return ctx.reply('Вы не зарегистрированы в системе. Обратитесь к администратору.');
      }
      
      // Сохраняем информацию о пользователе в сессии
      ctx.session.user = user;
      
      // Переходим в главное меню
      return ctx.scene.enter('main_menu');
    } catch (error) {
      console.error('Ошибка при обработке команды /start:', error);
      return ctx.reply('Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик команды /menu
  bot.command('menu', (ctx) => {
    return ctx.scene.enter('main_menu');
  });
  
  // Обработчик команды /help
  bot.help((ctx) => {
    return ctx.reply(
      'Доступные команды:\\n' +
      '/start - Запустить бота\\n' +
      '/menu - Перейти в главное меню\\n' +
      '/help - Показать справку'
    );
  });
  
  // Обработчик неизвестных команд
  bot.on('text', (ctx) => {
    return ctx.scene.enter('main_menu');
  });
}

module.exports = {
  registerScenes
};
`;
    
    fs.writeFileSync(fsmIntegratorPath, fsmIntegratorContent);
    log(`Файл ${fsmIntegratorPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла main-menu.scene.js
  const mainMenuScenePath = path.join(scenesDir, 'main-menu.scene.js');
  if (!checkFileExists(mainMenuScenePath)) {
    log(`Файл ${mainMenuScenePath} не найден, создаем...`, 'warning');
    
    const mainMenuSceneContent = `/**
 * FSM-сценарий: Главное меню
 * 
 * Отображает главное меню, динамически адаптирующееся под роль пользователя.
 */

const { Scenes } = require('telegraf');
const { MAIN_MENU } = require('../states');
const { createKeyboard } = require('../utils/fsm-helpers');
const { checkUserRole, getRoleText } = require('../utils/role-sync');

// Создаем сцену
const mainMenuScene = new Scenes.BaseScene('main_menu');

// Обработчик входа в сцену
mainMenuScene.enter(async (ctx) => {
  try {
    // Проверяем роль пользователя
    const telegramId = ctx.from.id.toString();
    const user = await checkUserRole(telegramId);
    
    if (!user) {
      return ctx.reply('Вы не зарегистрированы в системе. Обратитесь к администратору.');
    }
    
    // Сохраняем информацию о пользователе в сессии
    ctx.session.user = user;
    
    // Формируем кнопки в зависимости от роли пользователя
    const buttons = getMenuButtonsByRole(user.role);
    
    // Отправляем приветственное сообщение с кнопками
    return ctx.reply(
      \`Добро пожаловать, \${user.firstName} \${user.lastName}!\\n\\nВаша роль: \${getRoleText(user.role)}\\n\\nВыберите действие:\`,
      createKeyboard(buttons)
    );
  } catch (error) {
    console.error('Ошибка при входе в главное меню:', error);
    return ctx.reply('Произошла ошибка при загрузке главного меню. Пожалуйста, попробуйте позже.');
  }
});

// Обработчик кнопок
mainMenuScene.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  // Обработка кнопок в зависимости от текста
  switch (text) {
    case 'Мои задачи':
      return ctx.scene.enter('task_execution');
    
    case 'Создать задачу':
      return ctx.scene.enter('task_create');
    
    case 'Формирование сумок':
      return ctx.scene.enter('bag');
    
    case 'Приём на склад':
      return ctx.scene.enter('warehouse_receive');
    
    case 'Возврат на склад':
      return ctx.scene.enter('warehouse_return');
    
    case 'Инвентаризация':
      return ctx.scene.enter('warehouse_inventory');
    
    case 'Инкассация':
      return ctx.scene.enter('cash');
    
    case 'Ретро-ввод':
      return ctx.scene.enter('retro');
    
    case 'Импорт данных':
      return ctx.scene.enter('import');
    
    case 'Справочники':
      return ctx.scene.enter('directory');
    
    case 'Пользователи':
      return ctx.scene.enter('user');
    
    case 'Отчеты':
      return ctx.scene.enter('report');
    
    case 'Финансы':
      return ctx.scene.enter('finance');
    
    case 'Администрирование':
      return ctx.scene.enter('admin');
    
    default:
      return ctx.reply('Неизвестная команда. Пожалуйста, выберите действие из меню.');
  }
});

/**
 * Возвращает кнопки меню в зависимости от роли пользователя
 * @param {string} role - Роль пользователя
 * @returns {Array<Array<string>>} - Массив массивов с текстом кнопок
 */
function getMenuButtonsByRole(role) {
  const buttons = [];
  
  // Общие кнопки для всех ролей
  buttons.push(['Мои задачи']);
  
  // Кнопки для менеджера
  if (role === 'MANAGER' || role === 'ADMIN') {
    buttons.push(['Создать задачу']);
    buttons.push(['Отчеты', 'Финансы']);
    buttons.push(['Справочники', 'Импорт данных']);
  }
  
  // Кнопки для складского работника
  if (role === 'WAREHOUSE' || role === 'ADMIN') {
    buttons.push(['Формирование сумок']);
    buttons.push(['Приём на склад', 'Возврат на склад']);
    buttons.push(['Инвентаризация']);
  }
  
  // Кнопки для оператора
  if (role === 'OPERATOR' || role === 'ADMIN') {
    buttons.push(['Инкассация']);
    buttons.push(['Ретро-ввод']);
  }
  
  // Кнопки для техника
  if (role === 'TECHNICIAN' || role === 'ADMIN') {
    buttons.push(['Отчеты']);
  }
  
  // Кнопки только для администратора
  if (role === 'ADMIN') {
    buttons.push(['Пользователи', 'Администрирование']);
  }
  
  return buttons;
}

module.exports = {
  mainMenuScene
};
`;
    
    fs.writeFileSync(mainMenuScenePath, mainMenuSceneContent);
    log(`Файл ${mainMenuScenePath} успешно создан`, 'success');
  }
  
  log('Файлы FSM-сценариев успешно исправлены', 'success');
  return true;
}

// Функция для исправления файла index.js Telegram-бота
function fixTelegramBotIndex() {
  log('Исправление файла index.js Telegram-бота...', 'info');
  
  const indexPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');
  
  // Проверяем наличие файла
  if (!checkFileExists(indexPath)) {
    log(`Файл ${indexPath} не найден, создаем...`, 'warning');
    
    // Создаем директорию, если она не существует
    ensureDirectoryExists(path.join(__dirname, 'apps', 'telegram-bot', 'src'));
    
    const indexContent = `/**
 * Основной файл Telegram-бота VendHub
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { registerScenes } = require('./utils/fsm-integrator');
const { PrismaClient } = require('@prisma/client');

// Импорт всех FSM-сценариев
const scenes = require('./scenes');

// Инициализация Prisma
const prisma = new PrismaClient();

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Регистрация всех FSM-сценариев
registerScenes(bot, Object.values(scenes));

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка Telegraf:', err);
  ctx.reply('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.');
});

// Запуск бота
async function startBot() {
  try {
    // Проверка подключения к базе данных
    await prisma.$connect();
    console.log('Успешное подключение к базе данных');
    
    // Определение режима запуска (webhook или polling)
    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    const PORT = process.env.PORT || 3000;
    
    if (WEBHOOK_URL && process.env.NODE_ENV === 'production') {
      // Режим webhook для production
      await bot.telegram.setWebhook(WEBHOOK_URL);
      console.log(\`Webhook установлен на \${WEBHOOK_URL}\`);
      
      // Создаем Express-приложение для обработки webhook
      const express = require('express');
      const app = express();
      
      // Настройка middleware для обработки webhook
      app.use(express.json());
      
      // Маршрут для webhook
      app.post('/webhook', (req, res) => {
        bot.handleUpdate(req.body, res);
      });
      
      // Маршрут для проверки работоспособности
      app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      });
      
      // Запуск сервера
      app.listen(PORT, () => {
        console.log(\`Сервер запущен на порту \${PORT}\`);
      });
    } else {
      // Режим polling для разработки
      await bot.telegram.deleteWebhook();
      await bot.launch();
      console.log('Бот запущен в режиме polling');
    }
    
    console.log('Бот успешно запущен');
    
    // Обработка завершения работы
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
    process.exit(1);
  }
}

// Запуск бота
startBot();
`;
    
    fs.writeFileSync(indexPath, indexContent);
    log(`Файл ${indexPath} успешно создан`, 'success');
  } else {
    log(`Файл ${indexPath} уже существует`, 'info');
  }
  
  log('Файл index.js Telegram-бота успешно исправлен', 'success');
  return true;
}

// Функция для исправления package.json
function fixPackageJson() {
  log('Исправление файла package.json...', 'info');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  // Проверяем наличие файла
  if (!checkFileExists(packageJsonPath)) {
    log(`Файл ${packageJsonPath} не найден`, 'error');
    return false;
  }
  
  // Читаем содержимое файла
  let packageJsonContent;
  try {
    packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    log(`Ошибка при чтении файла ${packageJsonPath}: ${error.message}`, 'error');
    return false;
  }
  
  // Проверяем наличие необходимых зависимостей
  if (!packageJsonContent.dependencies) {
    packageJsonContent.dependencies = {};
  }
  
  // Добавляем необходимые зависимости, если их нет
  const requiredDependencies = {
    'telegraf': '^4.12.2',
    'express': '^4.18.2',
    'dotenv': '^16.3.1',
    '@prisma/client': '^5.0.0',
    'axios': '^1.4.0'
  };
  
  let dependenciesChanged = false;
  
  for (const [name, version] of Object.entries(requiredDependencies)) {
    if (!packageJsonContent.dependencies[name]) {
      packageJsonContent.dependencies[name] = version;
      dependenciesChanged = true;
      log(`Добавлена зависимость ${name}@${version}`, 'info');
    }
  }
  
  // Проверяем наличие необходимых скриптов
  if (!packageJsonContent.scripts) {
    packageJsonContent.scripts = {};
  }
  
  // Добавляем необходимые скрипты, если их нет
  const requiredScripts = {
    'start': 'node backend/src/index.js',
    'start:bot': 'node apps/telegram-bot/src/index.js',
    'dev': 'nodemon backend/src/index.js',
    'dev:bot': 'nodemon apps/telegram-bot/src/index.js',
    'prisma:generate': 'cd backend && npx prisma generate',
    'prisma:migrate': 'cd backend && npx prisma migrate dev',
    'prisma:studio': 'cd backend && npx prisma studio',
    'deploy': 'node deploy-to-railway-complete.js'
  };
  
  let scriptsChanged = false;
  
  for (const [name, command] of Object.entries(requiredScripts)) {
    if (!packageJsonContent.scripts[name]) {
      packageJsonContent.scripts[name] = command;
      scriptsChanged = true;
      log(`Добавлен скрипт ${name}: ${command}`, 'info');
    }
  }
  
  // Записываем обновленное содержимое, если были изменения
  if (dependenciesChanged || scriptsChanged) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
    log('Файл package.json успешно обновлен', 'success');
  } else {
    log('Файл package.json не требует обновления', 'info');
  }
  
  return true;
}

// Функция для проверки и исправления всех критических проблем
async function fixAllCriticalIssues() {
  log('=== ИСПРАВЛЕНИЕ КРИТИЧЕСКИХ ПРОБЛЕМ ===', 'title');
  
  try {
    // Исправление схемы Prisma
    const prismaFixed = fixPrismaSchema();
    
    if (!prismaFixed) {
      log('❌ Не удалось исправить схему Prisma', 'error');
    }
    
    // Исправление файлов FSM-сценариев
    const fsmFixed = fixFsmScenes();
    
    if (!fsmFixed) {
      log('❌ Не удалось исправить файлы FSM-сценариев', 'error');
    }
    
    // Исправление файла index.js Telegram-бота
    const indexFixed = fixTelegramBotIndex();
    
    if (!indexFixed) {
      log('❌ Не удалось исправить файл index.js Telegram-бота', 'error');
    }
    
    // Исправление package.json
    const packageJsonFixed = fixPackageJson();
    
    if (!packageJsonFixed) {
      log('❌ Не удалось исправить файл package.json', 'error');
    }
    
    log('=== ИСПРАВЛЕНИЕ КРИТИЧЕСКИХ ПРОБЛЕМ ЗАВЕРШЕНО ===', 'title');
    log('', 'info');
    log('Теперь вы можете развернуть приложение в Railway, выполнив команду:', 'info');
    log('node deploy-to-railway-complete.js', 'info');
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
fixAllCriticalIssues().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
