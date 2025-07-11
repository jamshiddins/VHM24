const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Получить неполные данные
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.incompleteDataLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.incompleteDataLog.count()
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения неполных данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику неполных данных
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.incompleteDataLog.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalCount = await prisma.incompleteDataLog.count();
    const pendingCount =
      stats.find(s => s.status === 'PENDING')?._count?.status || 0;
    const completedCount =
      stats.find(s => s.status === 'COMPLETED')?._count?.status || 0;

    res.json({
      total: totalCount,
      pending: pendingCount,
      completed: completedCount,
      completionRate:
        totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
