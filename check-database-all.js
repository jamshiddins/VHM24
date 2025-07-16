/**
 * Скрипт для комплексной проверки базы данных
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    console.log(`\n\n=== ВЫПОЛНЕНИЕ КОМАНДЫ: ${command} ===\n`);
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      ...options 
    });
    return { success: true, result };
  } catch (error) {
    console.error(`\n❌ Ошибка выполнения команды: ${error.message}`);
    return { success: false, error };
  }
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Функция для комплексной проверки базы данных
async function checkDatabaseAll() {
  console.log('=== КОМПЛЕКСНАЯ ПРОВЕРКА БАЗЫ ДАННЫХ ===');
  console.log('Дата и время: ' + new Date().toISOString());
  console.log('');
  
  // Список скриптов для проверки
  const scripts = [
    'check-database-connection.js',
    'check-database-queries.js',
    'check-database-services.js',
    'check-database-migrations.js'
  ];
  
  // Проверяем наличие всех скриптов
  const missingScripts = scripts.filter(script => !checkFileExists(script));
  
  if (missingScripts.length > 0) {
    console.error(`❌ Следующие скрипты не найдены: ${missingScripts.join(', ')}`);
    return false;
  }
  
  // Результаты выполнения скриптов
  const results = [];
  
  // Выполняем каждый скрипт
  for (const script of scripts) {
    const result = executeCommand(`node ${script}`);
    results.push({
      script,
      success: result.success
    });
  }
  
  // Выводим итоговый результат
  console.log('\n\n=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
  
  for (const result of results) {
    console.log(`${result.success ? '✅' : '❌'} ${result.script}`);
  }
  
  const successCount = results.filter(result => result.success).length;
  const totalCount = results.length;
  
  console.log(`\nОбщий результат: ${successCount}/${totalCount} проверок успешно`);
  
  if (successCount === totalCount) {
    console.log('✅ Все проверки успешно пройдены');
  } else {
    console.log(`⚠️ ${totalCount - successCount} проверок не пройдено`);
  }
  
  console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');
  return successCount === totalCount;
}

// Запускаем проверку
checkDatabaseAll().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
});
