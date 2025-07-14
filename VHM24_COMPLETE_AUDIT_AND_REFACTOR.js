#!/usr/bin/env node



const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VHM24CompleteAuditor {
    constructor() {
        this.projectRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
        this.fixes = [];
        this.cleanedFiles = [];
        this.missingFeatures = [];
        this.envVariables = new Map();

        
        
    }

    // ============================================================================
    // 1. СРАВНЕНИЕ С ДОКУМЕНТАЦИЕЙ И РЕАЛИЗАЦИЯ НЕДОСТАЮЩИХ ФУНКЦИЙ
    // ============================================================================

    async compareWithDocumentation() {
        

        const requiredFeatures = {
            // Роли и права
            roles: ['admin', 'manager', 'warehouse', 'operator', 'technician', 'driver'],

            // Справочники
            catalogs: [
                'machines', 'ingredients', 'hoppers', 'bags', 'syrups', 'water',
                'consumables', 'spare_parts', 'recipes', 'users', 'locations',
                'suppliers', 'routes', 'sim_cards', 'electricity_meters'
            ],

            // FSM состояния задач
            taskStates: [
                'created', 'assigned', 'in_progress', 'completed', 'error', 'cancelled'
            ],

            // Типы задач
            taskTypes: [
                'replace_ingredients', 'replace_water', 'replace_syrups', 'cleaning',
                'maintenance', 'cash_collection', 'repair', 'inspection', 'test_purchase'
            ],

            // Чек-листы
            checklists: [
                process.env.API_KEY_498 || 'ingredient_replacement', 'water_replacement', 'syrup_replacement',
                'cleaning', 'maintenance', 'cash_collection', 'repair'
            ],

            // Отчеты
            reports: [
                process.env.API_KEY_499 || 'sales_reconciliation', process.env.API_KEY_500 || 'ingredient_consumption', 'cash_collection',
                'inventory_status', 'task_completion', 'financial_summary'
            ],

            // Интеграции
            integrations: [
                'telegram_bot', 'payment_systems', 'fiscal_module', 'vending_system'
            ]
        };

        await this.checkMissingFeatures(requiredFeatures);
        await this.implementMissingFeatures();
    }

    async checkMissingFeatures(required) {
        

        // Проверка моделей Prisma
        const schemaPath = path.join(this.projectRoot, 'backend/prisma/schema.prisma');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');

            // Проверка ролей
            const roleEnum = schema.match(/enum UserRole \{([^}]+)\}/);
            if (roleEnum) {
                const existingRoles = roleEnum[1].match(/\w+/g) || [];
                const missingRoles = required.roles.filter(role =>
                    !existingRoles.some(r => r.toLowerCase() === role.toLowerCase())
                );
                if (missingRoles.length > 0) {
                    this.missingFeatures.push({
                        type: 'roles',
                        missing: missingRoles,
                        priority: 'high'
                    });
                }
            }

            // Проверка типов задач
            const taskTypeEnum = schema.match(/enum TaskType \{([^}]+)\}/);
            if (taskTypeEnum) {
                const existingTypes = taskTypeEnum[1].match(/\w+/g) || [];
                const missingTypes = required.taskTypes.filter(type =>
                    !existingTypes.some(t => t.toLowerCase().includes(type.toLowerCase().replace('_', '')))
                );
                if (missingTypes.length > 0) {
                    this.missingFeatures.push({
                        type: 'task_types',
                        missing: missingTypes,
                        priority: 'high'
                    });
                }
            }
        }

        // Проверка API роутов
        const routesDir = path.join(this.projectRoot, 'backend/src/routes');
        if (fs.existsSync(routesDir)) {
            const routeFiles = fs.readdirSync(routesDir);
            const missingRoutes = required.catalogs.filter(catalog =>
                !routeFiles.some(file => file.includes(catalog))
            );
            if (missingRoutes.length > 0) {
                this.missingFeatures.push({
                    type: 'api_routes',
                    missing: missingRoutes,
                    priority: 'medium'
                });
            }
        }

        // Проверка Telegram FSM
        const telegramBotPath = path.join(this.projectRoot, 'apps/telegram-bot/src');
        if (fs.existsSync(telegramBotPath)) {
            const botFiles = this.getAllFiles(telegramBotPath, '.js');
            const hasFSM = botFiles.some(file => {
                const content = fs.readFileSync(file, 'utf8');
                return content.includes('FSM') || content.includes('State');
            });

            if (!hasFSM) {
                this.missingFeatures.push({
                    type: 'telegram_fsm',
                    missing: ['FSM implementation'],
                    priority: 'high'
                });
            }
        }

        
    }

    async implementMissingFeatures() {
        

        for (const feature of this.missingFeatures) {
            switch (feature.type) {
                case 'roles':
                    await this.addMissingRoles(feature.missing);
                    break;
                case 'task_types':
                    await this.addMissingTaskTypes(feature.missing);
                    break;
                case 'api_routes':
                    await this.createMissingRoutes(feature.missing);
                    break;
                case 'telegram_fsm':
                    await this.implementTelegramFSM();
                    break;
            }
        }
    }

    async addMissingRoles(missingRoles) {
        }`);

        const schemaPath = path.join(this.projectRoot, 'backend/prisma/schema.prisma');
        if (fs.existsSync(schemaPath)) {
            let schema = fs.readFileSync(schemaPath, 'utf8');

            // Добавляем недостающие роли
            const roleEnumMatch = schema.match(/(enum UserRole \{[^}]+)(\})/);
            if (roleEnumMatch) {
                const existingRoles = roleEnumMatch[1];
                const newRoles = missingRoles.map(role => `  ${role.toUpperCase()}`).join('\n');
                schema = schema.replace(roleEnumMatch[0], `${existingRoles}\n${newRoles}\n}`);

                fs.writeFileSync(schemaPath, schema);
                this.fixes.push(`Добавлены роли: ${missingRoles.join(', ')}`);
            }
        }
    }

    async addMissingTaskTypes(missingTypes) {
        }`);

        const schemaPath = path.join(this.projectRoot, 'backend/prisma/schema.prisma');
        if (fs.existsSync(schemaPath)) {
            let schema = fs.readFileSync(schemaPath, 'utf8');

            const taskTypeEnumMatch = schema.match(/(enum TaskType \{[^}]+)(\})/);
            if (taskTypeEnumMatch) {
                const existingTypes = taskTypeEnumMatch[1];
                const newTypes = missingTypes.map(type => `  ${type.toUpperCase()}`).join('\n');
                schema = schema.replace(taskTypeEnumMatch[0], `${existingTypes}\n${newTypes}\n}`);

                fs.writeFileSync(schemaPath, schema);
                this.fixes.push(`Добавлены типы задач: ${missingTypes.join(', ')}`);
            }
        }
    }

    async createMissingRoutes(missingRoutes) {
        }`);

        const routesDir = path.join(this.projectRoot, 'backend/src/routes');

        for (const route of missingRoutes) {
            const routeFile = path.join(routesDir, `${route}.js`);
            if (!fs.existsSync(routeFile)) {
                const routeContent = this.generateRouteTemplate(route);
                fs.writeFileSync(routeFile, routeContent);
                this.fixes.push(`Создан роут: ${route}.js`);
            }
        }
    }

    generateRouteTemplate(routeName) {
        const modelName = routeName.charAt(0).toUpperCase() + routeName.slice(1, -1);

        return `const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /${routeName} - Получить все записи
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.${routeName.slice(0, -1)}.findMany({
            include: {
                // Добавить связи при необходимости
            }
        });
        res.json(items);
    } catch (error) {
        console.error('Error fetching ${routeName}:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// GET /${routeName}/:id - Получить запись по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await prisma.${routeName.slice(0, -1)}.findUnique({
            where: { id: req.params.id },
            include: {
                // Добавить связи при необходимости
            }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching ${routeName.slice(0, -1)}:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /${routeName} - Создать новую запись
router.post('/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.${routeName.slice(0, -1)}.create({
            data: req.body
        });
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating ${routeName.slice(0, -1)}:', error);
        res.status(500).json({ error: 'Ошибка создания записи' });
    }
});

