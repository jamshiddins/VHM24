const logger = require('@vhm24/shared/logger');

const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

class SafeFixer {
  constructor() {
    this.backups = [];
    this.changes = [];
  }

  // Создание резервных копий перед изменениями
  backup(filePath) {
    if (!fs.existsSync(filePath)) {
      logger.info(`⚠️ File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.await fsPromises.readFile(filePath, 'utf8');
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.await fsPromises.writeFile(backupPath, content);
    this.backups.push({ original: filePath, backup: backupPath });
    logger.info(`📦 Backup created: ${backupPath}`);
    return true;
  }

  // Безопасное изменение файла
  safeModify(filePath, modifier, description) {
    try {
      if (!this.backup(filePath)) {
        this.changes.push({ file: filePath, success: false, error: 'File not found' });
        return;
      }
      
      const content = fs.await fsPromises.readFile(filePath, 'utf8');
      const modified = modifier(content);
      
      if (content === modified) {
        logger.info(`ℹ️ No changes needed: ${filePath}`);
        this.changes.push({ file: filePath, success: true, description, noChanges: true });
        return;
      }
      
      fs.await fsPromises.writeFile(filePath, modified);
      this.changes.push({ file: filePath, success: true, description });
      logger.info(`✅ Modified: ${filePath} - ${description}`);
    } catch (error) {
      logger.error(`❌ Failed to modify ${filePath}: ${error.message}`);
      this.changes.push({ file: filePath, success: false, error: error.message, description });
    }
  }

  // Откат изменений
  rollback() {
    logger.info('🔄 Rolling back changes...');
    for (const { original, backup } of this.backups.reverse()) {
      try {
        fs.copyFileSync(backup, original);
        fs.unlinkSync(backup);
        logger.info(`↩️ Restored: ${original}`);
      } catch (error) {
        logger.error(`❌ Failed to restore ${original}: ${error.message}`);
      }
    }
  }

  // Исправление PORT для Railway
  fixPortConfiguration() {
    logger.info('\n🔧 Fixing PORT configuration for Railway...');
    
    const services = fs.readdirSync('services');
    
    for (const service of services) {
      const indexPath = path.join('services', service, 'src', 'index.js');
      
      if (fs.existsSync(indexPath)) {
        this.safeModify(indexPath, (content) => {
          // Заменяем фиксированные порты на process.env.PORT
          if (content.includes('const PORT =') && !content.includes('process.env.PORT')) {
            const servicePortMap = {
              'gateway': '8000',
              'auth': '3001',
              'machines': '3002',
              'inventory': '3003',
              'tasks': '3004',
              'telegram-bot': '3005',
              'notifications': '3006',
              'audit': '3007',
              'data-import': '3008',
              'backup': '3009',
              'monitoring': '3010',
              'routes': '3011',
              'warehouse': '3012',
              'recipes': '3013',
              'bunkers': '3014',
              'reconciliation': '3015'
            };
            
            const defaultPort = servicePortMap[service] || '3000';
            return content.replace(
              /const PORT = \d+;?/g,
              `const PORT = process.env.PORT || ${defaultPort};`
            );
          }
          return content;
        }, `Fixed PORT configuration for ${service}`);
      }
    }
  }

  // Добавление health checks
  addHealthChecks() {
    logger.info('\n🏥 Adding health checks...');
    
    const services = fs.readdirSync('services');
    
    for (const service of services) {
      const indexPath = path.join('services', service, 'src', 'index.js');
      
      if (fs.existsSync(indexPath)) {
        this.safeModify(indexPath, (content) => {
          if (!content.includes("'/health'") && !content.includes('"/health"')) {
            // Определяем тип сервиса для правильного health check
            const isTelegramBot = service === 'telegram-bot';
            const usesFastify = content.includes('fastify');
            
            let healthCheck;
            
            if (isTelegramBot && !usesFastify) {
              // Для Telegram Bot без Fastify
              healthCheck = `
// Health check endpoint for Railway
const express = require('express');
const healthApp = express();
const healthPort = process.env.PORT || 3005;

healthApp.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '${service}',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bot: bot ? 'connected' : 'disconnected'
  });
});

