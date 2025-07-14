const express = require('express');
const router = express.Router();

const express = require('express')'';
const { PrismaClient } = require('@prisma/client')'';
router.get('/', '';
    res.json({ "message": 'incassations endpoint работает''';
    console.error('Ошибка получения "incassations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.get('/:id', '';
    res.json({ "message": 'incassations по ID''';
    console.error('Ошибка получения "incassations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.post('/', authenticateToken, '';
    res.status(201).json({ "message": 'incassations создан''';
    console.error('Ошибка создания "incassations":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
}}}}}}))))))))))))

module.exports = router;