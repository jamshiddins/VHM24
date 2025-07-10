const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 Исправление оставшихся проблем VHM24\n');

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
      content = content.replace(new RegExp(search, 'g'), replace);
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

// Функция для стандартизации импортов/экспортов
function standardizeModules(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Заменяем import на require
  const importRegex = /import\s+(\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  
  if (importRegex.test(content)) {
    content = content.replace(importRegex, (match, imports, source) => {
      if (imports.startsWith('{') && imports.endsWith('}')) {
        // Деструктуризация: import { a, b } from 'module'
        const items = imports.slice(1, -1).split(',').map(item => item.trim());
        return `const { ${items.join(', ')} } = require('${source}')`;
      } else if (imports.startsWith('*')) {
        // Импорт всего модуля: import * as name from 'module'
        const name = imports.replace(/\*\s+as\s+/, '').trim();
        return `const ${name} = require('${source}')`;
      } else {
        // Простой импорт: import name from 'module'
        return `const ${imports} = require('${source}')`;
      }
    });
    
    // Заменяем export на module.exports
    content = content.replace(/export\s+default\s+(\w+)/g, 'module.exports = $1');
    content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
    
    // Добавляем module.exports в конец файла для именованных экспортов
    if (content.includes('export const') || content.includes('export function')) {
      const exportedNames = [];
      const exportConstRegex = /export\s+const\s+(\w+)/g;
      const exportFuncRegex = /export\s+function\s+(\w+)/g;
      
      let match;
      while ((match = exportConstRegex.exec(content)) !== null) {
        exportedNames.push(match[1]);
      }
      
      while ((match = exportFuncRegex.exec(content)) !== null) {
        exportedNames.push(match[1]);
      }
      
      if (exportedNames.length > 0) {
        content += `\nmodule.exports = { ${exportedNames.join(', ')} };\n`;
      }
    }
    
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Стандартизированы импорты/экспорты в ${filePath}`);
    return true;
  }

  return false;
}

// Функция для замены console.log на структурированное логирование
function replaceConsoleLog(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем, есть ли импорт логгера
  const hasLogger = content.includes('require(\'@vhm24/shared/logger\')') || 
                    content.includes('require("@vhm24/shared/logger")');
  
  // Если нет импорта логгера, но есть console.log, добавляем импорт
  if (!hasLogger && content.includes('console.log')) {
    // Добавляем импорт логгера в начало файла
    content = `const logger = require('@vhm24/shared/logger');\n\n${content}`;
  }
  
  // Заменяем console.log на logger.info
  let modified = false;
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\((.*?)\)/g, 'logger.info($1)');
    modified = true;
  }
  
  // Заменяем console.error на logger.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error\((.*?)\)/g, 'logger.error($1)');
    modified = true;
  }
  
  // Заменяем console.warn на logger.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\((.*?)\)/g, 'logger.warn($1)');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Заменены console.log на структурированное логирование в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для добавления expiresIn в JWT токены
function addJwtExpiry(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ищем и добавляем expiresIn в JWT опции
  const jwtSignRegex = /(jwt\.sign|sign|fastify\.jwt\.sign)\(\s*({[^}]*}|[^,]+)\s*,\s*(['"][^'"]+['"]|[^,)]+)\s*(?:,\s*({[^}]*})?\s*)?\)/g;
  
  let modified = false;
  content = content.replace(jwtSignRegex, (match, func, payload, secret, options) => {
    if (options && options.includes('expiresIn')) {
      return match; // Уже есть expiresIn
    }
    
    if (options) {
      // Есть опции, добавляем expiresIn
      const trimmedOptions = options.trim();
      if (trimmedOptions === '{}') {
        return `${func}(${payload}, ${secret}, { expiresIn: '1d' })`;
      } else {
        // Удаляем закрывающую скобку и добавляем expiresIn
        return `${func}(${payload}, ${secret}, ${trimmedOptions.slice(0, -1)}, expiresIn: '1d' })`;
      }
    } else {
      // Нет опций, добавляем объект с expiresIn
      return `${func}(${payload}, ${secret}, { expiresIn: '1d' })`;
    }
  });
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    modified = true;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Добавлен срок жизни JWT в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для создания health check endpoint
function addHealthCheck(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Проверяем, есть ли уже health check endpoint
  if (content.includes('/health') || content.includes('health check')) {
    return false;
  }
  
  // Ищем место для добавления health check endpoint
  const fastifyRegex = /fastify\.listen\s*\(/;
  
  if (fastifyRegex.test(content)) {
    const healthCheckCode = `
// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Проверка соединения с базой данных
    let dbStatus = 'ok';
    try {
      if (prisma) {
        await prisma.$queryRaw\`SELECT 1\`;
      }
    } catch (error) {
      dbStatus = 'error';
    }
    
    // Проверка соединения с Redis, если используется
    let redisStatus = 'not_used';
    if (typeof redis !== 'undefined') {
      try {
        await redis.ping();
        redisStatus = 'ok';
      } catch (error) {
        redisStatus = 'error';
      }
    }
    
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      service: process.env.SERVICE_NAME || path.basename(__dirname),
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
      redis: redisStatus,
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB'
      }
    };
  } catch (error) {
    request.log.error('Health check error:', error);
    reply.code(500).send({ status: 'error', error: 'Internal Server Error' });
  }
});

`;
    
    // Добавляем health check endpoint перед fastify.listen
    content = content.replace(fastifyRegex, healthCheckCode + 'fastify.listen(');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Добавлен health check endpoint в ${filePath}`);
    return true;
  }
  
  return false;
}

// Функция для создания Dockerfile для сервиса
function createDockerfile(servicePath) {
  const dockerfilePath = path.join(servicePath, 'Dockerfile');
  
  if (fs.existsSync(dockerfilePath)) {
    console.log(`⚠️ Dockerfile уже существует: ${dockerfilePath}`);
    return false;
  }
  
  const dockerfileContent = `# Базовый образ
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Установка зависимостей
FROM base AS deps
COPY package.json ./
RUN npm install --only=production

# Сборка
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Финальный образ
FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:${process.env.PORT || 3000}/health || exit 1

# Запуск сервиса
CMD ["node", "src/index.js"]
`;
  
  fs.writeFileSync(dockerfilePath, dockerfileContent);
  console.log(`✅ Создан Dockerfile: ${dockerfilePath}`);
  return true;
}

// Функция для создания GitHub Actions workflow
function createGitHubWorkflow() {
  const workflowDir = path.join('.github', 'workflows');
  const workflowPath = path.join(workflowDir, 'ci.yml');
  
  ensureDirectoryExists(workflowDir);
  
  if (fs.existsSync(workflowPath)) {
    console.log(`⚠️ GitHub Actions workflow уже существует: ${workflowPath}`);
    return false;
  }
  
  const workflowContent = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run security scan
        run: npm audit --production

  build:
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build project
        run: npm run build --if-present
      - name: Build Docker images
        run: |
          for service in services/*; do
            if [ -f "$service/Dockerfile" ]; then
              service_name=$(basename $service)
              docker build -t vhm24/$service_name:latest $service
            fi
          done
`;
  
  fs.writeFileSync(workflowPath, workflowContent);
  console.log(`✅ Создан GitHub Actions workflow: ${workflowPath}`);
  return true;
}

// Функция для создания Railway конфигурации
function createRailwayConfig() {
  // Создаем railway.toml, если его нет
  if (!fs.existsSync('railway.toml')) {
    const railwayToml = `[build]
builder = "nixpacks"
buildCommand = "npm install"

[deploy]
startCommand = "node railway-start-unified.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
`;
    
    fs.writeFileSync('railway.toml', railwayToml);
    console.log('✅ Создан railway.toml');
  }
  
  // Создаем nixpacks.toml, если его нет
  if (!fs.existsSync('nixpacks.toml')) {
    const nixpacksToml = `[phases.setup]
nixPkgs = ["nodejs", "yarn", "gcc", "gnumake"]

[phases.install]
cmds = ["yarn install --frozen-lockfile"]

[phases.build]
cmds = ["yarn build"]

[start]
cmd = "node railway-start-unified.js"
`;
    
    fs.writeFileSync('nixpacks.toml', nixpacksToml);
    console.log('✅ Создан nixpacks.toml');
  }
  
  // Проверяем и обновляем railway-start-unified.js
  if (fs.existsSync('railway-start-unified.js')) {
    console.log('✅ railway-start-unified.js уже существует');
  } else {
    const railwayStartUnified = `const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Определяем порт для основного сервиса
const PORT = process.env.PORT || 3000;

// Запускаем gateway сервис на основном порту
console.log(\`🚀 Запуск gateway сервиса на порту \${PORT}...\`);
const gatewayProcess = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'services', 'gateway'),
  env: { ...process.env, PORT },
  stdio: 'inherit'
});

// Обработка завершения процесса
gatewayProcess.on('close', (code) => {
  console.log(\`Gateway сервис завершился с кодом \${code}\`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT, завершение работы...');
  gatewayProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM, завершение работы...');
  gatewayProcess.kill('SIGTERM');
});
`;
    
    fs.writeFileSync('railway-start-unified.js', railwayStartUnified);
    console.log('✅ Создан railway-start-unified.js');
  }
  
  return true;
}

// Основные исправления

// 1. Исправляем оставшиеся проблемы с JWT токенами
console.log('\n🔑 Добавление срока жизни JWT токенам...');
const jwtFiles = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js'
];

jwtFiles.forEach(filePath => {
  addJwtExpiry(filePath);
});

// 2. Добавляем обработку ошибок в async функции
console.log('\n🛡️ Добавление обработки ошибок...');
const asyncFiles = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js',
  'services/telegram-bot/src/index.js'
];

asyncFiles.forEach(filePath => {
  addErrorHandling(filePath);
});

// 3. Стандартизируем импорты/экспорты
console.log('\n📦 Стандартизация импортов/экспортов...');
const moduleFiles = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js',
  'services/telegram-bot/src/index.js'
];

