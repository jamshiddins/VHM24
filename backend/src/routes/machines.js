const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все машины
router.get('/', async (req, res) => {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        location: true,
        inventory: {
          include: {
            item: true
          }
        },
        telemetry: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(machines);
  } catch (error) {
    console.error('Ошибка получения машин:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить машину по ID
router.get('/:id', async (req, res) => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: req.params.id },
      include: {
        location: true,
        inventory: {
          include: {
            item: true
          }
        },
        telemetry: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        serviceHistory: {
          orderBy: { performedAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!machine) {
      return res.status(404).json({ error: 'Машина не найдена' });
    }
    
    res.json(machine);
  } catch (error) {
    console.error('Ошибка получения машины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать машину
router.post('/', async (req, res) => {
  try {
    const machine = await prisma.machine.create({
      data: req.body
    });
    res.status(201).json(machine);
  } catch (error) {
    console.error('Ошибка создания машины:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
