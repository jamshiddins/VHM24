const AWS = require('aws-sdk');
require('dotenv').config();

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow
  };
  console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function testDigitalOceanSpaces() {
  log('☁️ Тестирование DigitalOcean Spaces...', 'info');
  
  try {
    // Проверка переменных окружения
    const requiredVars = ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      log(`❌ Отсутствуют переменные: ${missingVars.join(', ')}`, 'error');
      return false;
    }

    log(`📡 Endpoint: ${process.env.S3_ENDPOINT}`, 'info');
    log(`📦 Bucket: ${process.env.S3_BUCKET}`, 'info');
    log(`🔑 Access Key: ${process.env.S3_ACCESS_KEY.substring(0, 8)}...`, 'info');
    
    // Настройка AWS SDK для DigitalOcean Spaces
    const spacesEndpoint = new AWS.Endpoint(process.env.S3_ENDPOINT);
    const s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'nyc3',
      s3ForcePathStyle: false,
      signatureVersion: 'v4'
    });
    
    log('🔄 Проверка доступа к bucket...', 'info');
    
    // Тест 1: Проверка существования bucket
    try {
      await s3.headBucket({ Bucket: process.env.S3_BUCKET }).promise();
      log('✅ Bucket существует и доступен', 'success');
    } catch (error) {
      if (error.statusCode === 404) {
        log('⚠️ Bucket не найден, попытка создания...', 'warning');
        try {
          await s3.createBucket({ 
            Bucket: process.env.S3_BUCKET,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.S3_REGION || 'nyc3'
            }
          }).promise();
          log('✅ Bucket успешно создан', 'success');
        } catch (createError) {
          if (createError.message.includes('Bucket already exists')) {
            log('⚠️ Bucket уже существует, но принадлежит другому аккаунту', 'warning');
            log('🔧 Попробуйте использовать другое имя bucket', 'warning');
            return false;
          } else {
            log(`❌ Ошибка создания bucket: ${createError.message}`, 'error');
            return false;
          }
        }
      } else if (error.statusCode === 403) {
        log('⚠️ Bucket существует, но нет прав доступа', 'warning');
        log('🔑 Проверьте права доступа для API ключей', 'warning');
        return false;
      } else {
        throw error;
      }
    }
    
    // Тест 2: Загрузка тестового файла
    log('📤 Тестирование загрузки файла...', 'info');
    const testKey = `test/infrastructure-test-${Date.now()}.txt`;
    const testContent = 'VHM24 Infrastructure Test - DigitalOcean Spaces';
    
    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'private'
    };
    
    const uploadResult = await s3.upload(uploadParams).promise();
    log('✅ Файл успешно загружен', 'success');
    log(`📍 URL: ${uploadResult.Location}`, 'info');
    
    // Тест 3: Чтение файла
    log('📥 Тестирование чтения файла...', 'info');
    const downloadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: testKey
    };
    
    const downloadResult = await s3.getObject(downloadParams).promise();
    const downloadedContent = downloadResult.Body.toString();
    
    if (downloadedContent === testContent) {
      log('✅ Файл успешно прочитан', 'success');
    } else {
      log('❌ Содержимое файла не совпадает', 'error');
      return false;
    }
    
    // Тест 4: Список объектов
    log('📋 Получение списка объектов...', 'info');
    const listParams = {
      Bucket: process.env.S3_BUCKET,
      MaxKeys: 10
    };
    
    const listResult = await s3.listObjectsV2(listParams).promise();
    log(`📊 Найдено объектов: ${listResult.KeyCount}`, 'info');
    
    // Тест 5: Удаление тестового файла
    log('🗑️ Удаление тестового файла...', 'info');
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: testKey
    }).promise();
    log('✅ Тестовый файл удален', 'success');
    
    // Итоговый результат
    console.log('\n' + '='.repeat(60));
    log('🎉 DigitalOcean Spaces работает корректно!', 'success');
    log(`📦 Bucket: ${process.env.S3_BUCKET}`, 'info');
    log(`🌍 Region: ${process.env.S3_REGION || 'nyc3'}`, 'info');
    log(`📊 Объектов в bucket: ${listResult.KeyCount}`, 'info');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    log(`❌ Ошибка DigitalOcean Spaces: ${error.message}`, 'error');
    
    if (error.code === 'InvalidAccessKeyId') {
      log('🔑 Проверьте правильность S3_ACCESS_KEY', 'warning');
    } else if (error.code === 'SignatureDoesNotMatch') {
      log('🔐 Проверьте правильность S3_SECRET_KEY', 'warning');
    } else if (error.code === 'NoSuchBucket') {
      log('📦 Bucket не существует, попробуйте создать его', 'warning');
    }
    
    console.log('\n' + '='.repeat(60));
    log('❌ DigitalOcean Spaces требует настройки', 'error');
    console.log('='.repeat(60));
    
    return false;
  }
}

// Запуск тестирования
if (require.main === module) {
  testDigitalOceanSpaces().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = testDigitalOceanSpaces;
