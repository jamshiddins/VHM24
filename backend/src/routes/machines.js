const express = require('express');
const router = express.Router();

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const machines = [
      { 
        id: '1',
        name: 'Coffee Machine #1',
        model: 'CM-2000',
        location: 'Office Floor 1',
        status: 'ACTIVE'
      },
      { 
        id: '2',
        name: 'Snack Machine #1',
        model: 'SM-1500',
        location: 'Office Floor 2',
        status: 'ACTIVE'
      },
      { 
        id: '3',
        name: 'Beverage Machine #1',
        model: 'BM-1000',
        location: 'Lobby',
        status: 'MAINTENANCE'
      }
    ];
    
    res.json(machines);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/machines/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const machine = { 
      id,
      name: `Machine #${id}`,
      model: 'Generic Model',
      location: 'Unknown Location',
      status: 'ACTIVE'
    };
    
    res.json(machine);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/machines
router.post('/', async (req, res) => {
  try {
    const { name, model, location } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Machine name is required' });
    }

    const machine = {
      id: Date.now().toString(),
      name,
      model: model || 'Unknown Model',
      location: location || 'Unknown Location',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ machine, message: 'Machine created successfully' });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;