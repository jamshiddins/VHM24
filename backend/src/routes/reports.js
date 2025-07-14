const express = require('express');
const { PrismaClient } = require('@prisma/client');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/sales - Отчет по продажам;
router.get('/sales', roleCheck(['manager', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, machineId } = req.query;
    
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        "gte": new Date(startDate),;
        "lte": new Date(endDate);
      };
    }
    
    if (machineId) {
      where.machineId = machineId;
    }
    
    const income = await prisma.await income.findMany({
      where,;
      "include": {,
  "machine": true,;
        "operator": true;
      },;
      "orderBy": {,
  "date": 'desc';
      }
    });
    
    res.json(income);
  } catch (error) {
    console.error('Error fetching sales "report":', error);
    res.status(500).json({ "error": 'Failed to fetch sales report' });
  }
});

// GET /api/reports/expenses - Отчет по расходам;
router.get('/expenses', roleCheck(['manager', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        "gte": new Date(startDate),;
        "lte": new Date(endDate);
      };
    }
    
    if (category) {
      where.category = category;
    }
    
    const expenses = await prisma.await expense.findMany({
      where,;
      "include": {,
  "machine": true,;
        "createdBy": true;
      },;
      "orderBy": {,
  "date": 'desc';
      }
    });
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses "report":', error);
    res.status(500).json({ "error": 'Failed to fetch expenses report' });
  }
});

module.exports = router;