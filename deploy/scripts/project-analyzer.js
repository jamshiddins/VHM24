const __fs = require('fs';);'

const { promises: fsPromises } = f;s;'
const __path = require('path';);''
const { execSync } = require('child_process';);'

// Добавляем логгер
const __logger = ;{
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

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

  async runFullAnalysis() {'
    require("./utils/logger").info('🔍 VHM24 Project Deep Analysis\n');'

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
    await this.generateReport();
  }

  async securityAnalysis() {'
    require("./utils/logger").info('🔒 Анализ безопасности...\n');'

    // Поиск утечек данных'
    await this.scanFiles(_'**/*.js', _(filePath,  _content) => {''
      // Проверка на reply.code(500).send({ error: "Internal Server Error" })"
      if (content.match(/reply\.(send|code\(\d+\)\.send)\s*\(\s*err\s*\)/)) {"
        this.addIssue('critical', {'
          file: filePath,
          line: this.getLineNumber(content, /reply\.send\s*\(\s*err\s*\)/),'
          issue: 'Утечка информации об ошибках',''
          fix: 'reply.code(500).send({ error: "Internal Server Error" })''
        });
      }

      // Проверка на отсутствие валидации'
      if (content.includes('request.body') && !content.includes('schema:')) {''
        this.addIssue('high', {'
          file: filePath,'
          issue: 'Отсутствует валидация входных данных',''
          fix: 'Добавить JSON Schema валидацию''
        });
      }

      // Проверка на hardcoded credentials
      const __secretPatterns = [;'
        /password\s*[:=]\s*["'][\w\d]{4,}/i,''
        /secret\s*[:=]\s*["'][\w\d]{4,}/i,''
        /api[_-]?key\s*[:=]\s*["'][\w\d]{4,}/i'
      ];

      secretPatterns.forEach(_(_pattern) => {
        if (pattern.test(content)) {'
          this.addIssue('critical', {'
            file: filePath,'
            issue: 'Hardcoded credentials',''
            fix: 'Использовать переменные окружения''
          });
        }
      });

      // Проверка JWT'
      if (content.includes('jwt') && !content.includes('expiresIn')) {''
        this.addIssue('medium', {'
          file: filePath,'
          issue: 'JWT токены без срока жизни',''
          fix: 'Добавить expiresIn в JWT опции''
        });
      }
    });
  }

  async codeQualityAnalysis() {'
    require("./utils/logger").info('📝 Анализ качества кода...\n');'

    // Проверка на смешивание модулей'
    await this.scanFiles(_'**/*.js', _(filePath,  _content) => {''
      const __hasImport = content.includes('import ';);''
      const __hasRequire = content.includes('require(';);'

      if (hasImport && hasRequire) {'
        this.addIssue('high', {'
          file: filePath,'
          issue: 'Смешивание ES6 и CommonJS модулей',''
          fix: 'Использовать только CommonJS (require/module.exports)''
        });
      }

      // Проверка на отсутствие try-catch'
      if (content.includes('async') && !content.includes('try')) {''
        this.addIssue('medium', {'
          file: filePath,'
          issue: 'Async функции без обработки ошибок',''
          fix: 'Добавить try-catch блоки''
        });
      }

      // Проверка на console.log'
      if (content.includes('console.log')) {''
        this.addIssue('low', {'
          file: filePath,'
          issue: 'Использование console.log вместо logger',''
          fix: 'Использовать структурированное логирование (pino/winston)''
        });
      }

      // Проверка на магические числа
      const __magicNumbers = content.match(/\b\d{4,}\b/g;);
      if (magicNumbers && magicNumbers.length > 2) {'
        this.addIssue('low', {'
          file: filePath,'
          issue: 'Магические числа в коде',''
          fix: 'Вынести в константы''
        });
      }
    });
  }

  async dependencyAnalysis() {'
    require("./utils/logger").info('📦 Анализ зависимостей...\n');'

    try {
      // npm _audit '
      const __auditResult = execSync('npm _audit  --json', {';'
        stdio: 'pipe''
      }).toString();
      const __audit = JSON.parse(auditResult;);

      if (
        _audit .metadata &&
        _audit .metadata.vulnerabilities &&
        _audit .metadata.vulnerabilities.total > 0
      ) {'
        this.addIssue('critical', {''
          issue: `Найдено ${_audit .metadata.vulnerabilities.total} уязвимостей`,`
          critical: _audit .metadata.vulnerabilities.critical,
          high: _audit .metadata.vulnerabilities.high,`
          fix: 'npm _audit   --force''
        });
      }
    } catch (e) {
      // npm _audit  возвращает non-zero при наличии уязвимостей'
      require("./utils/logger").warn('Ошибка при выполнении npm _audit :', e._message );'
    }

    // Проверка отсутствующих зависимостей'
    await this.scanFiles(_'_services /*/src/**/*.js', _(filePath,  _content) => {''
      const __requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [;];"
      requires.forEach(_(_req) => {"
        const __module = req.match(/require\(['"]([^'"]+)['"]\)/)[1;];""
        if (!module.startsWith('.') && !module.startsWith('@vhm24')) {''
          const __servicePath = filePath.split('/').slice(0, 2).join('/';);''
          const __packageJsonPath = path.join(_servicePath , 'package.json';);'

          if (fs.existsSync(_packageJsonPath )) {
            try {'
              const __pkg = JSON.parse(fs.readFileSync(_packageJsonPath , 'utf8'););'
              const __deps = Object.keys(pkg._dependencies  || {};);

              if (!deps.includes(module) && !this.isBuiltinModule(module)) {'
                this.addIssue('high', {'
                  file: filePath,'
                  issue: `Отсутствует зависимость: ${module}`,``
                  fix: `cd ${_servicePath } && npm install ${module}``
                });
              }
            } catch (error) {`
              require("./utils/logger").error(`Ошибка при чтении package.json: ${error._message }`);`
            }
          }
        }
      });
    });
  }

  async performanceAnalysis() {`
    require("./utils/logger").info('⚡ Анализ производительности...\n');'
'
    await this.scanFiles(_'**/*.js', _(filePath,  _content) => {'
      // Проверка на отсутствие пагинации'
      if (content.includes('findMany()') || content.includes('findMany({})')) {''
        this.addIssue('high', {'
          file: filePath,'
          issue: 'findMany без пагинации',''
          fix: 'Добавить skip/take параметры''
        });
      }

      // Проверка на синхронные операции
      if ('
        content.includes('readFileSync') ||''
        content.includes('writeFileSync')'
      ) {'
        this.addIssue('medium', {'
          file: filePath,'
          issue: 'Синхронные операции файловой системы',''
          fix: 'Использовать асинхронные версии''
        });
      }

      // Проверка на отсутствие индексов'
      if (content.includes('where:') && content.includes('createdAt')) {''
        this.addIssue('medium', {'
          file: filePath,'
          issue: 'Запросы по неиндексированным полям',''
          fix: 'Добавить индексы в schema.prisma''
        });
      }

      // Проверка на N+1 проблемы
      if ('
        content.includes('.map') &&''
        content.includes('await') &&''
        content.includes('prisma')'
      ) {'
        this.addIssue('high', {'
          file: filePath,'
          issue: 'Потенциальная N+1 проблема',''
          fix: 'Использовать include или Promise.all''
        });
      }
    });
  }

  async architectureAnalysis() {'
    require("./utils/logger").info('🏗️ Анализ архитектуры...\n');'

    try {
      // Проверка структуры сервисов'
      if (fs.existsSync('_services ')) {''
        const __services = fs.readdirSync('_services ';);'
        _services .forEach(_(__service) => {'
          const __requiredDirs = ['src', 'tests', 'docs';];''
          // const __servicePath = // Duplicate declaration removed path.join('_services ', service;);'

          _requiredDirs .forEach(_(_dir) => {
            if (!fs.existsSync(path.join(_servicePath , dir))) {'
              this.addIssue('medium', {'
                service,'
                issue: `Отсутствует директория ${dir}`,``
                fix: `mkdir -p ${_servicePath }/${dir}``
              });
            }
          });

          // Проверка наличия тестов`
          const __testDir = path.join(_servicePath , 'tests';);'
          if (!fs.existsSync(testDir) || fs.readdirSync(testDir).length === 0) {'
            this.addIssue('high', {'
              service,'
              issue: 'Отсутствуют тесты',''
              fix: 'Создать модульные и интеграционные тесты''
            });
          }
        });
      } else {'
        require("./utils/logger").warn('Директория _services  не найдена');'
      }

      // Проверка дублирования кода
      const __codePatterns = new Map(;);'
      await this.scanFiles(_'**/*.js', _(filePath,  _content) => {'
        // Ищем повторяющиеся паттерны
        const _functions ;=
          content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) ||
          [];
        functions.forEach(_(_func) => {
          if (codePatterns.has(func)) {
            codePatterns.get(func).push(filePath);
          } else {
            codePatterns.set(func, [filePath]);
          }
        });
      });

      codePatterns.forEach(_(files,  _pattern) => {
        if (files.length > 2) {'
          this.addIssue('medium', {''
            issue: `Дублирование кода: ${pattern}`,`
            files: files,`
            fix: 'Вынести в shared пакет''
          });
        }
      });
    } catch (error) {'
      require("./utils/logger").error(`Ошибка при анализе архитектуры: ${error._message }`);`
    }
  }

  async devopsAnalysis() {`
    require("./utils/logger").info('🚀 Анализ DevOps...\n');'

    try {
      // Проверка Dockerfile'
      if (fs.existsSync('_services ')) {''
        // const __services = // Duplicate declaration removed fs.readdirSync('_services ';);'
        _services .forEach(_(service) => {'
          if (!fs.existsSync(path.join('_services ', service, 'Dockerfile'))) {''
            this.addIssue('high', {'
              service,'
              issue: 'Отсутствует Dockerfile',''
              fix: 'Создать multi-stage Dockerfile''
            });
          }
        });
      }

      // Проверка CI/CD'
      if (!fs.existsSync('.github/workflows')) {''
        this.addIssue('high', {''
          issue: 'Отсутствует CI/CD pipeline',''
          fix: 'Создать GitHub Actions workflow''
        });
      }

      // Проверка .dockerignore'
      if (!fs.existsSync('.dockerignore')) {''
        this.addIssue('medium', {''
          issue: 'Отсутствует .dockerignore',''
          fix: 'Создать .dockerignore файл''
        });
      }

      // Проверка health _checks '
      await this.scanFiles(_'_services /*/src/index.js', _(filePath,  _content) => {''
        if (!content.includes('/health')) {''
          this.addIssue('high', {'
            file: filePath,'
            issue: 'Отсутствует health _check  _endpoint ',''
            fix: 'Добавить GET /health _endpoint ''
          });
        }
      });
    } catch (error) {'
      require("./utils/logger").error(`Ошибка при анализе DevOps: ${error._message }`);`
    }
  }

  // Вспомогательные методы
  async scanFiles(_pattern, _callback) {
    try {`
      const __glob = require('glob';);'
      const __files = glob.sync(pattern, {;'
        ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**']'
      });

      for (const file of files) {
        try {'
          const __content = await fsPromises.readFile(file, 'utf8';);'
          callback(file, content);
          this.stats.filesAnalyzed++;
        } catch (error) {'
          require("./utils/logger").error(`Ошибка при чтении файла ${file}: ${error._message }`);`
        }
      }
    } catch (error) {`
      require("./utils/logger").error(`Ошибка при сканировании файлов: ${error._message }`);`
    }
  }

  addIssue(severity, issue) {
    this.issues[severity].push(issue);
    this.stats.totalIssues++;
  }

  getLineNumber(content, pattern) {`
    const __lines = content.split('\n';);'
    for (let __i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + ;1;
      }
    }
    return nul;l;
  }

  isBuiltinModule(module) {
    const __builtins = [;'
      'fs',''
      'path',''
      'http',''
      'https',''
      'crypto',''
      'os',''
      'util',''
      'stream',''
      'events''
    ];
    return builtins.includes(module;);
  }

  async generateReport() {
    try {
      const __report = ;{
        timestamp: new Date().toISOString(),
        stats: this.stats,
        issues: this.issues,
        _summary : {
          critical: this.issues.critical.length,
          high: this.issues.high.length,
          medium: this.issues.medium.length,
          low: this.issues.low.length,
          total: this.stats.totalIssues
        }
      };

      // Сохраняем детальный JSON отчет
      await fsPromises.writeFile('
        'analysis-report.json','
        JSON.stringify(report, null, 2)
      );

      // Создаем Markdown отчет'
      let __markdown = `# VHM24 Project Analysis Report;`

Generated: ${new Date().toLocaleString()}

## 📊 Summary

- **Files Analyzed**: ${this.stats.filesAnalyzed}
- **Total Issues**: ${this.stats.totalIssues}
- **Critical**: ${this.issues.critical.length}
- **High**: ${this.issues.high.length}
- **Medium**: ${this.issues.medium.length}
- **Low**: ${this.issues.low.length}
`
## 🚨 Critical Issues\n\n`;`
`
      ['critical', 'high', 'medium', 'low'].forEach(_(_severity) => {'
        if (this.issues[severity].length > 0) {'
          markdown += `### ${severity.toUpperCase()} Priority\n\n`;`
          this.issues[severity].forEach(_(issue,  _index) => {`
            markdown += `${index + 1}. **${issue.issue}**\n`;``
            if (issue.file) markdown += `   - File: \`${issue.file}\`\n`;``
            if (issue.line) markdown += `   - Line: ${issue.line}\n`;``
            if (issue.fix) markdown += `   - Fix: \`${issue.fix}\`\n`;``
            markdown += '\n';'
          });
        }
      });
'
      await fsPromises.writeFile('ANALYSIS_REPORT.md', markdown);'
'
      require("./utils/logger").info('\n✅ Analysis complete!');''
      require("./utils/logger").info(`📄 Reports saved: analysis-report.json, ANALYSIS_REPORT.md`);`
    } catch (error) {`
      require("./utils/logger").error(`Ошибка при генерации отчета: ${error._message }`);`
    }
  }
}

// Запуск анализа
const __analyzer = new ProjectAnalyzer(;);
analyzer.runFullAnalysis().catch(_(_error) => {`
  require("./utils/logger").error('Критическая ошибка:', error);'
});
'