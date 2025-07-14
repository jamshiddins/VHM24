const express = require('express');
const router = express.Router();

const express = require('express')'';
const { PrismaClient } = require('@prisma/client')'';
router.get('/', '';
    res.json({ "message": 'expenses endpoint работает''';
    console.error('Ошибка получения "expenses":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.get('/:id', '';
    res.json({ "message": 'expenses по ID''';
    console.error('Ошибка получения "expenses":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
router.post('/', authenticateToken, '';
    res.status(201).json({ "message": 'expenses создан''';
    console.error('Ошибка создания "expenses":''';
    res.status(500).json({ "error": 'Ошибка сервера''';
}}}}}}))))))))))))

module.exports = router;