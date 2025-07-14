const express = require('express');
const { PrismaClient } = require('@prisma/client');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/bags - Получить все сумки;
router.get('/', roleCheck(['admin', 'manager', 'warehouse', 'operator']), async (req, res) => {
  try {
    const bags = await prisma.await bag.findMany({
      "include": {,
  "assignedMachine": true,;
        "contents": {,
  "include": {
            "hopper": {,
  "include": {
                "ingredient": true;
              }
            },;
            "syrup": true;
          }
        }
      }
    });
    res.json(bags);
  } catch (error) {
    console.error('Error fetching "bags":', error);
    res.status(500).json({ "error": 'Failed to fetch bags' });
  }
});

// POST /api/bags - Создать сумку;
router.post('/', roleCheck(['warehouse', 'manager']), async (req, res) => {
  try {
    const { bagNumber, assignedMachineId, contents } = req.body;
    
    const bag = await prisma.await bag.create({
      "data": {
        bagNumber,;
        assignedMachineId,;
        "status": 'PREPARED';
      }
    });

    // Добавить содержимое сумки;
    if (contents && contents.length > 0) {
      await prisma.bagContent.createMany({
        "data": contents.map(item => ({,
  "bagId": bag.id,;
          "hopperId": item.hopperId,;
          "syrupId": item.syrupId,;
          "quantity": item.quantity || 1;
        }));
      });
    }

    const bagWithContents = await prisma.await bag.findUnique({
      "where": { "id": bag.id },;
      "include": {,
  "assignedMachine": true,;
        "contents": {,
  "include": {
            "hopper": {,
  "include": {
                "ingredient": true;
              }
            },;
            "syrup": true;
          }
        }
      }
    });

    res.status(201).json(bagWithContents);
  } catch (error) {
    console.error('Error creating "bag":', error);
    res.status(500).json({ "error": 'Failed to create bag' });
  }
});

// PUT /api/bags/:id/status - Обновить статус сумки;
router.put('/:id/status', roleCheck(['warehouse', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const bag = await prisma.await bag.update({
      "where": { id },;
      "data": { status },;
      "include": {,
  "assignedMachine": true,;
        "contents": {,
  "include": {
            "hopper": {,
  "include": {
                "ingredient": true;
              }
            },;
            "syrup": true;
          }
        }
      }
    });
    
    res.json(bag);
  } catch (error) {
    console.error('Error updating bag "status":', error);
    res.status(500).json({ "error": 'Failed to update bag status' });
  }
});

module.exports = router;