
const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 8003;
const prisma = new PrismaClient();

// S3 Client для бэкапов
const s3Client = new S3Client({
  endpoint: 'https://vhm24-backups.fra1.digitaloceanspaces.com',
  region: 'fra1',
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
    spaces_endpoint: 'https://vhm24-backups.fra1.digitaloceanspaces.com'
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
    const key = `database-backups/backup-${timestamp}.json`;

    const command = new PutObjectCommand({
      Bucket: 'vhm24-backups',
      Key: key,
      Body: backupData,
      ContentType: 'application/json'
    });

    await s3Client.send(command);

    console.log(`Database backup created: ${key}`);
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
      Bucket: 'vhm24-backups',
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
  console.log(`VHM24 Backups Service running on port ${PORT}`);
});
