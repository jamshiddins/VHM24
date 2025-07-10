const logger = require('@vhm24/shared/logger');

const fastify = require('fastify')({ logger: true 
    
    
    
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}});
const path = require('path');
const fs = require('fs')
const { promises: fsPromises 
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} = fs;
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const moment = require('moment');

// Регистрация плагинов
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../templates'),
  prefix: '/templates/',

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }});

// Хранилище для задач импорта (в production использовать Redis/Database)
const importJobs = new Map();
let jobIdCounter = 1;

// Схемы данных для валидации
const dataSchemas = {
  SALES: {
    required: ['date', 'time', 'machine_id', 'product_id', 'quantity', 'amount'],
    optional: ['customer_id', 'payment_method', 'discount']
  },
  INVENTORY: {
    required: ['date', 'time', 'item_id', 'quantity', 'location'],
    optional: ['batch_number', 'expiry_date', 'supplier_id']
  },
  MAINTENANCE: {
    required: ['date', 'time', 'machine_id', 'type', 'description', 'technician_id'],
    optional: ['parts_used', 'cost', 'duration', 'next_maintenance']
  },
  ROUTES: {
    required: ['date', 'time', 'driver_id', 'route_name', 'start_location', 'end_location'],
    optional: ['distance', 'duration', 'fuel_consumption', 'stops']
  },
  USERS: {
    required: ['username', 'first_name', 'last_name', 'role', 'created_date'],
    optional: ['email', 'phone', 'telegram_username', 'status']
  },
  TASKS: {
    required: ['date', 'time', 'title', 'type', 'assigned_to', 'status', 'description'],
    optional: ['priority', 'machine_id', 'estimated_duration', 'actual_duration']
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

// Генерация шаблонов CSV
const generateTemplate = (dataType) => {
  const schema = dataSchemas[dataType];
  if (!schema) {
    throw new Error(`Unknown data type: ${dataType}`);
  }

  const headers = [...schema.required, ...schema.optional];
  const sampleData = generateSampleData(dataType);
  
  let csv = headers.join(',') + '\n';
  csv += sampleData.map(row => headers.map(header => row[header] || '').join(',')).join('\n');
  
  return csv;

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

// Генерация примеров данных
const generateSampleData = (dataType) => {
  const baseDate = moment().subtract(30, 'days');
  
  switch (dataType) {
    case 'SALES':
      return [
        {
          date: baseDate.format('YYYY-MM-DD'),
          time: '10:30:00',
          machine_id: 'VM001',
          product_id: 'PROD001',
          quantity: '2',
          amount: '150.00',
          customer_id: 'CUST001',
          payment_method: 'CARD'
        },
        {
          date: baseDate.add(1, 'day').format('YYYY-MM-DD'),
          time: '14:15:00',
          machine_id: 'VM002',
          product_id: 'PROD002',
          quantity: '1',
          amount: '85.00',
          payment_method: 'CASH'
        }
      ];
    
    case 'INVENTORY':
      return [
        {
          date: baseDate.format('YYYY-MM-DD'),
          time: '09:00:00',
          item_id: 'ITEM001',
          quantity: '50',
          location: 'WAREHOUSE_A',
          batch_number: 'BATCH001',
          supplier_id: 'SUP001'
        },
        {
          date: baseDate.add(1, 'day').format('YYYY-MM-DD'),
          time: '16:30:00',
          item_id: 'ITEM002',
          quantity: '25',
          location: 'WAREHOUSE_B',
          batch_number: 'BATCH002'
        }
      ];
    
    case 'MAINTENANCE':
      return [
        {
          date: baseDate.format('YYYY-MM-DD'),
          time: '08:00:00',
          machine_id: 'VM001',
          type: 'PREVENTIVE',
          description: 'Routine maintenance check',
          technician_id: 'TECH001',
          duration: '120',
          cost: '500.00'
        }
      ];
    
    case 'ROUTES':
      return [
        {
          date: baseDate.format('YYYY-MM-DD'),
          time: '07:00:00',
          driver_id: 'DRV001',
          route_name: 'Route A',
          start_location: 'Warehouse',
          end_location: 'Mall District',
          distance: '25.5',
          duration: '180'
        }
      ];
    
    case 'USERS':
      return [
        {
          username: 'john.doe',
          first_name: 'John',
          last_name: 'Doe',
          role: 'OPERATOR',
          created_date: baseDate.format('YYYY-MM-DD'),
          email: 'john.doe@example.com',
          status: 'ACTIVE'
        }
      ];
    
    case 'TASKS':
      return [
        {
          date: baseDate.format('YYYY-MM-DD'),
          time: '09:00:00',
          title: 'Refill Machine VM001',
          type: 'REFILL',
          assigned_to: 'TECH001',
          status: 'COMPLETED',
          description: 'Refill products in machine VM001',
          priority: 'HIGH',
          estimated_duration: '60'
        }
      ];
    
    default:
      return [];
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

// Парсинг файлов
const parseFile = async (filePath, dataType) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const ext = path.extname(filePath).toLowerCase();
  let data = [];

  try {
    if (ext === '.csv') {
      data = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      data = await parseExcel(filePath);
    } else if (ext === '.json') {
      data = await parseJSON(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Валидация данных
    const validationResult = validateData(data, dataType);
    return validationResult;
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseExcel = async (filePath) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1); // Получаем первый лист
  
  const data = [];
  worksheet.eachRow({ includeEmpty: false, headerRow: 1 }, (row, rowNumber) => {
    if (rowNumber > 1) { // Пропускаем заголовок
      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        rowData[header] = cell.value;
      });
      data.push(rowData);
    }
  });
  
  return data;
};

const parseJSON = async (filePath) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const content = await fsPromises.readFile(filePath, 'utf8');
  return JSON.parse(content);

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }};

// Валидация данных
const validateData = (data, dataType) => {
  const schema = dataSchemas[dataType];
  const errors = [];
  const validRecords = [];

  data.forEach((record, index) => {
    const recordErrors = [];
    
    // Проверка обязательных полей
    schema.required.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        recordErrors.push(`Missing required field: ${field}`);
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}});

    // Валидация даты и времени
    if (record.date && !moment(record.date, 'YYYY-MM-DD', true).isValid()) {
      recordErrors.push(`Invalid date format: ${record.date
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}. Expected: YYYY-MM-DD`);
    
    
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}}
    
    if (record.time && !moment(record.time, 'HH:mm:ss', true).isValid()) {
      recordErrors.push(`Invalid time format: ${record.time
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}. Expected: HH:mm:ss`);
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}

    // Специфичная валидация по типу данных
    if (dataType === 'SALES') {
      if (record.amount && isNaN(parseFloat(record.amount))) {
        recordErrors.push(`Invalid amount: ${record.amount
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}`);
      }
      if (record.quantity && isNaN(parseInt(record.quantity))) {
        recordErrors.push(`Invalid quantity: ${record.quantity
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}`);
      }
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}

    if (recordErrors.length > 0) {
      errors.push(`Row ${index + 1}: ${recordErrors.join(', ')}`);
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }} else {
      validRecords.push({
        ...record,
        originalIndex: index + 1,
        importedAt: new Date().toISOString()
      });
    
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
  });

  return {
    totalRecords: data.length,
    validRecords,
    errorRecords: errors.length,
    errors
  };
};

