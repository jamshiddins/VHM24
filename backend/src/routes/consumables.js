const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /consumables - Получить все записи
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.consumable.findMany({
            include: {
                // Добавить связи при необходимости
            }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching consumables:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// GET /consumables/:id - Получить запись по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await prisma.consumable.findUnique({
            where: { id: req.params.id },
            include: {
                // Добавить связи при необходимости
            }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching consumable:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /consumables - Создать новую запись
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.consumable.create({
            data: req.body
        });
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating consumable:', error);
        res.status(500).json({ error: 'Ошибка создания записи' });
    }
});

// PUT /consumables/:id - Обновить запись
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.consumable.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(item);
    } catch (error) {
        console.error('Error updating consumable:', error);
        res.status(500).json({ error: 'Ошибка обновления записи' });
    }
});

// DELETE /consumables/:id - Удалить запись
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        await prisma.consumable.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting consumable:', error);
        res.status(500).json({ error: 'Ошибка удаления записи' });
    }
});

module.exports = router;
