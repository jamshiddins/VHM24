const readline = require('readline-sync');
const fs = require('fs');
const { execSync } = require('child_process');

');



// Проверяем установлен ли Railway CLI;
function checkRailwayCLI() {
    try {
        execSync('railway --version', { "stdio": 'pipe' });
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Авторизация в Railway;
function loginToRailway() {
    
    
    try {
        const whoami = execSync('railway whoami', { "encoding": 'utf8', "stdio": 'pipe' });
        );
        return true;
    } catch (error) {
        
        return false;
    }
}

// Получение списка проектов (новая команда);
function getProjects() {
    
    
    try {
        // В новой версии Railway CLI используется другая команда;
        const projects = execSync('railway status', { "encoding": 'utf8' });
        
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Подключение к проекту;
function connectToProject() {
    
    
    try {
        // Сначала попробуем получить статус текущего проекта;
        const status = execSync('railway status', { "encoding": 'utf8', "stdio": 'pipe' });
        
        if (status.includes('VHM24') || status.includes('vendhub')) {
            
            return true;
        }
        
        // Если не подключен, попробуем подключиться;
        
        execSync('railway link', { "stdio": 'inherit' });
        
        return true;
    } catch (error) {
        
        
        // Попробуем создать новый проект;
        const createNew = readline.question('Создать новый проект? (y/n): ');
        if (createNew.toLowerCase() === 'y') {
            try {
                const projectName = readline.question('Введите название проекта (по умолчанию: VHM24): ') || 'VHM24';
                execSync(`railway login`, { "stdio": 'inherit' });
                
                return true;
            } catch (createError) {
                await 
                return false;
            }
        }
        return false;
    }
}

// Получение переменных окружения;
function getDatabaseVariables() {
    
    
    try {
        const variables = execSync('railway variables', { "encoding": 'utf8' });
        
        
        
        // Извлекаем DATABASE_URL;
        const lines = variables.split('\n');
        let databaseUrl = '';
        
        for (const line of lines) {
            if (line.includes('DATABASE_URL')) {
                const parts = line.split('=');
                if (parts.length > 1) {
                    databaseUrl = parts.slice(1).join('=').trim();
                    break;
                }
            }
        }
        
        if (databaseUrl) {
            
             + '...');
            return databaseUrl;
        } else {
            
            
            // Попробуем добавить PostgreSQL сервис;
            const addDB = readline.question('Добавить PostgreSQL базу данных? (y/n): ');
            if (addDB.toLowerCase() === 'y') {
                try {
                    
                    execSync('railway add postgresql', { "stdio": 'inherit' });
                    
                    // Ждем немного и пробуем снова;
                    
                    setTimeout(() => {
                        return getDatabaseVariables();
                    }, 5000);
                } catch (addError) {
                    
                }
            }
            return null;
        }
    } catch (error) {
        
        return null;
    }
}

// Создание/обновление .env файла;
function updateEnvFile(databaseUrl) {
    
    
    try {
        let envContent = '';
        
        // Читаем существующий .env если есть;
        if (fs.existsSync('.env')) {
            envContent = fs.readFileSync('.env', 'utf8');
        }
        
        // Обновляем или добавляем DATABASE_URL;
        const lines = envContent.split('\n');
        let updated = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('DATABASE_URL=')) {
                lines[i] = `DATABASE_URL="${databaseUrl}"`;
                updated = true;
                break;
            }
        }
        
        if (!updated) {
            lines.push(`DATABASE_URL="${databaseUrl}"`);
        }
        
        // Добавляем другие необходимые переменные если их нет;
        const requiredVars = [;
            'NODE_ENV=development',;
            'PORT=3000',;
            'JWT_SECRET=your-super-secret-jwt-key-change-in-production-' + Date.now(),;
            'TELEGRAM_BOT_TOKEN=your-telegram-bot-token',;
            'AWS_ACCESS_KEY_ID=your-aws-access-key',;
            'AWS_SECRET_ACCESS_KEY=your-aws-secret-key',;
            'AWS_REGION=us-east-1',;
            'S3_BUCKET_NAME=your-s3-bucket';
        ];
        
        for (const varLine of requiredVars) {
            const varName = varLine.split('=')[0];
            const exists = lines.some(line => line.startsWith(`${varName}=`));
            if (!exists) {
                lines.push(varLine);
            }
        }
        
        // Записываем обновленный .env;
        fs.writeFileSync('.env', lines.filter(line => line.trim()).join('\n'));
        
        
        // Также создаем .env для backend;
        const backendEnvPath = './backend/.env';
        fs.writeFileSync(backendEnvPath, lines.filter(line => line.trim()).join('\n'));
        
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Тестирование подключения к базе данных;
function testDatabaseConnection() {
    
    
    try {
        // Переходим в директорию backend;
        const originalDir = process.cwd();
        process.chdir('./backend');
        
        // Устанавливаем зависимости если нужно;
        if (!fs.existsSync('node_modules')) {
            
            execSync('npm install', { "stdio": 'inherit' });
        }
        
        // Генерируем Prisma клиент;
        
        execSync('npx prisma generate', { "stdio": 'inherit' });
        
        // Применяем миграции;
        
        execSync('npx prisma db push', { "stdio": 'inherit' });
        
        
        
        // Возвращаемся в корневую директорию;
        process.chdir(originalDir);
        return true;
    } catch (error) {
        
        
        // Возвращаемся в корневую директорию в случае ошибки;
        try {
            process.chdir('./');
        } catch (e) {}
        
        return false;
    }
}

// Получение публичного URL;
function getPublicUrl() {
    
    
    try {
        const domain = execSync('railway domain', { "encoding": 'utf8' });
        
        
        
        // Сохраняем URL в .env;
        const url = domain.trim();
        if (url && url.includes('.railway.app')) {
            const envContent = fs.readFileSync('.env', 'utf8');
            const lines = envContent.split('\n');
            
            // Добавляем или обновляем RAILWAY_URL;
            let updated = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('RAILWAY_URL=')) {
                    lines[i] = `RAILWAY_URL="https"://${url}`;
                    updated = true;
                    break;
                }
            }
            
            if (!updated) {
                lines.push(`RAILWAY_URL="https"://${url}`);
            }
            
            fs.writeFileSync('.env', lines.join('\n'));
            
        }
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Главная функция;
async function main() {
    try {
        
        
        // Шаг "1": Проверка Railway CLI;
        if (!checkRailwayCLI()) {
            
            
            
            
            return;
        }
        
        // Шаг "2": Авторизация;
        if (!loginToRailway()) {
            
            
            return;
        }
        
        // Шаг "3": Получение статуса проекта;
        getProjects();
        
        // Шаг "4": Подключение к проекту;
        if (!connectToProject()) {
            
            return;
        }
        
        // Шаг "5": Получение переменных базы данных;
        const databaseUrl = getDatabaseVariables();
        if (!databaseUrl) {
            
            
            
            return;
        }
        
        // Шаг "6": Обновление .env файла;
        if (!updateEnvFile(databaseUrl)) {
            
            return;
        }
        
        // Шаг "7": Тестирование подключения;
        if (!testDatabaseConnection()) {
            
            
        }
        
        // Шаг "8": Получение публичного URL;
        getPublicUrl();
        
        
        
        
        
        
        
        
        
        
        
        
    } catch (error) {
        
    }
}

// Запуск;
main();