// PUT /${routeName}/:id - Обновить запись
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const item = await prisma.${routeName.slice(0, -1)}.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(item);
    } catch (error) {
        console.error('Error updating ${routeName.slice(0, -1)}:', error);
        res.status(500).json({ error: 'Ошибка обновления записи' });
    }
});

// DELETE /${routeName}/:id - Удалить запись
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        await prisma.${routeName.slice(0, -1)}.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting ${routeName.slice(0, -1)}:', error);
        res.status(500).json({ error: 'Ошибка удаления записи' });
    }
});

module.exports = router;
`;
    }

    async implementTelegramFSM() {
        

        const fsmPath = path.join(this.projectRoot, 'apps/telegram-bot/src/fsm');
        if (!fs.existsSync(fsmPath)) {
            fs.mkdirSync(fsmPath, { recursive: true });
        }

        // Создаем базовый FSM
        const baseFSMContent = `const { Scenes, session } = require('telegraf');

// Состояния FSM по ролям
const STATES = {
    ADMIN: {
        MAIN_MENU: 'admin_main_menu',
        MANAGE_USERS: 'admin_manage_users',
        VIEW_REPORTS: 'admin_view_reports',
        SYSTEM_SETTINGS: process.env.API_KEY_501 || 'admin_system_settings'
    },
    MANAGER: {
        MAIN_MENU: 'manager_main_menu',
        CREATE_TASK: 'manager_create_task',
        VIEW_REPORTS: process.env.API_KEY_502 || 'manager_view_reports',
        MANAGE_CATALOGS: process.env.API_KEY_503 || 'manager_manage_catalogs'
    },
    WAREHOUSE: {
        MAIN_MENU: 'warehouse_main_menu',
        RECEIVE_ITEMS: process.env.API_KEY_504 || 'warehouse_receive_items',
        ISSUE_BAGS: process.env.API_KEY_505 || 'warehouse_issue_bags',
        INVENTORY: 'warehouse_inventory'
    },
    OPERATOR: {
        MAIN_MENU: 'operator_main_menu',
        MY_ROUTES: 'operator_my_routes',
        EXECUTE_TASKS: process.env.API_KEY_506 || 'operator_execute_tasks',
        RETURN_ITEMS: process.env.API_KEY_507 || 'operator_return_items'
    },
    TECHNICIAN: {
        MAIN_MENU: process.env.API_KEY_508 || 'technician_main_menu',
        REPAIR_TASKS: process.env.API_KEY_509 || 'technician_repair_tasks',
        MAINTENANCE: process.env.API_KEY_510 || 'technician_maintenance'
    }
};

