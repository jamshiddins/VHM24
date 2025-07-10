const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Запуск комплексного исправления проекта VHM24...\n');

// Функция для выполнения команды и вывода результата
function runCommand(command, options = {}) {
  console.log(`Выполнение команды: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`❌ Ошибка при выполнении команды: ${command}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return null;
  }
}

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Создана директория: ${dirPath}`);
    return true;
  }
  return false;
}

// Шаг 1: Создание Dockerfile для совместимой среды
console.log('\n📋 Шаг 1: Создание Dockerfile для совместимой среды');
const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

# Установка зависимостей для сборки нативных модулей
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Запуск приложения
CMD ["node", "start-optimized.js"]
`;

fs.writeFileSync('Dockerfile.compatible', dockerfileContent);
console.log('✅ Создан Dockerfile.compatible');

// Шаг 2: Создание docker-compose.yml для запуска в совместимой среде
console.log('\n📋 Шаг 2: Создание docker-compose.yml для совместимой среды');
const dockerComposeContent = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.compatible
    ports:
      - "8000:8000"
      - "3001:3001"
      - "3002:3002"
      - "3003:3003"
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/vhm24
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=vhm24
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
`;

fs.writeFileSync('docker-compose.compatible.yml', dockerComposeContent);
console.log('✅ Создан docker-compose.compatible.yml');

// Шаг 3: Создание скрипта для запуска в Docker
console.log('\n📋 Шаг 3: Создание скрипта для запуска в Docker');
const runDockerContent = `#!/bin/bash
# Запуск проекта в Docker-контейнере с совместимой версией Node.js

echo "🚀 Запуск VHM24 в Docker-контейнере..."

# Остановка и удаление существующих контейнеров
docker-compose -f docker-compose.compatible.yml down

# Сборка и запуск контейнеров
docker-compose -f docker-compose.compatible.yml up --build
`;

fs.writeFileSync('run-in-docker.sh', runDockerContent);
fs.chmodSync('run-in-docker.sh', 0o755);
console.log('✅ Создан скрипт run-in-docker.sh');

// Шаг 4: Создание скрипта для Windows
console.log('\n📋 Шаг 4: Создание скрипта для Windows');
const runDockerBatContent = `@echo off
echo 🚀 Запуск VHM24 в Docker-контейнере...

REM Остановка и удаление существующих контейнеров
docker-compose -f docker-compose.compatible.yml down

REM Сборка и запуск контейнеров
docker-compose -f docker-compose.compatible.yml up --build
`;

fs.writeFileSync('run-in-docker.bat', runDockerBatContent);
console.log('✅ Создан скрипт run-in-docker.bat');

// Шаг 5: Исправление package.json
console.log('\n📋 Шаг 5: Исправление package.json');
if (checkFileExists('package.json')) {
  let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Удаление проблемных зависимостей
  const problematicDeps = ['canvas', 'node-canvas', 'fast-jwt'];
  let removedDeps = [];
  
  if (packageJson.dependencies) {
    problematicDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        delete packageJson.dependencies[dep];
        removedDeps.push(dep);
      }
    });
  }
  
  // Добавление альтернативных зависимостей
  if (removedDeps.includes('canvas') || removedDeps.includes('node-canvas')) {
    packageJson.dependencies['skia-canvas'] = "^0.9.30";
    console.log('✅ Заменен canvas на skia-canvas');
  }
  
  if (removedDeps.includes('fast-jwt')) {
    packageJson.dependencies['jsonwebtoken'] = "^9.0.0";
    console.log('✅ Заменен fast-jwt на jsonwebtoken');
  }
  
  // Добавление скриптов для Docker
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['docker:start'] = 'docker-compose -f docker-compose.compatible.yml up --build';
  packageJson.scripts['docker:stop'] = 'docker-compose -f docker-compose.compatible.yml down';
  packageJson.scripts['docker:shell'] = 'docker-compose -f docker-compose.compatible.yml exec app sh';
  
  // Обновление скриптов для тестов
  packageJson.scripts.test = 'jest';
  packageJson.scripts['test:watch'] = 'jest --watch';
  packageJson.scripts['test:coverage'] = 'jest --coverage';
  
  // Добавление engines для указания совместимых версий Node.js
  packageJson.engines = {
    "node": ">=16 <22",
    "npm": ">=7"
  };
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Обновлен package.json');
}

// Шаг 6: Создание .nvmrc для указания совместимой версии Node.js
console.log('\n📋 Шаг 6: Создание .nvmrc');
fs.writeFileSync('.nvmrc', '18.16.0');
console.log('✅ Создан .nvmrc с указанием Node.js 18.16.0');

// Шаг 7: Создание .node-version для указания совместимой версии Node.js (для nodenv)
console.log('\n📋 Шаг 7: Создание .node-version');
fs.writeFileSync('.node-version', '18.16.0');
console.log('✅ Создан .node-version с указанием Node.js 18.16.0');

// Шаг 8: Создание скрипта для исправления импортов fast-jwt
console.log('\n📋 Шаг 8: Создание скрипта для исправления импортов fast-jwt');
const fixFastJwtContent = `const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов fast-jwt...');