healthApp.listen(healthPort, () => {
  logger.info(\`Health check server running on port \${healthPort}\`);
});

`;
            } else if (usesFastify) {
              // Для сервисов с Fastify
              healthCheck = `
// Health check endpoint for Railway
fastify.get('/health', async (request, reply) => {
  try {
    // Проверка подключения к БД если есть prisma
    ${content.includes('prisma') ? 'await prisma.$queryRaw`SELECT 1`;' : ''}
    
    return {
      status: 'ok',
      service: '${service}',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    reply.code(503).send({
      status: 'error',
      service: '${service}',
      error: 'Service health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

`;
            } else {
              // Базовый health check
              healthCheck = `
// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '${service}',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

`;
            }
            
            // Вставляем health check перед запуском сервера
            const patterns = [
              /(fastify\.listen\()/,
              /(app\.listen\()/,
              /(bot\.launch\(\))/,
              /(console\.log.*started)/i
            ];
            
            for (const pattern of patterns) {
              if (pattern.test(content)) {
                return content.replace(pattern, healthCheck + '$1');
              }
            }
            
            // Если не нашли подходящее место, добавляем в конец
            return content + '\n' + healthCheck;
          }
          return content;
        }, `Added health check for ${service}`);
      }
    }
  }

  // Исправление start script для reconciliation
  fixReconciliationStartScript() {
    logger.info('\n📝 Fixing reconciliation start script...');
    
    const reconciliationPkgPath = 'services/reconciliation/package.json';
    
    if (fs.existsSync(reconciliationPkgPath)) {
      this.safeModify(reconciliationPkgPath, (content) => {
        const pkg = JSON.parse(content);
        
        if (!pkg.scripts) {
          pkg.scripts = {};
        }
        
        if (!pkg.scripts.start) {
          pkg.scripts.start = 'node src/index.js';
          pkg.scripts.dev = 'nodemon src/index.js';
        }
        
        return JSON.stringify(pkg, null, 2);
      }, 'Added start script to reconciliation service');
    } else {
      logger.info('⚠️ Reconciliation service package.json not found');
    }
  }

  // Создание S3 адаптера
  createS3Adapter() {
    logger.info('\n☁️ Creating S3 adapter...');
    
    const storageDir = 'packages/shared/storage';
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const s3AdapterContent = `
// S3 Storage Adapter for Railway deployment
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class S3StorageAdapter {
  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    this.bucket = process.env.S3_BUCKET;
    
    if (!this.bucket) {
      logger.warn('⚠️ S3_BUCKET not configured, using local storage fallback');
    }
  }

  async upload(key, buffer, contentType = 'application/octet-stream') {
    if (!this.bucket) {
      return this.localFallback('upload', key, buffer);
    }
    
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      };
      
      const result = await this.s3.upload(params).promise();
      return {
        success: true,
        url: result.Location,
        key: result.Key
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      return this.localFallback('upload', key, buffer);
    }
  }
  
  async download(key) {
    if (!this.bucket) {
      return this.localFallback('download', key);
    }
    
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      const result = await this.s3.getObject(params).promise();
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType
      };
    } catch (error) {
      logger.error('S3 download error:', error);
      return this.localFallback('download', key);
    }
  }
  
  getSignedUrl(key, expires = 3600) {
    if (!this.bucket) {
      return \`/uploads/\${key}\`;
    }
    
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expires
      });
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      return \`/uploads/\${key}\`;
    }
  }
  
  async delete(key) {
    if (!this.bucket) {
      return this.localFallback('delete', key);
    }
    
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }).promise();
      
      return { success: true };
    } catch (error) {
      logger.error('S3 delete error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Локальный fallback для разработки
  localFallback(operation, key, data) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, key);
    
    switch (operation) {
      case 'upload':
        fs.await fsPromises.writeFile(filePath, data);
        return {
          success: true,
          url: \`/uploads/\${key}\`,
          key: key,
          fallback: true
        };
        
      case 'download':
        if (fs.existsSync(filePath)) {
          return {
            success: true,
            data: fs.await fsPromises.readFile(filePath),
            fallback: true
          };
        }
        return { success: false, error: 'File not found' };
        
      case 'delete':
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return { success: true, fallback: true };
        
      default:
        return { success: false, error: 'Unknown operation' };
    }
  }
}

module.exports = S3StorageAdapter;
`;
    
    const s3AdapterPath = path.join(storageDir, 's3.js');
    fs.await fsPromises.writeFile(s3AdapterPath, s3AdapterContent.trim());
    this.changes.push({ 
      file: s3AdapterPath, 
      success: true, 
      description: 'Created S3 storage adapter',
      created: true 
    });
    logger.info(`✅ Created S3 adapter: ${s3AdapterPath}`);
    
    // Создаем индексный файл для storage
    const indexContent = `
const S3StorageAdapter = require('./s3');

module.exports = {
  S3StorageAdapter,
  // Создаем singleton instance
  storage: new S3StorageAdapter()
};
`;
    
    const indexPath = path.join(storageDir, 'index.js');
    fs.await fsPromises.writeFile(indexPath, indexContent.trim());
    this.changes.push({ 
      file: indexPath, 
      success: true, 
      description: 'Created storage index file',
      created: true 
    });
    logger.info(`✅ Created storage index: ${indexPath}`);
  }

  // Обновление зависимостей
  updateDependencies() {
    logger.info('\n📦 Updating problematic dependencies...');
    
    const problematicServices = [
      { service: 'data-import', dependency: 'xlsx', currentVersion: '^0.18.5', newVersion: '^0.20.0' },
      { service: 'notifications', dependency: 'node-telegram-bot-api', currentVersion: '^0.64.0', newVersion: '^0.66.0' },
      { service: 'telegram-bot', dependency: 'node-telegram-bot-api', currentVersion: '^0.63.0', newVersion: '^0.66.0' },
      { service: 'telegram-bot', dependency: 'pdfkit', currentVersion: '^0.14.0', newVersion: '^0.15.0' }
    ];
    
    for (const { service, dependency, currentVersion, newVersion } of problematicServices) {
      const pkgPath = path.join('services', service, 'package.json');
      
      if (fs.existsSync(pkgPath)) {
        this.safeModify(pkgPath, (content) => {
          const pkg = JSON.parse(content);
          
          if (pkg.dependencies && pkg.dependencies[dependency] === currentVersion) {
            pkg.dependencies[dependency] = newVersion;
            logger.info(`  📈 ${service}: ${dependency} ${currentVersion} → ${newVersion}`);
          }
          
          return JSON.stringify(pkg, null, 2);
        }, `Updated ${dependency} in ${service}`);
      }
    }
    
    // Добавляем aws-sdk если его нет в shared пакете
    const sharedPkgPath = 'packages/shared/package.json';
    if (fs.existsSync(sharedPkgPath)) {
      this.safeModify(sharedPkgPath, (content) => {
        const pkg = JSON.parse(content);
        
        if (!pkg.dependencies) {
          pkg.dependencies = {};
        }
        
        if (!pkg.dependencies['aws-sdk']) {
          pkg.dependencies['aws-sdk'] = '^2.1691.0';
          logger.info('  📈 Added aws-sdk to shared package');
        }
        
        return JSON.stringify(pkg, null, 2);
      }, 'Added aws-sdk dependency');
    }
  }

  // Создание отчета об изменениях
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      backups: this.backups,
      changes: this.changes,
      summary: {
        total: this.changes.length,
        successful: this.changes.filter(c => c.success).length,
        failed: this.changes.filter(c => !c.success).length,
        created: this.changes.filter(c => c.created).length,
        noChanges: this.changes.filter(c => c.noChanges).length
      }
    };
    
    fs.await fsPromises.writeFile('safe-fixes-report.json', JSON.stringify(report, null, 2));
    logger.info('\n📄 Report saved: safe-fixes-report.json');
    
    // Вывод статистики
    logger.info('\n📊 Summary:');
    logger.info(`  ✅ Successful changes: ${report.summary.successful}`);
    logger.info(`  ❌ Failed changes: ${report.summary.failed}`);
    logger.info(`  📁 Files created: ${report.summary.created}`);
    logger.info(`  ℹ️ No changes needed: ${report.summary.noChanges}`);
    
    if (report.summary.failed > 0) {
      logger.info('\n❌ Failed changes:');
      this.changes.filter(c => !c.success).forEach(change => {
        logger.info(`  - ${change.file}: ${change.error}`);
      });
    }
  }
}

