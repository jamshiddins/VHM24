const fs = require('fs');
const path = require('path');

// Функция для проверки обработки ошибок
function checkErrorHandling() {
  console.log('Проверка обработки ошибок...');
  
  try {
    // Проверка наличия try-catch блоков в файлах
    const directories = [
      path.join(__dirname, '..', 'telegram-bot', 'src', 'handlers'),
      path.join(__dirname, '..', 'telegram-bot', 'src', 'services'),
      path.join(__dirname, '..', 'telegram-bot', 'src', 'middleware'),
      path.join(__dirname, '..', 'backend', 'routes'),
      path.join(__dirname, '..', 'backend', 'controllers')
    ];
    
    let totalFiles = 0;
    let filesWithTryCatch = 0;
    let filesWithoutTryCatch = [];
    
    // Рекурсивная функция для обхода директорий
    function processDirectory(dirPath) {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          processDirectory(filePath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
          totalFiles++;
          
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('try {') && content.includes('catch (')) {
            filesWithTryCatch++;
          } else {
            filesWithoutTryCatch.push(filePath);
          }
        }
      }
    }
    
    // Обрабатываем все директории
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        processDirectory(dir);
      }
    }
    
    // Проверка наличия централизованного обработчика ошибок
    const errorHandlerPaths = [
      path.join(__dirname, '..', 'telegram-bot', 'src', 'utils', 'errorHandler.js'),
      path.join(__dirname, '..', 'backend', 'middleware', 'errorHandler.js')
    ];
    
    let hasErrorHandler = false;
    
    for (const errorHandlerPath of errorHandlerPaths) {
      if (fs.existsSync(errorHandlerPath)) {
        hasErrorHandler = true;
        console.log(`✅ Найден централизованный обработчик ошибок: ${errorHandlerPath}`);
      }
    }
    
    if (!hasErrorHandler) {
      console.warn('⚠️ Централизованный обработчик ошибок не найден');
    }
    
    // Проверка наличия логирования ошибок
    const loggerPaths = [
      path.join(__dirname, '..', 'telegram-bot', 'src', 'utils', 'logger.js'),
      path.join(__dirname, '..', 'backend', 'utils', 'logger.js')
    ];
    
    let hasLogger = false;
    
    for (const loggerPath of loggerPaths) {
      if (fs.existsSync(loggerPath)) {
        hasLogger = true;
        console.log(`✅ Найден логгер: ${loggerPath}`);
      }
    }
    
    if (!hasLogger) {
      console.warn('⚠️ Логгер не найден');
    }
    
    // Вывод результатов
    console.log(`\nПроверено файлов: ${totalFiles}`);
    console.log(`Файлов с try-catch блоками: ${filesWithTryCatch} (${Math.round(filesWithTryCatch / totalFiles * 100)}%)`);
    
    if (filesWithoutTryCatch.length > 0) {
      console.warn(`\nФайлы без try-catch блоков (${filesWithoutTryCatch.length}):`);
      filesWithoutTryCatch.forEach(file => {
        console.warn(`- ${file.replace(__dirname + '/../', '')}`);
      });
    }
    
    console.log('\nПроверка обработки ошибок завершена.');
  } catch (error) {
    console.error('Ошибка при проверке обработки ошибок:', error);
    process.exit(1);
  }
}

// Запуск проверки обработки ошибок
checkErrorHandling();
