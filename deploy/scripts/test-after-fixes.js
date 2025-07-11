const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Простой логгер
let logger;
try {
  logger = require('../utils/logger');
} catch (error) {
  logger = {
    info: message => console.log(message),
    error: message => console.error('\x1b[31m%s\x1b[0m', message),
    warn: message => console.warn('\x1b[33m%s\x1b[0m', message),
    success: message => console.log('\x1b[32m%s\x1b[0m', message)
  };
}

class TestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    };
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  async runTests() {
    logger.info('🧪 VHM24 Project Testing After Fixes\n');

    try {
      // 1. Проверка синтаксиса
      await this.syntaxCheck();

      // 2. Проверка зависимостей
      await this.dependencyCheck();

      // 3. Проверка безопасности
      await this.securityCheck();

      // 4. Проверка производительности
      await this.performanceCheck();

      // 5. Проверка интеграции
      await this.integrationCheck();

      // 6. Генерация отчета
      this.generateReport();
    } catch (error) {
      logger.error('❌ Error during testing process:', error);
    }
  }

  async syntaxCheck() {
    logger.info('🔍 Проверка синтаксиса JavaScript...\n');

    try {
      // Проверяем синтаксис JavaScript файлов
      const files = this.findJsFiles();

      for (const file of files) {
        try {
          // Проверяем синтаксис с помощью Node.js
          execSync(`node --check ${file}`, { stdio: 'pipe' });
          this.recordPass(`Синтаксис корректен: ${file}`);
        } catch (error) {
          this.recordFail(
            `Ошибка синтаксиса в файле ${file}: ${error.message}`
          );
        }
      }

      logger.info(`Проверено файлов: ${files.length}`);
    } catch (error) {
      logger.error(`Ошибка при проверке синтаксиса: ${error.message}`);
    }
  }

  async dependencyCheck() {
    logger.info('\n📦 Проверка зависимостей...\n');

    try {
      // Проверяем наличие package.json
      if (fs.existsSync('package.json')) {
        this.recordPass('package.json найден');

        // Проверяем, что все зависимости установлены
        try {
          execSync('npm ls --json', { stdio: 'pipe' });
          this.recordPass('Все зависимости установлены корректно');
        } catch (error) {
          // npm ls возвращает ненулевой код, если есть проблемы с зависимостями
          this.recordFail(
            'Проблемы с зависимостями. Рекомендуется выполнить npm install'
          );
        }

        // Проверяем наличие уязвимостей
        try {
          execSync('npm audit --json', { stdio: 'pipe' });
          this.recordPass('Уязвимости в зависимостях не обнаружены');
        } catch (error) {
          try {
            const auditOutput = error.stdout.toString();
            const auditData = JSON.parse(auditOutput);

            if (auditData.metadata && auditData.metadata.vulnerabilities) {
              const vulns = auditData.metadata.vulnerabilities;
              const totalVulns =
                vulns.critical + vulns.high + vulns.moderate + vulns.low;

              if (totalVulns > 0) {
                this.recordFail(
                  `Обнаружены уязвимости: ${totalVulns} (критических: ${vulns.critical}, высоких: ${vulns.high})`
                );
              } else {
                this.recordPass('Уязвимости в зависимостях не обнаружены');
              }
            }
          } catch (parseError) {
            this.recordFail(
              `Ошибка при анализе уязвимостей: ${parseError.message}`
            );
          }
        }
      } else {
        this.recordFail('package.json не найден');
      }
    } catch (error) {
      logger.error(`Ошибка при проверке зависимостей: ${error.message}`);
    }
  }

  async securityCheck() {
    logger.info('\n🔒 Проверка безопасности...\n');

    try {
      // Проверяем наличие .env файлов
      if (fs.existsSync('.env')) {
        this.recordPass('.env файл найден');

        // Проверяем, что .env не содержит критических данных
        const envContent = fs.readFileSync('.env', 'utf8');
        const sensitivePatterns = [
          /password\s*=\s*[^$]/i,
          /secret\s*=\s*[^$]/i,
          /key\s*=\s*[^$]/i
        ];

        let hasSensitiveData = false;
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(envContent)) {
            hasSensitiveData = true;
          }
        });

        if (hasSensitiveData) {
          this.recordFail('.env содержит незащищенные чувствительные данные');
        } else {
          this.recordPass(
            '.env не содержит незащищенных чувствительных данных'
          );
        }
      } else {
        this.recordSkipped('Файл .env не найден, проверка пропущена');
      }

      // Проверяем наличие .gitignore
      if (fs.existsSync('.gitignore')) {
        this.recordPass('.gitignore файл найден');

        // Проверяем, что .gitignore содержит необходимые паттерны
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        const requiredPatterns = [
          '.env',
          'node_modules',
          '.DS_Store',
          'npm-debug.log'
        ];

        let missingPatterns = [];
        requiredPatterns.forEach(pattern => {
          if (!gitignoreContent.includes(pattern)) {
            missingPatterns.push(pattern);
          }
        });

        if (missingPatterns.length > 0) {
          this.recordFail(
            `.gitignore не содержит необходимые паттерны: ${missingPatterns.join(', ')}`
          );
        } else {
          this.recordPass('.gitignore содержит все необходимые паттерны');
        }
      } else {
        this.recordFail('.gitignore файл не найден');
      }
    } catch (error) {
      logger.error(`Ошибка при проверке безопасности: ${error.message}`);
    }
  }

  async performanceCheck() {
    logger.info('\n⚡ Проверка производительности...\n');

    try {
      // Проверяем наличие больших файлов
      const largeFiles = this.findLargeFiles();

      if (largeFiles.length > 0) {
        this.recordFail(
          `Обнаружены большие файлы (>500KB): ${largeFiles.join(', ')}`
        );
      } else {
        this.recordPass('Больших файлов не обнаружено');
      }

      // Проверяем наличие глубоких вложенностей
      const deepNesting = this.findDeepNesting();

      if (deepNesting.length > 0) {
        this.recordFail(
          `Обнаружены директории с глубокой вложенностью (>5): ${deepNesting.join(', ')}`
        );
      } else {
        this.recordPass('Директорий с глубокой вложенностью не обнаружено');
      }
    } catch (error) {
      logger.error(`Ошибка при проверке производительности: ${error.message}`);
    }
  }

  async integrationCheck() {
    logger.info('\n🔄 Проверка интеграции...\n');

    try {
      // Проверяем наличие health check endpoints
      const healthChecks = this.findHealthChecks();

      if (healthChecks.length > 0) {
        this.recordPass(
          `Обнаружены health check endpoints: ${healthChecks.length}`
        );
      } else {
        this.recordFail('Health check endpoints не обнаружены');
      }

      // Проверяем наличие Dockerfile
      const dockerfiles = this.findDockerfiles();

      if (dockerfiles.length > 0) {
        this.recordPass(`Обнаружены Dockerfile: ${dockerfiles.length}`);
      } else {
        this.recordFail('Dockerfile не обнаружены');
      }

      // Проверяем наличие CI/CD конфигурации
      if (fs.existsSync('.github/workflows')) {
        this.recordPass('CI/CD конфигурация найдена');
      } else {
        this.recordFail('CI/CD конфигурация не найдена');
      }
    } catch (error) {
      logger.error(`Ошибка при проверке интеграции: ${error.message}`);
    }
  }

  // Вспомогательные методы
  findJsFiles() {
    const glob = require('glob');
    return glob.sync('**/*.js', {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/backup/**'
      ]
    });
  }

  findLargeFiles() {
    const glob = require('glob');
    const files = glob.sync('**/*', {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/backup/**',
        '**/.*/**'
      ],
      nodir: true
    });

    return files.filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.size > 500 * 1024; // > 500KB
      } catch (error) {
        return false;
      }
    });
  }

  findDeepNesting() {
    const glob = require('glob');
    const dirs = glob.sync('**/');

    return dirs.filter(dir => {
      const depth = dir.split('/').length - 1;
      return depth > 5;
    });
  }

  findHealthChecks() {
    const glob = require('glob');
    const files = glob.sync('**/*.js', {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/backup/**'
      ]
    });

    return files.filter(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        return (
          content.includes('/health') &&
          (content.includes('app.get') || content.includes('fastify.get'))
        );
      } catch (error) {
        return false;
      }
    });
  }

  findDockerfiles() {
    const glob = require('glob');
    return glob.sync('**/Dockerfile', {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/backup/**'
      ]
    });
  }

  recordPass(message) {
    this.results.passed.push(message);
    this.stats.passed++;
    this.stats.total++;
    logger.success(`✅ PASS: ${message}`);
  }

  recordFail(message) {
    this.results.failed.push(message);
    this.stats.failed++;
    this.stats.total++;
    logger.error(`❌ FAIL: ${message}`);
  }

  recordSkipped(message) {
    this.results.skipped.push(message);
    this.stats.skipped++;
    this.stats.total++;
    logger.warn(`⚠️ SKIP: ${message}`);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      results: this.results,
      summary: {
        total: this.stats.total,
        passed: this.stats.passed,
        failed: this.stats.failed,
        skipped: this.stats.skipped,
        successRate:
          Math.round(
            (this.stats.passed / (this.stats.total - this.stats.skipped)) * 100
          ) || 0
      }
    };

    // Сохраняем детальный JSON отчет
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

    // Выводим итоги
    logger.info('\n📊 Test Results:');
    logger.info(`Total: ${this.stats.total}`);
    logger.success(`Passed: ${this.stats.passed}`);
    logger.error(`Failed: ${this.stats.failed}`);
    logger.warn(`Skipped: ${this.stats.skipped}`);
    logger.info(`Success Rate: ${report.summary.successRate}%`);

    logger.info('\n📄 Report saved: test-report.json');
  }
}

// Запуск тестирования
const tester = new TestRunner();
tester.runTests().catch(error => {
  logger.error('Критическая ошибка:', error);
});
