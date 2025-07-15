/**
 * Скрипт для запуска системы VendHub с исправлением всех ошибок
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

// Переменные для хранения процессов
let apiProcess = null;
let botProcess = null;
let isApiReady = false;
let isBotReady = false;

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
  
  // Исправляем провайдер базы данных для локального запуска
  if (schemaContent.includes('provider = "postgresql"')) {
    log('Изменение провайдера базы данных на SQLite для локального запуска...', 'info');
    
    // Заменяем PostgreSQL на SQLite
    schemaContent = schemaContent.replace(
      /provider = "postgresql"/,
      'provider = "sqlite"'
    );
    
    // Заменяем URL базы данных
    schemaContent = schemaContent.replace(
      /url = env\("DATABASE_URL"\)/,
      'url = "file:./dev.db"'
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
  
  // Создаем директорию, если она не существует
  ensureDirectoryExists(scenesDir);
  
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
  
  // Проверяем наличие файла role-sync.js
  const roleSyncPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'role-sync.js');
  if (!checkFileExists(roleSyncPath)) {
    log(`Файл ${roleSyncPath} не найден, создаем...`, 'warning');
    
    // Создаем директорию utils, если она не существует
    ensureDirectoryExists(path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils'));
    
    const roleSyncContent = `/**
 * Утилита для синхронизации ролей между Telegram-ботом и веб-интерфейсом
 */
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Константы ролей
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
  OPERATOR: 'OPERATOR',
  TECHNICIAN: 'TECHNICIAN',
  DRIVER: 'DRIVER'
};

// Текстовые представления ролей
const ROLE_TEXTS = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  WAREHOUSE: 'Складской работник',
  OPERATOR: 'Оператор',
  TECHNICIAN: 'Техник',
  DRIVER: 'Водитель'
};

// Права доступа для ролей
const ROLE_PERMISSIONS = {
  ADMIN: ['*'], // Администратор имеет все права
  MANAGER: ['create_task', 'view_reports', 'manage_machines', 'manage_finance', 'manage_directories'],
  WAREHOUSE: ['receive_items', 'dispatch_items', 'manage_bags', 'inventory_check'],
  OPERATOR: ['execute_task', 'replace_hoppers', 'replace_water', 'clean', 'cash_collection'],
  TECHNICIAN: ['repair', 'diagnostics', 'execute_task', 'view_reports'],
  DRIVER: ['execute_task', 'view_routes']
};

/**
 * Проверка роли пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<object|null>} - Информация о пользователе или null, если пользователь не найден
 */
