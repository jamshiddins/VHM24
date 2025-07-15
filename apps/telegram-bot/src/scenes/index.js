/**
 * Экспорт всех FSM-сценариев для Telegram бота
 */

// Импорт сцен
const mainMenuScene = require('./main-menu.scene');
const taskCreateScene = require('./task-create.scene');
const taskExecutionScene = require('./task-execution.scene');
const checklistScene = require('./checklist.scene');
const bagScene = require('./bag.scene');
const warehouseReceiveScene = require('./warehouse-receive.scene');
const warehouseReturnScene = require('./warehouse-return.scene');
const warehouseCheckInventoryScene = require('./warehouse-inventory.scene');
const cashScene = require('./cash.scene');
const retroScene = require('./retro.scene');
const errorScene = require('./error.scene');
const importScene = require('./import.scene');
const directoryScene = require('./directory.scene');
const userScene = require('./user.scene');
const reportScene = require('./report.scene');
const financeScene = require('./finance.scene');
const adminScene = require('./admin.scene');

// Импорт интегратора FSM-хелперов
const { integrateAllScenes } = require('../utils/fsm-integrator');

// Массив всех сцен
const allScenes = [
  mainMenuScene,
  taskCreateScene,
  taskExecutionScene,
  checklistScene,
  bagScene,
  warehouseReceiveScene,
  warehouseReturnScene,
  warehouseCheckInventoryScene,
  cashScene,
  retroScene,
  errorScene,
  importScene,
  directoryScene,
  userScene,
  reportScene,
  financeScene,
  adminScene
];

// Интегрируем FSM-хелперы во все сцены
const integratedScenes = integrateAllScenes(allScenes);

// Экспорт всех сцен
module.exports = {
  mainMenuScene,
  taskCreateScene,
  taskExecutionScene,
  checklistScene,
  bagScene,
  warehouseReceiveScene,
  warehouseReturnScene,
  warehouseCheckInventoryScene,
  cashScene,
  retroScene,
  errorScene,
  importScene,
  directoryScene,
  userScene,
  reportScene,
  financeScene,
  adminScene,
  
  // Массив всех сцен для регистрации в боте
  allScenes: integratedScenes
};
