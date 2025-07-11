const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireWarehouse } = require('../middleware/roleCheck');
const { S3Service } = require('../utils/s3');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем изображения и видео
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

// Применяем аутентификацию ко всем routes
router.use(authenticateToken);

// Корневой маршрут склада
router.get('/', async (req, res) => {
  try {
    res.json({
      message: 'VHM24 Warehouse API',
      endpoints: [
        'GET /items - Товары на складе',
        'GET /operations - Операции склада',
        'GET /bunkers - Бункеры',
        'POST /operations - Создать операцию'
      ]
    });
  } catch (error) {
    console.error('Ошибка склада:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все товары на складе
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить операции склада
router.get('/operations', async (req, res) => {
  try {
    const operations = await prisma.stockMovement.findMany({
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        machine: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(operations);
  } catch (error) {
    console.error('Ошибка получения операций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить бункеры
router.get('/bunkers', requireWarehouse(), async (req, res) => {
  try {
    const { machineId, status } = req.query;
    
    const where = {};
    if (machineId) where.machineId = machineId;
    if (status) where.status = status;
    
    const bunkers = await prisma.bunker.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true
          }
        },
        operations: {
          take: 5,
          orderBy: { eventTime: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { machine: { code: 'asc' } },
        { name: 'asc' }
      ]
    });
    
    res.json({
      success: true,
      data: bunkers,
      total: bunkers.length
    });
  } catch (error) {
    logger.error('Ошибка получения бункеров', { error: error.message, userId: req.user.id });
    res.status(500).json({ 
      success: false,
      error: 'Ошибка получения бункеров' 
    });
  }
});

// Создать операцию с бункером
router.post('/bunkers/:bunkerId/operations', requireWarehouse(), upload.array('photos', 5), async (req, res) => {
  try {
    const { bunkerId } = req.params;
    const { type, description, quantity, eventTime } = req.body;
    
    // Валидация данных
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: type, description'
      });
    }
    
    // Проверяем существование бункера
    const bunker = await prisma.bunker.findUnique({
      where: { id: bunkerId },
      include: { machine: true }
    });
    
    if (!bunker) {
      return res.status(404).json({
        success: false,
        error: 'Бункер не найден'
      });
    }
    
    // Загружаем фотографии в S3
    const photoUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const photoUrl = await S3Service.uploadImage(
            file.buffer,
            file.originalname,
            req.user.id,
            'bunker'
          );
          photoUrls.push(photoUrl);
        } catch (uploadError) {
          logger.error('Ошибка загрузки фото', { 
            error: uploadError.message,
            fileName: file.originalname 
          });
        }
      }
    }
    
    // Создаем операцию
    const operation = await prisma.bunkerOperation.create({
      data: {
        bunkerId: bunkerId,
        userId: req.user.id,
        type: type,
        description: description,
        quantity: quantity ? parseFloat(quantity) : null,
        photos: photoUrls,
        eventTime: eventTime ? new Date(eventTime) : new Date(),
        metadata: {
          machineCode: bunker.machine.code,
          machineName: bunker.machine.name,
          bunkerName: bunker.name
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        bunker: {
          include: {
            machine: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Обновляем статус бункера в зависимости от операции
    let newStatus = bunker.status;
    let newLevel = bunker.currentLevel;
    let updateData = {};
    
    switch (type) {
      case 'FILL':
        newStatus = 'FULL';
        newLevel = bunker.capacity;
        updateData = {
          status: newStatus,
          currentLevel: newLevel,
          lastFilled: new Date()
        };
        break;
      case 'EMPTY':
        newStatus = 'EMPTY';
        newLevel = 0;
        updateData = {
          status: newStatus,
          currentLevel: newLevel
        };
        break;
      case 'CLEAN':
        updateData = {
          lastCleaned: new Date()
        };
        break;
      case 'MAINTENANCE':
        newStatus = 'MAINTENANCE';
        updateData = {
          status: newStatus
        };
        break;
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.bunker.update({
        where: { id: bunkerId },
        data: updateData
      });
    }
    
    // Логируем операцию
    await prisma.systemAuditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'BUNKER_OPERATION',
        entityId: operation.id,
        description: `Операция с бункером: ${type}`,
        newValues: {
          type,
          description,
          quantity,
          bunkerName: bunker.name,
          machineCode: bunker.machine.code,
          photosCount: photoUrls.length
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Операция с бункером создана успешно',
      data: operation
    });
    
  } catch (error) {
    logger.error('Ошибка создания операции с бункером', { 
      error: error.message,
      bunkerId: req.params.bunkerId,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      error: 'Ошибка создания операции с бункером'
    });
  }
});

// Получить операции бункера
router.get('/bunkers/:bunkerId/operations', requireWarehouse(), async (req, res) => {
  try {
    const { bunkerId } = req.params;
    const { limit = 50, offset = 0, type } = req.query;
    
    const where = { bunkerId };
    if (type) where.type = type;
    
    const operations = await prisma.bunkerOperation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        bunker: {
          select: {
            name: true,
            machine: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { eventTime: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.bunkerOperation.count({ where });
    
    res.json({
      success: true,
      data: operations,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
    
  } catch (error) {
    logger.error('Ошибка получения операций бункера', { 
      error: error.message,
      bunkerId: req.params.bunkerId,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      error: 'Ошибка получения операций бункера'
    });
  }
});

// Создать операцию движения товара
router.post('/operations', async (req, res) => {
  try {
    const operation = await prisma.stockMovement.create({
      data: req.body
    });
    res.status(201).json(operation);
  } catch (error) {
    console.error('Ошибка создания операции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
