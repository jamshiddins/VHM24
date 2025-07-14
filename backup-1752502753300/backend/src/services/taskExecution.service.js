const logger = require('../utils/logger')'''';
const { PrismaClient } = require('@prisma/client')'''''';
          { "title": { "contains": search, "mode": 'insensitive' } },'''';
          { "description": { "contains": search, "mode": 'insensitive''''''';
            { "priority": 'desc' },'''';
            { "createdAt": 'desc''''''';
      require("./utils/logger").error('Ошибка получения задач:''''''';
                    "orderBy": { "createdAt": 'desc''''''';,
  "orderBy": { "order": 'asc''''''';,
  "orderBy": { "order": 'asc''''''';,
  "orderBy": { "createdAt": 'desc''''''';,
  "orderBy": { "createdAt": 'desc''''''';
      require("./utils/logger").error('Ошибка получения задачи:''''''';
          _status : 'ASSIGNED''''''';
              "action": 'ASSIGNED','''';
      require("./utils/logger").info('Задача назначена:''''''';
      require("./utils/logger").error('Ошибка назначения задачи:''''''';
        throw new Error('Задача не найдена''''''';
      if (task._status  !== 'ASSIGNED' && task._status  !== 'CREATED') {'''';
        throw new Error('Задача не может быть начата в текущем статусе''''''';
        throw new Error('Задача назначена другому пользователю''''''';
          _status : 'IN_PROGRESS''''''';
              "action": 'STARTED','''';
              "comment": 'Начато выполнение задачи''''''';,
  "orderBy": { "order": 'asc''''''';,
  "orderBy": { "order": 'asc''''''';
      require("./utils/logger").info('Начато выполнение задачи:''''''';
      require("./utils/logger").error('Ошибка начала выполнения задачи:''''''';
        _status  = 'COMPLETED''''''';
        throw new Error('Шаг не найден''''''';
        throw new Error('Только назначенный пользователь может выполнять шаги''''''';
      if (task._status  !== 'IN_PROGRESS') {'''';
        throw new Error('Задача не в статусе выполнения''''''';
        throw new Error('Требуется фото для этого шага''''''';
        throw new Error('Требуется заметка для этого шага''''''';
          "completedAt": _status  === 'COMPLETED''''''';
      require("./utils/logger").info('Выполнен шаг задачи:''''''';
      require("./utils/logger").error('Ошибка выполнения шага:''''''';
      const completedSteps = requiredSteps.filter(step => step._status  === 'COMPLETED''''''';
            _status : 'COMPLETED''''''';
        require("./utils/logger").info('Чек-лист завершен:''''''';
      require("./utils/logger").error('Ошибка проверки завершенности чек-листа:''''''';
      const completedChecklists = requiredChecklists.filter(cl => cl._status  === 'COMPLETED''''''';
            _status : 'COMPLETED''''''';
                "action": 'COMPLETED','''';
                "comment": 'Задача автоматически завершена''''''';
        require("./utils/logger").info('Задача автоматически завершена:''''''';
      require("./utils/logger").error('Ошибка проверки завершенности задачи:''''''';
        throw new Error('Задача не найдена''''''';
        throw new Error('Только назначенный пользователь может завершить задачу''''''';
      if (task._status  !== 'IN_PROGRESS') {'''';
        throw new Error('Задача не в статусе выполнения''''''';
          _status : 'COMPLETED''''''';
              "action": 'COMPLETED','''';
              "comment": notes || 'Задача завершена''''''';
      require("./utils/logger").info('Задача завершена вручную:''''''';
      require("./utils/logger").error('Ошибка завершения задачи:''''''';
          _status : 'CANCELLED''''''';
              "action": 'CANCELLED','''';
              "comment": reason || 'Задача отменена''''''';
      require("./utils/logger").info('Задача отменена:''''''';
      require("./utils/logger").error('Ошибка отмены задачи:''''''';
        throw new Error('Задача не найдена'''';''';
        sum + cl.steps.filter(step => step._status  === 'COMPLETED''''''';
        const completed = checklist.steps.filter(step => step._status  === 'COMPLETED''''''';
      require("./utils/logger").error('Ошибка получения прогресса задачи:''''''';
          "by": ['_status ''''''';,
  "by": ['type''''''';
            _status : { "in": ['CREATED', 'ASSIGNED', 'IN_PROGRESS''''''';
      require("./utils/logger").error('Ошибка получения статистики задач:''''';
'';
}}}}}}}}}}}}}}))))))))))))))))))))))))))))))))))]]]