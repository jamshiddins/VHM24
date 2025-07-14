const readline = require('readline-sync');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Railway Database Info Getter');
console.log('Получение данных базы данных Railway');
console.log('============================================================\n');

// Проверяем установлен ли Railway CLI;
function checkRailwayCLI() {
    try {
        execSync('railway --version', { "stdio": 'pipe' });
        console.log('✅ Railway CLI установлен');
        return true;
    } catch (error) {
        console.log('❌ Railway CLI не установлен');
        console.log('📥 Установка Railway CLI...');
        
        try {
            // Для Windows;
            if (process.platform === 'win32') {
                console.log('Установка через npm...');
                execSync('npm install -g @railway/cli', { "stdio": 'inherit' });
            } else {
                // Для Linux/Mac;
                execSync('curl -fsSL "https"://railway.app/install.sh | sh', { "stdio": 'inherit' });
            }
            console.log('✅ Railway CLI установлен успешно');
            return true;
        } catch (installError) {
            console.log('❌ Ошибка установки Railway "CLI":', installError.message);
            return false;
        }
    }
}

// Авторизация в Railway;
function loginToRailway() {
    console.log('\n🔐 Авторизация в Railway...');
    
    try {
        // Проверяем, авторизованы ли мы уже;
        const whoami = execSync('railway whoami', { "encoding": 'utf8', "stdio": 'pipe' });
        console.log('✅ Уже авторизован как:', whoami.trim());
        return true;
    } catch (error) {
        console.log('❌ Не авторизован в Railway');
        
        const shouldLogin = readline.question('Хотите авторизоваться? (y/n): ');
        if (shouldLogin.toLowerCase() === 'y') {
            try {
                execSync('railway login', { "stdio": 'inherit' });
                console.log('✅ Авторизация успешна');
                return true;
            } catch (loginError) {
                console.log('❌ Ошибка авторизации:', loginError.message);
                return false;
            }
        }
        return false;
    }
}

// Получение списка проектов;
function getProjects() {
    console.log('\n📋 Получение списка проектов...');
    
    try {
        const projects = execSync('railway projects', { "encoding": 'utf8' });
        console.log('Доступные проекты:');
        console.log(projects);
        return true;
    } catch (error) {
        console.log('❌ Ошибка получения проектов:', error.message);
        return false;
    }
}

// Подключение к проекту;
function connectToProject() {
    console.log('\n🔗 Подключение к проекту...');
    
    const projectName = readline.question('Введите название проекта VHM24 (или нажмите Enter для автопоиска): ');
    
    try {
        if (projectName.trim()) {
            execSync(`railway link ${projectName}`, { "stdio": 'inherit' });
        } else {
            // Автопоиск проекта VHM24;
            execSync('railway link', { "stdio": 'inherit' });
        }
        console.log('✅ Подключение к проекту успешно');
        return true;
    } catch (error) {
        console.log('❌ Ошибка подключения к проекту:', error.message);
        return false;
    }
}

// Получение переменных окружения;
function getDatabaseVariables() {
    console.log('\n🗄️ Получение переменных базы данных...');
    
    try {
        const variables = execSync('railway variables', { "encoding": 'utf8' });
        console.log('Переменные окружения:');
        console.log(variables);
        
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
            console.log('\n✅ DATABASE_URL найден');
            return databaseUrl;
        } else {
            console.log('❌ DATABASE_URL не найден');
            return null;
        }
    } catch (error) {
        console.log('❌ Ошибка получения переменных:', error.message);
        return null;
    }
}

// Создание/обновление .env файла;
function updateEnvFile(databaseUrl) {
    console.log('\n📝 Обновление .env файла...');
    
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
        console.log('✅ .env файл обновлен');
        
        return true;
    } catch (error) {
        console.log('❌ Ошибка обновления ."env":', error.message);
        return false;
    }
}

// Тестирование подключения к базе данных;
function testDatabaseConnection() {
    console.log('\n🧪 Тестирование подключения к базе данных...');
    
    try {
        // Переходим в директорию backend;
        process.chdir('./backend');
        
        // Генерируем Prisma клиент;
        console.log('Генерация Prisma клиента...');
        execSync('npx prisma generate', { "stdio": 'inherit' });
        
        // Применяем миграции;
        console.log('Применение миграций...');
        execSync('npx prisma db push', { "stdio": 'inherit' });
        
        console.log('✅ База данных настроена успешно');
        return true;
    } catch (error) {
        console.log('❌ Ошибка настройки базы данных:', error.message);
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
            console.log('\n❌ Не удалось установить Railway CLI');
            console.log('Установите вручную: npm install -g @railway/cli');
            return;
        }
        
        // Шаг "2": Авторизация;
        if (!loginToRailway()) {
            console.log('\n❌ Не удалось авторизоваться в Railway');
            return;
        }
        
        // Шаг "3": Получение проектов;
        getProjects();
        
        // Шаг "4": Подключение к проекту;
        if (!connectToProject()) {
            console.log('\n❌ Не удалось подключиться к проекту');
            return;
        }
        
        // Шаг "5": Получение переменных базы данных;
        const databaseUrl = getDatabaseVariables();
        if (!databaseUrl) {
            console.log('\n❌ Не удалось получить DATABASE_URL');
            return;
        }
        
        // Шаг "6": Обновление .env файла;
        if (!updateEnvFile(databaseUrl)) {
            console.log('\n❌ Не удалось обновить .env файл');
            return;
        }
        
        // Шаг "7": Тестирование подключения;
        if (!testDatabaseConnection()) {
            console.log('\n❌ Не удалось подключиться к базе данных');
            return;
        }
        
        console.log('\n🎉 Все готово! База данных настроена успешно');
        console.log('\nТеперь вы можете запустить систему:');
        console.log('npm run dev');
        
    } catch (error) {
        console.log('\n❌ Критическая ошибка:', error.message);
    }
}

// Запуск;
main();