// Запуск безопасных исправлений
const fixer = new SafeFixer();

// Обработка rollback
if (process.argv.includes('--rollback')) {
  logger.info('🔄 Rollback mode activated');
  // Загружаем предыдущий отчет для rollback
  if (fs.existsSync('safe-fixes-report.json')) {
    const report = JSON.parse(fs.await fsPromises.readFile('safe-fixes-report.json', 'utf8'));
    fixer.backups = report.backups;
    fixer.rollback();
  } else {
    logger.info('❌ No backup report found');
  }
  process.exit(0);
}

try {
  logger.info('🚀 Starting safe fixes for Railway deployment...\n');
  
  // 1. Исправление конфигурации портов
  fixer.fixPortConfiguration();
  
  // 2. Добавление health checks
  fixer.addHealthChecks();
  
  // 3. Исправление reconciliation start script
  fixer.fixReconciliationStartScript();
  
  // 4. Создание S3 адаптера
  fixer.createS3Adapter();
  
  // 5. Обновление зависимостей
  fixer.updateDependencies();
  
  // 6. Генерация отчета
  fixer.generateReport();
  
  logger.info('\n✅ Safe fixes completed successfully!');
  logger.info('💡 To rollback changes, run: node scripts/safe-fixes.js --rollback');
  logger.info('🔍 Next step: Run comprehensive test to verify changes');
  
} catch (error) {
  logger.error('\n❌ Error during fixes:', error);
  logger.info('🔄 Rolling back changes...');
  fixer.rollback();
  process.exit(1);
}
