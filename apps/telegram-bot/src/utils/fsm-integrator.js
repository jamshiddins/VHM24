/**
 * Интегратор FSM-хелперов в сцены Telegram-бота
 * Этот модуль интегрирует общие FSM-состояния и логику во все FSM-сценарии
 */

const { inputMiddleware } = require('./fsm-helpers');

/**
 * Интегрирует FSM-хелперы в сцену
 * @param {Object} scene - Сцена Telegraf
 * @returns {Object} Сцена с интегрированными FSM-хелперами
 */
function integrateFsmHelpers(scene) {
  // Добавляем middleware для обработки всех типов ввода
  scene.use(inputMiddleware);
  
  return scene;
}

/**
 * Интегрирует FSM-хелперы во все сцены
 * @param {Array} scenes - Массив сцен Telegraf
 * @returns {Array} Массив сцен с интегрированными FSM-хелперами
 */
function integrateAllScenes(scenes) {
  return scenes.map(scene => integrateFsmHelpers(scene));
}

module.exports = {
  integrateFsmHelpers,
  integrateAllScenes
};