async function checkUserRole(telegramId) {
  try {
    // Проверяем, существует ли пользователь в базе
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });
    
    if (!user) {
      console.log(\`Пользователь с Telegram ID \${telegramId} не найден\`);
      return null;
    }
    
    if (user.status !== 'ACTIVE') {
      console.log(\`Пользователь с Telegram ID \${telegramId} заблокирован\`);
      return null;
    }
    
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || []
    };
  } catch (error) {
    console.error('Ошибка при проверке роли пользователя:', error);
    return null;
  }
}

/**
 * Проверка наличия разрешения у пользователя
 * @param {string} role - Роль пользователя
 * @param {string} permission - Проверяемое разрешение
 * @returns {boolean} - true, если у пользователя есть разрешение, иначе false
 */
function hasPermission(role, permission) {
  if (!role || !permission) {
    return false;
  }
  
  // Администратор имеет все права
  if (role === ROLES.ADMIN) {
    return true;
  }
  
  // Проверяем наличие разрешения для роли
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Синхронизация пользователя с API
 * @param {object} user - Информация о пользователе
 * @returns {Promise<boolean>} - true, если синхронизация успешна, иначе false
 */
async function syncUserWithAPI(user) {
  try {
    if (!user || !user.id) {
      console.error('Ошибка синхронизации пользователя: отсутствуют данные пользователя');
      return false;
    }
    
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
    
    // Отправляем запрос к API для синхронизации пользователя
    const response = await axios.post(\`\${API_BASE_URL}/users/sync\`, {
      userId: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log(\`Пользователь \${user.id} успешно синхронизирован с API\`);
      return true;
    } else {
      console.warn(\`Ошибка синхронизации пользователя \${user.id} с API: \${JSON.stringify(response.data)}\`);
      return false;
    }
  } catch (error) {
    console.error('Ошибка синхронизации пользователя с API:', error.message);
    return false;
  }
}

/**
 * Получение текстового представления роли
 * @param {string} role - Роль пользователя
 * @returns {string} - Текстовое представление роли
 */
function getRoleText(role) {
  return ROLE_TEXTS[role] || 'Пользователь';
}

module.exports = {
  ROLES,
  ROLE_TEXTS,
  ROLE_PERMISSIONS,
  checkUserRole,
  hasPermission,
  syncUserWithAPI,
  getRoleText
};
`;
    
    fs.writeFileSync(roleSyncPath, roleSyncContent);
    log(`Файл ${roleSyncPath} успешно создан`, 'success');
  }
  
  // Проверяем наличие файла fsm-helpers.js
  const fsmHelpersPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'fsm-helpers.js');
  if (!checkFileExists(fsmHelpersPath)) {
    log(`Файл ${fsmHelpersPath} не найден, создаем...`, 'warning');
    
    const fsmHelpersContent = `/**
 * Утилиты для работы с FSM-сценариями
 */
const { Markup } = require('telegraf');

/**
 * Создает клавиатуру с кнопками для Telegram-бота
 * @param {Array<Array<string>>} buttons - Массив массивов с текстом кнопок
 * @param {Object} options - Дополнительные опции
 * @returns {Object} - Объект с клавиатурой
 */
function createKeyboard(buttons, options = {}) {
  return Markup.keyboard(buttons)
    .resize(options.resize !== false)
    .oneTime(options.oneTime === true)
    .selective(options.selective === true)
    .extra();
}

/**
 * Создает инлайн-клавиатуру с кнопками для Telegram-бота
 * @param {Array<Array<Object>>} buttons - Массив массивов с объектами кнопок
 * @returns {Object} - Объект с инлайн-клавиатурой
 */
function createInlineKeyboard(buttons) {
  return Markup.inlineKeyboard(buttons).extra();
}

/**
 * Создает кнопку "Назад" для возврата в предыдущее меню
 * @param {string} backText - Текст кнопки "Назад"
 * @returns {Array<Array<string>>} - Массив с кнопкой "Назад"
 */
function createBackButton(backText = 'Назад') {
  return [[backText]];
}

/**
 * Создает кнопки "Подтвердить" и "Отмена"
 * @param {string} confirmText - Текст кнопки "Подтвердить"
 * @param {string} cancelText - Текст кнопки "Отмена"
 * @returns {Array<Array<string>>} - Массив с кнопками
 */
function createConfirmButtons(confirmText = 'Подтвердить', cancelText = 'Отмена') {
  return [[confirmText, cancelText]];
}

/**
 * Форматирует дату в читаемый формат
 * @param {Date} date - Дата для форматирования
 * @returns {string} - Отформатированная дата
 */
function formatDate(date) {
  if (!date) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return \`\${day}.\${month}.\${year} \${hours}:\${minutes}\`;
}

/**
 * Форматирует число с разделителями тысяч
 * @param {number} number - Число для форматирования
 * @returns {string} - Отформатированное число
 */
function formatNumber(number) {
  return number.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, " ");
}

/**
 * Проверяет, является ли строка числом
 * @param {string} str - Строка для проверки
 * @returns {boolean} - true, если строка является числом, иначе false
 */
function isNumeric(str) {
  if (typeof str !== 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * Обрезает текст до указанной длины
 * @param {string} text - Текст для обрезки
 * @param {number} maxLength - Максимальная длина
 * @returns {string} - Обрезанный текст
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Создает уникальный идентификатор
 * @returns {string} - Уникальный идентификатор
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Преобразует объект в строку для отладки
 * @param {Object} obj - Объект для преобразования
 * @returns {string} - Строковое представление объекта
 */
function debugObject(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Создает кнопки с датами для выбора
 * @param {number} daysAhead - Количество дней вперед
 * @returns {Array<Array<string>>} - Массив с кнопками дат
 */
function createDateButtons(daysAhead = 7) {
  const buttons = [];
  const today = new Date();
  
  const row = ['Сегодня', 'Завтра'];
  buttons.push(row);
  
  for (let i = 2; i < daysAhead; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    if (i % 2 === 0) {
      buttons.push([\`\${day}.\${month}\`]);
    } else {
      buttons[buttons.length - 1].push(\`\${day}.\${month}\`);
    }
  }
  
  buttons.push(['Отмена']);
  
  return buttons;
}

/**
 * Создает кнопки с часами для выбора
 * @returns {Array<Array<string>>} - Массив с кнопками часов
 */
function createTimeButtons() {
  const buttons = [];
  
  for (let i = 8; i <= 20; i += 2) {
    const row = [];
    row.push(\`\${i}:00\`);
    row.push(\`\${i}:30\`);
    buttons.push(row);
  }
  
  buttons.push(['Отмена']);
  
  return buttons;
}

module.exports = {
  createKeyboard,
  createInlineKeyboard,
  createBackButton,
  createConfirmButtons,
  formatDate,
  formatNumber,
  isNumeric,
  truncateText,
  generateUniqueId,
  debugObject,
  createDateButtons,
  createTimeButtons
};`;
    
    fs.writeFileSync(fsmHelpersPath, fsmHelpersContent);
    log(`Файл ${fsmHelpersPath} успешно создан`, 'success');
  }
  
  log('Файлы FSM-сценариев успешно исправлены', 'success');
  return true;
}
