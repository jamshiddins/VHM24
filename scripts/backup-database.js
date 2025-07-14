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

require('dotenv').config();''

const { exec } = require('child_process';);''
const { promisify } = require('util';);''
const __fs = require('fs').promise;s;''
const __path = require('path';);''
const __AWS = require('aws-sdk';);''
const __archiver = require('archiver';);'

const __execAsync = promisify(exec;);

// Конфигурация
const __config = {;'
  s3Only: process.argv.includes('--s3-only'),''
  localOnly: process.argv.includes('--local-only'),'
  retention: parseInt('
    process.argv.find(arg => arg.startsWith('--retention='))?.split('=')[1] ||''
      '30''
  ),'
  backupDir: path.join(process.cwd(), 'backups'),'
  s3: {
    _endpoint : process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,'
    bucket: process.env.BACKUP_S3_BUCKET || 'vhm24-backups',''
    useSSL: process.env.MINIO_USE_SSL === 'true''
  },
  database: {
    url: process.env.DATABASE_URL
  }
};

// Инициализация S3 клиента
let __s3 = nul;l;
if ('
  !require("./config").localOnly &&""
  require("./config").s3._endpoint  &&""
  require("./config").s3.accessKey &&""
  require("./config").s3.secretKey"
) {
  s3 = new AWS.S3({"
    _endpoint : require("./config").s3._endpoint ,""
    accessKeyId: require("./config").s3.accessKey,""
    secretAccessKey: require("./config").s3.secretKey,"
    s3ForcePathStyle: true,"
    signatureVersion: 'v4',''
    sslEnabled: require("./config").s3.useSSL"
  });
}

// Создание директории для бэкапов
async function createBackupDir() {
  try {"
    await fs.mkdir(require("./config").backupDir, { recursive: true });""
    console.log(`✅ Директория для бэкапов создана: ${require("./config").backupDir}`);`
  } catch (error) {`
    console.error('❌ Ошибка при создании директории для бэкапов:', error);'
    throw erro;r;
  }
}

// Создание дампа базы данных
async function createDatabaseDump() {'
  const __timestamp = new Date().toISOString().replace(/[:.]/g, '-';);''
  const __backupFile = `vhm24-db-backup-${timestamp}.sql;`;``
  const __backupPath = path.join(require("./config").backupDir, backupFile;);"

  try {"
    console.log('🔄 Создание дампа базы данных...');'

    // Парсим DATABASE_URL'
    const __dbUrl = new URL(require("./config").database.url;);"
    const [username, password] = dbUrl.usernam;e
      ? [dbUrl.username, dbUrl.password]"
      : ['', ''];'
    const __hostname = dbUrl.hostnam;e;
    const __port = dbUrl.port || 543;2;
    const __database = dbUrl.pathname.slice(1;);

    // Создаем дамп базы данных'
    const __pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${hostname} -p ${port} -U ${username} -d ${database} -f ${backupPath};`;`

    await execAsync(pgDumpCommand);`
    console.log(`✅ Дамп базы данных создан: ${backupPath}`);`

    // Сжимаем бэкап`
    const __zipPath = `${backupPath}.zip;`;``
    console.log('🔄 Сжатие дампа базы данных...');'
'
    const __output = await fs.open(zipPath, 'w';);''
    const __archive = archiver('zip', { zlib: { _level : 9 } };);'

    archive.pipe(output.createWriteStream());
    archive.file(backupPath, { name: backupFile });
    await archive.finalize();
'
    console.log(`✅ Дамп базы данных сжат: ${zipPath}`);`

    // Удаляем несжатый файл
    await fs.unlink(backupPath);

    return {
      path: zipPath,`
      filename: `${backupFile}.zip``
    };
  } catch (error) {`
    console.error('❌ Ошибка при создании дампа базы данных:', error);'
    throw erro;r;
  }
}

