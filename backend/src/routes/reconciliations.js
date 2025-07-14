const express = require('express');
const router = express.Router();

const express = require('express')'';
const { PrismaClient } = require('@prisma/client')'';
router.get('/', '';
    res.json({ "message": 'reconciliations endpoint работает''';
    console.error('Ошибка получения "reconciliations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.get('/:id', '';
    res.json({ "message": 'reconciliations по ID''';
    console.error('Ошибка получения "reconciliations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.post('/', authenticateToken, '';
    res.status(201).json({ "message": 'reconciliations создан''';
    console.error('Ошибка создания "reconciliations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
}}}}}}))))))))))))

module.exports = router;