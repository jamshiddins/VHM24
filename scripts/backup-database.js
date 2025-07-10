/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для автоматического резервного копирования базы данных
 * 
 * Использование:
 * node scripts/backup-database.js
 * 
 * Опции:
 * --s3-only: загрузка только в S3 (без локального сохранения)
 * --local-only: сохранение только локально (без загрузки в S3)
 * --retention=30: количество дней хранения резервных копий (по умолчанию 30)
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const archiver = require('archiver');

const execAsync = promisify(exec);

// Конфигурация
const config = {
  s3Only: process.argv.includes('--s3-only'),
  localOnly: process.argv.includes('--local-only'),
  retention: parseInt(process.argv.find(arg => arg.startsWith('--retention='))?.split('=')[1] || '30'),
  backupDir: path.join(process.cwd(), 'backups'),
  s3: {
    endpoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.BACKUP_S3_BUCKET || 'vhm24-backups',
    useSSL: process.env.MINIO_USE_SSL === 'true'
  },
  database: {
    url: process.env.DATABASE_URL
  }
};

// Инициализация S3 клиента
let s3 = null;
if (!config.localOnly && config.s3.endpoint && config.s3.accessKey && config.s3.secretKey) {
  s3 = new AWS.S3({
    endpoint: config.s3.endpoint,
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    sslEnabled: config.s3.useSSL
  });
}

// Создание директории для бэкапов
async function createBackupDir() {
  try {
    await fs.mkdir(config.backupDir, { recursive: true });
    console.log(`✅ Директория для бэкапов создана: ${config.backupDir}`);
  } catch (error) {
    console.error('❌ Ошибка при создании директории для бэкапов:', error);
    throw error;
  }
}

// Создание дампа базы данных
async function createDatabaseDump() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `vhm24-db-backup-${timestamp}.sql`;
  const backupPath = path.join(config.backupDir, backupFile);
  
  try {
    console.log('🔄 Создание дампа базы данных...');
    
    // Парсим DATABASE_URL
    const dbUrl = new URL(config.database.url);
    const [username, password] = dbUrl.username ? [dbUrl.username, dbUrl.password] : ['', ''];
    const hostname = dbUrl.hostname;
    const port = dbUrl.port || 5432;
    const database = dbUrl.pathname.slice(1);
    
    // Создаем дамп базы данных
    const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${hostname} -p ${port} -U ${username} -d ${database} -f ${backupPath}`;
    
    await execAsync(pgDumpCommand);
    console.log(`✅ Дамп базы данных создан: ${backupPath}`);
    
    // Сжимаем бэкап
    const zipPath = `${backupPath}.zip`;
    console.log('🔄 Сжатие дампа базы данных...');
    
    const output = await fs.open(zipPath, 'w');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output.createWriteStream());
    archive.file(backupPath, { name: backupFile });
    await archive.finalize();
    
    console.log(`✅ Дамп базы данных сжат: ${zipPath}`);
    
    // Удаляем несжатый файл
    await fs.unlink(backupPath);
    
    return {
      path: zipPath,
      filename: `${backupFile}.zip`
    };
  } catch (error) {
    console.error('❌ Ошибка при создании дампа базы данных:', error);
    throw error;
  }
}

// Загрузка бэкапа в S3
async function uploadToS3(backupPath, filename) {
  if (!s3) {
    console.log('⚠️ S3 не настроен, пропуск загрузки');
    return;
  }
  
  try {
    console.log(`🔄 Загрузка бэкапа в S3: ${filename}`);
    
    const fileContent = await fs.readFile(backupPath);
    
    await s3.putObject({
      Bucket: config.s3.bucket,
      Key: `database/${filename}`,
      Body: fileContent,
      ContentType: 'application/zip'
    }).promise();
    
    console.log(`✅ Бэкап загружен в S3: s3://${config.s3.bucket}/database/${filename}`);
    
    // Удаляем локальный файл, если нужно только S3
    if (config.s3Only) {
      await fs.unlink(backupPath);
      console.log(`🗑️ Локальный файл удален: ${backupPath}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при загрузке бэкапа в S3:', error);
    throw error;
  }
}

// Очистка старых бэкапов
async function cleanupOldBackups() {
  try {
    console.log(`🔄 Очистка старых бэкапов (старше ${config.retention} дней)...`);
    
    // Очистка локальных бэкапов
    if (!config.s3Only) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention);
      
      const files = await fs.readdir(config.backupDir);
      
      for (const file of files) {
        if (!file.endsWith('.zip')) continue;
        
        const filePath = path.join(config.backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️ Удален старый локальный бэкап: ${file}`);
        }
      }
    }
    
    // Очистка бэкапов в S3
    if (s3 && !config.localOnly) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention);
      
      const { Contents } = await s3.listObjectsV2({
        Bucket: config.s3.bucket,
        Prefix: 'database/'
      }).promise();
      
      if (Contents && Contents.length > 0) {
        for (const object of Contents) {
          if (object.LastModified < cutoffDate) {
            await s3.deleteObject({
              Bucket: config.s3.bucket,
              Key: object.Key
            }).promise();
            
            console.log(`🗑️ Удален старый бэкап из S3: ${object.Key}`);
          }
        }
      }
    }
    
    console.log('✅ Очистка старых бэкапов завершена');
  } catch (error) {
    console.error('❌ Ошибка при очистке старых бэкапов:', error);
  }
}

// Главная функция
async function main() {
  console.log(`
🚀 VHM24 - Автоматическое резервное копирование базы данных
⏰ Дата: ${new Date().toISOString()}
  `);
  
  try {
    // Создаем директорию для бэкапов
    if (!config.s3Only) {
      await createBackupDir();
    }
    
    // Создаем дамп базы данных
    const backup = await createDatabaseDump();
    
    // Загружаем бэкап в S3
    if (!config.localOnly && s3) {
      await uploadToS3(backup.path, backup.filename);
    }
    
    // Очищаем старые бэкапы
    await cleanupOldBackups();
    
    console.log(`
✅ Резервное копирование завершено успешно
📂 Локальный путь: ${!config.s3Only ? backup.path : 'не сохранено локально'}
☁️ S3 путь: ${!config.localOnly && s3 ? `s3://${config.s3.bucket}/database/${backup.filename}` : 'не загружено в S3'}
    `);
  } catch (error) {
    console.error('❌ Ошибка при резервном копировании:', error);
    process.exit(1);
  }
}

// Запуск
main();
