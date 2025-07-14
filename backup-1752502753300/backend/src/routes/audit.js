const express = require('express')'''';
const { PrismaClient } = require('@prisma/client')'''''';
router.get(_'/''''''';
      _message : 'VHM24 Audit API''''''';
        'GET /logs - Логи аудита','''';
        'GET /stats/activity - Статистика активности''''''';
    console.error('Ошибка аудита:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/logs''''''';
        "orderBy": { "createdAt": 'desc''''''';
    console.error('Ошибка получения логов аудита:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''''';
router.get(_'/stats/activity'''';''';
      "by": ['action''''''';
    console.error('Ошибка получения статистики:''''';
    res.status(500).json({ "error": 'Ошибка сервера''''';
'';
}}}})))))))))]