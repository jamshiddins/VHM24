const readline = require('readline-sync');
const fs = require('fs');
const { execSync } = require('child_process');





// Проверяем установлен ли Railway CLI;
function checkRailwayCLI() {
    try {
        execSync('railway --version', { "stdio": 'pipe' });
        
        return true;
    } catch (error) {
        
        
        
        try {
            // Для Windows;
            if (process.platform === 'win32') {
                
                execSync('npm install -g @railway/cli', { "stdio": 'inherit' });
            } else {
                // Для Linux/Mac;
                execSync('curl -fsSL "https"://railway.app/install.sh | sh', { "stdio": 'inherit' });
            }
            
            return true;
        } catch (installError) {
            
            return false;
        }
    }
}

// Авторизация в Railway;
function loginToRailway() {
    
    
    try {
        // Проверяем, авторизованы ли мы уже;
        const whoami = execSync('railway whoami', { "encoding": 'utf8', "stdio": 'pipe' });
        console.log('✅ Уже авторизован как:', whoami.trim());
        return true;
    } catch (error) {
        
        
        const shouldLogin = readline.question('Хотите авторизоваться? (y/n): ');
        if (shouldLogin.toLowerCase() === 'y') {
            try {
                execSync('railway login', { "stdio": 'inherit' });
                
                return true;
            } catch (loginError) {
                
                return false;
            }
        }
        return false;
    }
}

// Получение списка проектов;
function getProjects() {
    
    
    try {
        const projects = execSync('railway projects', { "encoding": 'utf8' });
        
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Подключение к проекту;
function connectToProject() {
    
    
    const projectName = readline.question('Введите название проекта VHM24 (или нажмите Enter для автопоиска): ');
    
    try {
        if (projectName.trim()) {
            execSync(`railway link ${projectName}`, { "stdio": 'inherit' });
        } else {
            // Автопоиск проекта VHM24;
            execSync('railway link', { "stdio": 'inherit' });
        }
        
        return true;
    } catch (error) {
        
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
                databaseUrl = line.split('=')[1]?.trim();
                break;
            }
        }
        
        if (databaseUrl) {
            
            return databaseUrl;
        } else {
            
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
            'JWT_SECRET=your-super-secret-jwt-key-change-in-production',;
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
        fs.writeFileSync('.env', lines.join('\n'));
        
        
        return true;
    } catch (error) {
        
        return false;
    }
}

// Тестирование подключения к базе данных;
function testDatabaseConnection() {
    
    
    try {
        // Переходим в директорию backend;
        process.chdir('./backend');
        
        // Генерируем Prisma клиент;
        
        execSync('npx prisma generate', { "stdio": 'inherit' });
        
        // Применяем миграции;
        
        execSync('npx prisma db push', { "stdio": 'inherit' });
        
        
        return true;
    } catch (error) {
        
        return false;
    } finally {
        // Возвращаемся в корневую директорию;
        process.chdir('..');
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
        
        // Шаг "3": Получение проектов;
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
            
            return;
        }
        
        
        
        
        
    } catch (error) {
        
    }
}

// Запуск;
main();
