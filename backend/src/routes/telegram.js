const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware для проверки Telegram Bot токена
const verifyTelegramBot = (req, res, next) => {
  const botToken = req.headers['x-telegram-bot-token'];
  if (botToken !== process.env.TELEGRAM_BOT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized bot access' });
  }
  next();
};

// Получить пользователя по Telegram ID
router.get('/user/:telegramId', verifyTelegramBot, async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        phoneNumber: true,
        telegramId: true,
        telegramUsername: true,
        isActive: true,
        registrationStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user by telegram ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Регистрация пользователя через Telegram
router.post('/register', verifyTelegramBot, async (req, res) => {
  try {
    const { 
      telegramId, 
      telegramUsername, 
      name, 
      email, 
      phoneNumber,
      roles 
    } = req.body;

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Определение ролей и статуса на основе ADMIN_IDS
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    const isAdmin = adminIds.includes(telegramId.toString());
    
    let userRoles, isActive, registrationStatus;
    
    if (isAdmin) {
      // Администратор получает все роли и автоматическое одобрение
      userRoles = ['ADMIN', 'MANAGER', 'WAREHOUSE', 'OPERATOR', 'TECHNICIAN'];
      isActive = true;
      registrationStatus = 'APPROVED';
    } else {
      // Обычные пользователи получают базовую роль и требуют одобрения
      userRoles = roles || ['OPERATOR'];
      isActive = false; // Требует одобрения администратора
      registrationStatus = 'PENDING';
    }

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        telegramId: telegramId.toString(),
        telegramUsername,
        name,
        email: email || `user${telegramId}@vhm24.local`,
        phoneNumber,
        roles: userRoles,
        passwordHash: '', // Пароль не нужен для Telegram пользователей
        isActive,
        registrationStatus
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        roles: user.roles,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    console.error('Error registering telegram user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Авторизация для Telegram пользователя
router.post('/auth', verifyTelegramBot, async (req, res) => {
  try {
    const { telegramId } = req.body;

    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id, 
        roles: user.roles,
        telegramId: user.telegramId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        roles: user.roles,
        telegramId: user.telegramId
      }
    });
  } catch (error) {
    console.error('Error authenticating telegram user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить список автоматов для оператора
router.get('/machines', verifyTelegramBot, async (req, res) => {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        location: true,
        inventory: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(machines);
  } catch (error) {
    console.error('Error getting machines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить задачи для пользователя
router.get('/tasks/:telegramId', verifyTelegramBot, async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получить задачи
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedToId: user.id },
          { createdById: user.id }
        ]
      },
      include: {
        machine: {
          include: {
            location: true
          }
        },
        assignedTo: {
          select: {
            name: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать новую задачу
router.post('/tasks', verifyTelegramBot, async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'MEDIUM',
      machineId,
      assignedToTelegramId,
      createdByTelegramId,
      dueDate
    } = req.body;

    // Найти создателя задачи
    const createdBy = await prisma.user.findUnique({
      where: { telegramId: createdByTelegramId.toString() }
    });

    if (!createdBy) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Найти исполнителя (если указан)
    let assignedTo = null;
    if (assignedToTelegramId) {
      assignedTo = await prisma.user.findUnique({
        where: { telegramId: assignedToTelegramId.toString() }
      });
    }

    // Создать задачу
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        machineId,
        assignedToId: assignedTo?.id,
        createdById: createdBy.id,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        machine: {
          include: {
            location: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            telegramId: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить статус задачи
router.patch('/tasks/:taskId/status', verifyTelegramBot, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, telegramId, comment } = req.body;

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновить задачу
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        machine: {
          include: {
            location: true
          }
        }
      }
    });

    // Добавить действие к задаче
    if (comment) {
      await prisma.taskAction.create({
        data: {
          taskId,
          userId: user.id,
          action: `Status changed to ${status}`,
          comment
        }
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить товары для склада
router.get('/inventory', verifyTelegramBot, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(items);
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать движение товара (приход/расход)
router.post('/stock-movement', verifyTelegramBot, async (req, res) => {
  try {
    const {
      itemId,
      telegramId,
      type, // 'IN', 'OUT', 'ADJUSTMENT'
      quantity,
      reason,
      machineId,
      photos = [],
      eventTime
    } = req.body;

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Найти товар
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Рассчитать новое количество
    const quantityBefore = item.quantity;
    let quantityAfter = quantityBefore;

    switch (type) {
      case 'IN':
        quantityAfter = quantityBefore + quantity;
        break;
      case 'OUT':
        quantityAfter = quantityBefore - quantity;
        break;
      case 'ADJUSTMENT':
        quantityAfter = quantity;
        break;
    }

    // Создать движение товара
    const movement = await prisma.stockMovement.create({
      data: {
        itemId,
        userId: user.id,
        type,
        quantity,
        quantityBefore,
        quantityAfter,
        reason,
        machineId,
        photos,
        eventTime: eventTime ? new Date(eventTime) : new Date()
      },
      include: {
        item: true,
        user: {
          select: {
            name: true
          }
        },
        machine: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    // Обновить количество товара
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantity: quantityAfter,
        lastUpdated: new Date()
      }
    });

    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получить бункеры автомата
router.get('/machines/:machineId/bunkers', verifyTelegramBot, async (req, res) => {
  try {
    const { machineId } = req.params;

    const bunkers = await prisma.bunker.findMany({
      where: { machineId },
      include: {
        item: true,
        machine: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(bunkers);
  } catch (error) {
    console.error('Error getting bunkers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать операцию с бункером
router.post('/bunker-operation', verifyTelegramBot, async (req, res) => {
  try {
    const {
      bunkerId,
      telegramId,
      type, // 'FILL', 'EMPTY', 'CLEAN', 'MAINTENANCE', 'INSPECTION'
      description,
      quantity,
      photos = [],
      eventTime
    } = req.body;

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Создать операцию
    const operation = await prisma.bunkerOperation.create({
      data: {
        bunkerId,
        userId: user.id,
        type,
        description,
        quantity,
        photos,
        eventTime: eventTime ? new Date(eventTime) : new Date()
      },
      include: {
        bunker: {
          include: {
            machine: {
              select: {
                name: true,
                code: true
              }
            },
            item: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Обновить статус бункера если нужно
    if (type === 'FILL') {
      await prisma.bunker.update({
        where: { id: bunkerId },
        data: {
          status: 'FULL',
          currentLevel: quantity || 100,
          lastFilled: new Date()
        }
      });
    } else if (type === 'EMPTY') {
      await prisma.bunker.update({
        where: { id: bunkerId },
        data: {
          status: 'EMPTY',
          currentLevel: 0
        }
      });
    } else if (type === 'CLEAN') {
      await prisma.bunker.update({
        where: { id: bunkerId },
        data: {
          lastCleaned: new Date()
        }
      });
    }

    res.status(201).json(operation);
  } catch (error) {
    console.error('Error creating bunker operation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удалить пользователя (только для администраторов)
router.delete('/user/:telegramId', verifyTelegramBot, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { adminTelegramId } = req.body;

    // Проверить, что запрос от администратора
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    if (!adminIds.includes(adminTelegramId.toString())) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Удалить пользователя
    const deletedUser = await prisma.user.delete({
      where: { telegramId: telegramId.toString() }
    });

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser.id,
        name: deletedUser.name,
        telegramId: deletedUser.telegramId
      }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
