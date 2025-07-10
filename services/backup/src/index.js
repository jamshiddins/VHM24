/**
 * VHM24 - VendHub Manager 24/7
 * Backup Service
 * Автоматическое резервное копирование данных
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const AWS = require('aws-sdk');

const execAsync = promisify(exec);
const fastify = Fastify({ 
  logger: true,
  trustProxy: true
});

// Проверка обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

// Настройка S3 для хранения бэкапов
let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

// CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
});

// JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  verify: {
    issuer: ['vhm24-gateway', 'vhm24-auth']
  }
});

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
    // Проверяем, что пользователь - администратор
    if (!request.user.roles || !request.user.roles.includes('ADMIN')) {
      throw new Error('Admin access required');
    }
  } catch (err) {
    reply.code(401).send({ 
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired token'
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'backup',
    storage: {
      s3: s3 ? 'configured' : 'not configured',
      local: 'available'
    },
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *'
  };
});

// Функция создания бэкапа базы данных
async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = `vhm24-db-backup-${timestamp}.sql`;
  const backupPath = path.join(backupDir, backupFile);
  
  try {
    // Создаем директорию для бэкапов
    await fs.mkdir(backupDir, { recursive: true });
    
    // Парсим DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL);
    const [username, password] = dbUrl.username ? [dbUrl.username, dbUrl.password] : ['', ''];
    const hostname = dbUrl.hostname;
    const port = dbUrl.port || 5432;
    const database = dbUrl.pathname.slice(1);
    
    // Создаем дамп базы данных
    const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${hostname} -p ${port} -U ${username} -d ${database} -f ${backupPath}`;
    
    await execAsync(pgDumpCommand);
    
    // Сжимаем бэкап
    const zipPath = `${backupPath}.zip`;
    const output = await fs.open(zipPath, 'w');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.file(backupPath, { name: backupFile });
    await archive.finalize();
    
    // Удаляем несжатый файл
    await fs.unlink(backupPath);
    
    // Загружаем в S3 если настроено
    if (s3 && process.env.BACKUP_S3_BUCKET) {
      const fileContent = await fs.readFile(zipPath);
      
      await s3.putObject({
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: `database/${backupFile}.zip`,
        Body: fileContent,
        ContentType: 'application/zip'
      }).promise();
      
      fastify.log.info(`Database backup uploaded to S3: ${backupFile}.zip`);
    }
    
    // Очистка старых локальных бэкапов
    await cleanupOldBackups(backupDir);
    
    return {
      success: true,
      filename: `${backupFile}.zip`,
      size: (await fs.stat(zipPath)).size,
      path: zipPath,
      s3: s3 && process.env.BACKUP_S3_BUCKET ? true : false
    };
  } catch (error) {
    fastify.log.error('Database backup failed:', error);
    throw error;
  }
}

// Функция создания бэкапа файлов
async function createFilesBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = `vhm24-files-backup-${timestamp}.zip`;
  const backupPath = path.join(backupDir, backupFile);
  
  try {
    // Создаем директорию для бэкапов
    await fs.mkdir(backupDir, { recursive: true });
    
    // Создаем архив
    const output = await fs.open(backupPath, 'w');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Добавляем директории для бэкапа
    const dirsToBackup = ['uploads', 'logs'];
    
    for (const dir of dirsToBackup) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        await fs.access(dirPath);
        archive.directory(dirPath, dir);
      } catch (error) {
        fastify.log.warn(`Directory ${dir} not found, skipping`);
      }
    }
    
    await archive.finalize();
    
    // Загружаем в S3 если настроено
    if (s3 && process.env.BACKUP_S3_BUCKET) {
      const fileContent = await fs.readFile(backupPath);
      
      await s3.putObject({
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: `files/${backupFile}`,
        Body: fileContent,
        ContentType: 'application/zip'
      }).promise();
      
      fastify.log.info(`Files backup uploaded to S3: ${backupFile}`);
    }
    
    return {
      success: true,
      filename: backupFile,
      size: (await fs.stat(backupPath)).size,
      path: backupPath,
      s3: s3 && process.env.BACKUP_S3_BUCKET ? true : false
    };
  } catch (error) {
    fastify.log.error('Files backup failed:', error);
    throw error;
  }
}

// Очистка старых бэкапов
async function cleanupOldBackups(backupDir) {
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  try {
    const files = await fs.readdir(backupDir);
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        fastify.log.info(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    fastify.log.error('Cleanup failed:', error);
  }
}

// Создать бэкап вручную
fastify.post('/api/v1/backup/create', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: ['database', 'files', 'full'],
          default: 'full'
        }
      }
    }
  }
}, async (request, reply) => {
  const { type } = request.body;
  
  try {
    const results = {};
    
    if (type === 'database' || type === 'full') {
      results.database = await createDatabaseBackup();
    }
    
    if (type === 'files' || type === 'full') {
      results.files = await createFilesBackup();
    }
    
    return {
      success: true,
      data: results,
      message: 'Backup created successfully'
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Backup failed',
      message: error.message
    });
  }
});

// Получить список бэкапов
fastify.get('/api/v1/backup/list', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const backups = [];
    
    try {
      const files = await fs.readdir(backupDir);
      
      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
          type: file.includes('db-backup') ? 'database' : 'files'
        });
      }
    } catch (error) {
      // Директория не существует
    }
    
    // Получаем список из S3
    let s3Backups = [];
    if (s3 && process.env.BACKUP_S3_BUCKET) {
      try {
        const s3Data = await s3.listObjectsV2({
          Bucket: process.env.BACKUP_S3_BUCKET,
          MaxKeys: 100
        }).promise();
        
        s3Backups = s3Data.Contents.map(item => ({
          filename: item.Key.split('/').pop(),
          size: item.Size,
          created: item.LastModified,
          type: item.Key.startsWith('database/') ? 'database' : 'files',
          s3: true,
          key: item.Key
        }));
      } catch (error) {
        fastify.log.error('Failed to list S3 backups:', error);
      }
    }
    
    return {
      success: true,
      data: {
        local: backups.sort((a, b) => b.created - a.created),
        s3: s3Backups.sort((a, b) => b.created - a.created)
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to list backups'
    });
  }
});

// Скачать бэкап
fastify.get('/api/v1/backup/download/:filename', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  const { filename } = request.params;
  
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);
    
    // Проверяем безопасность пути
    if (!filePath.startsWith(backupDir)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    // Проверяем существование файла
    await fs.access(filePath);
    
    // Отправляем файл
    return reply.sendFile(filename, backupDir);
  } catch (error) {
    reply.code(404).send({
      success: false,
      error: 'Backup not found'
    });
  }
});

// Восстановить из бэкапа
fastify.post('/api/v1/backup/restore', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['filename'],
      properties: {
        filename: { type: 'string' },
        source: { type: 'string', enum: ['local', 's3'], default: 'local' }
      }
    }
  }
}, async (request, reply) => {
  const { filename, source } = request.body;
  
  try {
    // Только для database бэкапов
    if (!filename.includes('db-backup')) {
      return reply.code(400).send({
        success: false,
        error: 'Only database backups can be restored'
      });
    }
    
    let backupPath;
    
    if (source === 's3' && s3 && process.env.BACKUP_S3_BUCKET) {
      // Скачиваем из S3
      const tempPath = path.join(process.cwd(), 'temp', filename);
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      
      const s3Object = await s3.getObject({
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: `database/${filename}`
      }).promise();
      
      await fs.writeFile(tempPath, s3Object.Body);
      backupPath = tempPath;
    } else {
      backupPath = path.join(process.cwd(), 'backups', filename);
    }
    
    // TODO: Реализовать восстановление базы данных
    // Это требует остановки всех сервисов и выполнения pg_restore
    
    return {
      success: false,
      error: 'Restore functionality not implemented yet',
      message: 'Please restore manually using pg_restore'
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Restore failed',
      message: error.message
    });
  }
});

// Настройка расписания автоматических бэкапов
if (process.env.BACKUP_ENABLED === 'true') {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // По умолчанию в 2 ночи
  
  cron.schedule(schedule, async () => {
    fastify.log.info('Starting scheduled backup...');
    
    try {
      const dbBackup = await createDatabaseBackup();
      const filesBackup = await createFilesBackup();
      
      fastify.log.info('Scheduled backup completed successfully', {
        database: dbBackup,
        files: filesBackup
      });
    } catch (error) {
      fastify.log.error('Scheduled backup failed:', error);
    }
  });
  
  fastify.log.info(`Backup schedule configured: ${schedule}`);
}

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.BACKUP_PORT || 3007,
      host: '0.0.0.0'
    });
    logger.info('VHM24 Backup Service running 24/7 on port', process.env.BACKUP_PORT || 3007);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});