// Обработка импорта
const processImport = async (jobId) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const job = importJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'PROCESSING';
    job.startedAt = new Date().toISOString();

    const result = await parseFile(job.filePath, job.dataType);
    
    // Симуляция обработки записей
    for (let i = 0; i < result.validRecords.length; i++) {
      // Здесь будет сохранение в базу данных
      await new Promise(resolve => setTimeout(resolve, 100)); // Симуляция задержки
      job.processedRecords = i + 1;
    }

    job.status = 'COMPLETED';
    job.completedAt = new Date().toISOString();
    job.totalRecords = result.totalRecords;
    job.errorRecords = result.errorRecords;
    job.errors = result.errors;

    // Удаление временного файла
    fs.unlinkSync(job.filePath);
    
  } catch (error) {
    job.status = 'FAILED';
    job.errors = [error.message];
    job.completedAt = new Date().toISOString();
  }

    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }};

// API Routes

// Получение списка задач импорта
fastify.get('/api/v1/data-import/jobs', async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const jobs = Array.from(importJobs.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  return {
    success: true,
    data: jobs
  };
});

// Получение исторических данных
fastify.get('/api/v1/data-import/historical', async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  // В production здесь будет запрос к базе данных
  return {
    success: true,
    data: []
  
    
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }} catch (error) {
      console.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}} catch (error) {
      logger.error('Error:', error);
      throw error;
    
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}};
});

