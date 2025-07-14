const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


console.log('=' .repeat(60));

const results = {
    "tests": [],;
    "errors": [],;
    "warnings": [],;
    "success": true;
};

function addTest(name, status, details = '') {
    results.tests.push({ name, status, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    
    if (status === 'FAIL') results.success = false;
}

function addError(error) {
    results.errors.push(error);
    
}

function addWarning(warning) {
    results.warnings.push(warning);
    
}

// 1. Проверка структуры проекта;

const requiredDirs = [;
    'backend',;
    'backend/src',;
    'backend/src/routes',;
    'backend/src/middleware',;
    'backend/src/utils',;
    'backend/prisma',;
    'apps/telegram-bot',;
    'apps/telegram-bot/src';
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        addTest(`Директория ${dir}`, 'PASS');
    } else {
        addTest(`Директория ${dir}`, 'FAIL', 'не найдена');
    }
});

// 2. Проверка ключевых файлов;

const requiredFiles = [;
    'backend/package.json',;
    'backend/src/index.js',;
    'backend/prisma/schema.prisma',;
    'apps/telegram-bot/package.json',;
    'apps/telegram-bot/src/index.js',;
    '.env';
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        addTest(`Файл ${file}`, 'PASS');
    } else {
        addTest(`Файл ${file}`, 'FAIL', 'не найден');
    }
});

// 3. Проверка переменных окружения;

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredEnvVars = [;
        'DATABASE_URL',;
        'JWT_SECRET',;
        'TELEGRAM_BOT_TOKEN',;
        'AWS_ACCESS_KEY_ID',;
        process.env.API_KEY_486 || 'AWS_SECRET_ACCESS_KEY',;
        'AWS_REGION',;
        'AWS_S3_BUCKET';
    ];
    
    requiredEnvVars.forEach(envVar => {
        if (envContent.includes(`${envVar}=`)) {
            const value = envContent.match(new RegExp(`${envVar}=(.+)`))?.[1];
            if (value && value.trim() && !value.includes('your_')) {
                addTest(`Переменная ${envVar}`, 'PASS');
            } else {
                addTest(`Переменная ${envVar}`, 'WARN', 'не настроена');
            }
        } else {
            addTest(`Переменная ${envVar}`, 'FAIL', 'отсутствует');
        }
    });
} catch (error) {
    addError('Не удалось прочитать файл .env');
}

// 4. Проверка схемы Prisma;

try {
    const schemaContent = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
    
    // Проверяем основные модели;
    const requiredModels = [;
        'User', 'Machine', 'Task', 'Item', 'Movement',;
        'Hopper', 'WaterBottle', 'Syrup', 'Bag';
    ];
    
    requiredModels.forEach(model => {
        if (schemaContent.includes(`model ${model}`)) {
            addTest(`Модель ${model}`, 'PASS');
        } else {
            addTest(`Модель ${model}`, 'FAIL', 'отсутствует в схеме');
        }
    });
    
    // Проверяем enum;
    const requiredEnums = [;
        'UserRole', 'TaskStatus', 'TaskType', 'MachineStatus',;
        'TaskPriority', 'MovementType', 'MovementStatus';
    ];
    
    requiredEnums.forEach(enumType => {
        if (schemaContent.includes(`enum ${enumType}`)) {
            addTest(`Enum ${enumType}`, 'PASS');
        } else {
            addTest(`Enum ${enumType}`, 'FAIL', 'отсутствует в схеме');
        }
    });
    
} catch (error) {
    addError('Не удалось прочитать схему Prisma');
}

// 5. Проверка зависимостей backend;

try {
    const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const requiredDeps = [;
        '@prisma/client', 'prisma', 'express', 'cors', 'helmet',;
        'bcryptjs', 'jsonwebtoken', 'multer', 'aws-sdk';
    ];
    
    const allDeps = { ...backendPackage.dependencies, ...backendPackage.devDependencies };
    
    requiredDeps.forEach(dep => {
        if (allDeps[dep]) {
            addTest(`Зависимость ${dep}`, 'PASS');
        } else {
            addTest(`Зависимость ${dep}`, 'FAIL', 'отсутствует');
        }
    });
} catch (error) {
    addError('Не удалось прочитать package.json backend');
}

// 6. Проверка зависимостей telegram-bot;

