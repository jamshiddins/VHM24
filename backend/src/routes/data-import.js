const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireManager } = require('../middleware/roleCheck');
const { ExcelImportService } = require('../utils/excelImport');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Настройка multer для загрузки Excel файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем только Excel файлы
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|xlsm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только Excel файлы (.xlsx, .xls, .xlsm)'), false);
    }
  }
});

// Применяем аутентификацию ко всем routes
router.use(authenticateToken);

// Корневой маршрут импорта данных
router.get('/', async (req, res) => {
  try {
    res.json({
      message: 'VHM24 Data Import API',
      version: '2.0',
      supportedFormats: ['Excel (.xlsx, .xls, .xlsm)'],
      importTypes: [
        {
          type: 'sales',
          description: 'Импорт данных о продажах',
          requiredColumns: ['дата', 'автомат', 'товар', 'количество', 'сумма']
        },
        {
          type: 'inventory',
          description: 'Импорт данных инвентаризации',
          requiredColumns: ['sku', 'название', 'количество', 'единица', 'категория']
        },
        {
          type: 'payments',
          description: 'Импорт данных о платежах',
          requiredColumns: ['дата', 'автомат', 'тип', 'сумма', 'статус', 'референс']
        },
        {
          type: 'machines',
          description: 'Импорт данных об автоматах',
          requiredColumns: ['код', 'серийный', 'название', 'тип', 'адрес']
        },
        {
          type: 'vendhub',
          description: 'Импорт данных VendHub',
          requiredColumns: ['datetime', 'machineid', 'productname', 'quantity', 'price', 'total']
        }
      ],
      endpoints: [
        'GET / - Информация об API',
        'GET /history - История импортов',
        'POST /excel - Импорт из Excel файла',
        'POST /validate - Валидация Excel файла',
        'GET /template/:type - Скачать шаблон Excel'
      ]
    });
  } catch (error) {
    logger.error('Ошибка data-import API', { error: error.message });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить историю импортов
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await ExcelImportService.getImportHistory(
      req.user.id, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: history.length
      }
    });
  } catch (error) {
    logger.error('Ошибка получения истории импортов', { 
      error: error.message, 
      userId: req.user.id 
    });
    res.status(500).json({ 
      success: false,
      error: 'Ошибка получения истории импортов' 
    });
  }
});

// Импорт данных из Excel файла
router.post('/excel', requireManager(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не загружен'
      });
    }
    
    const { importType } = req.body;
    
    if (!importType) {
      return res.status(400).json({
        success: false,
        error: 'Не указан тип импорта'
      });
    }
    
    const supportedTypes = ['sales', 'inventory', 'payments', 'machines', 'vendhub'];
    if (!supportedTypes.includes(importType)) {
      return res.status(400).json({
        success: false,
        error: `Неподдерживаемый тип импорта. Поддерживаются: ${supportedTypes.join(', ')}`
      });
    }
    
    logger.info('Starting Excel import', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      importType,
      userId: req.user.id
    });
    
    // Импортируем данные
    const result = await ExcelImportService.importFromExcel(
      req.file.buffer,
      req.file.originalname,
      req.user.id,
      importType
    );
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка импорта Excel', { 
      error: error.message,
      fileName: req.file?.originalname,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка импорта данных'
    });
  }
});

// Валидация Excel файла перед импортом
router.post('/validate', requireManager(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не загружен'
      });
    }
    
    const { importType } = req.body;
    
    if (!importType) {
      return res.status(400).json({
        success: false,
        error: 'Не указан тип импорта'
      });
    }
    
    // Валидируем файл
    const validation = ExcelImportService.validateExcelFile(
      req.file.buffer,
      importType
    );
    
    res.json({
      success: true,
      validation: validation,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
    
  } catch (error) {
    logger.error('Ошибка валидации Excel', { 
      error: error.message,
      fileName: req.file?.originalname,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка валидации файла'
    });
  }
});

// Скачать шаблон Excel для определенного типа импорта
router.get('/template/:type', requireManager(), async (req, res) => {
  try {
    const { type } = req.params;
    
    const templates = {
      sales: {
        filename: 'template_sales.xlsx',
        headers: ['Дата', 'Автомат', 'Товар', 'Количество', 'Сумма'],
        example: ['2025-01-07', 'VM001', 'Кофе Americano', '1', '150.00']
      },
      inventory: {
        filename: 'template_inventory.xlsx',
        headers: ['SKU', 'Название', 'Количество', 'Единица', 'Категория'],
        example: ['COFFEE001', 'Кофе Jacobs', '50', 'KG', 'Напитки']
      },
      payments: {
        filename: 'template_payments.xlsx',
        headers: ['Дата', 'Автомат', 'Тип', 'Сумма', 'Статус', 'Референс'],
        example: ['2025-01-07', 'VM001', 'CARD', '150.00', 'COMPLETED', 'PAY123456']
      },
      machines: {
        filename: 'template_machines.xlsx',
        headers: ['Код', 'Серийный', 'Название', 'Тип', 'Адрес'],
        example: ['VM001', 'SN123456', 'Автомат №1', 'VENDING', 'ул. Ленина, 1']
      },
      vendhub: {
        filename: 'template_vendhub.xlsx',
        headers: ['DateTime', 'MachineID', 'ProductName', 'Quantity', 'Price', 'Total'],
        example: ['2025-01-07 10:30:00', 'VH001', 'Coffee', '1', '150.00', '150.00']
      }
    };
    
    const template = templates[type];
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Шаблон не найден'
      });
    }
    
    // Создаем простой Excel файл с заголовками и примером
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      template.headers,
      template.example
    ]);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.send(buffer);
    
  } catch (error) {
    logger.error('Ошибка создания шаблона', { 
      error: error.message,
      type: req.params.type,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Ошибка создания шаблона'
    });
  }
});

// Получить статистику импортов
router.get('/stats', requireManager(), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Определяем период
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Получаем статистику из audit логов
    const stats = await prisma.systemAuditLog.groupBy({
      by: ['statusCode'],
      where: {
        action: 'IMPORT',
        entity: 'EXCEL_IMPORT',
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });
    
    const totalImports = stats.reduce((sum, stat) => sum + stat._count.id, 0);
    const successfulImports = stats.find(s => s.statusCode === 200)?._count.id || 0;
    const failedImports = stats.find(s => s.statusCode === 500)?._count.id || 0;
    
    res.json({
      success: true,
      period,
      stats: {
        total: totalImports,
        successful: successfulImports,
        failed: failedImports,
        successRate: totalImports > 0 ? (successfulImports / totalImports * 100).toFixed(2) : 0
      }
    });
    
  } catch (error) {
    logger.error('Ошибка получения статистики', { 
      error: error.message,
      userId: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

// Обработка ошибок multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 50MB'
      });
    }
  }
  
  if (error.message.includes('Excel')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;
