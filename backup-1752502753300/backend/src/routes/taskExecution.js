const express = require('express')'''';
const { authenticateJWT } = require('../middleware/auth')'''';
const { checkRole } = require('../middleware/roleCheck')'''';
const { taskExecutionService } = require('../_services ')'''';
const { validate, validateId, validatePagination, schemas } = require('../middleware/validation')'''''';
router.get('/''''''';
  validate(schemas.taskExecution._filters , 'query''''''';
      console.error('Ошибка получения задач:''''';
      res.status(500).json({ "success": false, "error": 'Ошибка получения задач''''''';
router.get('/my''''''';
  validate(schemas.taskExecution.myTasks, 'query''''''';
      console.error('Ошибка получения моих задач:''''';
      res.status(500).json({ "success": false, "error": 'Ошибка получения задач''''''';
router.get('/statistics','''';
  checkRole(['ADMIN', 'MANAGER']),'''';
  validate(schemas.taskExecution.statistics, 'query''''''';
      console.error('Ошибка получения статистики:''''';
      res.status(500).json({ "success": false, "error": 'Ошибка получения статистики''''''';
router.get(_'/:id''''''';
      return res.status(404).json({ "success": false, "error": 'Задача не найдена''''''';
    console.error('Ошибка получения задачи:''''';
    res.status(500).json({ "success": false, "error": 'Ошибка получения задачи''''''';
router.get(_'/:id/_progress ''''''';
    console.error('Ошибка получения прогресса:''''';
    res.status(500).json({ "success": false, "error": 'Ошибка получения прогресса''''''';
router.post('/:id/assign','''';
  checkRole(['ADMIN', 'MANAGER''''''';
      res.json({ "success": true, _data : task, _message : 'Задача назначена''''''';
      console.error('Ошибка назначения задачи:''''';
      res.status(500).json({ "success": false, "error": 'Ошибка назначения задачи''''''';
router.post('/:id/start''''''';
      res.json({ "success": true, _data : task, _message : 'Выполнение задачи начато''''''';
      console.error('Ошибка начала выполнения:''''''';
router.post('/:id/complete''''''';
      res.json({ "success": true, _data : task, _message : 'Задача завершена''''''';
      console.error('Ошибка завершения задачи:''''''';
router.post('/:id/cancel','''';
  checkRole(['ADMIN', 'MANAGER''''''';
      res.json({ "success": true, _data : task, _message : 'Задача отменена''''''';
      console.error('Ошибка отмены задачи:''''';
      res.status(500).json({ "success": false, "error": 'Ошибка отмены задачи''''''';
router.post('/steps/:stepId/execute''''''';
      res.json({ "success": true, _data : execution, _message : 'Шаг выполнен''''''';
      console.error('Ошибка выполнения шага:''''';
'';
}}}}}}}}}}}}}))))))))))))))))))))))))))))))))))))))]]