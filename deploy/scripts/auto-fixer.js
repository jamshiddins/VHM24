const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Простой логгер
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

class AutoFixer {
  constructor(analysisReport) {
    this.report = analysisReport || {
      issues: { critical: [], high: [], medium: [], low: [] }
    };
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
    Object.values(this.report.issues)
      .flat()
      .forEach(issue => {
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
    fs.writeFileSync(
      'backup.json',
      JSON.stringify(Object.fromEntries(this.backups), null, 2)
    );
    logger.info(`✅ Created backups for ${this.backups.size} files`);
  }

  async fixSecurityIssues() {
    logger.info('\n🔒 Fixing security issues...');

    // Исправляем утечки информации об ошибках
    this.report.issues.critical.forEach(issue => {
      if (issue.file && issue.issue.includes('Утечка информации')) {
        this.fixInFile(issue.file, {
          pattern: /reply\.(send|code\(\d+\)\.send)\s*\(\s*err\s*\)/g,
          replacement: `reply.code(err.statusCode || 500).send({
            error: err.name || 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
          })`
        });
      }
    });

    // Добавляем валидацию входных данных
    this.report.issues.high.forEach(issue => {
      if (issue.file && issue.issue.includes('Отсутствует валидация')) {
        this.addValidationSchemas(issue.file);
      }
    });

    // Добавляем срок жизни JWT токенов
    this.report.issues.medium.forEach(issue => {
      if (issue.file && issue.issue.includes('JWT токены без срока жизни')) {
        this.fixInFile(issue.file, {
          pattern: /jwt\.sign\(\s*({[^}]+}|[^,]+),\s*([^,)]+)\s*\)/g,
          replacement:
            'jwt.sign($1, $2, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" })'
        });
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
      execSync('npm audit fix', { stdio: 'inherit' });
      this.fixed.push('Fixed npm vulnerabilities with npm audit fix');
    } catch (e) {
      this.failed.push('npm audit fix failed');
    }
  }

  async fixCodeIssues() {
    logger.info('\n📝 Fixing code issues...');

    // Замена console.log на logger
    this.report.issues.low.forEach(issue => {
      if (issue.file && issue.issue.includes('console.log')) {
        this.replaceConsoleLog(issue.file);
      }
    });
  }

  async addMissingComponents() {
    logger.info('\n➕ Adding missing components...');

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
      if (issue.file && issue.issue.includes('findMany без пагинации')) {
        this.addPagination(issue.file);
      }
    });
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

  addValidationSchemas(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');

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
        match => {
          if (
            match.includes('post') ||
            match.includes('put') ||
            match.includes('patch')
          ) {
            return match.replace(
              'async',
              '{ schema: schemas.createSchema }, async'
            );
          } else if (match.includes('get') && !match.includes('/health')) {
            return match.replace(
              'async',
              '{ schema: schemas.querySchema }, async'
            );
          }
          return match;
        }
      );

      fs.writeFileSync(filePath, content);
      this.fixed.push(`Added validation schemas: ${filePath}`);
    } catch (error) {
      this.failed.push(`Failed to add validation schemas: ${filePath}`);
    }
  }

  replaceConsoleLog(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Добавляем logger если его нет
      if (!content.includes('logger')) {
        content =
          `const logger = require('@vhm24/shared/logger');\n\n` + content;
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

  addPagination(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Заменяем findMany() на findMany с пагинацией
      content = content.replace(
        /\.findMany\(\s*\)/g,
        `.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    })`
      );

      // Также для findMany({})
      content = content.replace(
        /\.findMany\(\s*\{\s*\}\s*\)/g,
        `.findMany({
      skip: (request.query.page - 1) * request.query.limit,
      take: request.query.limit,
      orderBy: { createdAt: 'desc' }
    })`
      );

      fs.writeFileSync(filePath, content);
      this.fixed.push(`Added pagination: ${filePath}`);
    } catch (error) {
      this.failed.push(`Failed to add pagination: ${filePath}`);
    }
  }

  async rollbackAll() {
    logger.info('\n🔄 Rolling back all changes...');

    this.backups.forEach((content, filePath) => {
      fs.writeFileSync(filePath, content);
      logger.info(`Restored: ${filePath}`);
    });
  }

  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      fixed: this.fixed,
      failed: this.failed,
      summary: {
        totalFixed: this.fixed.length,
        totalFailed: this.failed.length,
        successRate: Math.round(
          (this.fixed.length / (this.fixed.length + this.failed.length || 1)) *
            100
        )
      }
    };

    fs.writeFileSync('fix-report.json', JSON.stringify(report, null, 2));

    logger.info('\n📊 Fix Report:');
    logger.info(`✅ Fixed: ${this.fixed.length} issues`);
    logger.info(`❌ Failed: ${this.failed.length} issues`);
    logger.info(`📈 Success rate: ${report.summary.successRate}%`);

    if (this.failed.length > 0) {
      logger.info('\n❌ Failed fixes:');
      this.failed.forEach(fail => logger.info(`  - ${fail}`));
    }
  }
}

// Запуск автоматического исправления
async function runAutoFix() {
  try {
    // Загружаем отчет анализа
    let analysisReport;

    try {
      analysisReport = JSON.parse(
        fs.readFileSync('analysis-report.json', 'utf8')
      );
    } catch (error) {
      logger.warn('Не удалось загрузить отчет анализа, создаем пустой отчет');
      analysisReport = {
        issues: {
          critical: [],
          high: [],
          medium: [],
          low: []
        }
      };
    }

    // Запускаем исправление
    const fixer = new AutoFixer(analysisReport);
    await fixer.fixAllIssues();

    logger.info('\n✅ Процесс исправления завершен!');
  } catch (error) {
    logger.error('Критическая ошибка:', error);
  }
}

// Запускаем
runAutoFix().catch(error => {
  logger.error('Критическая ошибка:', error);
});