// Проверка наличия glob
try {
  require.resolve('glob');
} catch (e) {
  console.log('📦 Установка пакета glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('✅ Пакет glob установлен');
}

// Находим все JS файлы в проекте
console.log('🔍 Поиск JS файлов...');
const jsFiles = glob.sync('**/*.js', {
  ignore: [
    'node_modules/**', 
    'dist/**', 
    'build/**', 
    'scripts/fix-fast-jwt.js',
    '**/*.min.js'
  ]
});

console.log(\`📋 Найдено \${jsFiles.length} JS файлов для обработки\`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты fast-jwt на jsonwebtoken
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Проверяем, содержит ли файл импорты fast-jwt
    const hasFastJwt = content.includes('fast-jwt') || 
                       content.includes('createSigner') || 
                       content.includes('createVerifier');
    
    if (!hasFastJwt) {
      skippedFiles++;
      return;
    }
    
    // Заменяем импорты fast-jwt на jsonwebtoken
    let modified = false;
    
    // Замена CommonJS импортов
    if (content.includes("require('fast-jwt')") || content.includes('require("fast-jwt")')) {
      content = content.replace(
        /const\s+\{\s*createSigner\s*,\s*createVerifier\s*\}\s*=\s*require\(['"]fast-jwt['"]\)/g,
        "const jwt = require('jsonwebtoken')"
      );
      modified = true;
    }
    
    // Замена ES6 импортов
    if (content.includes("from 'fast-jwt'") || content.includes('from "fast-jwt"')) {
      content = content.replace(
        /import\s+\{\s*createSigner\s*,\s*createVerifier\s*\}\s+from\s+['"]fast-jwt['"]/g,
        "import jwt from 'jsonwebtoken'"
      );
      modified = true;
    }
    
    // Замена вызовов createSigner и createVerifier
    if (content.includes('createSigner(') || content.includes('createVerifier(')) {
      // Замена createSigner
      content = content.replace(
        /const\s+sign\s*=\s*createSigner\(\s*\{\s*key\s*:\s*([^}]+)\s*\}\s*\)/g,
        "// Заменено fast-jwt на jsonwebtoken\\nconst sign = (payload, options) => jwt.sign(payload, $1, options)"
      );
      
      // Замена createVerifier
      content = content.replace(
        /const\s+verify\s*=\s*createVerifier\(\s*\{\s*key\s*:\s*([^}]+)\s*\}\s*\)/g,
        "// Заменено fast-jwt на jsonwebtoken\\nconst verify = (token, options) => jwt.verify(token, $1, options)"
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(\`✅ Исправлен файл: \${file}\`);
      modifiedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(\`❌ Ошибка при обработке файла \${file}:\`, error.message);
    errorFiles++;
  }
});

console.log('\\n📊 Статистика:');
console.log(\`✅ Успешно исправлено: \${modifiedFiles} файлов\`);
console.log(\`⏭️ Пропущено: \${skippedFiles} файлов\`);
console.log(\`❌ Ошибки: \${errorFiles} файлов\`);

console.log('\\n✅ Исправление импортов fast-jwt завершено!');
`;

fs.writeFileSync('scripts/fix-fast-jwt.js', fixFastJwtContent);
console.log('✅ Создан скрипт scripts/fix-fast-jwt.js');

// Шаг 9: Создание скрипта для исправления импортов canvas
console.log('\n📋 Шаг 9: Создание скрипта для исправления импортов canvas');
const fixCanvasContent = `const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Запуск исправления импортов canvas...');

// Проверка наличия glob
try {
  require.resolve('glob');
} catch (e) {
  console.log('📦 Установка пакета glob...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('✅ Пакет glob установлен');
}

// Находим все JS файлы в проекте
console.log('🔍 Поиск JS файлов...');
const jsFiles = glob.sync('**/*.js', {
  ignore: [
    'node_modules/**', 
    'dist/**', 
    'build/**', 
    'scripts/fix-canvas.js',
    '**/*.min.js'
  ]
});

console.log(\`📋 Найдено \${jsFiles.length} JS файлов для обработки\`);

// Счетчики для статистики
let modifiedFiles = 0;
let skippedFiles = 0;
let errorFiles = 0;

// Исправляем импорты canvas на skia-canvas
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Проверяем, содержит ли файл импорты canvas
    const hasCanvas = content.includes('canvas') || 
                      content.includes('new Canvas(')) || 
                      content.includes('Canvas');
    
    if (!hasCanvas) {
      skippedFiles++;
      return;
    }
    
    // Заменяем импорты canvas на skia-canvas
    let modified = false;
    
    // Замена CommonJS импортов
    if (content.includes("require('canvas')") || content.includes('require("canvas")')) {
      content = content.replace(
        /const\s+\{\s*new Canvas(\s*(?:,\s*[^}]+))?\s*\}\s*=\s*require\(['"]canvas['"]\)/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      content = content.replace(
        /const\s+Canvas\s*=\s*require\(['"]canvas['"]\)/g,
        "const { Canvas } = require('skia-canvas')"
      );
      
      modified = true;
    }
    
    // Замена ES6 импортов
    if (content.includes("from 'canvas'") || content.includes('from "canvas"')) {
      content = content.replace(
        /import\s+\{\s*new Canvas(\s*(?:,\s*[^}]+))?\s*\}\s+from\s+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      content = content.replace(
        /import\s+Canvas\s+from\s+['"]canvas['"]/g,
        "import { Canvas } from 'skia-canvas'"
      );
      
      modified = true;
    }
    
    // Замена вызовов new Canvas(
    if (content.includes('new Canvas((')))) {
      content = content.replace(
        /new Canvas(\(([^))]+)\)/g,
        "new Canvas($1)"
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(\`✅ Исправлен файл: \${file}\`);
      modifiedFiles++;
    } else {
      skippedFiles++;
    }
  } catch (error) {
    console.error(\`❌ Ошибка при обработке файла \${file}:\`, error.message);
    errorFiles++;
  }
});

console.log('\\n📊 Статистика:');
console.log(\`✅ Успешно исправлено: \${modifiedFiles} файлов\`);
console.log(\`⏭️ Пропущено: \${skippedFiles} файлов\`);
console.log(\`❌ Ошибки: \${errorFiles} файлов\`);

console.log('\\n✅ Исправление импортов canvas завершено!');
`;

fs.writeFileSync('scripts/fix-canvas.js', fixCanvasContent);
console.log('✅ Создан скрипт scripts/fix-canvas.js');

// Шаг 10: Создание скрипта для запуска всех исправлений
console.log('\n📋 Шаг 10: Создание скрипта для запуска всех исправлений');
const runAllFixesContent = `#!/bin/bash
# Запуск всех исправлений

echo "🚀 Запуск всех исправлений VHM24..."

# Исправление импортов fast-jwt
echo "📋 Исправление импортов fast-jwt"
node scripts/fix-fast-jwt.js

# Исправление импортов canvas
echo "📋 Исправление импортов canvas"
node scripts/fix-canvas.js

# Исправление тестов
echo "📋 Исправление тестов"
node scripts/fix-dependencies.js

# Запуск в Docker
echo "📋 Запуск в Docker"
./run-in-docker.sh
`;

fs.writeFileSync('run-all-fixes.sh', runAllFixesContent);
fs.chmodSync('run-all-fixes.sh', 0o755);
console.log('✅ Создан скрипт run-all-fixes.sh');

// Шаг 11: Создание скрипта для Windows
console.log('\n📋 Шаг 11: Создание скрипта для Windows');
const runAllFixesBatContent = `@echo off
echo 🚀 Запуск всех исправлений VHM24...

REM Исправление импортов fast-jwt
echo 📋 Исправление импортов fast-jwt
node scripts/fix-fast-jwt.js

REM Исправление импортов canvas
echo 📋 Исправление импортов canvas
node scripts/fix-canvas.js

REM Исправление тестов
echo 📋 Исправление тестов
node scripts/fix-dependencies.js

REM Запуск в Docker
echo 📋 Запуск в Docker
run-in-docker.bat
`;

fs.writeFileSync('run-all-fixes.bat', runAllFixesBatContent);
console.log('✅ Создан скрипт run-all-fixes.bat');

// Шаг 12: Создание README.md с инструкциями
console.log('\n📋 Шаг 12: Создание README.md с инструкциями');
const readmeContent = `# VHM24 - Комплексное решение проблем совместимости

## Проблемы и решения

### 1. Проблемы с Node.js 22.17.0
Некоторые пакеты (fast-jwt, canvas) не совместимы с Node.js 22.17.0. Решения:
- Использование Docker с Node.js 18
- Замена fast-jwt на jsonwebtoken
- Замена canvas на skia-canvas

### 2. Проблемы с тестами
Тесты используют tap, который не совместим с текущей конфигурацией. Решение:
- Конвертация тестов в Jest

## Инструкции по запуску

### Вариант 1: Запуск в Docker (рекомендуется)
Этот вариант обеспечивает изолированную среду с совместимой версией Node.js и всеми зависимостями.

\`\`\`bash
# Linux/macOS
./run-in-docker.sh

# Windows
run-in-docker.bat
\`\`\`

### Вариант 2: Запуск всех исправлений
Этот вариант исправляет все проблемы и запускает проект в Docker.

\`\`\`bash
# Linux/macOS
./run-all-fixes.sh

# Windows
run-all-fixes.bat
\`\`\`

### Вариант 3: Ручное исправление
Если вы хотите исправить проблемы вручную:

1. Исправление импортов fast-jwt:
\`\`\`bash
node scripts/fix-fast-jwt.js
\`\`\`

2. Исправление импортов canvas:
\`\`\`bash
node scripts/fix-canvas.js
\`\`\`

3. Исправление тестов:
\`\`\`bash
node scripts/fix-dependencies.js
\`\`\`

4. Запуск проекта:
\`\`\`bash
node start-optimized.js
\`\`\`

## Дополнительная информация

### Структура Docker-контейнера
- Node.js 18 Alpine
- PostgreSQL 14
- Redis Alpine

### Порты
- 8000: API Gateway
- 3001-3004: Микросервисы
- 5432: PostgreSQL
- 6379: Redis

### Тома
- postgres-data: Данные PostgreSQL
- redis-data: Данные Redis
`;

fs.writeFileSync('COMPATIBILITY_SOLUTION.md', readmeContent);
console.log('✅ Создан COMPATIBILITY_SOLUTION.md с инструкциями');

console.log('\n✅ Комплексное исправление проекта завершено!');
console.log('\nДля запуска всех исправлений выполните:');
console.log('Linux/macOS: ./run-all-fixes.sh');
console.log('Windows: run-all-fixes.bat');
console.log('\nДля запуска в Docker выполните:');
console.log('Linux/macOS: ./run-in-docker.sh');
console.log('Windows: run-in-docker.bat');
console.log('\nПодробные инструкции доступны в файле COMPATIBILITY_SOLUTION.md');