moduleFiles.forEach(filePath => {
  standardizeModules(filePath);
});

// 4. Заменяем console.log на структурированное логирование
console.log('\n📝 Замена console.log на структурированное логирование...');
const logFiles = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js',
  'services/telegram-bot/src/index.js'
];

logFiles.forEach(filePath => {
  replaceConsoleLog(filePath);
});

// 5. Добавляем health check endpoints
console.log('\n🏥 Добавление health check endpoints...');
const healthCheckFiles = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js',
  'services/telegram-bot/src/index.js'
];

healthCheckFiles.forEach(filePath => {
  addHealthCheck(filePath);
});

// 6. Создаем Dockerfile для каждого сервиса
console.log('\n🐳 Создание Dockerfile для сервисов...');
const services = [
  'auth',
  'inventory',
  'tasks',
  'data-import',
  'gateway',
  'machines',
  'warehouse',
  'telegram-bot'
];

services.forEach(service => {
  const servicePath = path.join('services', service);
  if (fs.existsSync(servicePath)) {
    createDockerfile(servicePath);
  }
});

// 7. Создаем GitHub Actions workflow
console.log('\n🔄 Создание GitHub Actions workflow...');
createGitHubWorkflow();

// 8. Создаем Railway конфигурацию
console.log('\n🚂 Создание Railway конфигурации...');
createRailwayConfig();

console.log('\n✅ Исправление оставшихся проблем завершено!');
console.log('✅ Проект подготовлен к деплою на Railway');
