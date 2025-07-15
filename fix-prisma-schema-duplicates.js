/**
 * Скрипт для исправления дублирующихся значений в схеме Prisma
 */

const fs = require('fs');
const path = require('path');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для исправления дублирующихся значений в enum
function fixDuplicateEnumValues(schemaContent) {
  // Находим enum TaskType
  const taskTypeEnumRegex = /enum\s+TaskType\s+{([^}]*)}/s;
  const match = schemaContent.match(taskTypeEnumRegex);
  
  if (!match) {
    log('Enum TaskType не найден в схеме', 'error');
    return schemaContent;
  }
  
  const enumContent = match[1];
  const enumValues = enumContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'));
  
  // Удаляем дублирующиеся значения
  const uniqueValues = [...new Set(enumValues)];
  
  log(`Найдено ${enumValues.length} значений, из них уникальных: ${uniqueValues.length}`, 'info');
  
  // Формируем новое содержимое enum
  const newEnumContent = `enum TaskType {\n  ${uniqueValues.join('\n  ')}\n}`;
  
  // Заменяем старый enum на новый
  const newSchemaContent = schemaContent.replace(taskTypeEnumRegex, newEnumContent);
  
  return newSchemaContent;
}

// Функция для исправления схемы Prisma
function fixPrismaSchema() {
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  
  // Проверяем наличие файла
  if (!fs.existsSync(schemaPath)) {
    log(`Файл ${schemaPath} не найден`, 'error');
    return false;
  }
  
  // Создаем резервную копию файла
  const backupPath = `${schemaPath}.backup-${Date.now()}`;
  fs.copyFileSync(schemaPath, backupPath);
  log(`Создана резервная копия схемы: ${backupPath}`, 'info');
  
  // Читаем содержимое файла
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Исправляем дублирующиеся значения
  const fixedSchemaContent = fixDuplicateEnumValues(schemaContent);
  
  // Записываем исправленное содержимое
  fs.writeFileSync(schemaPath, fixedSchemaContent);
  
  log('Схема Prisma успешно исправлена', 'success');
  return true;
}

// Функция для изменения провайдера базы данных
function changeDbProvider(provider = 'postgresql') {
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  
  // Проверяем наличие файла
  if (!fs.existsSync(schemaPath)) {
    log(`Файл ${schemaPath} не найден`, 'error');
    return false;
  }
  
  // Читаем содержимое файла
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Заменяем провайдер
  if (provider === 'postgresql') {
    // Заменяем SQLite на PostgreSQL
    schemaContent = schemaContent.replace(
      /provider = "sqlite"/,
      'provider = "postgresql"'
    );
    
    // Заменяем URL базы данных
    schemaContent = schemaContent.replace(
      /url = "file:\.\/dev\.db"/,
      'url = env("DATABASE_URL")'
    );
  } else if (provider === 'sqlite') {
    // Заменяем PostgreSQL на SQLite
    schemaContent = schemaContent.replace(
      /provider = "postgresql"/,
      'provider = "sqlite"'
    );
    
    // Заменяем URL базы данных
    schemaContent = schemaContent.replace(
      /url = env\("DATABASE_URL"\)/,
      'url = "file:./dev.db"'
    );
  }
  
  // Записываем измененное содержимое
  fs.writeFileSync(schemaPath, schemaContent);
  
  log(`Провайдер базы данных изменен на ${provider}`, 'success');
  return true;
}

// Главная функция
async function main() {
  log('=== ИСПРАВЛЕНИЕ СХЕМЫ PRISMA ===', 'title');
  
  try {
    // Исправляем дублирующиеся значения в enum
    const schemaFixed = fixPrismaSchema();
    
    if (!schemaFixed) {
      log('Не удалось исправить схему Prisma', 'error');
      return;
    }
    
    // Изменяем провайдер на PostgreSQL для Railway
    const providerChanged = changeDbProvider('postgresql');
    
    if (!providerChanged) {
      log('Не удалось изменить провайдер базы данных', 'error');
      return;
    }
    
    log('=== СХЕМА PRISMA УСПЕШНО ИСПРАВЛЕНА ===', 'title');
    log('', 'info');
    log('Теперь вы можете развернуть приложение в Railway, следуя инструкциям в VENDHUB_RAILWAY_DEPLOYMENT_GUIDE.md', 'info');
  } catch (error) {
    log(`Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
