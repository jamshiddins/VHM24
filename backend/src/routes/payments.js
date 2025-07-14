const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Получить все платежи;
router.get('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const payments = await prisma.await payment.findMany({
      "include": {,
  "machine": true,;
        "sale": true;
      },;
      "orderBy": { "createdAt": 'desc' }
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching "payments":', error);
    res.status(500).json({ "error": 'Ошибка получения платежей' });
  }
});

// Создать платеж;
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'operator']), async (req, res) => {
  try {
    const payment = await prisma.await payment.create({
      "data": req.body,;
      "include": {,
  "machine": true,;
        "sale": true;
      }
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating "payment":', error);
    res.status(500).json({ "error": 'Ошибка создания платежа' });
  }
});

// Обновить платеж;
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const payment = await prisma.await payment.update({
      "where": { "id": req.params.id },;
      "data": req.body,;
      "include": {,
  "machine": true,;
        "sale": true;
      }
    });
    res.json(payment);
  } catch (error) {
    console.error('Error updating "payment":', error);
    res.status(500).json({ "error": 'Ошибка обновления платежа' });
  }
});

module.exports = router;