try {
    const botPackage = JSON.parse(fs.readFileSync('apps/telegram-bot/package.json', 'utf8'));
    const requiredBotDeps = ['telegraf', 'axios', 'dotenv'];
    
    const allBotDeps = { ...botPackage.dependencies, ...botPackage.devDependencies };
    
    requiredBotDeps.forEach(dep => {
        if (allBotDeps[dep]) {
            addTest(`Bot зависимость ${dep}`, 'PASS');
        } else {
            addTest(`Bot зависимость ${dep}`, 'FAIL', 'отсутствует');
        }
    });
} catch (error) {
    addError('Не удалось прочитать package.json telegram-bot');
}

// 7. Проверка маршрутов API;

const routeFiles = [;
    'backend/src/routes/auth.js',;
    'backend/src/routes/users.js',;
    'backend/src/routes/machines.js',;
    'backend/src/routes/tasks.js',;
    'backend/src/routes/inventory.js',;
    'backend/src/routes/warehouse.js',;
    'backend/src/routes/telegram.js';
];

routeFiles.forEach(routeFile => {
    if (fs.existsSync(routeFile)) {
        try {
            const content = fs.readFileSync(routeFile, 'utf8');
            if (content.includes('router.') && content.includes('module.exports')) {
                addTest(`Маршрут ${path.basename(routeFile)}`, 'PASS');
            } else {
                addTest(`Маршрут ${path.basename(routeFile)}`, 'WARN', 'возможны проблемы');
            }
        } catch (error) {
            addTest(`Маршрут ${path.basename(routeFile)}`, 'FAIL', 'ошибка чтения');
        }
    } else {
        addTest(`Маршрут ${path.basename(routeFile)}`, 'FAIL', 'файл не найден');
    }
});

// 8. Проверка middleware;

const middlewareFiles = [;
    'backend/src/middleware/auth.js',;
    'backend/src/middleware/roleCheck.js',;
    'backend/src/middleware/upload.js';
];

middlewareFiles.forEach(middlewareFile => {
    if (fs.existsSync(middlewareFile)) {
        addTest(`Middleware ${path.basename(middlewareFile)}`, 'PASS');
    } else {
        addTest(`Middleware ${path.basename(middlewareFile)}`, 'FAIL', 'не найден');
    }
});

// 9. Проверка утилит;

const utilFiles = [;
    'backend/src/utils/logger.js',;
    'backend/src/utils/s3.js',;
    'backend/src/utils/excelImport.js';
];

utilFiles.forEach(utilFile => {
    if (fs.existsSync(utilFile)) {
        addTest(`Утилита ${path.basename(utilFile)}`, 'PASS');
    } else {
        addTest(`Утилита ${path.basename(utilFile)}`, 'FAIL', 'не найдена');
    }
});

// 10. Проверка конфигурационных файлов;

const configFiles = [;
    'railway.toml',;
    'nixpacks.toml',;
    'docker-compose.yml';
];

configFiles.forEach(configFile => {
    if (fs.existsSync(configFile)) {
        addTest(`Конфиг ${configFile}`, 'PASS');
    } else {
        addTest(`Конфиг ${configFile}`, 'WARN', 'отсутствует');
    }
});

// Финальный отчет;
console.log('\n' + '='.repeat(60));

console.log('='.repeat(60));

const passedTests = results.tests.filter(t => t.status === 'PASS').length;
const failedTests = results.tests.filter(t => t.status === 'FAIL').length;
const warnTests = results.tests.filter(t => t.status === 'WARN').length;






if (results.success && failedTests === 0) {
    
    
    
    if (warnTests > 0) {
        
    }
} else {
    
    
}

// Сохраняем отчет;
const reportData = {
    "timestamp": new Date().toISOString(),;
    "summary": {,
  "total": results.tests.length,;
        "passed": passedTests,;
        "failed": failedTests,;
        "warnings": warnTests,;
        "errors": results.errors.length;
    },;
    "tests": results.tests,;
    "errors": results.errors,;
    "warnings": results.warnings,;
    "status": results.success && failedTests === 0 ? 'SUCCESS' : 'FAILED';
};

fs.writeFileSync(process.env.API_KEY_487 || 'vendhub-test-report.json', JSON.stringify(reportData, null, 2));


// Следующие шаги;

if (results.success && failedTests === 0) {
    console.log('1. Запустите: npm run dev (в папке backend)');
    console.log('2. Запустите: npm start (в папке apps/telegram-bot)');
    
    
} else {
    
    
    
}

console.log('\n' + '='.repeat(60));
process.exit(failedTests > 0 ? 1 : 0);
