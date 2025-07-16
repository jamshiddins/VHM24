/**
 * Скрипт для тестирования подключения к S3-хранилищу
 */
require('dotenv').config();
const S3Service = require('./backend/src/utils/s3');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Функция для логирования с цветом
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Функция для проверки переменных окружения
function checkEnvironmentVariables() {
  log('=== ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ДЛЯ S3 ===', 'blue');
  
  const requiredVariables = [
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_REGION',
    'S3_BUCKET_NAME',
    'S3_ENDPOINT',
    'S3_UPLOAD_URL'
  ];
  
  const missingVariables = [];
  
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      missingVariables.push(variable);
      log(`❌ ${variable}: отсутствует`, 'red');
    } else {
      log(`✅ ${variable}: ${variable.includes('KEY') ? '********' : process.env[variable]}`, 'green');
    }
  }
  
  if (missingVariables.length > 0) {
    log(`❌ Отсутствуют необходимые переменные окружения: ${missingVariables.join(', ')}`, 'red');
    return false;
  }
  
  log('✅ Все необходимые переменные окружения настроены', 'green');
  return true;
}

// Функция для тестирования подключения к S3
async function testS3Connection() {
  log('=== ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ К S3 ===', 'blue');
  
  try {
    log('Проверка подключения к S3...', 'blue');
    const connectionResult = await S3Service.testConnection();
    
    if (connectionResult) {
      log('✅ Подключение к S3 успешно установлено', 'green');
      log(`✅ Бакет: ${S3Service.getBucketName()}`, 'green');
      log(`✅ URL для загрузок: ${S3Service.getUploadsEndpoint()}`, 'green');
      return true;
    } else {
      log('❌ Не удалось подключиться к S3', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Ошибка при подключении к S3: ${error.message}`, 'red');
    return false;
  }
}

// Функция для тестирования загрузки файла в S3
async function testFileUpload() {
  log('=== ТЕСТИРОВАНИЕ ЗАГРУЗКИ ФАЙЛА В S3 ===', 'blue');
  
  try {
    // Создаем тестовый файл
    const testContent = 'Это тестовый файл для проверки загрузки в S3';
    const testBuffer = Buffer.from(testContent);
    const fileName = `test-file-${Date.now()}.txt`;
    
    log(`Загрузка тестового файла ${fileName}...`, 'blue');
    
    const uploadResult = await S3Service.uploadFile(testBuffer, fileName, 'text/plain', 'tests');
    
    if (uploadResult.success) {
      log('✅ Файл успешно загружен в S3', 'green');
      log(`✅ URL файла: ${uploadResult.url}`, 'green');
      log(`✅ Ключ файла: ${uploadResult.key}`, 'green');
      
      // Проверяем существование файла
      log('Проверка существования файла...', 'blue');
      const fileExists = await S3Service.fileExists(uploadResult.key);
      
      if (fileExists) {
        log('✅ Файл существует в S3', 'green');
      } else {
        log('❌ Файл не найден в S3', 'red');
      }
      
      // Удаляем тестовый файл
      log('Удаление тестового файла...', 'blue');
      const deleteResult = await S3Service.deleteFile(uploadResult.key);
      
      if (deleteResult.success) {
        log('✅ Файл успешно удален из S3', 'green');
      } else {
        log('❌ Не удалось удалить файл из S3', 'red');
      }
      
      return true;
    } else {
      log(`❌ Не удалось загрузить файл в S3: ${uploadResult.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Ошибка при тестировании загрузки файла: ${error.message}`, 'red');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ТЕСТИРОВАНИЕ S3-ХРАНИЛИЩА ===', 'magenta');
  
  // Проверка переменных окружения
  const envVarsOk = checkEnvironmentVariables();
  
  if (!envVarsOk) {
    log('❌ Проверка переменных окружения не пройдена', 'red');
    return;
  }
  
  // Тестирование подключения к S3
  const connectionOk = await testS3Connection();
  
  if (!connectionOk) {
    log('❌ Тестирование подключения к S3 не пройдено', 'red');
    return;
  }
  
  // Тестирование загрузки файла в S3
  const uploadOk = await testFileUpload();
  
  if (!uploadOk) {
    log('❌ Тестирование загрузки файла в S3 не пройдено', 'red');
    return;
  }
  
  // Итоговый результат
  log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'magenta');
  log('✅ Все тесты успешно пройдены', 'green');
  log('✅ S3-хранилище настроено и работает корректно', 'green');
}

// Запуск главной функции
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'red');
  process.exit(1);
});
