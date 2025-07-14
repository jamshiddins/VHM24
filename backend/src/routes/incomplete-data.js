const express = require('express');
const router = express.Router();

const express = require('express')'';
const { PrismaClient } = require('@prisma/client')'';
router.get('/', '';
    res.json({ "message": 'incomplete-data endpoint работает''';
    console.error('Ошибка получения incomplete-"data":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.get('/:id', '';
    res.json({ "message": 'incomplete-data по ID''';
    console.error('Ошибка получения incomplete-"data":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.post('/', authenticateToken, '';
    res.status(201).json({ "message": 'incomplete-data создан''';
    console.error('Ошибка создания incomplete-"data":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
}}}}}}))))))))))))

module.exports = router;