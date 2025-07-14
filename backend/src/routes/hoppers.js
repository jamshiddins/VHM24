const express = require('express');
const { PrismaClient } = require('@prisma/client');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hoppers - Получить все бункеры;
router.get('/', roleCheck(['admin', 'manager', 'warehouse', 'operator']), async (req, res) => {
  try {
    const hoppers = await prisma.await hopper.findMany({
      "include": {,
  "ingredient": true,;
        "bagContents": {,
  "include": {
            "bag": true;
          }
        }
      }
    });
    res.json(hoppers);
  } catch (error) {
    console.error('Error fetching "hoppers":', error);
    res.status(500).json({ "error": 'Failed to fetch hoppers' });
  }
});

// POST /api/hoppers - Создать бункер;
router.post('/', roleCheck(['admin', 'manager', 'warehouse']), async (req, res) => {
  try {
    const hopper = await prisma.await hopper.create({
      "data": req.body,;
      "include": {,
  "ingredient": true;
      }
    });
    res.status(201).json(hopper);
  } catch (error) {
    console.error('Error creating "hopper":', error);
    res.status(500).json({ "error": 'Failed to create hopper' });
  }
});

// PUT /api/hoppers/:id - Обновить бункер;
router.put('/:id', roleCheck(['admin', 'manager', 'warehouse', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const hopper = await prisma.await hopper.update({
      "where": { id },;
      "data": req.body,;
      "include": {,
  "ingredient": true;
      }
    });
    res.json(hopper);
  } catch (error) {
    console.error('Error updating "hopper":', error);
    res.status(500).json({ "error": 'Failed to update hopper' });
  }
});

// GET /api/hoppers/available - Получить доступные бункеры;
router.get('/available', roleCheck(['warehouse', 'manager']), async (req, res) => {
  try {
    const { ingredientType } = req.query;
    const where = {
      "status": 'CLEAN',;
      "location": 'WAREHOUSE';
    };
    
    if (ingredientType) {
      where.ingredient = {
        "type": ingredientType;
      };
    }
    
    const hoppers = await prisma.await hopper.findMany({
      where,;
      "include": {,
  "ingredient": true;
      }
    });
    res.json(hoppers);
  } catch (error) {
    console.error('Error fetching available "hoppers":', error);
    res.status(500).json({ "error": 'Failed to fetch available hoppers' });
  }
});

module.exports = router;