// Предварительный просмотр файла

// Схема валидации для POST /api/v1/data-import/preview
const postapiv1data-importpreviewSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}
  
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }}
};

fastify.post('/api/v1/data-import/preview', { schema: postapiv1data-importpreviewSchema }, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    const data = await request.file();
    const dataType = request.body?.dataType || 'SALES';
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Сохранение временного файла
    const tempPath = path.join(__dirname, '../temp', `preview_${Date.now()}_${data.filename}`);
    await data.file.pipe(fs.createWriteStream(tempPath));

    // Парсинг первых 10 записей для предварительного просмотра
    const result = await parseFile(tempPath, dataType);
    const preview = result.validRecords.slice(0, 10);

    // Удаление временного файла
    fs.unlinkSync(tempPath);

    return {
      success: true,
      preview,
      totalRecords: result.totalRecords,
      errors: result.errors.slice(0, 5) // Показать только первые 5 ошибок
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error.message
    });
  }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }});

// Загрузка файла для импорта

// Схема валидации для POST /api/v1/data-import/upload
const postapiv1data-importuploadSchema = {
  body: {
    type: 'object',
    required: [],
    properties: {}
  }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }};

fastify.post('/api/v1/data-import/upload', { schema: postapiv1data-importuploadSchema 
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }}, async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    const data = await request.file();
    const { dataType, startDate, endDate } = request.body;
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Создание задачи импорта
    const jobId = jobIdCounter++;
    const tempPath = path.join(__dirname, '../temp', `import_${jobId}_${data.filename}`);
    
    // Создание директории temp если не существует
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await data.file.pipe(fs.createWriteStream(tempPath));

    const job = {
      id: jobId,
      fileName: data.filename,
      fileSize: fs.statSync(tempPath).size,
      dataType,
      status: 'PENDING',
      totalRecords: 0,
      processedRecords: 0,
      errorRecords: 0,
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
      filePath: tempPath,
      errors: []
    };

    importJobs.set(jobId, job);

    // Запуск обработки в фоне
    setImmediate(() => processImport(jobId));

    return {
      success: true,
      job: {
        id: job.id,
        fileName: job.fileName,
        fileSize: job.fileSize,
        dataType: job.dataType,
        status: job.status,
        createdAt: job.createdAt
      }
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error.message
    });
  }
});

// Скачивание шаблона
fastify.get('/api/v1/data-import/template/:dataType', async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    const { dataType } = request.params;
    
    if (!dataSchemas[dataType]) {
      return reply.code(400).send({
        success: false,
        error: `Unknown data type: ${dataType}`
      });
    }

    const template = generateTemplate(dataType);
    
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="${dataType.toLowerCase()}_template.csv"`)
      .send(template);
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error.message
    });
  }
});

// Получение деталей задачи
fastify.get('/api/v1/data-import/jobs/:jobId', async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  const { jobId } = request.params;
  const job = importJobs.get(parseInt(jobId));
  
  if (!job) {
    return reply.code(404).send({
      success: false,
      error: 'Job not found'
    });
  }

  return {
    success: true,
    data: job
  };
});

// Health check
fastify.get('/health', async (request, reply) => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    // В этом сервисе нет прямого подключения к базе данных через Prisma
    // Но мы можем проверить доступность директории для временных файлов
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    return { 
      status: 'ok', 
      service: 'data-import', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      storage: 'connected',
      activeJobs: importJobs.size
    };
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    return reply.code(503).send({ 
      status: 'error', 
      service: 'data-import',
      timestamp: new Date().toISOString(),
      error: 'Storage access failed'
    });
  }
});

// Запуск сервера
const start = async () => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  try {
    const port = process.env.PORT || 3009;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    logger.info(`🚀 Data Import Service running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
let server;

const gracefulShutdown = async () => {
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
    try {
      
  logger.info('Gracefully shutting down...');
  if (server) {
    await server.close();
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
