/**
 * Скрипт для тестирования FSM-сценариев
 */

const fs = require('fs');
const path = require('path');

// Пути к директориям
const scenesDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes');
const utilsDir = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils');
const docsPath = path.join(__dirname, 'apps', 'telegram-bot', 'FSM_DOCUMENTATION.md');

// Список ожидаемых FSM-сценариев
const expectedScenes = [
  'main-menu.scene.js',
  'task-create.scene.js',
  'task-execution.scene.js',
  'checklist.scene.js',
  'bag.scene.js',
  'warehouse-receive.scene.js',
  'warehouse-return.scene.js',
  'warehouse-inventory.scene.js',
  'cash.scene.js',
  'retro.scene.js',
  'error.scene.js',
  'import.scene.js',
  'directory.scene.js',
  'user.scene.js',
  'report.scene.js',
  'finance.scene.js',
  'admin.scene.js'
];

// Список ожидаемых утилитарных файлов
const expectedUtils = [
  'fsm-helpers.js',
  'fsm-integrator.js'
];

// Функция для проверки наличия файлов
function checkFilesExist(dir, files, prefix = '') {
  const existingFiles = fs.readdirSync(dir);
  const missingFiles = files.filter(file => !existingFiles.includes(file));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Отсутствуют следующие ${prefix}файлы:`);
    missingFiles.forEach(file => console.error(`   - ${file}`));
    return false;
  }
  
  return true;
}

// Функция для проверки содержимого файла
function checkFileContent(filePath, patterns) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл ${filePath} не существует`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      console.error(`❌ Файл ${filePath} не содержит "${pattern}"`);
      return false;
    }
  }
  
  return true;
}

// Функция для проверки индексного файла сцен
function checkScenesIndex() {
  const indexPath = path.join(scenesDir, 'index.js');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Индексный файл сцен не существует');
    return false;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Проверяем, что индексный файл экспортирует все сцены
  for (const scene of expectedScenes) {
    const sceneName = scene.replace('.scene.js', '');
    if (!content.includes(`require('./${sceneName}.scene')`)) {
      console.error(`❌ Индексный файл сцен не импортирует "${sceneName}.scene.js"`);
      return false;
    }
  }
  
  // Проверяем, что индексный файл экспортирует массив allScenes
  if (!content.includes('const allScenes = [')) {
    console.error('❌ Индексный файл сцен не экспортирует массив allScenes');
    return false;
  }
  
  return true;
}

// Функция для проверки интеграции FSM-хелперов
function checkFsmIntegration() {
  const integratorPath = path.join(utilsDir, 'fsm-integrator.js');
  const helpersPath = path.join(utilsDir, 'fsm-helpers.js');
  
  if (!fs.existsSync(integratorPath) || !fs.existsSync(helpersPath)) {
    console.error('❌ Файлы FSM-хелперов или интегратора не существуют');
    return false;
  }
  
  const integratorContent = fs.readFileSync(integratorPath, 'utf8');
  const helpersContent = fs.readFileSync(helpersPath, 'utf8');
  
  // Проверяем, что интегратор импортирует хелперы
  if (!integratorContent.includes('require(\'./fsm-helpers\')')) {
    console.error('❌ Интегратор не импортирует FSM-хелперы');
    return false;
  }
  
  // Проверяем, что хелперы экспортируют необходимые функции
  const requiredHelpers = [
    'text_input',
    'num_input',
    'select',
    'media_upload',
    'confirm',
    'submit',
    'redirect'
  ];
  
  for (const helper of requiredHelpers) {
    if (!helpersContent.includes(helper)) {
      console.error(`❌ FSM-хелперы не содержат функцию "${helper}"`);
      return false;
    }
  }
  
  return true;
}

// Функция для проверки документации
function checkDocumentation() {
  if (!fs.existsSync(docsPath)) {
    console.error('❌ Файл документации не существует');
    return false;
  }
  
  const content = fs.readFileSync(docsPath, 'utf8');
  
  // Проверяем, что документация содержит описание всех FSM-сценариев
  const fsmNames = [
    'main_menu_fsm',
    'task_create_fsm',
    'task_execution_fsm',
    'checklist_fsm',
    'bag_fsm',
    'warehouse_receive_fsm',
    'warehouse_return_fsm',
    'warehouse_check_inventory_fsm',
    'cash_fsm',
    'retro_fsm',
    'error_fsm',
    'import_fsm',
    'directory_fsm',
    'user_fsm',
    'report_fsm',
    'finance_fsm',
    'admin_fsm'
  ];
  
  for (const fsm of fsmNames) {
    if (!content.includes(fsm)) {
      console.error(`❌ Документация не содержит описание FSM-сценария "${fsm}"`);
      return false;
    }
  }
  
  return true;
}

// Запуск проверок
console.log('Проверка наличия всех FSM-сценариев...');
const scenesExist = checkFilesExist(scenesDir, expectedScenes, 'FSM-сценарии');
console.log(scenesExist ? 'Все FSM-сценарии: OK' : 'Проверка FSM-сценариев: FAILED');

console.log('\nПроверка наличия всех утилитарных файлов...');
const utilsExist = checkFilesExist(utilsDir, expectedUtils, 'утилитарные');
console.log(utilsExist ? 'Все утилитарные файлы: OK' : 'Проверка утилитарных файлов: FAILED');

console.log('\nПроверка индексного файла сцен...');
const indexOk = checkScenesIndex();
console.log(indexOk ? 'Индексный файл сцен: OK' : 'Проверка индексного файла сцен: FAILED');

console.log('\nПроверка интеграции FSM-хелперов...');
const integrationOk = checkFsmIntegration();
console.log(integrationOk ? 'Интеграция FSM-хелперов: OK' : 'Проверка интеграции FSM-хелперов: FAILED');

console.log('\nПроверка документации...');
const docsOk = checkDocumentation();
console.log(docsOk ? 'Документация: OK' : 'Проверка документации: FAILED');

console.log('\nОбщий результат:');
if (scenesExist && utilsExist && indexOk && integrationOk && docsOk) {
  console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ');
} else {
  console.log('❌ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
}
