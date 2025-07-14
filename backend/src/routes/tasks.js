const express = require('express');
const router = express.Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const tasks = [
      {
        id: '1',
        title: 'Заправка кофе-машины #1',
        type: 'REFILL',
        status: 'PENDING',
        machineId: '1',
        assignedTo: userId || '123456789',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        description: 'Заправить кофе и молоко'
      },
      {
        id: '2',
        title: 'Техническое обслуживание',
        type: 'MAINTENANCE',
        status: 'IN_PROGRESS',
        machineId: '2',
        assignedTo: userId || '123456789',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        description: 'Проверка и чистка автомата'
      }
    ];
    
    // Фильтруем задачи по пользователю если указан
    const filteredTasks = userId ? 
      tasks.filter(task => task.assignedTo === userId) : 
      tasks;
    
    res.json(filteredTasks);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = {
      id,
      title: `Task #${id}`,
      type: 'GENERAL',
      status: 'PENDING',
      machineId: '1',
      assignedTo: '123456789',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'General task description'
    };
    
    res.json(task);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title, type, machineId, assignedTo, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = {
      id: Date.now().toString(),
      title,
      type: type || 'GENERAL',
      status: 'PENDING',
      machineId,
      assignedTo,
      description,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ task, message: 'Task created successfully' });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;