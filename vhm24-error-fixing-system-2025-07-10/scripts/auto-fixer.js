const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('@vhm24/shared/logger');

class AutoFixer {
  constructor(analysisReport) {
    this.report = analysisReport;
    this.fixed = [];
    this.failed = [];
    this.backups = new Map();
  }

  async fixAllIssues() {
    logger.info('🔧 Starting Auto-Fix Process...\n');
    
    // Создаем резервные копии
    await this.createBackups();
    
    try {
      // 1. Исправляем критические проблемы безопасности
      await this.fixSecurityIssues();
      
      // 2. Исправляем проблемы с зависимостями
      await this.fixDependencyIssues();
      
      // 3. Исправляем проблемы кода
      await this.fixCodeIssues();
      
      // 4. Добавляем отсутствующие компоненты
      await this.addMissingComponents();
      
      // 5. Оптимизируем производительность
      await this.fixPerformanceIssues();
      
      // 6. Генерируем отчет
      this.generateFixReport();
      
    } catch (error) {
      logger.error('❌ Error during fix process:', error);
      await this.rollbackAll();
    }
  }

  async createBackups() {
    logger.info('📦 Creating backups...');
    
    const filesToBackup = new Set();
    
    // Собираем все файлы из отчета
    Object.values(this.report.issues).flat().forEach(issue => {
      if (issue.file) filesToBackup.add(issue.file);
    });
    
    filesToBackup.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        this.backups.set(file, content);
      } catch (error) {
        logger.warn(`Could not backup file ${file}: ${error.message}`);
      }
    });
    
    // Сохраняем бекап на диск
    fs.writeFileSync('backup.json', JSON.stringify(Object.fromEntries(this.backups), null, 2));
    logger.info(`✅ Created backups for ${this.backups.size} files`);
  }

  async fixSecurityIssues() {
    logger.info('\n🔒 Fixing security issues...');
    
    const securityFixes = {
      // Исправление утечки ошибок
      'reply.code(500).send({ error: "Internal Server Error" })': {
        pattern: /reply\.(send|code\(\d+\)\.send)\s*\(\s*err\s*\)/g,
        replacement: `reply.code(err.statusCode || 500).send({
          error: err.name || 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        })`
      },
      
      // Добавление валидации
      'missing-validation': {
        detect: (content) => content.includes('async (request, reply)') && 
                             content.includes('request.body') && 
                             !content.includes('schema:'),
        fix: (content, filePath) => {
          // Находим все routes и добавляем схемы
          return this.addValidationSchemas(content, filePath);
        }
      },
      
      // Замена hardcoded credentials
      'hardcoded-secrets': {
        patterns: [
          { match: /JWT_SECRET\s*=\s*["'][^"']+["']/g, replace: 'JWT_SECRET = process.env.JWT_SECRET' },
          { match: /password:\s*["'][^"']+["']/g, replace: 'password: process.env.DB_PASSWORD' },
          { match: /apiKey:\s*["'][^"']+["']/g, replace: 'apiKey: process.env.API_KEY' },
          { match: /secret:\s*["'][^"']+["']/g, replace: 'secret: process.env.SECRET' }
        ]
      },
      
      // Добавление expiresIn в JWT
      'jwt-expiration': {
        pattern: /jwt\.sign\(\s*({[^}]+}|[^,]+),\s*([^,)]+)\s*\)/g,
        replacement: 'jwt.sign($1, $2, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" })'
      }
    };
    
    // Исправляем утечки информации об ошибках
    this.report.issues.critical.forEach(issue => {
      if (issue.file && issue.issue.includes('Утечка информации')) {
        this.fixInFile(issue.file, securityFixes['reply.code(500).send({ error: "Internal Server Error" })']);
      }
    });
    
    // Исправляем hardcoded credentials
    this.report.issues.critical.forEach(issue => {
      if (issue.file && issue.issue.includes('Hardcoded credentials')) {
        securityFixes['hardcoded-secrets'].patterns.forEach(pattern => {
          this.fixInFile(issue.file, { pattern: pattern.match, replacement: pattern.replace });
        });
      }
    });
    
    // Добавляем валидацию входных данных
    this.report.issues.high.forEach(issue => {
      if (issue.file && issue.issue.includes('Отсутствует валидация')) {
        this.fixInFile(issue.file, {
          fix: (content) => securityFixes['missing-validation'].fix(content, issue.file)
        });
      }
    });
    
    // Добавляем срок жизни JWT токенов
    this.report.issues.medium.forEach(issue => {
      if (issue.file && issue.issue.includes('JWT токены без срока жизни')) {
        this.fixInFile(issue.file, securityFixes['jwt-expiration']);
      }
    });
  }

  async fixDependencyIssues() {
    logger.info('\n📦 Fixing dependency issues...');
    
    // Создаем .npmrc для настройки npm
    const npmrc = `
# Настройки npm для исправления уязвимостей
audit=true
fund=false
loglevel=warn
    `;
    fs.writeFileSync('.npmrc', npmrc);
    this.fixed.push('Created .npmrc configuration');
    
    // Автоматическое исправление уязвимостей
    try {
      logger.info('Running npm audit fix...');
      
      // Сначала пробуем обычный fix
      try {
        execSync('npm audit fix', { stdio: 'inherit' });
        this.fixed.push('Fixed npm vulnerabilities with npm audit fix');
      } catch (e) {
        logger.warn('Regular npm audit fix failed, trying with --force');
        
        // Если не получилось, пробуем с --force для критических уязвимостей
        try {
          // Получаем информацию о уязвимостях
          const auditOutput = execSync('npm audit --json', { stdio: 'pipe' }).toString();
          const auditData = JSON.parse(auditOutput);
          
          if (auditData.metadata.vulnerabilities.critical > 0) {
            logger.info(`Found ${auditData.metadata.vulnerabilities.critical} critical vulnerabilities, fixing with --force`);
            execSync('npm audit fix --force', { stdio: 'inherit' });
            this.fixed.push('Fixed critical npm vulnerabilities with npm audit fix --force');
          } else {
            logger.info('No critical vulnerabilities found, skipping --force fix');
          }
        } catch (forceError) {
          this.failed.push('npm audit fix --force failed');
        }
      }
    } catch (e) {
      this.failed.push('npm audit fix failed');
    }
    
    // Установка отсутствующих зависимостей
    const missingDeps = new Map();
    
    this.report.issues.high.forEach(issue => {
      if (issue.issue.includes('Отсутствует зависимость')) {
        const match = issue.issue.match(/Отсутствует зависимость: (.+)/);
        if (match) {
          const dep = match[1];
          const service = issue.file.split('/')[1];
          
          if (!missingDeps.has(service)) {
            missingDeps.set(service, []);
          }
          missingDeps.get(service).push(dep);
        }
      }
    });
    
    missingDeps.forEach((deps, service) => {
      const servicePath = path.join('services', service);
      logger.info(`Installing dependencies for ${service}: ${deps.join(', ')}`);
      
      try {
        execSync(`cd ${servicePath} && npm install ${deps.join(' ')}`, { stdio: 'inherit' });
        this.fixed.push(`Installed dependencies for ${service}`);
      } catch (e) {
        this.failed.push(`Failed to install dependencies for ${service}`);
      }
    });
    
    // Обновление устаревших зависимостей
    try {
      logger.info('Checking for outdated dependencies...');
      const outdatedOutput = execSync('npm outdated --json', { stdio: 'pipe' }).toString();
      
      if (outdatedOutput.trim()) {
        const outdated = JSON.parse(outdatedOutput);
        const outdatedPackages = Object.keys(outdated);
        
        if (outdatedPackages.length > 0) {
          logger.info(`Found ${outdatedPackages.length} outdated packages`);
          
          // Обновляем только не-мажорные версии
          const nonMajorUpdates = outdatedPackages.filter(pkg => {
            const current = outdated[pkg].current.split('.')[0];
            const wanted = outdated[pkg].wanted.split('.')[0];
            return current === wanted;
          });
          
          if (nonMajorUpdates.length > 0) {
            logger.info(`Updating ${nonMajorUpdates.length} packages with non-major updates`);
            execSync(`npm update ${nonMajorUpdates.join(' ')}`, { stdio: 'inherit' });
            this.fixed.push(`Updated ${nonMajorUpdates.length} packages to latest compatible versions`);
          }
        }
      }
    } catch (e) {
      logger.warn('Failed to check for outdated dependencies');
    }
  }

  async fixCodeIssues() {
    logger.info('\n📝 Fixing code issues...');
    
    // Конвертация ES6 в CommonJS
    this.report.issues.high.forEach(issue => {
      if (issue.issue.includes('Смешивание ES6 и CommonJS')) {
        this.convertToCommonJS(issue.file);
      }
    });
    
    // Добавление try-catch
    this.report.issues.medium.forEach(issue => {
      if (issue.issue.includes('Async функции без обработки ошибок')) {
        this.addTryCatch(issue.file);
      }
    });
    
    // Замена console.log на logger
    this.report.issues.low.forEach(issue => {
      if (issue.issue.includes('console.log')) {
        this.replaceConsoleLog(issue.file);
      }
    });
    
    // Вынесение магических чисел в константы
    this.report.issues.low.forEach(issue => {
      if (issue.issue.includes('Магические числа')) {
        this.extractMagicNumbers(issue.file);
      }
    });
  }

  async addMissingComponents() {
    logger.info('\n➕ Adding missing components...');
    
    // Создание отсутствующих директорий
    this.report.issues.medium.forEach(issue => {
      if (issue.issue && issue.issue.includes('Отсутствует директория')) {
        const match = issue.issue.match(/Отсутствует директория (\w+)/);
        if (match && issue.service) {
          const dirPath = path.join('services', issue.service, match[1]);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            this.fixed.push(`Created directory: ${dirPath}`);
          }
        }
      }
    });
    
    // Создание отсутствующих Dockerfile
    const services = fs.readdirSync('services');
    services.forEach(service => {
      const dockerfilePath = path.join('services', service, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        this.createDockerfile(service, dockerfilePath);
      }
    });
    
    // Создание CI/CD pipeline
    if (!fs.existsSync('.github/workflows')) {
      this.createGitHubActions();
    }
    
    // Добавление health checks
    services.forEach(service => {
      const indexPath = path.join('services', service, 'src', 'index.js');
      if (fs.existsSync(indexPath)) {
        this.addHealthCheck(indexPath);
      }
    });
    
    // Создание тестов
    services.forEach(service => {
      this.createTestsForService(service);
    });
    
    // Создание .dockerignore
    if (!fs.existsSync('.dockerignore')) {
      const dockerignore = `
# Файлы и директории, которые не должны попадать в Docker образ
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.git
.github
.vscode
.idea
*.md
*.log
.env
.env.*
coverage
docs
tests
test
__tests__
*.test.js
*.spec.js
.DS_Store
`;
      fs.writeFileSync('.dockerignore', dockerignore);
      this.fixed.push('Created .dockerignore file');
    }
  }

  async fixPerformanceIssues() {
    logger.info('\n⚡ Fixing performance issues...');
    
    // Добавление пагинации
    this.report.issues.high.forEach(issue => {
      if (issue.issue.includes('findMany без пагинации')) {
        this.addPagination(issue.file);
      }
    });
    
    // Замена синхронных операций
    this.report.issues.medium.forEach(issue => {
      if (issue.issue.includes('Синхронные операции')) {
        this.makeAsync(issue.file);
      }
    });
    
    // Исправление N+1 проблем
    this.report.issues.high.forEach(issue => {
      if (issue.issue.includes('N+1 проблема')) {
        this.fixNPlusOne(issue.file);
      }
    });
    
    // Добавление индексов в schema.prisma
    const prismaSchemaPath = 'packages/database/prisma/schema.prisma';
    if (fs.existsSync(prismaSchemaPath)) {
      this.addPrismaIndexes(prismaSchemaPath);
    }
  }

  // Вспомогательные методы для исправлений
  fixInFile(filePath, fix) {
    try {
      if (!fs.existsSync(filePath)) {
        this.failed.push(`File not found: ${filePath}`);
        return;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      if (fix.pattern && fix.replacement) {
        content = content.replace(fix.pattern, fix.replacement);
      } else if (fix.fix) {
        content = fix.fix(content, filePath);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.fixed.push(`Fixed: ${filePath} - ${fix.pattern || 'custom fix'}`);
      }
    } catch (error) {
      this.failed.push(`Failed to fix ${filePath}: ${error.message}`);
    }
  }

  convertToCommonJS(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Конвертируем import в require
      content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 
        "const $1 = require('$2')");
      
      content = content.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        "const $1 = require('$2')");
      
      content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
        "const {$1} = require('$2')");
      
      // Конвертируем export в module.exports
      content = content.replace(/export\s+default\s+/g, 'module.exports = ');
      content = content.replace(/export\s+\{([^}]+)\}/g, 'module.exports = {$1}');
      content = content.replace(/export\s+(const|let|var)\s+/g, '$1 ');
      
      // Добавляем exports в конец если нужно
      if (!content.includes('module.exports')) {
        const exports = content.match(/(?:const|let|var)\s+(\w+)\s*=/g) || [];
        if (exports.length > 0) {
          const exportNames = exports.map(e => e.match(/(\w+)\s*=/)[1]);
          content += `\n\nmodule.exports = { ${exportNames.join(', ')} };`;
        }
      }
      
      fs.writeFileSync(filePath, content);
      this.fixed.push(`Converted to CommonJS: ${filePath}`);
    } catch (error) {
      this.failed.push(`Failed to convert ${filePath}: ${error.message}`);
    }
  }

  addValidationSchemas(content, filePath) {
    // Создаем базовые схемы для common endpoints
    const schemas = `
const schemas = {
  createSchema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 }
      }
    }
  },
  updateSchema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 }
      }
    }
  },
  querySchema: {
    query: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        search: { type: 'string', maxLength: 100 }
      }
    }
  }
};
`;
    
    // Добавляем схемы в начало файла
    if (!content.includes('schemas')) {
      content = schemas + '\n' + content;
    }
    
    // Добавляем schema к routes
    content = content.replace(
      /fastify\.(get|post|put|patch|delete)\s*\(\s*['"][^'"]+['"]\s*,\s*async/g,
      (match) => {
        if (match.includes('post') || match.includes('put') || match.includes('patch')) {
          return match.replace('async', '{ schema: schemas.createSchema }, async');
        } else if (match.includes('get') && !match.includes('/health')) {
          return match.replace('async', '{ schema: schemas.querySchema }, async');
        }
        return match;
      }
    );
    
    return content;
  }

  addTryCatch(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Находим async функции без try-catch
      const asyncFunctionRegex = /(async\s+(?:function\s+)?\w*\s*\([^)]*\)\s*(?:=>)?\s*\{)([^}]+)(\})/g;
      
      content = content.replace(asyncFunctionRegex, (match, start, body, end) => {
        if (!body.includes('try')) {
          return `${start}
  try {${body}  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
${end}`;
        }
        return match;
      });
      
      // Добавляем импорт logger, если его нет
      if (!content.includes('logger') && content.includes('logger.error')) {
        content = `const logger = require('@vhm24/shared/logger');\n\n${content}`;
      }
      
      fs.writeFileSync(filePath, content);
      this.fixed.push(`Added try-catch blocks: ${filePath}`);
    } catch (error) {
      this.failed.push(`Failed to add try-catch: ${filePath}`);
    }
  }

  replaceConsoleLog(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Добавляем logger если его нет
      if (!content.includes('logger')) {
        content = `const logger = require('@vhm24/shared/logger');\n\n` + content;
      }
      
      // Заменяем console.log
      content = content.replace(/console\.log\(/g, 'logger.info(');
      content = content.replace(/console\.error\(/g, 'logger.error(');
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      content = content.replace(/console\.debug\(/g, 'logger.debug(');
      
      fs.writeFileSync(filePath, content);
      this.fixed.push(`Replaced console.log with logger: ${filePath}`);
    } catch (error) {
      this.failed.push(`Failed to replace console.log: ${filePath}`);
    }
  }

  extractMagicNumbers(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Находим магические числа (4+ цифры)
      const magicNumbers = new Set();
      const regex = /\b(\d{4,})\b/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        magicNumbers.add(match[1]);
      }
      
      if (magicNumbers.size > 0) {
        // Создаем константы
        let constants = '// Constants\n';
        const replacements = [];
        
        magicNumbers.forEach(num => {
          const constName = `CONST_${num}`;
          constants += `const ${constName} = ${num};\n`;
          replacements.push({ number: num, constName });
        });
        
        // Добавляем константы в начало файла
        content = constants + '\n' + content;
        
        // Заменяем числа на константы
        replacements.forEach(({ number, constName }) => {
          const numberRegex = new RegExp(`\\b${number}\\b`, 'g');
          content = content.replace(numberRegex, constName);
        });
        
        fs.writeFileSync(filePath, content);
        this.fixed.push(`Extracted magic numbers: ${filePath}`);
      }
    } catch (error) {
      this.failed.push(`Failed to extract magic numbers: ${filePath}`);
    }
  }

  createDockerfile(service, dockerfilePath) {
    const dockerfile = `# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/${service}/package*.json ./services/${service}/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/${service} ./services/${service}
COPY packages ./packages

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/${service} ./services/${service}
COPY --from=builder /app/packages ./packages

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE \${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start service
CMD ["node", "services/${service}/src/index.js"]
`;
    
    fs.writeFileSync(dockerfilePath, dockerfile);
    this.fixed.push(`Created Dockerfile for ${service}`);
  }

  createGitHubActions() {
    const workflowDir = '.github/workflows';
    fs.mkdirSync(workflowDir, { recursive: true });
    
    const ciWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          npm ci --workspaces
      
      - name: Run linter
        run: npm run lint --if-present
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key-for-testing-only
      
      - name: Build
        run: npm run build --if-present
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        continue-on-error: true

  docker:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            vhm24/platform:latest
            vhm24/platform:\${{ github.sha }}
          cache-from: type=registry,ref=vhm24/platform:buildcache
          cache-to: type=registry,ref=vhm24/platform:buildcache,mode=max
`;
    
    fs.writeFileSync(path.join(workflowDir, 'ci.yml'), ciWorkflow);
    this.fixed.push('Created GitHub Actions CI/CD pipeline');
  }

  addHealthCheck(indexPath) {
    try {
      let content = fs.readFileSync(indexPath, 'utf8');
      
      if (!content.includes('/health')) {
        const healthEndpoint = `
// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '${path.basename(path.dirname(path.dirname(indexPath)))}',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };
  
  // Database check
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }
  
  // Redis check (if applicable)
  if (typeof redis !== 'undefined') {
    try {
      await redis.ping();
      health.checks.redis = 'ok';
    } catch (error) {
      health.checks.redis = 'error';
      health.status = 'degraded';
    }
  }
  
  reply.code(health.status === 'ok' ? 200 : 503).send(health);
});
`;
        
        // Добавляем перед fastify.listen
        content = content.replace(/(fastify\.listen)/g, healthEndpoint + '\n$1');
        
        fs.writeFileSync(indexPath, content);
        this.fixed.push(`Added health check: ${indexPath}`);
      }
    } catch (error) {
      this.failed.push(`Failed to add health check: ${indexPath}`);
    }
  }

  createTestsForService(service) {
    const testDir = path.join('services', service, 'tests');
    fs.mkdirSync(testDir, { recursive: true });
    
    // Создаем базовый тест
    const testFile = `const { test } = require('tap');
const build = require('../src/app');

test('health check', async (t) => {
  const app = build({ logger: false
