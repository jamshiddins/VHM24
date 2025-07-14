const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /electricity_meters - Получить все записи
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.electricity_meter.findMany({
            include: {
                // Добавить связи при необходимости
            }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching electricity_meters:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// GET /electricity_meters/:id - Получить запись по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await prisma.electricity_meter.findUnique({
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
        console.error('Error fetching electricity_meter:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /electricity_meters - Создать новую запись
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.electricity_meter.create({
            data: req.body
        });
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating electricity_meter:', error);
        res.status(500).json({ error: 'Ошибка создания записи' });
    }
});

// PUT /electricity_meters/:id - Обновить запись
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.electricity_meter.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(item);
    } catch (error) {
        console.error('Error updating electricity_meter:', error);
        res.status(500).json({ error: 'Ошибка обновления записи' });
    }
});

// DELETE /electricity_meters/:id - Удалить запись
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        await prisma.electricity_meter.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting electricity_meter:', error);
        res.status(500).json({ error: 'Ошибка удаления записи' });
    }
});

module.exports = router;
