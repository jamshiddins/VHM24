#!/usr/bin/env node

/**
 * VHM24 Railway Microservices Orchestrator
 * Управление микросервисной архитектурой на Railway
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Конфигурация микросервисов
const MICROSERVICES = {
  gateway: {
    name: 'vhm24-gateway',
    port: process.env.PORT || 8000,
    path: 'backend',
    script: 'src/index.js',
    healthPath: '/health',
    critical: true
  },
  telegram: {
    name: 'vhm24-telegram-bot',
    port: 8001,
    path: 'apps/telegram-bot',
    script: 'src/index.js',
    healthPath: '/health',
    critical: false
  },
  uploads: {
    name: 'vhm24-uploads-service',
    port: 8002,
    path: 'services/uploads',
    script: 'index.js',
    healthPath: '/health',
    critical: true
  },
  backups: {
    name: 'vhm24-backups-service',
    port: 8003,
    path: 'services/backups',
    script: 'index.js',
    healthPath: '/health',
    critical: false
  },
  monitoring: {
    name: 'vhm24-monitoring',
    port: 8004,
    path: 'services/monitoring',
    script: 'index.js',
    healthPath: '/health',
    critical: false
  }
};

// DigitalOcean Spaces конфигурация
const SPACES_CONFIG = {
  uploads: {
    endpoint: 'https://vhm24-uploads.fra1.digitaloceanspaces.com',
    bucket: 'vhm24-uploads',
    region: 'fra1'
  },
  backups: {
    endpoint: 'https://vhm24-backups.fra1.digitaloceanspaces.com',
    bucket: 'vhm24-backups',
    region: 'fra1'
  }
};

// Логирование
function log(level, message, service = 'orchestrator', data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service,
    message,
    railway_project: process.env.RAILWAY_PROJECT_ID,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

// Создание директорий для сервисов
function createServiceDirectories() {
  const dirs = [
    'services/uploads',
    'services/backups', 
    'services/monitoring',
    'logs',
    'temp'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log('INFO', `Created directory: ${dir}`);
    }
  });
}

// Создание сервиса загрузок
function createUploadsService() {
  const uploadsServiceCode = `
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8002;

// S3 Client для DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: '${SPACES_CONFIG.uploads.endpoint}',
  region: '${SPACES_CONFIG.uploads.region}',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

// Multer для обработки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Uploads Service',
    timestamp: new Date().toISOString(),
    spaces_endpoint: '${SPACES_CONFIG.uploads.endpoint}'
  });
});

// Загрузка файла
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileName = \`\${Date.now()}-\${req.file.originalname}\`;
    const key = \`uploads/\${fileName}\`;

    const command = new PutObjectCommand({
      Bucket: '${SPACES_CONFIG.uploads.bucket}',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    });

    await s3Client.send(command);

    const fileUrl = \`${SPACES_CONFIG.uploads.endpoint}/\${key}\`;

    res.json({
      success: true,
      fileName,
      fileUrl,
      size: req.file.size,
      contentType: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Получение подписанного URL
app.get('/signed-url/:key', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: '${SPACES_CONFIG.uploads.bucket}',
      Key: req.params.key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Удаление файла
app.delete('/delete/:key', async (req, res) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: '${SPACES_CONFIG.uploads.bucket}',
      Key: req.params.key
    });

    await s3Client.send(command);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => {
  console.log(\`VHM24 Uploads Service running on port \${PORT}\`);
});
`;

  fs.writeFileSync('services/uploads/index.js', uploadsServiceCode);
  fs.writeFileSync('services/uploads/package.json', JSON.stringify({
    name: 'vhm24-uploads-service',
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
      'express': '^4.18.2',
      'multer': '^2.0.1',
      '@aws-sdk/client-s3': '^3.844.0',
      '@aws-sdk/s3-request-presigner': '^3.844.0'
    }
  }, null, 2));

  log('INFO', 'Created uploads service');
}

// Создание сервиса бэкапов
function createBackupsService() {
  const backupsServiceCode = `
const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 8003;
const prisma = new PrismaClient();

// S3 Client для бэкапов
const s3Client = new S3Client({
  endpoint: '${SPACES_CONFIG.backups.endpoint}',
  region: '${SPACES_CONFIG.backups.region}',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Backups Service',
    timestamp: new Date().toISOString(),
    spaces_endpoint: '${SPACES_CONFIG.backups.endpoint}'
  });
});

// Создание бэкапа базы данных
async function createDatabaseBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Экспорт данных из основных таблиц
    const tables = ['User', 'Machine', 'InventoryItem', 'Task', 'StockMovement'];
    const backup = {};

    for (const table of tables) {
      const data = await prisma[table.toLowerCase()].findMany();
      backup[table] = data;
    }

    const backupData = JSON.stringify(backup, null, 2);
    const key = \`database-backups/backup-\${timestamp}.json\`;

    const command = new PutObjectCommand({
      Bucket: '${SPACES_CONFIG.backups.bucket}',
      Key: key,
      Body: backupData,
      ContentType: 'application/json'
    });

    await s3Client.send(command);

    console.log(\`Database backup created: \${key}\`);
    return key;

  } catch (error) {
    console.error('Backup error:', error);
    throw error;
  }
}

// Ручное создание бэкапа
app.post('/backup/create', async (req, res) => {
  try {
    const backupKey = await createDatabaseBackup();
    res.json({
      success: true,
      backupKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Список бэкапов
app.get('/backup/list', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: '${SPACES_CONFIG.backups.bucket}',
      Prefix: 'database-backups/'
    });

    const response = await s3Client.send(command);
    
    res.json({
      success: true,
      backups: response.Contents || []
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Автоматические бэкапы каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  try {
    await createDatabaseBackup();
    console.log('Scheduled backup completed');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(\`VHM24 Backups Service running on port \${PORT}\`);
});
`;

  fs.writeFileSync('services/backups/index.js', backupsServiceCode);
  fs.writeFileSync('services/backups/package.json', JSON.stringify({
    name: 'vhm24-backups-service',
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
      'express': '^4.18.2',
      '@aws-sdk/client-s3': '^3.844.0',
      '@prisma/client': '^6.11.1',
      'node-cron': '^3.0.3'
    }
  }, null, 2));

  log('INFO', 'Created backups service');
}

// Создание сервиса мониторинга
function createMonitoringService() {
  const monitoringServiceCode = `
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VHM24 Monitoring Service',
    timestamp: new Date().toISOString()
  });
});

// Проверка всех сервисов
app.get('/status', async (req, res) => {
  const services = [
    { name: 'Gateway', url: 'http://localhost:8000/health' },
    { name: 'Uploads', url: 'http://localhost:8002/health' },
    { name: 'Backups', url: 'http://localhost:8003/health' }
  ];

  const results = await Promise.allSettled(
    services.map(async service => {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        return {
          name: service.name,
          status: 'healthy',
          response: response.data
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );

  res.json({
    timestamp: new Date().toISOString(),
    services: results.map(result => result.value)
  });
});

app.listen(PORT, () => {
  console.log(\`VHM24 Monitoring Service running on port \${PORT}\`);
});
`;

  fs.writeFileSync('services/monitoring/index.js', monitoringServiceCode);
  fs.writeFileSync('services/monitoring/package.json', JSON.stringify({
    name: 'vhm24-monitoring-service',
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
      'express': '^4.18.2',
      'axios': '^1.10.0'
    }
  }, null, 2));

  log('INFO', 'Created monitoring service');
}

// Запуск микросервиса
function startMicroservice(serviceName, config) {
  return new Promise((resolve) => {
    log('INFO', `Starting ${serviceName}...`, serviceName);

    const process = spawn('node', [config.script], {
      cwd: path.join(__dirname, '..', config.path),
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: config.port,
        SERVICE_NAME: serviceName
      }
    });

    process.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log('INFO', output, serviceName);
      }
    });

    process.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        log('ERROR', error, serviceName);
      }
    });

    process.on('close', (code) => {
      log('WARN', `Service stopped with code ${code}`, serviceName);
    });

    setTimeout(() => {
      log('INFO', `Service ${serviceName} startup completed`);
      resolve(process);
    }, 3000);
  });
}

// Главная функция
async function main() {
  try {
    log('INFO', '🚀 Starting VHM24 Microservices');

    // Создание структуры
    createServiceDirectories();
    createUploadsService();
    createBackupsService();
    createMonitoringService();

    // Установка зависимостей для сервисов
    log('INFO', 'Installing service dependencies...');
    
    const services = ['uploads', 'backups', 'monitoring'];
    for (const service of services) {
      const servicePath = path.join(__dirname, '..', 'services', service);
      await new Promise((resolve) => {
        const npm = spawn('npm', ['install'], {
          cwd: servicePath,
          stdio: 'inherit'
        });
        npm.on('close', resolve);
      });
    }

    // Запуск сервисов
    const processes = [];
    
    for (const [serviceName, config] of Object.entries(MICROSERVICES)) {
      if (fs.existsSync(path.join(__dirname, '..', config.path))) {
        const process = await startMicroservice(serviceName, config);
        processes.push(process);
      }
    }

    log('INFO', '✅ All microservices started successfully', 'orchestrator', {
      services: processes.length,
      spaces_uploads: SPACES_CONFIG.uploads.endpoint,
      spaces_backups: SPACES_CONFIG.backups.endpoint
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('INFO', 'Shutting down microservices...');
      processes.forEach(proc => {
        if (proc && !proc.killed) {
          proc.kill('SIGTERM');
        }
      });
    });

  } catch (error) {
    log('ERROR', 'Failed to start microservices', 'orchestrator', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, MICROSERVICES, SPACES_CONFIG };
