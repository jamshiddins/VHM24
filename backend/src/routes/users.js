const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /users - Получить всех пользователей
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// GET /users/:id - Получить пользователя по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Ошибка получения пользователя' });
    }
});

// POST /users - Создать пользователя
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { telegramId, name, phone, role } = req.body;
        
        const user = await prisma.user.create({
            data: {
                telegramId,
                name,
                phone,
                role: role || 'OPERATOR'
            }
        });
        
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
});

// PUT /users/:id - Обновить пользователя
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
});

module.exports = router;
