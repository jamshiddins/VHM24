const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireRole, authenticateToken } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/routes - Получить все маршруты
router.get('/', authenticateToken, requireRole(['ADMIN', 'MANAGER', 'OPERATOR']), async (req, res) => {
  try {
    const { operatorId, date } = req.query;
    const where = {};
    
    if (operatorId) {
      where.assignedOperatorId = operatorId;
    }
    
    if (date) {
      where.routeDate = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      };
    }
    
    const routes = await prisma.route.findMany({
      where,
      include: {
        assignedOperator: true,
        stops: {
          include: {
            machine: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// POST /api/routes - Создать маршрут
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { routeName, assignedOperatorId, routeDate, machines } = req.body;
    
    const route = await prisma.route.create({
      data: {
        routeName,
        assignedOperatorId,
        routeDate: new Date(routeDate),
        machinesOrder: machines,
        status: 'PLANNED'
      }
    });

    // Создать остановки маршрута
    if (machines && machines.length > 0) {
      await prisma.routeStop.createMany({
        data: machines.map((machineId, index) => ({
          routeId: route.id,
          machineId,
          order: index + 1
        }))
      });
    }

    const routeWithStops = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        assignedOperator: true,
        stops: {
          include: {
            machine: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    res.status(201).json(routeWithStops);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

module.exports = router;