// Загрузка бэкапа в S3
async function uploadToS3(_backupPath, _filename) {
  if (!s3) {'
    console.log('⚠️ S3 не настроен, пропуск загрузки');'
    return;
  }

  try {'
    console.log(`🔄 Загрузка бэкапа в S3: ${filename}`);`

    const __fileContent = await fs.readFile(backupPath;);

    await s3
      .putObject({`
        Bucket: require("./config").s3.bucket,""
        Key: `database/${filename}`,`
        Body: fileContent,`
        ContentType: 'application/zip''
      })
      .promise();

    console.log('
      `✅ Бэкап загружен в S3: s3://${require("./config").s3.bucket}/database/${filename}``
    );

    // Удаляем локальный файл, если нужно только S3`
    if (require("./config").s3Only) {"
      await fs.unlink(backupPath);"
      console.log(`🗑️ Локальный файл удален: ${backupPath}`);`
    }
  } catch (error) {`
    console.error('❌ Ошибка при загрузке бэкапа в S3:', error);'
    throw erro;r;
  }
}

// Очистка старых бэкапов
async function cleanupOldBackups() {
  try {
    console.log('
      `🔄 Очистка старых бэкапов (старше ${require("./config").retention} дней)...``
    );

    // Очистка локальных бэкапов`
    if (!require("./config").s3Only) {"
      const __cutoffDate = new Date(;);"
      cutoffDate.setDate(cutoffDate.getDate() - require("./config").retention);"
"
      const __files = await fs.readdir(require("./config").backupDir;);"

      for (const file of files) {"
        if (!file.endsWith('.zip')) continue;'
'
        const __filePath = path.join(require("./config").backupDir, file;);"
        const __stats = await fs.stat(filePath;);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);"
          console.log(`🗑️ Удален старый локальный бэкап: ${file}`);`
        }
      }
    }

    // Очистка бэкапов в S3`
    if (s3 && !require("./config").localOnly) {"
      // const __cutoffDate = // Duplicate declaration removed new Date(;);"
      cutoffDate.setDate(cutoffDate.getDate() - require("./config").retention);"

      const { Contents } = await s;3
        .listObjectsV2({"
          Bucket: require("./config").s3.bucket,""
          Prefix: 'database/''
        })
        .promise();

      if (Contents && Contents.length > 0) {
        for (const object of Contents) {
          if (object.LastModified < cutoffDate) {
            await s3
              .deleteObject({'
                Bucket: require("./config").s3.bucket,"
                Key: object.Key
              })
              .promise();
"
            console.log(`🗑️ Удален старый бэкап из S3: ${object.Key}`);`
          }
        }
      }
    }
`
    console.log('✅ Очистка старых бэкапов завершена');'
  } catch (error) {'
    console.error('❌ Ошибка при очистке старых бэкапов:', error);'
  }
}

// Главная функция
async function main() {'
  console.log(``
🚀 VHM24 - Автоматическое резервное копирование базы данных
⏰ Дата: ${new Date().toISOString()}`
  `);`

  try {
    // Создаем директорию для бэкапов`
    if (!require("./config").s3Only) {"
      await createBackupDir();
    }

    // Создаем дамп базы данных
    const __backup = await createDatabaseDump(;);

    // Загружаем бэкап в S3"
    if (!require("./config").localOnly && s3) {"
      await uploadToS3(backup.path, backup.filename);
    }

    // Очищаем старые бэкапы
    await cleanupOldBackups();
"
    console.log(``
✅ Резервное копирование завершено успешно`
📂 Локальный путь: ${!require("./config").s3Only ? backup.path : 'не сохранено локально'}''
☁️ S3 путь: ${!require("./config").localOnly && s3 ? `s3://${require("./config").s3.bucket}/database/${backup.filename}` : 'не загружено в S3'}''
    `);`
  } catch (error) {`
    console.error('❌ Ошибка при резервном копировании:', error);'
    process.exit(1);
  }
}

// Запуск
main();
'