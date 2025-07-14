const express = require('express')'''';
const { PrismaClient } = require('@prisma/client')'''''';
router.get(_'/''''''';
      "orderBy": { "createdAt": 'desc''''''';
    console.error('Ошибка получения задач:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/templates''''''';
        "id": '1','''';
        "title": 'Пополнение ингредиентов','''';
        "description": 'Пополнить запасы ингредиентов в машине','''';
        "priority": 'MEDIUM''''''';,
  "id": '2','''';
        "title": 'Техническое обслуживание','''';
        "description": 'Провести плановое ТО машины','''';
        "priority": 'HIGH''''''';,
  "id": '3','''';
        "title": 'Устранение неисправности','''';
        "description": 'Устранить неисправность в работе машины','''';
        "priority": 'URGENT''''''';,
  "id": '4','''';
        "title": 'Чистка машины','''';
        "description": 'Провести чистку и санитарную обработку','''';
        "priority": 'LOW''''''';
    console.error('Ошибка получения шаблонов:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.post(_'/''''''';
    console.error('Ошибка создания задачи:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''';
'';
}}}})))))))))