const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 Запуск экстренного исправления критических ошибок VHM24\n');

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Создана директория: ${dirPath}`);
    return true;
  }
  return false;
}

// Функция для исправления синтаксических ошибок в файле
function fixSyntaxErrors(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ search, replace }) => {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлены синтаксические ошибки в ${filePath}`);
    return true;
  }

  return false;
}

// Функция для добавления обработки ошибок в async функции
function addErrorHandling(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ищем async функции без try-catch
  const asyncFuncRegex = /async\s+(?:function\s+\w+|\(\s*(?:\w+(?:,\s*\w+)*\s*)?\)\s*=>|[^{]*=>)\s*{(?![^{}]*try\s*{[^{}]*}[^{}]*catch[^{}]*{)/g;
  
  if (asyncFuncRegex.test(content)) {
    // Заменяем async функции, добавляя try-catch
    content = content.replace(asyncFuncRegex, (match) => {
      // Находим открывающую скобку функции
      const openBraceIndex = match.indexOf('{');
      
      if (openBraceIndex !== -1) {
        return match.substring(0, openBraceIndex + 1) + `
    try {
      ` + match.substring(openBraceIndex + 1);
      }
      
      return match;
    });
    
    // Добавляем catch блок перед закрывающими скобками функций
    let depth = 0;
    let result = '';
    let i = 0;
    
    while (i < content.length) {
      const char = content[i];
      
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        
        // Если это закрывающая скобка функции и нет catch блока
        if (depth === 0 && !content.substring(Math.max(0, i - 50), i).includes('catch')) {
          result += `
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }`;
        }
      }
      
      result += char;
      i++;
    }
    
    fs.writeFileSync(filePath, result);
    console.log(`✅ Добавлена обработка ошибок в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для добавления graceful shutdown
function addGracefulShutdown(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем, есть ли уже обработчики SIGINT и SIGTERM
  if (!content.includes('SIGINT') && !content.includes('SIGTERM')) {
    // Добавляем обработчики в конец файла
    const shutdownCode = `

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Получен сигнал SIGINT, выполняется graceful shutdown...');
  try {
    // Закрываем соединения с базой данных
    if (prisma) {
      await prisma.$disconnect();
      console.log('Соединение с базой данных закрыто');
    }
    
    // Закрываем fastify сервер, если он существует
    if (fastify) {
      await fastify.close();
      console.log('Fastify сервер остановлен');
    }
    
    console.log('Graceful shutdown завершен');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при выполнении graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, выполняется graceful shutdown...');
  try {
    // Закрываем соединения с базой данных
    if (prisma) {
      await prisma.$disconnect();
      console.log('Соединение с базой данных закрыто');
    }
    
    // Закрываем fastify сервер, если он существует
    if (fastify) {
      await fastify.close();
      console.log('Fastify сервер остановлен');
    }
    
    console.log('Graceful shutdown завершен');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при выполнении graceful shutdown:', error);
    process.exit(1);
  }
});
`;

    content += shutdownCode;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Добавлен graceful shutdown в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для создания скрипта kill-ports.js, если он не существует
function createKillPortsScript() {
  const scriptPath = path.join('scripts', 'kill-ports.js');
  
  if (!fs.existsSync(scriptPath)) {
    const scriptContent = `const { execSync } = require('child_process');

// Порты, которые нужно освободить
const ports = [
  8000, // auth
  8001, // inventory
  8002, // machines
  8003, // warehouse
  8004, // tasks
  3000, // gateway
  3001, // web-dashboard
  3009  // data-import
];

console.log('🔄 Освобождение портов...');

ports.forEach(port => {
  try {
    // Для Windows
    if (process.platform === 'win32') {
      const result = execSync(\`netstat -ano | findstr :$\{port}\`).toString();
      
      if (result) {
        const lines = result.split('\\n');
        
        lines.forEach(line => {
          const parts = line.trim().split(/\\s+/);
          if (parts.length > 4 && parts[1].includes(':' + port)) {
            const pid = parts[4];
            try {
              execSync(\`taskkill /F /PID $\{pid}\`);
              console.log(\`✅ Порт $\{port\} освобожден (PID: $\{pid\})\`);
            } catch (error) {
              // Игнорируем ошибки, если процесс не найден
            }
          }
        });
      }
    } 
    // Для Linux/Mac
    else {
      try {
        const pid = execSync(\`lsof -t -i:$\{port}\`).toString().trim();
        if (pid) {
          execSync(\`kill -9 $\{pid}\`);
          console.log(\`✅ Порт $\{port\} освобожден (PID: $\{pid\})\`);
        }
      } catch (error) {
        // Игнорируем ошибки, если процесс не найден
      }
    }
  } catch (error) {
    // Игнорируем ошибки, если порт не занят
  }
});

console.log('✅ Все порты проверены');
`;

    ensureDirectoryExists('scripts');
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`✅ Создан скрипт ${scriptPath}`);
    return true;
  }
  
  return false;
}

// Основные исправления

// 1. Создаем недостающие директории
console.log('\n📁 Создание недостающих директорий...');
const services = fs.readdirSync('services');
services.forEach(service => {
  const servicePath = path.join('services', service);
  
  if (fs.existsSync(servicePath) && fs.statSync(servicePath).isDirectory()) {
    // Создаем стандартные директории для каждого сервиса
    ['src', 'tests', 'docs'].forEach(dir => {
      ensureDirectoryExists(path.join(servicePath, dir));
    });
  }
});

// 2. Исправляем синтаксические ошибки
console.log('\n🔧 Исправление синтаксических ошибок...');

// Исправляем fs.await на await в файлах
const fsAwaitReplacements = [
  { search: 'fs.await fsPromises.readFile', replace: 'await fsPromises.readFile' },
  { search: 'fs.await fsPromises.writeFile', replace: 'await fsPromises.writeFile' },
  { search: 'fs.await fs.promises.readFile', replace: 'await fs.promises.readFile' },
  { search: 'fs.await fs.promises.writeFile', replace: 'await fs.promises.writeFile' }
];

// Список файлов для проверки
const filesToCheck = [
  'services/gateway/src/index.js',
  'services/telegram-bot/src/utils/s3Storage.js',
  'packages/shared/utils/pagination.js',
  'scripts/project-analyzer.js'
];

filesToCheck.forEach(filePath => {
  fixSyntaxErrors(filePath, fsAwaitReplacements);
});

// 3. Добавляем обработку ошибок в ключевые файлы
console.log('\n🛡️ Добавление обработки ошибок...');
const filesToAddErrorHandling = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js'
];

filesToAddErrorHandling.forEach(filePath => {
  addErrorHandling(filePath);
});

// 4. Добавляем graceful shutdown в ключевые файлы
console.log('\n🔄 Добавление graceful shutdown...');
const filesToAddGracefulShutdown = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js'
];

filesToAddGracefulShutdown.forEach(filePath => {
  addGracefulShutdown(filePath);
});

// 5. Создаем скрипт kill-ports.js
console.log('\n🔄 Создание скрипта kill-ports.js...');
createKillPortsScript();

console.log('\n✅ Экстренное исправление критических ошибок завершено!');
