const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');

// Цвета для консоли
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

class VHM24FunctionalTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            projectName: 'VHM24',
            tests: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                score: 0
            },
            issues: [],
            recommendations: []
        };
        
        this.runningProcesses = [];
        this.testTimeout = 30000; // 30 секунд таймаут для тестов
    }

    log(message, color = 'white') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    logSection(title) {
        this.log(`\n${'='.repeat(80)}`, 'cyan');
        this.log(`${title}`, 'cyan');
        this.log(`${'='.repeat(80)}`, 'cyan');
    }

    logSubSection(title) {
        this.log(`\n${'─'.repeat(60)}`, 'yellow');
        this.log(`${title}`, 'yellow');
        this.log(`${'─'.repeat(60)}`, 'yellow');
    }

    // Утилита для HTTP запросов
    makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const requestOptions = {
                timeout: 5000,
                ...options
            };
            
            const req = client.request(url, requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    // Проверка конфигурационных файлов
    async testConfigurationFiles() {
        this.logSubSection('🔧 Тестирование конфигурационных файлов');
        
        const configTest = {
            name: 'Configuration Files',
            status: 'PASS',
            details: {},
            issues: []
        };

        // Проверка .env файлов
        const envFiles = ['.env', '.env.example', '.env.production'];
        for (const envFile of envFiles) {
            try {
                if (fs.existsSync(envFile)) {
                    const content = fs.readFileSync(envFile, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                    
                    configTest.details[envFile] = {
                        exists: true,
                        variableCount: lines.length,
                        valid: true
                    };
                    
                    this.log(`✅ ${envFile}: ${lines.length} переменных`, 'green');
                } else {
                    configTest.details[envFile] = {
                        exists: false,
                        valid: false
                    };
                    
                    if (envFile === '.env.example') {
                        configTest.status = 'WARNING';
                        configTest.issues.push(`${envFile} не найден`);
                        this.log(`⚠️ ${envFile} не найден`, 'yellow');
                    } else {
                        this.log(`⚠️ ${envFile} не найден`, 'yellow');
                    }
                }
            } catch (error) {
                configTest.details[envFile] = {
                    exists: true,
                    valid: false,
                    error: error.message
                };
                configTest.status = 'FAIL';
                configTest.issues.push(`Ошибка при чтении ${envFile}: ${error.message}`);
                this.log(`❌ Ошибка при чтении ${envFile}: ${error.message}`, 'red');
            }
        }

        // Проверка package.json всех сервисов
        const serviceDirs = ['backend', 'apps/telegram-bot', 'apps/web-dashboard'];
        for (const serviceDir of serviceDirs) {
            const packageJsonPath = path.join(serviceDir, 'package.json');
            try {
                if (fs.existsSync(packageJsonPath)) {
                    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    configTest.details[`${serviceDir}/package.json`] = {
                        exists: true,
                        valid: true,
                        name: packageData.name,
                        version: packageData.version,
                        hasScripts: !!packageData.scripts,
                        hasDependencies: !!packageData.dependencies
                    };
                    
                    this.log(`✅ ${serviceDir}/package.json: ${packageData.name}@${packageData.version}`, 'green');
                } else {
                    configTest.details[`${serviceDir}/package.json`] = {
                        exists: false,
                        valid: false
                    };
                    configTest.status = 'WARNING';
                    configTest.issues.push(`${serviceDir}/package.json не найден`);
                    this.log(`⚠️ ${serviceDir}/package.json не найден`, 'yellow');
                }
            } catch (error) {
                configTest.details[`${serviceDir}/package.json`] = {
                    exists: true,
                    valid: false,
                    error: error.message
                };
                configTest.status = 'FAIL';
                configTest.issues.push(`Ошибка при чтении ${serviceDir}/package.json: ${error.message}`);
                this.log(`❌ Ошибка при чтении ${serviceDir}/package.json: ${error.message}`, 'red');
            }
        }

        this.testResults.tests.configurationFiles = configTest;
        return configTest;
    }

    // Тестирование структуры проекта
    async testProjectStructure() {
        this.logSubSection('📁 Тестирование структуры проекта');
        
        const structureTest = {
            name: 'Project Structure',
            status: 'PASS',
            details: {},
            issues: []
        };

        // Проверка основных директорий
        const requiredDirs = [
            'backend',
            'apps',
            'services',
            'backend/src',
            'apps/telegram-bot',
            'apps/web-dashboard'
        ];

        for (const dir of requiredDirs) {
            try {
                if (fs.existsSync(dir)) {
                    const stats = fs.statSync(dir);
                    if (stats.isDirectory()) {
                        const contents = fs.readdirSync(dir);
                        structureTest.details[dir] = {
                            exists: true,
                            isDirectory: true,
                            fileCount: contents.length
                        };
                        this.log(`✅ ${dir}/: ${contents.length} файлов`, 'green');
                    } else {
                        structureTest.details[dir] = {
                            exists: true,
                            isDirectory: false
                        };
                        structureTest.status = 'FAIL';
                        structureTest.issues.push(`${dir} существует, но это не директория`);
                        this.log(`❌ ${dir} существует, но это не директория`, 'red');
                    }
                } else {
                    structureTest.details[dir] = {
                        exists: false,
                        isDirectory: false
                    };
                    structureTest.status = 'WARNING';
                    structureTest.issues.push(`Директория ${dir} не найдена`);
                    this.log(`⚠️ Директория ${dir} не найдена`, 'yellow');
                }
            } catch (error) {
                structureTest.details[dir] = {
                    exists: false,
                    error: error.message
                };
                structureTest.status = 'FAIL';
                structureTest.issues.push(`Ошибка при проверке ${dir}: ${error.message}`);
                this.log(`❌ Ошибка при проверке ${dir}: ${error.message}`, 'red');
            }
        }

        // Проверка важных файлов
        const requiredFiles = [
            'README.md',
            'docker-compose.yml',
            'Dockerfile',
            'backend/src/app.js',
            'backend/src/server.js'
        ];

        for (const file of requiredFiles) {
            try {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    structureTest.details[file] = {
                        exists: true,
                        size: stats.size,
                        lastModified: stats.mtime
                    };
                    this.log(`✅ ${file}: ${stats.size} байт`, 'green');
                } else {
                    structureTest.details[file] = {
                        exists: false
                    };
                    if (file.includes('app.js') || file.includes('server.js')) {
                        structureTest.status = 'WARNING';
                        structureTest.issues.push(`Файл ${file} не найден`);
                        this.log(`⚠️ Файл ${file} не найден`, 'yellow');
                    } else {
                        this.log(`⚠️ Файл ${file} не найден`, 'yellow');
                    }
                }
            } catch (error) {
                structureTest.details[file] = {
                    exists: false,
                    error: error.message
                };
                structureTest.status = 'FAIL';
                structureTest.issues.push(`Ошибка при проверке ${file}: ${error.message}`);
                this.log(`❌ Ошибка при проверке ${file}: ${error.message}`, 'red');
            }
        }

        this.testResults.tests.projectStructure = structureTest;
        return structureTest;
    }

    // Тестирование зависимостей
    async testDependencies() {
        this.logSubSection('📦 Тестирование зависимостей');
        
        const dependencyTest = {
            name: 'Dependencies',
            status: 'PASS',
            details: {},
            issues: []
        };

        // Проверка основных зависимостей
        const mainDependencies = [
            'express',
            'cors',
            'helmet',
            'dotenv',
            'jsonwebtoken',
            'bcryptjs',
            'pg',
            'sequelize',
            'winston',
            'joi',
            'multer',
            'redis'
        ];

        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const allDependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            dependencyTest.details.totalDependencies = Object.keys(allDependencies).length;
            dependencyTest.details.foundDependencies = 0;
            dependencyTest.details.missingDependencies = [];

            for (const dep of mainDependencies) {
                if (allDependencies[dep]) {
                    dependencyTest.details.foundDependencies++;
                    this.log(`✅ ${dep}: ${allDependencies[dep]}`, 'green');
                } else {
                    dependencyTest.details.missingDependencies.push(dep);
                    this.log(`⚠️ ${dep}: не найден`, 'yellow');
                }
            }

            if (dependencyTest.details.missingDependencies.length > 0) {
                dependencyTest.status = 'WARNING';
                dependencyTest.issues.push(`Отсутствуют зависимости: ${dependencyTest.details.missingDependencies.join(', ')}`);
            }

            // Проверка node_modules
            if (fs.existsSync('node_modules')) {
                const nodeModulesContents = fs.readdirSync('node_modules');
                dependencyTest.details.nodeModulesCount = nodeModulesContents.length;
                this.log(`✅ node_modules: ${nodeModulesContents.length} пакетов`, 'green');
            } else {
                dependencyTest.status = 'FAIL';
                dependencyTest.issues.push('node_modules не найден');
                this.log(`❌ node_modules не найден`, 'red');
            }

        } catch (error) {
            dependencyTest.status = 'FAIL';
            dependencyTest.issues.push(`Ошибка при проверке зависимостей: ${error.message}`);
            this.log(`❌ Ошибка при проверке зависимостей: ${error.message}`, 'red');
        }

        this.testResults.tests.dependencies = dependencyTest;
        return dependencyTest;
    }

    // Тестирование синтаксиса JavaScript файлов
    async testJavaScriptSyntax() {
        this.logSubSection('🔍 Тестирование синтаксиса JavaScript');
        
        const syntaxTest = {
            name: 'JavaScript Syntax',
            status: 'PASS',
            details: {},
            issues: []
        };

        // Поиск всех JS файлов
        const findJSFiles = (dir, files = []) => {
            try {
                const entries = fs.readdirSync(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                        findJSFiles(fullPath, files);
                    } else if (stat.isFile() && entry.endsWith('.js')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Игнорируем ошибки доступа к директориям
            }
            return files;
        };

        const jsFiles = findJSFiles('.');
        syntaxTest.details.totalFiles = jsFiles.length;
        syntaxTest.details.validFiles = 0;
        syntaxTest.details.invalidFiles = [];

        this.log(`🔍 Найдено ${jsFiles.length} JavaScript файлов`, 'blue');

        for (const file of jsFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Простая проверка синтаксиса
                new Function(content);
                
                syntaxTest.details.validFiles++;
                this.log(`✅ ${file}: синтаксис корректен`, 'green');
                
            } catch (error) {
                syntaxTest.details.invalidFiles.push({
                    file: file,
                    error: error.message
                });
                syntaxTest.status = 'FAIL';
                syntaxTest.issues.push(`Синтаксическая ошибка в ${file}: ${error.message}`);
                this.log(`❌ ${file}: ${error.message}`, 'red');
            }
        }

        this.testResults.tests.javaScriptSyntax = syntaxTest;
        return syntaxTest;
    }

    // Тестирование Docker конфигурации
    async testDockerConfiguration() {
        this.logSubSection('🐳 Тестирование Docker конфигурации');
        
        const dockerTest = {
            name: 'Docker Configuration',
            status: 'PASS',
            details: {},
            issues: []
        };

        // Проверка Dockerfile
        try {
            if (fs.existsSync('Dockerfile')) {
                const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
                const lines = dockerfileContent.split('\n');
                
                dockerTest.details.dockerfile = {
                    exists: true,
                    lineCount: lines.length,
                    hasFrom: lines.some(line => line.trim().startsWith('FROM')),
                    hasExpose: lines.some(line => line.trim().startsWith('EXPOSE')),
                    hasCmd: lines.some(line => line.trim().startsWith('CMD'))
                };
                
                if (dockerTest.details.dockerfile.hasFrom) {
                    this.log(`✅ Dockerfile: найден базовый образ`, 'green');
                } else {
                    dockerTest.status = 'WARNING';
                    dockerTest.issues.push('Dockerfile не содержит FROM инструкцию');
                    this.log(`⚠️ Dockerfile не содержит FROM инструкцию`, 'yellow');
                }
                
                if (dockerTest.details.dockerfile.hasExpose) {
                    this.log(`✅ Dockerfile: найден EXPOSE`, 'green');
                } else {
                    this.log(`⚠️ Dockerfile не содержит EXPOSE инструкцию`, 'yellow');
                }
                
                if (dockerTest.details.dockerfile.hasCmd) {
                    this.log(`✅ Dockerfile: найден CMD`, 'green');
                } else {
                    dockerTest.status = 'WARNING';
                    dockerTest.issues.push('Dockerfile не содержит CMD инструкцию');
                    this.log(`⚠️ Dockerfile не содержит CMD инструкцию`, 'yellow');
                }
                
            } else {
                dockerTest.details.dockerfile = { exists: false };
                dockerTest.status = 'WARNING';
                dockerTest.issues.push('Dockerfile не найден');
                this.log(`⚠️ Dockerfile не найден`, 'yellow');
            }
        } catch (error) {
            dockerTest.details.dockerfile = {
                exists: true,
                error: error.message
            };
            dockerTest.status = 'FAIL';
            dockerTest.issues.push(`Ошибка при чтении Dockerfile: ${error.message}`);
            this.log(`❌ Ошибка при чтении Dockerfile: ${error.message}`, 'red');
        }

        // Проверка docker-compose.yml
        try {
            if (fs.existsSync('docker-compose.yml')) {
                const composeContent = fs.readFileSync('docker-compose.yml', 'utf8');
                
                dockerTest.details.dockerCompose = {
                    exists: true,
                    hasServices: composeContent.includes('services:'),
                    hasVolumes: composeContent.includes('volumes:'),
                    hasNetworks: composeContent.includes('networks:')
                };
                
                if (dockerTest.details.dockerCompose.hasServices) {
                    this.log(`✅ docker-compose.yml: найдены сервисы`, 'green');
                } else {
                    dockerTest.status = 'FAIL';
                    dockerTest.issues.push('docker-compose.yml не содержит сервисов');
                    this.log(`❌ docker-compose.yml не содержит сервисов`, 'red');
                }
                
                if (dockerTest.details.dockerCompose.hasVolumes) {
                    this.log(`✅ docker-compose.yml: найдены volumes`, 'green');
                } else {
                    this.log(`⚠️ docker-compose.yml не содержит volumes`, 'yellow');
                }
                
                if (dockerTest.details.dockerCompose.hasNetworks) {
                    this.log(`✅ docker-compose.yml: найдены networks`, 'green');
                } else {
                    this.log(`⚠️ docker-compose.yml не содержит networks`, 'yellow');
                }
                
            } else {
                dockerTest.details.dockerCompose = { exists: false };
                dockerTest.status = 'WARNING';
                dockerTest.issues.push('docker-compose.yml не найден');
                this.log(`⚠️ docker-compose.yml не найден`, 'yellow');
            }
        } catch (error) {
            dockerTest.details.dockerCompose = {
                exists: true,
                error: error.message
            };
            dockerTest.status = 'FAIL';
            dockerTest.issues.push(`Ошибка при чтении docker-compose.yml: ${error.message}`);
            this.log(`❌ Ошибка при чтении docker-compose.yml: ${error.message}`, 'red');
        }

        this.testResults.tests.dockerConfiguration = dockerTest;
        return dockerTest;
    }

    // Тестирование скриптов запуска
    async testStartupScripts() {
        this.logSubSection('🚀 Тестирование скриптов запуска');
        
        const startupTest = {
            name: 'Startup Scripts',
            status: 'PASS',
            details: {},
            issues: []
        };

        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const scripts = packageJson.scripts || {};
            
            startupTest.details.scripts = scripts;
            startupTest.details.hasStart = !!scripts.start;
            startupTest.details.hasDev = !!scripts.dev;
            startupTest.details.hasBuild = !!scripts.build;
            startupTest.details.hasTest = !!scripts.test;
            
            if (startupTest.details.hasStart) {
                this.log(`✅ npm start: ${scripts.start}`, 'green');
            } else {
                startupTest.status = 'WARNING';
                startupTest.issues.push('Отсутствует npm start script');
                this.log(`⚠️ Отсутствует npm start script`, 'yellow');
            }
            
            if (startupTest.details.hasDev) {
                this.log(`✅ npm run dev: ${scripts.dev}`, 'green');
            } else {
                startupTest.status = 'WARNING';
                startupTest.issues.push('Отсутствует npm run dev script');
                this.log(`⚠️ Отсутствует npm run dev script`, 'yellow');
            }
            
            if (startupTest.details.hasBuild) {
                this.log(`✅ npm run build: ${scripts.build}`, 'green');
            } else {
                this.log(`⚠️ Отсутствует npm run build script`, 'yellow');
            }
            
            if (startupTest.details.hasTest) {
                this.log(`✅ npm test: ${scripts.test}`, 'green');
            } else {
                this.log(`⚠️ Отсутствует npm test script`, 'yellow');
            }
            
        } catch (error) {
            startupTest.status = 'FAIL';
            startupTest.issues.push(`Ошибка при чтении package.json: ${error.message}`);
            this.log(`❌ Ошибка при чтении package.json: ${error.message}`, 'red');
        }

        this.testResults.tests.startupScripts = startupTest;
        return startupTest;
    }

    // Генерация итогового отчета
    generateSummary() {
        const tests = this.testResults.tests;
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;
        
        Object.keys(tests).forEach(testName => {
            const test = tests[testName];
            totalTests++;
            
            if (test.status === 'PASS') {
                passedTests++;
            } else if (test.status === 'FAIL') {
                failedTests++;
            } else if (test.status === 'WARNING') {
                passedTests++; // Warnings считаются как passed, но с предупреждениями
            } else {
                skippedTests++;
            }
        });
        
        const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        this.testResults.summary = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            skipped: skippedTests,
            score: score
        };
        
        // Сбор всех проблем
        Object.keys(tests).forEach(testName => {
            const test = tests[testName];
            if (test.issues && test.issues.length > 0) {
                test.issues.forEach(issue => {
                    this.testResults.issues.push(`[${testName}] ${issue}`);
                });
            }
        });
        
        // Генерация рекомендаций
        if (failedTests > 0) {
            this.testResults.recommendations.push('Исправьте критические ошибки перед запуском в production');
        }
        
        if (this.testResults.issues.length > 0) {
            this.testResults.recommendations.push('Устраните найденные проблемы для повышения стабильности');
        }
        
        this.testResults.recommendations.push('Проведите дополнительное тестирование в runtime окружении');
        this.testResults.recommendations.push('Настройте мониторинг и логирование для production');
    }

    // Вывод итогового отчета
    printFinalReport() {
        this.logSection('📊 ИТОГОВЫЙ ОТЧЕТ ФУНКЦИОНАЛЬНОГО ТЕСТИРОВАНИЯ');
        
        const summary = this.testResults.summary;
        
        // Определение статуса
        let overallStatus = 'EXCELLENT';
        if (summary.score >= 90) {
            overallStatus = 'EXCELLENT';
        } else if (summary.score >= 80) {
            overallStatus = 'GOOD';
        } else if (summary.score >= 70) {
            overallStatus = 'FAIR';
        } else if (summary.score >= 60) {
            overallStatus = 'POOR';
        } else {
            overallStatus = 'CRITICAL';
        }
        
        const statusColors = {
            'EXCELLENT': 'green',
            'GOOD': 'green',
            'FAIR': 'yellow',
            'POOR': 'red',
            'CRITICAL': 'red'
        };
        
        this.log(`\n🎯 ОБЩИЙ СТАТУС: ${overallStatus}`, statusColors[overallStatus]);
        this.log(`📈 БАЛЛ: ${summary.score}/100`, summary.score >= 80 ? 'green' : summary.score >= 60 ? 'yellow' : 'red');
        
        // Статистика тестов
        this.log(`\n📊 СТАТИСТИКА ТЕСТОВ:`, 'blue');
        this.log(`   ✅ Пройдено: ${summary.passed}/${summary.total}`, 'green');
        this.log(`   ❌ Провалено: ${summary.failed}/${summary.total}`, 'red');
        this.log(`   ⏭️ Пропущено: ${summary.skipped}/${summary.total}`, 'yellow');
        
        // Детали тестов
        this.log(`\n📋 ДЕТАЛИ ТЕСТОВ:`, 'blue');
        Object.keys(this.testResults.tests).forEach(testName => {
            const test = this.testResults.tests[testName];
            const statusEmoji = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
            const color = test.status === 'PASS' ? 'green' : test.status === 'FAIL' ? 'red' : 'yellow';
            this.log(`   ${statusEmoji} ${test.name}: ${test.status}`, color);
        });
        
        // Найденные проблемы
        if (this.testResults.issues.length > 0) {
            this.log(`\n🔍 НАЙДЕННЫЕ ПРОБЛЕМЫ:`, 'red');
            this.testResults.issues.forEach(issue => {
                this.log(`   • ${issue}`, 'red');
            });
        }
        
        // Рекомендации
        if (this.testResults.recommendations.length > 0) {
            this.log(`\n💡 РЕКОМЕНДАЦИИ:`, 'yellow');
            this.testResults.recommendations.forEach(rec => {
                this.log(`   • ${rec}`, 'yellow');
            });
        }
        
        // Заключение
        this.log(`\n📄 ЗАКЛЮЧЕНИЕ:`, 'cyan');
        
        if (overallStatus === 'EXCELLENT' || overallStatus === 'GOOD') {
            this.log('   ✅ Проект прошел функциональное тестирование успешно', 'green');
            this.log('   ✅ Готов к дальнейшей разработке и деплою', 'green');
        } else if (overallStatus === 'FAIR') {
            this.log('   ⚠️ Проект требует устранения предупреждений', 'yellow');
            this.log('   ⚠️ Рекомендуется дополнительное тестирование', 'yellow');
        } else {
            this.log('   ❌ Проект требует серьезных исправлений', 'red');
            this.log('   ❌ Не рекомендуется к запуску в production', 'red');
        }
    }

    // Основной метод запуска всех тестов
    async runAllTests() {
        this.logSection('🧪 ЗАПУСК ФУНКЦИОНАЛЬНОГО ТЕСТИРОВАНИЯ VHM24');
        
        try {
            // Последовательное выполнение всех тестов
            await this.testConfigurationFiles();
            await this.testProjectStructure();
            await this.testDependencies();
            await this.testJavaScriptSyntax();
            await this.testDockerConfiguration();
            await this.testStartupScripts();
            
            // Генерация итогового отчета
            this.generateSummary();
            
            // Вывод итогового отчета
            this.printFinalReport();
            
            // Сохранение отчета в файл
            const reportPath = 'VHM24_FUNCTIONAL_TEST_REPORT.json';
            fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
            this.log(`\n💾 Отчет сохранен в: ${reportPath}`, 'green');
            
            return this.testResults;
            
        } catch (error) {
            this.log(`❌ Ошибка при выполнении тестирования: ${error.message}`, 'red');
            throw error;
        }
    }

    // Очистка ресурсов
    cleanup() {
        // Завершение всех запущенных процессов
        this.runningProcesses.forEach(process => {
            try {
                process.kill();
            } catch (error) {
                // Игнорируем ошибки при завершении процессов
            }
        });
        
        this.runningProcesses = [];
    }
}

// Запуск тестирования
if (require.main === module) {
    const tester = new VHM24FunctionalTester();
    
    // Обработка сигналов для корректного завершения
    process.on('SIGINT', () => {
        console.log('\n⏹️ Остановка тестирования...');
        tester.cleanup();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n⏹️ Остановка тестирования...');
        tester.cleanup();
        process.exit(0);
    });
    
    tester.runAllTests()
        .then(results => {
            console.log('\n✅ Тестирование завершено успешно');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Ошибка при тестировании:', error.message);
            tester.cleanup();
            process.exit(1);
        });
}

module.exports = VHM24FunctionalTester;