// Создание сцен для каждой роли
const createRoleScenes = () => {
    const scenes = [];
    
    // Сцены для администратора
    scenes.push(new Scenes.BaseScene(STATES.ADMIN.MAIN_MENU)
        .enter((ctx) => {
            ctx.reply('👑 Панель администратора', {
                reply_markup: {
                    keyboard: [
                        ['👥 Управление пользователями', '📊 Отчеты'],
                        ['⚙️ Настройки системы', '📋 Журнал действий'],
                        ['🏠 Главное меню']
                    ],
                    resize_keyboard: true
                }
            });
        })
        .hears('👥 Управление пользователями', (ctx) => {
            ctx.scene.enter(STATES.ADMIN.MANAGE_USERS);
        })
        .hears('📊 Отчеты', (ctx) => {
            ctx.scene.enter(STATES.ADMIN.VIEW_REPORTS);
        })
    );
    
    // Сцены для менеджера
    scenes.push(new Scenes.BaseScene(STATES.MANAGER.MAIN_MENU)
        .enter((ctx) => {
            ctx.reply('📋 Панель менеджера', {
                reply_markup: {
                    keyboard: [
                        ['📝 Создать задачу', '📊 Отчеты'],
                        ['📚 Справочники', '🗺 Маршруты'],
                        ['🏠 Главное меню']
                    ],
                    resize_keyboard: true
                }
            });
        })
        .hears('📝 Создать задачу', (ctx) => {
            ctx.scene.enter(STATES.MANAGER.CREATE_TASK);
        })
    );
    
    // Сцены для склада
    scenes.push(new Scenes.BaseScene(STATES.WAREHOUSE.MAIN_MENU)
        .enter((ctx) => {
            ctx.reply('📦 Панель склада', {
                reply_markup: {
                    keyboard: [
                        ['📥 Приём товара', '📤 Выдача сумок'],
                        ['📊 Инвентаризация', '🧹 Возврат и мойка'],
                        ['🏠 Главное меню']
                    ],
                    resize_keyboard: true
                }
            });
        })
    );
    
    // Сцены для оператора
    scenes.push(new Scenes.BaseScene(STATES.OPERATOR.MAIN_MENU)
        .enter((ctx) => {
            ctx.reply('🚚 Панель оператора', {
                reply_markup: {
                    keyboard: [
                        ['🗺 Мои маршруты', '📋 Выполнить задачи'],
                        ['🔄 Возврат товара', '💰 Инкассация'],
                        ['🏠 Главное меню']
                    ],
                    resize_keyboard: true
                }
            });
        })
    );
    
    return scenes;
};

