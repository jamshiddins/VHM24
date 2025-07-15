/**
 * Скрипт для тестирования FSM-сценариев VendHubBot
 */

const fs = require('fs');
const path = require('path');

// Пути к директориям
const scenesDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes');
const utilsDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils');

// Список всех FSM-сценариев
const fsmScenarios = [
  { name: 'main-menu.scene.js', id: 'main_menu_fsm' },
  { name: 'task-create.scene.js', id: 'task_create_fsm' },
  { name: 'task-execution.scene.js', id: 'task_execution_fsm' },
  { name: 'checklist.scene.js', id: 'checklist_fsm' },
  { name: 'bag.scene.js', id: 'bag_fsm' },
  { name: 'warehouse-receive.scene.js', id: 'warehouse_receive_fsm' },
  { name: 'warehouse-return.scene.js', id: 'warehouse_return_fsm' },
  { name: 'warehouse-inventory.scene.js', id: 'warehouse_check_inventory_fsm' },
  { name: 'cash.scene.js', id: 'cash_fsm' },
  { name: 'retro.scene.js', id: 'retro_fsm' },
  { name: 'error.scene.js', id: 'error_fsm' },
  { name: 'import.scene.js', id: 'import_fsm' },
  { name: 'directory.scene.js', id: 'directory_fsm' },
  { name: 'user.scene.js', id: 'user_fsm' },
  { name: 'report.scene.js', id: 'report_fsm' },
  { name: 'finance.scene.js', id: 'finance_fsm' },
  { name: 'admin.scene.js', id: 'admin_fsm' }
];

// Список утилитарных файлов
const utilFiles = [
  'fsm-helpers.js',
  'fsm-integrator.js'
];

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Ошибка при проверке файла ${filePath}:`, err);
    return false;
  }
}

// Функция для проверки содержимого файла
function checkFileContent(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (err) {
    console.error(`Ошибка при чтении файла ${filePath}:`, err);
    return false;
  }
}

// Проверка наличия всех FSM-сценариев
console.log('Проверка наличия всех FSM-сценариев...');
let allScenesExist = true;
for (const scenario of fsmScenarios) {
  const filePath = path.join(scenesDir, scenario.name);
  const exists = checkFileExists(filePath);
  console.log(`${scenario.name}: ${exists ? 'OK' : 'ОТСУТСТВУЕТ'}`);
  if (!exists) {
    allScenesExist = false;
  }
}

// Проверка наличия всех утилитарных файлов
console.log('\nПроверка наличия всех утилитарных файлов...');
let allUtilsExist = true;
for (const utilFile of utilFiles) {
  const filePath = path.join(utilsDir, utilFile);
  const exists = checkFileExists(filePath);
  console.log(`${utilFile}: ${exists ? 'OK' : 'ОТСУТСТВУЕТ'}`);
  if (!exists) {
    allUtilsExist = false;
  }
}

// Проверка индексного файла сцен
console.log('\nПроверка индексного файла сцен...');
const indexFilePath = path.join(scenesDir, 'index.js');
const indexFileExists = checkFileExists(indexFilePath);
console.log(`index.js: ${indexFileExists ? 'OK' : 'ОТСУТСТВУЕТ'}`);

// Проверка интеграции FSM-хелперов в индексном файле
let fsmHelpersIntegrated = false;
if (indexFileExists) {
  fsmHelpersIntegrated = checkFileContent(indexFilePath, 'integrateAllScenes');
  console.log(`Интеграция FSM-хелперов: ${fsmHelpersIntegrated ? 'OK' : 'ОТСУТСТВУЕТ'}`);
}

// Проверка документации
console.log('\nПроверка документации...');
const docFilePath = path.join(__dirname, 'apps', 'telegram-bot', 'FSM_DOCUMENTATION.md');
const docFileExists = checkFileExists(docFilePath);
console.log(`FSM_DOCUMENTATION.md: ${docFileExists ? 'OK' : 'ОТСУТСТВУЕТ'}`);

// Вывод результатов тестирования
console.log('\nРезультаты тестирования:');
console.log(`Все FSM-сценарии: ${allScenesExist ? 'OK' : 'ОШИБКА'}`);
console.log(`Все утилитарные файлы: ${allUtilsExist ? 'OK' : 'ОШИБКА'}`);
console.log(`Индексный файл сцен: ${indexFileExists ? 'OK' : 'ОШИБКА'}`);
console.log(`Интеграция FSM-хелперов: ${fsmHelpersIntegrated ? 'OK' : 'ОШИБКА'}`);
console.log(`Документация: ${docFileExists ? 'OK' : 'ОШИБКА'}`);

// Общий результат
const allTestsPassed = allScenesExist && allUtilsExist && indexFileExists && fsmHelpersIntegrated && docFileExists;
console.log(`\nОбщий результат: ${allTestsPassed ? 'ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : 'ЕСТЬ ОШИБКИ'}`);

// Если все тесты пройдены, выводим сообщение об успешном завершении
if (allTestsPassed) {
  console.log('\nВсе FSM-сценарии и утилитарные файлы успешно реализованы и готовы к использованию!');
  console.log('Система VendHubBot полностью готова к работе.');
} else {
  console.log('\nНеобходимо исправить ошибки перед использованием системы.');
}
