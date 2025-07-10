const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');
const { execSync } = require('child_process');

class ProjectAnalyzer {
  constructor() {
    this.issues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    this.stats = {
      filesAnalyzed: 0,
      totalIssues: 0,
      fixedIssues: 0
    };
  }

  async runFullAnalysis() {
    logger.info('🔍 VHM24 Project Deep Analysis\n');
    
    // 1. Анализ безопасности
    await this.securityAnalysis();
    
    // 2. Анализ кода
    await this.codeQualityAnalysis();
    
    // 3. Анализ зависимостей
    await this.dependencyAnalysis();
    
    // 4. Анализ производительности
    await this.performanceAnalysis();
    
    // 5. Анализ архитектуры
    await this.architectureAnalysis();
    
    // 6. Анализ DevOps
    await this.devopsAnalysis();
    
    // 7. Генерация отчета
    this.generateReport();
  }

  async securityAnalysis() {
    logger.info('🔒 Анализ безопасности...\n');
    
    // Поиск утечек данных
    this.scanFiles('**/*.js', (filePath, content) => {
      // Проверка на reply.code(err.statusCode || 500).send({
          error: err.name || 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        })
      if (content.match(/reply\.(send|code\(\d+\)\.send)\s*\(\s*err\s*\)/)) {
        this.addIssue('critical', {
          file: filePath,
          line: this.getLineNumber(content, /reply\.send\s*\(\s*err\s*\)/),
          issue: 'Утечка информации об ошибках',
          fix: 'reply.code(500).send({ error: "Internal Server Error" })'
        });
      }
      
      // Проверка на отсутствие валидации
      if (content.includes('request.body') && !content.includes('schema:')) {
        this.addIssue('high', {
          file: filePath,
          issue: 'Отсутствует валидация входных данных',
          fix: 'Добавить JSON Schema валидацию'
        });
      }
      
      // Проверка на hardcoded credentials
      const secretPatterns = [
        /password\s*[:=]\s*["'][\w\d]{4,}/i,
        /secret\s*[:=]\s*["'][\w\d]{4,}/i,
        /api[_-]?key\s*[:=]\s*["'][\w\d]{4,}/i
      ];
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.addIssue('critical', {
            file: filePath,
            issue: 'Hardcoded credentials',
            fix: 'Использовать переменные окружения'
          });
        }
      });
      
      // Проверка JWT
      if (content.includes('jwt') && !content.includes('expiresIn')) {
        this.addIssue('medium', {
          file: filePath,
          issue: 'JWT токены без срока жизни',
          fix: 'Добавить expiresIn в JWT опции'
        });
      }
    });
  }

  async codeQualityAnalysis() {
    logger.info('📝 Анализ качества кода...\n');
    
    // Проверка на смешивание модулей
    this.scanFiles('**/*.js', (filePath, content) => {
      const hasImport = content.includes('import ');
      const hasRequire = content.includes('require(');
      
      if (hasImport && hasRequire) {
        this.addIssue('high', {
          file: filePath,
          issue: 'Смешивание ES6 и CommonJS модулей',
          fix: 'Использовать только CommonJS (require/module.exports)'
        });
      }
      
      // Проверка на отсутствие try-catch
      if (content.includes('async') && !content.includes('try')) {
        this.addIssue('medium', {
          file: filePath,
          issue: 'Async функции без обработки ошибок',
          fix: 'Добавить try-catch блоки'
        });
      }
      
      // Проверка на console.log
      if (content.includes('console.log')) {
        this.addIssue('low', {
          file: filePath,
          issue: 'Использование console.log вместо logger',
          fix: 'Использовать структурированное логирование (pino/winston)'
        });
      }
      
      // Проверка на магические числа
      const magicNumbers = content.match(/\b\d{4,}\b/g);
      if (magicNumbers && magicNumbers.length > 2) {
        this.addIssue('low', {
          file: filePath,
          issue: 'Магические числа в коде',
          fix: 'Вынести в константы'
        });
      }
    });
  }

  async dependencyAnalysis() {
    logger.info('📦 Анализ зависимостей...\n');
    
    try {
      // npm audit
      const auditResult = execSync('npm audit --json', { stdio: 'pipe' }).toString();
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata.vulnerabilities.total > 0) {
        this.addIssue('critical', {
          issue: `Найдено ${audit.metadata.vulnerabilities.total} уязвимостей`,
          critical: audit.metadata.vulnerabilities.critical,
          high: audit.metadata.vulnerabilities.high,
          fix: 'npm audit fix --force'
        });
      }
    } catch (e) {
      // npm audit возвращает non-zero при наличии уязвимостей
    }
    
    // Проверка отсутствующих зависимостей
    this.scanFiles('services/*/src/**/*.js', (filePath, content) => {
      const requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
      requires.forEach(req => {
        const module = req.match(/require\(['"]([^'"]+)['"]\)/)[1];
        if (!module.startsWith('.') && !module.startsWith('@vhm24')) {
          const servicePath = filePath.split('/').slice(0, 2).join('/');
          const packageJsonPath = path.join(servicePath, 'package.json');
          
          if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.await fsPromises.readFile(packageJsonPath, 'utf8'));
            const deps = Object.keys(pkg.dependencies || {});
            
            if (!deps.includes(module) && !this.isBuiltinModule(module)) {
              this.addIssue('high', {
                file: filePath,
                issue: `Отсутствует зависимость: ${module}`,
                fix: `cd ${servicePath} && npm install ${module}`
              });
            }
          }
        }
      });
    });
  }

  async performanceAnalysis() {
    logger.info('⚡ Анализ производительности...\n');
    
    this.scanFiles('**/*.js', (filePath, content) => {
      // Проверка на отсутствие пагинации
      if (content.includes('findMany()') || content.includes('findMany({})')) {
        this.addIssue('high', {
          file: filePath,
          issue: 'findMany без пагинации',
          fix: 'Добавить skip/take параметры'
        });
      }
      
      // Проверка на синхронные операции
      if (content.includes('readFileSync') || content.includes('writeFileSync')) {
        this.addIssue('medium', {
          file: filePath,
          issue: 'Синхронные операции файловой системы',
          fix: 'Использовать асинхронные версии'
        });
      }
      
      // Проверка на отсутствие индексов
      if (content.includes('where:') && content.includes('createdAt')) {
        this.addIssue('medium', {
          file: filePath,
          issue: 'Запросы по неиндексированным полям',
          fix: 'Добавить индексы в schema.prisma'
        });
      }
      
      // Проверка на N+1 проблемы
      if (content.includes('.map') && content.includes('await') && content.includes('prisma')) {
        this.addIssue('high', {
          file: filePath,
          issue: 'Потенциальная N+1 проблема',
          fix: 'Использовать include или Promise.all'
        });
      }
    });
  }

  async architectureAnalysis() {
    logger.info('🏗️ Анализ архитектуры...\n');
    
    // Проверка структуры сервисов
    const services = fs.readdirSync('services');
    services.forEach(service => {
      const requiredDirs = ['src', 'tests', 'docs'];
      const servicePath = path.join('services', service);
      
      requiredDirs.forEach(dir => {
        if (!fs.existsSync(path.join(servicePath, dir))) {
          this.addIssue('medium', {
            service,
            issue: `Отсутствует директория ${dir}`,
            fix: `mkdir -p ${servicePath}/${dir}`
          });
        }
      });
      
      // Проверка наличия тестов
      const testDir = path.join(servicePath, 'tests');
      if (!fs.existsSync(testDir) || fs.readdirSync(testDir).length === 0) {
        this.addIssue('high', {
          service,
          issue: 'Отсутствуют тесты',
          fix: 'Создать модульные и интеграционные тесты'
        });
      }
    });
    
    // Проверка дублирования кода
    const codePatterns = new Map();
    this.scanFiles('**/*.js', (filePath, content) => {
      // Ищем повторяющиеся паттерны
      const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || [];
      functions.forEach(func => {
        if (codePatterns.has(func)) {
          codePatterns.get(func).push(filePath);
        } else {
          codePatterns.set(func, [filePath]);
        }
      });
    });
    
    codePatterns.forEach((files, pattern) => {
      if (files.length > 2) {
        this.addIssue('medium', {
          issue: `Дублирование кода: ${pattern}`,
          files: files,
          fix: 'Вынести в shared пакет'
        });
      }
    });
  }

  async devopsAnalysis() {
    logger.info('🚀 Анализ DevOps...\n');
    
    // Проверка Dockerfile
    const services = fs.readdirSync('services');
    services.forEach(service => {
      if (!fs.existsSync(path.join('services', service, 'Dockerfile'))) {
        this.addIssue('high', {
          service,
          issue: 'Отсутствует Dockerfile',
          fix: 'Создать multi-stage Dockerfile'
        });
      }
    });
    
    // Проверка CI/CD
    if (!fs.existsSync('.github/workflows')) {
      this.addIssue('high', {
        issue: 'Отсутствует CI/CD pipeline',
        fix: 'Создать GitHub Actions workflow'
      });
    }
    
    // Проверка .dockerignore
    if (!fs.existsSync('.dockerignore')) {
      this.addIssue('medium', {
        issue: 'Отсутствует .dockerignore',
        fix: 'Создать .dockerignore файл'
      });
    }
    
    // Проверка health checks
    this.scanFiles('services/*/src/index.js', (filePath, content) => {
      if (!content.includes('/health')) {
        this.addIssue('high', {
          file: filePath,
          issue: 'Отсутствует health check endpoint',
          fix: 'Добавить GET /health endpoint'
        });
      }
    });
  }

  // Вспомогательные методы
  scanFiles(pattern, callback) {
    const glob = require('glob');
    const files = glob.sync(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] 
    });
    
    files.forEach(file => {
      const content = fs.await fsPromises.readFile(file, 'utf8');
      callback(file, content);
      this.stats.filesAnalyzed++;
    });
  }

  addIssue(severity, issue) {
    this.issues[severity].push(issue);
    this.stats.totalIssues++;
  }

  getLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  isBuiltinModule(module) {
    const builtins = ['fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream', 'events'];
    return builtins.includes(module);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues,
      summary: {
        critical: this.issues.critical.length,
        high: this.issues.high.length,
        medium: this.issues.medium.length,
        low: this.issues.low.length,
        total: this.stats.totalIssues
      }
    };
    
    // Сохраняем детальный JSON отчет
    fs.await fsPromises.writeFile('analysis-report.json', JSON.stringify(report, null, 2));
    
    // Создаем Markdown отчет
    let markdown = `# VHM24 Project Analysis Report

Generated: ${new Date().toLocaleString()}

## 📊 Summary

- **Files Analyzed**: ${this.stats.filesAnalyzed}
- **Total Issues**: ${this.stats.totalIssues}
- **Critical**: ${this.issues.critical.length}
- **High**: ${this.issues.high.length}
- **Medium**: ${this.issues.medium.length}
- **Low**: ${this.issues.low.length}

## 🚨 Critical Issues\n\n`;

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      if (this.issues[severity].length > 0) {
        markdown += `### ${severity.toUpperCase()} Priority\n\n`;
        this.issues[severity].forEach((issue, index) => {
          markdown += `${index + 1}. **${issue.issue}**\n`;
          if (issue.file) markdown += `   - File: \`${issue.file}\`\n`;
          if (issue.line) markdown += `   - Line: ${issue.line}\n`;
          if (issue.fix) markdown += `   - Fix: \`${issue.fix}\`\n`;
          markdown += '\n';
        });
      }
    });
    
    fs.await fsPromises.writeFile('ANALYSIS_REPORT.md', markdown);
    
    logger.info('\n✅ Analysis complete!');
    logger.info(`📄 Reports saved: analysis-report.json, ANALYSIS_REPORT.md`);
  }
}

// Запуск анализа
const analyzer = new ProjectAnalyzer();
analyzer.runFullAnalysis().catch(console.error);
