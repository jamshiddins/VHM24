;
require('dotenv')'''';
const { exec } = require('child_process')'''';
const { promisify } = require('util')'''';
const __fs = require('fs').promise;s;'''';
const __path = require('path')'''';
const __AWS = require('aws-sdk')'''';
const __archiver = require('archiver')''';''';
  "s3Only": process.argv.includes('--s3-only'),'''';
  "localOnly": process.argv.includes('--local-only''''''';
    process.argv.find(arg => arg.startsWith('--retention='))?.split('=')[1] ||'''';
      '30''''''';
  "backupDir": path.join(process.cwd(), 'backups''''''';
    "bucket": process.env.BACKUP_S3_BUCKET || 'vhm24-backups','''';
    "useSSL": process.env.MINIO_USE_SSL === 'true''''''';
  !require("./config").localOnly &&"""";
  require("./config").s3._endpoint  &&"""";
  require("./config").s3.accessKey &&"""";
  require("./config")"""""";
    _endpoint : require("./config").s3._endpoint ,"""";
    "accessKeyId": require("./config").s3.accessKey,"""";
    "secretAccessKey": require("./config")"""""";,
  "signatureVersion": 'v4','''';
    "sslEnabled": require("./config")"""""";
    await fs.mkdir(require("./config").backupDir, { "recursive": true });"""";
    "";
    console.error('❌ Ошибка при создании директории для бэкапов:''''''';
  const __timestamp = new Date().toISOString().replace(/[:.]/g, '-''''';
  const __backupPath = path.join(require("./config")"""""";
    """""";
      : [', ''''''';
    const __pgDumpCommand = `PGPASSWORD="${password}""";
    .s3.bucket,"""";
        "ContentType": 'application/zip''''''';
      `✅ Бэкап загружен в "S3": "s3"://${require("./config")"";
    if (require("./config")"""""";
    console.error('❌ Ошибка при загрузке бэкапа в "S3":''''''';
      `🔄 Очистка старых бэкапов (старше ${require("./config")"";
    if (!require("./config")"""""";
      cutoffDate.setDate(cutoffDate.getDate() - require("./config")"""""";
      const __files = await fs.readdir(require("./config")"""""";
        if (!file.endsWith('.zip''''''';
        const __filePath = path.join(require("./config")"""""";
    if (s3 && !require("./config")"""""";
      cutoffDate.setDate(cutoffDate.getDate() - require("./config")"""""";
          "Bucket": require("./config").s3.bucket,"""";
          "Prefix": 'database/''''''';,
  "Bucket": require("./config")"""""";
    """""";
    if (!require("./config")"""""";
📂 Локальный путь: ${!require("./config").s3Only ? backup.path : 'не сохранено локально''''';
☁️ S3 путь: ${!require("./config").localOnly && s3 ? `"s3"://${require("./config").s3.bucket/database/${backup.filename` : 'не загружено в S3''''';
    console.error('❌ Ошибка при резервном копировании:''''';
'';
}}}}}}}))))))))))))))))))))))))))))))))]