module.exports = {
    STATES,
    createRoleScenes
};
`;

        fs.writeFileSync(path.join(fsmPath, 'index.js'), baseFSMContent);
        this.fixes.push('Создан базовый Telegram FSM');
    }

    // ============================================================================
    // 2. АУДИТ КОДА И АРХИТЕКТУРЫ
    // ============================================================================

    async auditCodeAndArchitecture() {
        

        await this.checkCodeQuality();
        await this.fixArchitectureIssues();
        await this.validateBusinessLogic();
        await this.standardizeCodeStyle();
    }

    async fixArchitectureIssues() {
        

        // Проверяем структуру проекта
        const requiredDirs = [
            'backend/src/middleware',
            'backend/src/utils',
            'backend/src/config',
            'apps/telegram-bot/src/handlers',
            'apps/telegram-bot/src/middleware',
            'logs'
        ];

        for (const dir of requiredDirs) {
            const fullPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.fixes.push(`Создана директория: ${dir}`);
            }
        }
    }

    async validateBusinessLogic() {
        

        // Проверяем наличие основных middleware
        const middlewareDir = path.join(this.projectRoot, 'backend/src/middleware');
        const requiredMiddleware = ['auth.js', 'validation.js', 'errorHandler.js'];

        for (const middleware of requiredMiddleware) {
            const middlewarePath = path.join(middlewareDir, middleware);
            if (!fs.existsSync(middlewarePath)) {
                this.warnings.push(`Отсутствует middleware: ${middleware}`);
            }
        }
    }

    async standardizeCodeStyle() {
        

        // Создаем .eslintrc.js если его нет
        const eslintPath = path.join(this.projectRoot, '.eslintrc.js');
        if (!fs.existsSync(eslintPath)) {
            const eslintConfig = `module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'no-console': 'warn',
        'no-unused-vars': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
    },
};
`;
            fs.writeFileSync(eslintPath, eslintConfig);
            this.fixes.push('Создан .eslintrc.js');
        }
    }

    async checkCodeQuality() {
        

        const jsFiles = this.getAllFiles(this.projectRoot, '.js');
        const tsFiles = this.getAllFiles(this.projectRoot, '.ts');
        const allFiles = [...jsFiles, ...tsFiles];

        for (const file of allFiles) {
            if (file.includes('node_modules') || file.includes('.git')) continue;

            try {
                const content = fs.readFileSync(file, 'utf8');
                await this.analyzeFile(file, content);
            } catch (error) {
                this.errors.push(`Ошибка чтения файла ${file}: ${error.message}`);
            }
        }
    }

    async analyzeFile(filePath, content) {
        const relativePath = path.relative(this.projectRoot, filePath);

        // Проверка синтаксических ошибок
        const syntaxIssues = this.checkSyntaxIssues(content);
        if (syntaxIssues.length > 0) {
            this.errors.push(`${relativePath}: ${syntaxIssues.join(', ')}`);
        }

        // Проверка архитектурных проблем
        const architectureIssues = this.checkArchitectureIssues(content);
        if (architectureIssues.length > 0) {
            this.warnings.push(`${relativePath}: ${architectureIssues.join(', ')}`);
        }

        // Проверка безопасности
        const securityIssues = this.checkSecurityIssues(content);
        if (securityIssues.length > 0) {
            this.errors.push(`${relativePath}: БЕЗОПАСНОСТЬ - ${securityIssues.join(', ')}`);
        }

        // Проверка производительности
        const performanceIssues = this.checkPerformanceIssues(content);
        if (performanceIssues.length > 0) {
            this.warnings.push(`${relativePath}: ПРОИЗВОДИТЕЛЬНОСТЬ - ${performanceIssues.join(', ')}`);
        }
    }

    checkSyntaxIssues(content) {
        const issues = [];

        // Проверка незакрытых скобок
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push('Несоответствие фигурных скобок');
        }

        // Проверка незакрытых круглых скобок
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            issues.push('Несоответствие круглых скобок');
        }

        // Проверка неопределенных переменных
        const undefinedVars = content.match(/\bundefined\b/g);
        if (undefinedVars && undefinedVars.length > 2) {
            issues.push('Множественное использование undefined');
        }

        // Проверка console.log в продакшене
        if (content.includes('console.log') && !content.includes('// DEBUG')) {
            issues.push('Найдены console.log без пометки DEBUG');
        }

        return issues;
    }

    checkArchitectureIssues(content) {
        const issues = [];

        // Проверка длинных функций
        const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        functions.forEach(func => {
            const lines = func.split('\n').length;
            if (lines > 50) {
                issues.push('Функция слишком длинная (>50 строк)');
            }
        });

        // Проверка дублирования кода
        const lines = content.split('\n');
        const duplicates = this.findDuplicateLines(lines);
        if (duplicates.length > 0) {
            issues.push(`Дублирование кода: ${duplicates.length} повторов`);
        }

        // Проверка магических чисел
        const magicNumbers = content.match(/\b\d{3,}\b/g);
        if (magicNumbers && magicNumbers.length > 3) {
            issues.push('Найдены магические числа');
        }

        return issues;
    }

    checkSecurityIssues(content) {
        const issues = [];

        // Проверка захардкоженных секретов
        const hardcodedSecrets = [
            /password\s*[:=]\s*['"][^'"]+['"]/i,
            /token\s*[:=]\s*['"][^'"]+['"]/i,
            /secret\s*[:=]\s*['"][^'"]+['"]/i,
            /api_key\s*[:=]\s*['"][^'"]+['"]/i
        ];

        hardcodedSecrets.forEach(pattern => {
            if (pattern.test(content)) {
                issues.push('Захардкоженные секреты');
            }
        });

        // Проверка SQL инъекций
        if (content.includes('SELECT') && content.includes('+') && content.includes('req.')) {
            issues.push('Потенциальная SQL инъекция');
        }

        // Проверка небезопасного eval
        if (content.includes('eval(')) {
            issues.push('Использование небезопасного eval()');
        }

        return issues;
    }

    checkPerformanceIssues(content) {
        const issues = [];

        // Проверка синхронных операций
        if (content.includes('readFileSync') || content.includes('writeFileSync')) {
            issues.push('Синхронные файловые операции');
        }

        // Проверка неоптимальных циклов
        if (content.includes('for') && content.includes('await') && !content.includes('Promise.all')) {
            issues.push('Неоптимальные асинхронные циклы');
        }

        // Проверка утечек памяти
        if (content.includes('setInterval') && !content.includes('clearInterval')) {
            issues.push('Потенциальная утечка памяти (setInterval)');
        }

        return issues;
    }

    findDuplicateLines(lines) {
        const lineCount = {};
        const duplicates = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length > 10) {
                lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
                if (lineCount[trimmed] === 2) {
                    duplicates.push(trimmed);
                }
            }
        });

        return duplicates;
    }

    // ============================================================================
    // 3. РАБОТА С ПЕРЕМЕННЫМИ
    // ============================================================================

    async fixVariables() {
        

        await this.findHardcodedVariables();
        await this.updateEnvironmentFiles();
        await this.replaceHardcodedValues();
    }

    async findHardcodedVariables() {
        

        const patterns = [
            { pattern: /process.env.TELEGRAM_BOT_TOKEN/g, replacement: process.env.API_KEY_511 || 'process.env.TELEGRAM_BOT_TOKEN', env: 'TELEGRAM_BOT_TOKEN' },
            { pattern: /process.env.API_URL/g, replacement: 'process.env.API_URL', env: 'API_URL' }
        ];
    }

    async updateEnvironmentFiles() {
        // Реализация метода
    }

    async replaceHardcodedValues() {
        // Реализация метода
    }

    getAllFiles(dir, extension) {
        // Реализация метода для получения всех файлов с указанным расширением
        return [];
    }
}

// Запуск аудита
const auditor = new VHM24CompleteAuditor();
(async () => {
    try {
        await auditor.compareWithDocumentation();
        await auditor.auditCodeAndArchitecture();
        await auditor.fixVariables();
        
    } catch (error) {
        console.error('❌ Ошибка при выполнении аудита:', error);
    }
})();
