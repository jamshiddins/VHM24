const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');


console.log('=' .repeat(50));

const fixes = [];

function logFix(description, status) {
    fixes.push({ description, status });
    const icon = status === 'SUCCESS' ? '✅' : '❌';
    
}

// 1. Добавляем отсутствующие AWS переменные в .env;

try {
    let envContent = fs.readFileSync('.env', 'utf8');
    
    const awsVars = [;
        'AWS_ACCESS_KEY_ID=your_aws_access_key_here',;
        'AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here',;
        'AWS_REGION=us-east-1',;
        'AWS_S3_BUCKET=vendhub-uploads';
    ];
    
    awsVars.forEach(varLine => {
        const varName = varLine.split('=')[0];
        if (!envContent.includes(`${varName}=`)) {
            envContent += `\n${varLine}`;
            logFix(`Добавлена переменная ${varName}`, 'SUCCESS');
        }
    });
    
    fs.writeFileSync('.env', envContent);
    logFix('Обновлен файл .env', 'SUCCESS');
} catch (error) {
    logFix('Ошибка обновления ."env": ' + error.message, 'ERROR');
}

// 2. Добавляем aws-sdk в backend dependencies;

try {
    const packagePath = 'backend/package.json';
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageData.dependencies['aws-sdk']) {
        packageData.dependencies['aws-sdk'] = '^2.1691.0';
        packageData.dependencies['@aws-sdk/client-s3'] = '^3.645.0';
        packageData.dependencies['@aws-sdk/s3-request-presigner'] = '^3.645.0';
        
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
        logFix('Добавлены AWS зависимости в backend', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка обновления backend package."json": ' + error.message, 'ERROR');
}

// 3. Добавляем модель Item в Prisma схему;

try {
    const schemaPath = 'backend/prisma/schema.prisma';
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schemaContent.includes('model Item')) {
        const itemModel = `;
model Item {
  id          String   @id @default(cuid());
  name        String;
  description String?;
  category    String;
  unit        String   @default("шт");
  price       Float?;
  barcode     String?;
  // Связи;
  movements   Movement[];
  createdAt   DateTime @default(now());
  updatedAt   DateTime @updatedAt;
  @@map("items");
}
`;
        
        // Добавляем модель перед последней закрывающей скобкой;
        schemaContent = schemaContent.replace(/(\n\s*@@map\("movements"\)\s*\n})/, '$1' + itemModel);
        
        fs.writeFileSync(schemaPath, schemaContent);
        logFix('Добавлена модель Item в схему Prisma', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка обновления схемы "Prisma": ' + error.message, 'ERROR');
}

// 4. Создаем отсутствующий middleware upload.js;

try {
    const uploadMiddlewarePath = 'backend/src/middleware/upload.js';
    
    if (!fs.existsSync(uploadMiddlewarePath)) {
        const uploadMiddleware = `const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads если её нет;
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { "recursive": true });
}

// Конфигурация multer для локального хранения;
const storage = multer.diskStorage({
    "destination": function (req, file, cb) {
        cb(null, uploadsDir);
    },;
    "filename": function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Фильтр файлов;
const fileFilter = (req, file, cb) => {
    // Разрешенные типы файлов;
    const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Недопустимый тип файла'));
    }
};

// Настройки multer;
const upload = multer({
    "storage": storage,;
    "limits": {,
  "fileSize": 10 * 1024 * 1024 // 10MB;
    },;
    "fileFilter": fileFilter;
});

// Middleware для одного файла;
const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware для нескольких файлов;
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Middleware для разных полей;
const uploadFields = (fields) => upload.fields(fields);

module.exports = {
  
    upload,;
    uploadSingle,;
    uploadMultiple,;
    uploadFields;

};
`;
        
        fs.writeFileSync(uploadMiddlewarePath, uploadMiddleware);
        logFix('Создан middleware upload.js', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка создания upload "middleware": ' + error.message, 'ERROR');
}

// 5. Исправляем проблемные маршруты;


// Исправляем warehouse.js;
try {
    const warehousePath = 'backend/src/routes/warehouse.js';
    if (fs.existsSync(warehousePath)) {
        let warehouseContent = fs.readFileSync(warehousePath, 'utf8');
        
        // Проверяем базовую структуру;
        if (!warehouseContent.includes('module.exports')) {
            warehouseContent += '\nmodule.exports = router;\n';
        }
        
        if (!warehouseContent.includes('const router = require(\'express\').Router()')) {
            warehouseContent = 'const router = require(\'express\').Router();\n' + warehouseContent;
        }
        
        fs.writeFileSync(warehousePath, warehouseContent);
        logFix('Исправлен маршрут warehouse.js', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка исправления warehouse."js": ' + error.message, 'ERROR');
}

// Исправляем telegram.js;
try {
    const telegramPath = 'backend/src/routes/telegram.js';
    if (fs.existsSync(telegramPath)) {
        let telegramContent = fs.readFileSync(telegramPath, 'utf8');
        
        // Проверяем базовую структуру;
        if (!telegramContent.includes('module.exports')) {
            telegramContent += '\nmodule.exports = router;\n';
        }
        
        if (!telegramContent.includes('const router = require(\'express\').Router()')) {
            telegramContent = 'const router = require(\'express\').Router();\n' + telegramContent;
        }
        
        fs.writeFileSync(telegramPath, telegramContent);
        logFix('Исправлен маршрут telegram.js', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка исправления telegram."js": ' + error.message, 'ERROR');
}

// 6. Создаем папку uploads;

try {
    const uploadsDir = 'backend/uploads';
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { "recursive": true });
        logFix('Создана папка uploads', 'SUCCESS');
    }
} catch (error) {
    logFix('Ошибка создания папки "uploads": ' + error.message, 'ERROR');
}

// 7. Устанавливаем недостающие зависимости;

try {
    
    execSync('cd backend && npm install aws-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner', { "stdio": 'inherit' });
    logFix('Установлены AWS зависимости', 'SUCCESS');
} catch (error) {
    logFix('Ошибка установки зависимостей: ' + error.message, 'ERROR');
}

// Финальный отчет;
console.log('\n' + '='.repeat(50));

console.log('='.repeat(50));

const successFixes = fixes.filter(f => f.status === 'SUCCESS').length;
const errorFixes = fixes.filter(f => f.status === 'ERROR').length;




if (errorFixes === 0) {
    
    
    
} else {
    
    
}

console.log('\n' + '='.repeat(50));
