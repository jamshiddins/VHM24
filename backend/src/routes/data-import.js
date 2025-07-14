/**
 * Маршруты для импорта данных
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middleware для проверки аутентификации
const authenticateToken = (req, res, next) => {
  // В реальном приложении здесь должна быть проверка JWT токена
  // Для тестирования просто пропускаем дальше
  next();
};

/**
 * @route GET /api/data-import
 * @desc Получение списка импортированных данных
 */
router.get('/', async (req, res) => {
  try {
    // В реальном приложении здесь должен быть запрос к базе данных
    // Для тестирования возвращаем моковые данные
    const imports = [
      {
        id: '1',
        filename: 'inventory-2023-01.xlsx',
        status: 'completed',
        recordsCount: 150,
        importedAt: '2023-01-15T10:30:00Z',
        importedBy: 'admin'
      },
      {
        id: '2',
        filename: 'machines-2023-02.xlsx',
        status: 'completed',
        recordsCount: 45,
        importedAt: '2023-02-20T14:15:00Z',
        importedBy: 'manager'
      }
    ];
    
    res.json({ imports });
  } catch (error) {
    console.error('Ошибка получения импортов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * @route GET /api/data-import/:id
 * @desc Получение информации об импорте по ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // В реальном приложении здесь должен быть запрос к базе данных
    // Для тестирования возвращаем моковые данные
    const importData = {
      id,
      filename: `import-${id}.xlsx`,
      status: 'completed',
      recordsCount: 120,
      importedAt: new Date().toISOString(),
      importedBy: 'admin',
      details: {
        successCount: 118,
        errorCount: 2,
        warnings: ['Дублирующиеся записи были пропущены']
      }
    };
    
    res.json({ import: importData });
  } catch (error) {
    console.error('Ошибка получения импорта:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * @route POST /api/data-import
 * @desc Загрузка файла для импорта данных
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const { originalname, mimetype, size, path } = req.file;
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Тип импорта не указан' });
    }
    
    // В реальном приложении здесь должна быть обработка файла
    // Для тестирования возвращаем моковые данные
    const importData = {
      id: Date.now().toString(),
      filename: originalname,
      type,
      status: 'processing',
      size,
      path,
      importedAt: new Date().toISOString(),
      importedBy: req.user?.id || 'anonymous'
    };
    
    res.status(201).json({ import: importData, message: 'Файл успешно загружен и поставлен в очередь на обработку' });
  } catch (error) {
    console.error('Ошибка импорта данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
