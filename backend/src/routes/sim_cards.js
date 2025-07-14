const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /sim_cards - Получить все записи
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.sim_card.findMany({
            include: {
                // Добавить связи при необходимости
            }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching sim_cards:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// GET /sim_cards/:id - Получить запись по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await prisma.sim_card.findUnique({
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
        console.error('Error fetching sim_card:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /sim_cards - Создать новую запись
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.sim_card.create({
            data: req.body
        });
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating sim_card:', error);
        res.status(500).json({ error: 'Ошибка создания записи' });
    }
});

// PUT /sim_cards/:id - Обновить запись
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.sim_card.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(item);
    } catch (error) {
        console.error('Error updating sim_card:', error);
        res.status(500).json({ error: 'Ошибка обновления записи' });
    }
});

// DELETE /sim_cards/:id - Удалить запись
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        await prisma.sim_card.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting sim_card:', error);
        res.status(500).json({ error: 'Ошибка удаления записи' });
    }
});

module.exports = router;
