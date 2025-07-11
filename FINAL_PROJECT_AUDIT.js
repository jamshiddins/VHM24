const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

class VHM24ProjectAudit {
    constructor() {
        this.auditResults = {
            timestamp: new Date().toISOString(),
            projectName: 'VHM24',
            gitRepo: 'https://github.com/jamshiddins/VHM24.git',
            checks: {},
            issues: [],
            recommendations: [],
            summary: {
                status: 'UNKNOWN',
                score: 0,
                totalChecks: 0,
                passedChecks: 0,
                failedChecks: 0,
                warningChecks: 0
            }
        };
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
        this.log(`\n${'─'.repeat(50)}`, 'yellow');
        this.log(`${title}`, 'yellow');
        this.log(`${'─'.repeat(50)}`, 'yellow');
    }

    checkGitSync() {
        this.logSubSection('🔄 Проверка синхронизации с GitHub');
        
        try {
            // Проверка статуса Git
            const gitStatus = execSync('git status --porcelain', { 
                encoding: 'utf8',
                cwd: process.cwd()
            }).trim();
            
            // Проверка удаленного репозитория
            const remoteUrl = execSync('git remote get-url origin', { 
                encoding: 'utf8',
                cwd: process.cwd()
            }).trim();
            
            // Проверка последнего коммита
            const lastCommit = execSync('git log -1 --oneline', { 
                encoding: 'utf8',
                cwd: process.cwd()
            }).trim();
            
            // Проверка различий с удаленным репозиторием
            let behindAhead = '';
            try {
                behindAhead = execSync('git rev-list --left-right --count origin/main...HEAD', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                }).trim();
            } catch (error) {
                behindAhead = 'unknown';
            }
            
            const gitCheck = {
                status: 'PASS',
                localChanges: gitStatus === '',
                remoteUrl: remoteUrl,
                lastCommit: lastCommit,
                behindAhead: behindAhead,
                issues: []
            };
            
            if (gitStatus !== '') {
                gitCheck.status = 'WARNING';
                gitCheck.issues.push('Есть несохраненные изменения в рабочем дереве');
                this.log('⚠️ Обнаружены несохраненные изменения:', 'yellow');
                this.log(gitStatus, 'yellow');
            } else {
                this.log('✅ Рабочее дерево чистое', 'green');
            }
            
            this.log(`📍 Удаленный репозиторий: ${remoteUrl}`, 'blue');
            this.log(`📝 Последний коммит: ${lastCommit}`, 'blue');
            
            this.auditResults.checks.gitSync = gitCheck;
            return gitCheck;
            
        } catch (error) {
            const gitCheck = {
                status: 'FAIL',
                error: error.message,
                issues: ['Ошибка при проверке Git статуса']
            };
            
            this.log('❌ Ошибка при проверке Git:', 'red');
            this.log(error.message, 'red');
            
            this.auditResults.checks.gitSync = gitCheck;
            return gitCheck;
        }
    }

    checkProjectStructure() {
        this.logSubSection('📁 Проверка структуры проекта');
        
        const requiredFiles = [
            'package.json',
            'README.md',
            'docker-compose.yml',
            '.env.example'
        ];
        
        const requiredDirs = [
            'backend',
            'services',
            'packages',
            'apps'
        ];
        
        const structureCheck = {
            status: 'PASS',
            files: {},
            directories: {},
            issues: []
        };
        
        // Проверка файлов
        requiredFiles.forEach(file => {
            const exists = fs.existsSync(file);
            structureCheck.files[file] = exists;
            
            if (exists) {
                this.log(`✅ ${file}`, 'green');
            } else {
                this.log(`❌ ${file}`, 'red');
                structureCheck.issues.push(`Отсутствует файл: ${file}`);
                structureCheck.status = 'WARNING';
            }
        });
        
        // Проверка директорий
        requiredDirs.forEach(dir => {
            const exists = fs.existsSync(dir);
            structureCheck.directories[dir] = exists;
            
            if (exists) {
                this.log(`✅ ${dir}/`, 'green');
            } else {
                this.log(`❌ ${dir}/`, 'red');
                structureCheck.issues.push(`Отсутствует директория: ${dir}`);
                structureCheck.status = 'WARNING';
            }
        });
        
        this.auditResults.checks.projectStructure = structureCheck;
        return structureCheck;
    }

    checkPackageJson() {
        this.logSubSection('📦 Проверка package.json');
        
        const packageCheck = {
            status: 'PASS',
            exists: false,
            valid: false,
            data: null,
            issues: []
        };
        
        try {
            if (fs.existsSync('package.json')) {
                packageCheck.exists = true;
                const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                packageCheck.valid = true;
                packageCheck.data = packageData;
                
                this.log(`✅ package.json найден`, 'green');
                this.log(`📦 Название: ${packageData.name}`, 'blue');
                this.log(`🏷️ Версия: ${packageData.version}`, 'blue');
                
                // Проверка обязательных полей
                const requiredFields = ['name', 'version', 'scripts'];
                requiredFields.forEach(field => {
                    if (!packageData[field]) {
                        packageCheck.issues.push(`Отсутствует поле: ${field}`);
                        packageCheck.status = 'WARNING';
                    }
                });
                
                // Проверка scripts
                if (packageData.scripts) {
                    const importantScripts = ['start', 'dev', 'build', 'test'];
                    importantScripts.forEach(script => {
                        if (packageData.scripts[script]) {
                            this.log(`✅ Script ${script}: ${packageData.scripts[script]}`, 'green');
                        } else {
                            this.log(`⚠️ Отсутствует script: ${script}`, 'yellow');
                        }
                    });
                }
                
                // Проверка зависимостей
                if (packageData.dependencies) {
                    this.log(`📚 Зависимости: ${Object.keys(packageData.dependencies).length}`, 'blue');
                }
                
                if (packageData.devDependencies) {
                    this.log(`🔧 Dev зависимости: ${Object.keys(packageData.devDependencies).length}`, 'blue');
                }
                
            } else {
                packageCheck.status = 'FAIL';
                packageCheck.issues.push('Файл package.json не найден');
                this.log('❌ package.json не найден', 'red');
            }
            
        } catch (error) {
            packageCheck.status = 'FAIL';
            packageCheck.issues.push(`Ошибка при чтении package.json: ${error.message}`);
            this.log(`❌ Ошибка при чтении package.json: ${error.message}`, 'red');
        }
        
        this.auditResults.checks.packageJson = packageCheck;
        return packageCheck;
    }

    checkNodeModules() {
        this.logSubSection('📚 Проверка зависимостей');
        
        const nodeModulesCheck = {
            status: 'PASS',
            nodeModulesExists: false,
            packageLockExists: false,
            issues: []
        };
        
        // Проверка node_modules
        if (fs.existsSync('node_modules')) {
            nodeModulesCheck.nodeModulesExists = true;
            this.log('✅ node_modules найден', 'green');
            
            // Подсчет установленных пакетов
            try {
                const nodeModulesContent = fs.readdirSync('node_modules');
                const packageCount = nodeModulesContent.filter(item => !item.startsWith('.')).length;
                this.log(`📦 Установлено пакетов: ${packageCount}`, 'blue');
            } catch (error) {
                this.log('⚠️ Ошибка при чтении node_modules', 'yellow');
            }
        } else {
            nodeModulesCheck.status = 'WARNING';
            nodeModulesCheck.issues.push('node_modules не найден');
            this.log('❌ node_modules не найден', 'red');
        }
        
        // Проверка package-lock.json
        if (fs.existsSync('package-lock.json')) {
            nodeModulesCheck.packageLockExists = true;
            this.log('✅ package-lock.json найден', 'green');
        } else {
            nodeModulesCheck.issues.push('package-lock.json не найден');
            this.log('⚠️ package-lock.json не найден', 'yellow');
        }
        
        this.auditResults.checks.nodeModules = nodeModulesCheck;
        return nodeModulesCheck;
    }

    checkDockerConfig() {
        this.logSubSection('🐳 Проверка Docker конфигурации');
        
        const dockerCheck = {
            status: 'PASS',
            dockerCompose: false,
            dockerfile: false,
            issues: []
        };
        
        // Проверка docker-compose.yml
        if (fs.existsSync('docker-compose.yml')) {
            dockerCheck.dockerCompose = true;
            this.log('✅ docker-compose.yml найден', 'green');
        } else {
            dockerCheck.issues.push('docker-compose.yml не найден');
            this.log('⚠️ docker-compose.yml не найден', 'yellow');
        }
        
        // Проверка Dockerfile
        if (fs.existsSync('Dockerfile')) {
            dockerCheck.dockerfile = true;
            this.log('✅ Dockerfile найден', 'green');
        } else {
            dockerCheck.issues.push('Dockerfile не найден');
            this.log('⚠️ Dockerfile не найден', 'yellow');
        }
        
        if (dockerCheck.issues.length > 0) {
            dockerCheck.status = 'WARNING';
        }
        
        this.auditResults.checks.dockerConfig = dockerCheck;
        return dockerCheck;
    }

    checkEnvironmentConfig() {
        this.logSubSection('🔧 Проверка конфигурации окружения');
        
        const envCheck = {
            status: 'PASS',
            envFiles: {},
            issues: []
        };
        
        const envFiles = ['.env', '.env.example', '.env.production', '.env.development'];
        
        envFiles.forEach(file => {
            const exists = fs.existsSync(file);
            envCheck.envFiles[file] = exists;
            
            if (exists) {
                this.log(`✅ ${file} найден`, 'green');
            } else {
                this.log(`⚠️ ${file} не найден`, 'yellow');
                if (file === '.env.example') {
                    envCheck.issues.push('Отсутствует .env.example');
                    envCheck.status = 'WARNING';
                }
            }
        });
        
        this.auditResults.checks.environmentConfig = envCheck;
        return envCheck;
    }

    checkServices() {
        this.logSubSection('🔧 Проверка сервисов');
        
        const servicesCheck = {
            status: 'PASS',
            services: {},
            issues: []
        };
        
        const servicesDir = 'services';
        
        if (fs.existsSync(servicesDir)) {
            try {
                const servicesList = fs.readdirSync(servicesDir);
                
                servicesList.forEach(service => {
                    const servicePath = path.join(servicesDir, service);
                    const servicePackageJson = path.join(servicePath, 'package.json');
                    
                    if (fs.statSync(servicePath).isDirectory()) {
                        const serviceInfo = {
                            exists: true,
                            hasPackageJson: fs.existsSync(servicePackageJson),
                            issues: []
                        };
                        
                        if (serviceInfo.hasPackageJson) {
                            this.log(`✅ Сервис ${service}: package.json найден`, 'green');
                        } else {
                            this.log(`⚠️ Сервис ${service}: package.json не найден`, 'yellow');
                            serviceInfo.issues.push('Отсутствует package.json');
                        }
                        
                        servicesCheck.services[service] = serviceInfo;
                    }
                });
                
                this.log(`📊 Найдено сервисов: ${Object.keys(servicesCheck.services).length}`, 'blue');
                
            } catch (error) {
                servicesCheck.status = 'FAIL';
                servicesCheck.issues.push(`Ошибка при чтении директории services: ${error.message}`);
                this.log(`❌ Ошибка при чтении services: ${error.message}`, 'red');
            }
        } else {
            servicesCheck.status = 'WARNING';
            servicesCheck.issues.push('Директория services не найдена');
            this.log('⚠️ Директория services не найдена', 'yellow');
        }
        
        this.auditResults.checks.services = servicesCheck;
        return servicesCheck;
    }

    checkBackend() {
        this.logSubSection('🔧 Проверка backend');
        
        const backendCheck = {
            status: 'PASS',
            exists: false,
            hasPackageJson: false,
            issues: []
        };
        
        if (fs.existsSync('backend')) {
            backendCheck.exists = true;
            this.log('✅ Директория backend найдена', 'green');
            
            if (fs.existsSync('backend/package.json')) {
                backendCheck.hasPackageJson = true;
                this.log('✅ backend/package.json найден', 'green');
            } else {
                backendCheck.issues.push('backend/package.json не найден');
                this.log('⚠️ backend/package.json не найден', 'yellow');
            }
        } else {
            backendCheck.status = 'WARNING';
            backendCheck.issues.push('Директория backend не найдена');
            this.log('⚠️ Директория backend не найдена', 'yellow');
        }
        
        this.auditResults.checks.backend = backendCheck;
        return backendCheck;
    }

    checkApps() {
        this.logSubSection('📱 Проверка приложений');
        
        const appsCheck = {
            status: 'PASS',
            exists: false,
            apps: {},
            issues: []
        };
        
        if (fs.existsSync('apps')) {
            appsCheck.exists = true;
            this.log('✅ Директория apps найдена', 'green');
            
            try {
                const appsList = fs.readdirSync('apps');
                
                appsList.forEach(app => {
                    const appPath = path.join('apps', app);
                    const appPackageJson = path.join(appPath, 'package.json');
                    
                    if (fs.statSync(appPath).isDirectory()) {
                        const appInfo = {
                            exists: true,
                            hasPackageJson: fs.existsSync(appPackageJson),
                            issues: []
                        };
                        
                        if (appInfo.hasPackageJson) {
                            this.log(`✅ Приложение ${app}: package.json найден`, 'green');
                        } else {
                            this.log(`⚠️ Приложение ${app}: package.json не найден`, 'yellow');
                            appInfo.issues.push('Отсутствует package.json');
                        }
                        
                        appsCheck.apps[app] = appInfo;
                    }
                });
                
                this.log(`📊 Найдено приложений: ${Object.keys(appsCheck.apps).length}`, 'blue');
                
            } catch (error) {
                appsCheck.status = 'FAIL';
                appsCheck.issues.push(`Ошибка при чтении директории apps: ${error.message}`);
                this.log(`❌ Ошибка при чтении apps: ${error.message}`, 'red');
            }
        } else {
            appsCheck.status = 'WARNING';
            appsCheck.issues.push('Директория apps не найдена');
            this.log('⚠️ Директория apps не найдена', 'yellow');
        }
        
        this.auditResults.checks.apps = appsCheck;
        return appsCheck;
    }

    calculateScore() {
        const checks = this.auditResults.checks;
        let totalScore = 0;
        let maxScore = 0;
        
        Object.keys(checks).forEach(checkName => {
            const check = checks[checkName];
            maxScore += 100;
            
            if (check.status === 'PASS') {
                totalScore += 100;
            } else if (check.status === 'WARNING') {
                totalScore += 70;
            } else if (check.status === 'FAIL') {
                totalScore += 0;
            }
        });
        
        return Math.round((totalScore / maxScore) * 100);
    }

    generateSummary() {
        const checks = this.auditResults.checks;
        let passedChecks = 0;
        let failedChecks = 0;
        let warningChecks = 0;
        
        Object.keys(checks).forEach(checkName => {
            const check = checks[checkName];
            if (check.status === 'PASS') {
                passedChecks++;
            } else if (check.status === 'WARNING') {
                warningChecks++;
            } else if (check.status === 'FAIL') {
                failedChecks++;
            }
        });
        
        const totalChecks = Object.keys(checks).length;
        const score = this.calculateScore();
        
        let status = 'EXCELLENT';
        if (score >= 90) {
            status = 'EXCELLENT';
        } else if (score >= 80) {
            status = 'GOOD';
        } else if (score >= 70) {
            status = 'FAIR';
        } else if (score >= 60) {
            status = 'POOR';
        } else {
            status = 'CRITICAL';
        }
        
        this.auditResults.summary = {
            status,
            score,
            totalChecks,
            passedChecks,
            failedChecks,
            warningChecks
        };
        
        // Собираем все проблемы
        Object.keys(checks).forEach(checkName => {
            const check = checks[checkName];
            if (check.issues && check.issues.length > 0) {
                check.issues.forEach(issue => {
                    this.auditResults.issues.push(`[${checkName}] ${issue}`);
                });
            }
        });
        
        // Генерируем рекомендации
        if (failedChecks > 0) {
            this.auditResults.recommendations.push('Критические проблемы должны быть исправлены немедленно');
        }
        
        if (warningChecks > 0) {
            this.auditResults.recommendations.push('Рекомендуется устранить предупреждения для повышения качества проекта');
        }
        
        if (!this.auditResults.checks.nodeModules?.nodeModulesExists) {
            this.auditResults.recommendations.push('Выполните npm install для установки зависимостей');
        }
        
        if (!this.auditResults.checks.dockerConfig?.dockerCompose) {
            this.auditResults.recommendations.push('Добавьте docker-compose.yml для упрощения развертывания');
        }
        
        if (!this.auditResults.checks.environmentConfig?.envFiles['.env.example']) {
            this.auditResults.recommendations.push('Создайте .env.example с примером конфигурации');
        }
    }

    printFinalReport() {
        this.logSection('📊 ИТОГОВЫЙ ОТЧЕТ АУДИТА VHM24');
        
        const summary = this.auditResults.summary;
        
        // Статус проекта
        const statusColors = {
            'EXCELLENT': 'green',
            'GOOD': 'green',
            'FAIR': 'yellow',
            'POOR': 'red',
            'CRITICAL': 'red'
        };
        
        this.log(`\n🎯 СТАТУС ПРОЕКТА: ${summary.status}`, statusColors[summary.status]);
        this.log(`📈 ОБЩИЙ БАЛЛ: ${summary.score}/100`, summary.score >= 80 ? 'green' : summary.score >= 60 ? 'yellow' : 'red');
        
        // Статистика проверок
        this.log(`\n📊 СТАТИСТИКА ПРОВЕРОК:`, 'blue');
        this.log(`   ✅ Успешно: ${summary.passedChecks}/${summary.totalChecks}`, 'green');
        this.log(`   ⚠️ Предупреждения: ${summary.warningChecks}/${summary.totalChecks}`, 'yellow');
        this.log(`   ❌ Ошибки: ${summary.failedChecks}/${summary.totalChecks}`, 'red');
        
        // Найденные проблемы
        if (this.auditResults.issues.length > 0) {
            this.log(`\n🔍 НАЙДЕННЫЕ ПРОБЛЕМЫ:`, 'red');
            this.auditResults.issues.forEach(issue => {
                this.log(`   • ${issue}`, 'red');
            });
        }
        
        // Рекомендации
        if (this.auditResults.recommendations.length > 0) {
            this.log(`\n💡 РЕКОМЕНДАЦИИ:`, 'yellow');
            this.auditResults.recommendations.forEach(rec => {
                this.log(`   • ${rec}`, 'yellow');
            });
        }
        
        // Выводы
        this.log(`\n📋 ВЫВОДЫ:`, 'blue');
        
        if (summary.status === 'EXCELLENT' || summary.status === 'GOOD') {
            this.log('   ✅ Проект в хорошем состоянии и готов к использованию', 'green');
        } else if (summary.status === 'FAIR') {
            this.log('   ⚠️ Проект требует некоторых улучшений', 'yellow');
        } else {
            this.log('   ❌ Проект требует серьезных доработок', 'red');
        }
        
        // Следующие шаги
        this.log(`\n🚀 СЛЕДУЮЩИЕ ШАГИ:`, 'cyan');
        
        if (!this.auditResults.checks.nodeModules?.nodeModulesExists) {
            this.log('   1. Выполните: npm install', 'cyan');
        }
        
        if (summary.failedChecks > 0) {
            this.log('   2. Исправьте критические ошибки', 'cyan');
        }
        
        if (summary.warningChecks > 0) {
            this.log('   3. Устраните предупреждения', 'cyan');
        }
        
        this.log('   4. Проведите тестирование функциональности', 'cyan');
        this.log('   5. Подготовьте к развертыванию', 'cyan');
    }

    async runFullAudit() {
        this.logSection('🔍 ПОЛНЫЙ АУДИТ ПРОЕКТА VHM24');
        
        try {
            // Последовательное выполнение всех проверок
            await this.checkGitSync();
            await this.checkProjectStructure();
            await this.checkPackageJson();
            await this.checkNodeModules();
            await this.checkDockerConfig();
            await this.checkEnvironmentConfig();
            await this.checkServices();
            await this.checkBackend();
            await this.checkApps();
            
            // Генерация итогового отчета
            this.generateSummary();
            
            // Вывод итогового отчета
            this.printFinalReport();
            
            // Сохранение отчета в файл
            const reportPath = 'VHM24_AUDIT_REPORT.json';
            fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
            this.log(`\n💾 Отчет сохранен в: ${reportPath}`, 'green');
            
            return this.auditResults;
            
        } catch (error) {
            this.log(`❌ Ошибка при выполнении аудита: ${error.message}`, 'red');
            throw error;
        }
    }
}

// Запуск аудита
if (require.main === module) {
    const audit = new VHM24ProjectAudit();
    audit.runFullAudit().catch(console.error);
}

module.exports = VHM24ProjectAudit;
