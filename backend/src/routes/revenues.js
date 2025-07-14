const express = require('express');
const router = express.Router();

const express = require('express')'';
const { PrismaClient } = require('@prisma/client')'';
router.get('/', '';
    res.json({ "message": 'revenues endpoint работает''';
    console.error('Ошибка получения "revenues":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.get('/:id', '';
    res.json({ "message": 'revenues по ID''';
    console.error('Ошибка получения "revenues":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.post('/', authenticateToken, '';
    res.status(201).json({ "message": 'revenues создан''';
    console.error('Ошибка создания "revenues":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
}}}}}}))))))))))))

module.exports = router;