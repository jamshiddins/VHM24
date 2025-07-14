const express = require('express')'''';
const { PrismaClient } = require('@prisma/client')'''''';
router.get(_'/''''''';
      _message : 'VHM24 Dashboard API''''''';
        'GET /stats - Статистика','''';
        'GET /activities - Последние активности','''';
        'GET /notifications - Уведомления''''''';
    console.error('Ошибка дашборда:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/stats'''';''';
      "where": { _status : 'ONLINE''''''';,
  "in": ['CREATED', 'ASSIGNED', 'IN_PROGRESS''''''';
    console.error('Ошибка получения статистики:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/activities''''''';
      "orderBy": { "createdAt": 'desc''''''';
    console.error('Ошибка получения активностей:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/notifications''''''';
      "orderBy": { "createdAt": 'desc''''''';
    console.error('Ошибка получения уведомлений:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''';
'';
}}}}}}}))))))))))))]