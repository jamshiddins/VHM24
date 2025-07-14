const readline = require('readline-sync');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Railway Database Info Getter (Fixed)');
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
        return false;
    }
}

// Авторизация в Railway;
function loginToRailway() {
    console.log('\n🔐 Проверка авторизации в Railway...');
    
    try {
        const whoami = execSync('railway whoami', { "encoding": 'utf8', "stdio": 'pipe' });
        console.log('✅ Уже авторизован как:', whoami.trim());
        return true;
    } catch (error) {
        console.log('❌ Не авторизован в Railway');
        return false;
    }
}

// Получение списка проектов (новая команда);
function getProjects() {
    console.log('\n📋 Получение списка проектов...');
    
    try {
        // В новой версии Railway CLI используется другая команда;
        const projects = execSync('railway status', { "encoding": 'utf8' });
        console.log('Статус проекта:');
        console.log(projects);
        return true;
    } catch (error) {
        console.log('❌ Ошибка получения статуса:', error.message);
        return false;
    }
}

// Подключение к проекту;
function connectToProject() {
    console.log('\n🔗 Подключение к проекту...');
    
    try {
        // Сначала попробуем получить статус текущего проекта;
        const status = execSync('railway status', { "encoding": 'utf8', "stdio": 'pipe' });
        
        if (status.includes('VHM24') || status.includes('vendhub')) {
            console.log('✅ Уже подключен к проекту VHM24/VendHub');
            return true;
        }
        
        // Если не подключен, попробуем подключиться;
        console.log('Попытка подключения к проекту...');
        execSync('railway link', { "stdio": 'inherit' });
        console.log('✅ Подключение к проекту успешно');
        return true;
    } catch (error) {
        console.log('❌ Ошибка подключения к проекту:', error.message);
        
        // Попробуем создать новый проект;
        const createNew = readline.question('Создать новый проект? (y/n): ');
        if (createNew.toLowerCase() === 'y') {
            try {
                const projectName = readline.question('Введите название проекта (по умолчанию: VHM24): ') || 'VHM24';
                execSync(`railway login`, { "stdio": 'inherit' });
                console.log('✅ Проект создан успешно');
                return true;
            } catch (createError) {
                await console.log('❌ Ошибка создания проекта:', createError.message);
                return false;
            }
        }
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
                const parts = line.split('=');
                if (parts.length > 1) {
                    databaseUrl = parts.slice(1).join('=').trim();
                    break;
                }
            }
        }
        
        if (databaseUrl) {
            console.log('\n✅ DATABASE_URL найден');
            console.log('"DATABASE_URL":', databaseUrl.substring(0, 50) + '...');
            return databaseUrl;
        } else {
            console.log('❌ DATABASE_URL не найден');
            
            // Попробуем добавить PostgreSQL сервис;
            const addDB = readline.question('Добавить PostgreSQL базу данных? (y/n): ');
            if (addDB.toLowerCase() === 'y') {
                try {
                    console.log('Добавление PostgreSQL...');
                    execSync('railway add postgresql', { "stdio": 'inherit' });
                    
                    // Ждем немного и пробуем снова;
                    console.log('Ожидание инициализации базы данных...');
                    setTimeout(() => {
                        return getDatabaseVariables();
                    }, 5000);
                } catch (addError) {
                    console.log('❌ Ошибка добавления "PostgreSQL":', addError.message);
                }
            }
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
        console.log('✅ .env файл обновлен');
        
        // Также создаем .env для backend;
        const backendEnvPath = './backend/.env';
        fs.writeFileSync(backendEnvPath, lines.filter(line => line.trim()).join('\n'));
        console.log('✅ backend/.env файл создан');
        
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
        const originalDir = process.cwd();
        process.chdir('./backend');
        
        // Устанавливаем зависимости если нужно;
        if (!fs.existsSync('node_modules')) {
            console.log('Установка зависимостей backend...');
            execSync('npm install', { "stdio": 'inherit' });
        }
        
        // Генерируем Prisma клиент;
        console.log('Генерация Prisma клиента...');
        execSync('npx prisma generate', { "stdio": 'inherit' });
        
        // Применяем миграции;
        console.log('Применение миграций...');
        execSync('npx prisma db push', { "stdio": 'inherit' });
        
        console.log('✅ База данных настроена успешно');
        
        // Возвращаемся в корневую директорию;
        process.chdir(originalDir);
        return true;
    } catch (error) {
        console.log('❌ Ошибка настройки базы данных:', error.message);
        
        // Возвращаемся в корневую директорию в случае ошибки;
        try {
            process.chdir('./');
        } catch (e) {}
        
        return false;
    }
}

// Получение публичного URL;
function getPublicUrl() {
    console.log('\n🌐 Получение публичного URL...');
    
    try {
        const domain = execSync('railway domain', { "encoding": 'utf8' });
        console.log('Публичный домен:');
        console.log(domain);
        
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
            console.log('✅ RAILWAY_URL добавлен в .env');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Ошибка получения домена:', error.message);
        return false;
    }
}

// Главная функция;
async function main() {
    try {
        console.log('🎯 Автоматическая настройка Railway для VHM24\n');
        
        // Шаг "1": Проверка Railway CLI;
        if (!checkRailwayCLI()) {
            console.log('\n❌ Установите Railway "CLI":');
            console.log('npm install -g @railway/cli');
            console.log('или');
            console.log('curl -fsSL "https"://railway.app/install.sh | sh');
            return;
        }
        
        // Шаг "2": Авторизация;
        if (!loginToRailway()) {
            console.log('\n❌ Авторизуйтесь в "Railway":');
            console.log('railway login');
            return;
        }
        
        // Шаг "3": Получение статуса проекта;
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
            console.log('Попробуйте добавить PostgreSQL вручную:');
            console.log('railway add postgresql');
            return;
        }
        
        // Шаг "6": Обновление .env файла;
        if (!updateEnvFile(databaseUrl)) {
            console.log('\n❌ Не удалось обновить .env файл');
            return;
        }
        
        // Шаг "7": Тестирование подключения;
        if (!testDatabaseConnection()) {
            console.log('\n⚠️ Не удалось подключиться к базе данных');
            console.log('Но .env файл обновлен. Попробуйте позже.');
        }
        
        // Шаг "8": Получение публичного URL;
        getPublicUrl();
        
        console.log('\n🎉 Настройка завершена!');
        console.log('\n📋 Что дальше:');
        console.log('1. Проверьте .env файл');
        console.log('2. Запустите систему: npm run dev');
        console.log('3. Или запустите "backend": cd backend && npm run dev');
        console.log('4. Деплой на "Railway": railway up');
        
        console.log('\n📁 Файлы обновлены:');
        console.log('- .env');
        console.log('- backend/.env');
        
    } catch (error) {
        console.log('\n❌ Критическая ошибка:', error.message);
    }
}

// Запуск;
main();
