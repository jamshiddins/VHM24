const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все задачи
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        machine: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить шаблоны задач
router.get('/templates', async (req, res) => {
  try {
    // Возвращаем предопределенные шаблоны задач
    const templates = [
      {
        id: '1',
        title: 'Пополнение ингредиентов',
        description: 'Пополнить запасы ингредиентов в машине',
        priority: 'MEDIUM'
      },
      {
        id: '2',
        title: 'Техническое обслуживание',
        description: 'Провести плановое ТО машины',
        priority: 'HIGH'
      },
      {
        id: '3',
        title: 'Устранение неисправности',
        description: 'Устранить неисправность в работе машины',
        priority: 'URGENT'
      },
      {
        id: '4',
        title: 'Чистка машины',
        description: 'Провести чистку и санитарную обработку',
        priority: 'LOW'
      }
    ];
    res.json(templates);
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать задачу
router.post('/', async (req, res) => {
  try {
    const task = await prisma.task.create({
      data: req.body,
      include: {
        assignedTo: true,
        createdBy: true,
        machine: true
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Ошибка создания задачи:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
