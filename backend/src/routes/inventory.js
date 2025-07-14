const express = require('express');
const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const inventory = [
      { 
        "id": '1',
        "name": 'Coffee Beans',
        "type": 'ingredient',
        "quantity": 50,
        "unit": 'kg',
        "minStock": 10
      },
      { 
        "id": '2',
        "name": 'Paper Cups',
        "type": 'supply',
        "quantity": 1000,
        "unit": 'pcs',
        "minStock": 100
      }
    ];
    
    res.json({ inventory });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = { 
      id,
      "name": `Item #${id}`,
      "type": 'ingredient',
      "quantity": 100,
      "unit": 'pcs',
      "minStock": 10
    };
    
    res.json({ item });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { name, type = 'ingredient', quantity = 0, unit = 'pcs', minStock = 0 } = req.body;
    
    if (!name) {
      return res.status(400).json({ "error": "Item name is required" });
    }

    const item = {
      "id": Date.now().toString(),
      name,
      type,
      "quantity": parseInt(quantity),
      unit,
      "minStock": parseInt(minStock),
      "createdAt": new Date().toISOString()
    };

    res.status(201).json({ item, "message": 'Inventory item created successfully' });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
