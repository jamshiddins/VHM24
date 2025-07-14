const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /spare_parts - Получить все записи
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.spare_part.findMany({
            include: {
                // Добавить связи при необходимости
            }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching spare_parts:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// GET /spare_parts/:id - Получить запись по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await prisma.spare_part.findUnique({
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
        console.error('Error fetching spare_part:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /spare_parts - Создать новую запись
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.spare_part.create({
            data: req.body
        });
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating spare_part:', error);
        res.status(500).json({ error: 'Ошибка создания записи' });
    }
});

// PUT /spare_parts/:id - Обновить запись
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.spare_part.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(item);
    } catch (error) {
        console.error('Error updating spare_part:', error);
        res.status(500).json({ error: 'Ошибка обновления записи' });
    }
});

// DELETE /spare_parts/:id - Удалить запись
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        await prisma.spare_part.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting spare_part:', error);
        res.status(500).json({ error: 'Ошибка удаления записи' });
    }
});

module.exports = router;
