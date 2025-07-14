const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Получение URL базы данных Railway...');

try {
    // Получаем переменные окружения Railway
    const result = execSync('railway variables', { encoding: 'utf8' });
    console.log('Railway variables:', result);
    
    // Ищем DATABASE_URL
    const lines = result.split('\n');
    let databaseUrl = null;
    
    for (const line of lines) {
        if (line.includes('DATABASE_URL')) {
            const match = line.match(/DATABASE_URL\s*=\s*(.+)/);
            if (match) {
                databaseUrl = match[1].trim();
                break;
            }
        }
    }
    
    if (databaseUrl) {
        console.log('✅ Найден DATABASE_URL:', databaseUrl.substring(0, 50) + '...');
        
        // Обновляем .env файл
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Удаляем старый DATABASE_URL если есть
        envContent = envContent.replace(/DATABASE_URL=.*/g, '');
        
        // Добавляем новый DATABASE_URL
        envContent += `\nDATABASE_URL="${databaseUrl}"\n`;
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env файл обновлен');
        
        // Также обновляем backend/.env
        const backendEnvPath = path.join(__dirname, 'backend', '.env');
        fs.writeFileSync(backendEnvPath, `DATABASE_URL="${databaseUrl}"\n`);
        console.log('✅ backend/.env файл обновлен');
        
    } else {
        console.log('❌ DATABASE_URL не найден в переменных Railway');
        
        // Попробуем создать базу данных
        console.log('🔄 Попытка создания новой базы данных...');
        try {
            execSync('railway add postgresql', { encoding: 'utf8' });
            console.log('✅ PostgreSQL добавлен');
            
            // Ждем немного и пробуем снова
            setTimeout(() => {
                const newResult = execSync('railway variables', { encoding: 'utf8' });
                console.log('Новые переменные:', newResult);
            }, 3000);
            
        } catch (addError) {
            console.log('❌ Ошибка при добавлении PostgreSQL:', addError.message);
        }
    }
    
} catch (error) {
    console.log('❌ Ошибка при получении переменных Railway:', error.message);
    
    // Попробуем альтернативный способ
    try {
        console.log('🔄 Попытка альтернативного способа...');
        const loginResult = execSync('railway login', { encoding: 'utf8' });
        console.log('Login result:', loginResult);
        
        const projectResult = execSync('railway status', { encoding: 'utf8' });
        console.log('Project status:', projectResult);
        
    } catch (altError) {
        console.log('❌ Альтернативный способ не сработал:', altError.message);
        
        // Создаем локальную базу данных для разработки
        console.log('🔄 Создание локальной конфигурации...');
        const localDbUrl = 'postgresql://postgres:password@localhost:5432/vendhub_dev';
        
        const envContent = `
# Database
DATABASE_URL="${localDbUrl}"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# AWS S3 (optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"

# Server
PORT=3000
NODE_ENV=development
`;
        
        fs.writeFileSync('.env', envContent);
        fs.writeFileSync('backend/.env', `DATABASE_URL="${localDbUrl}"\n`);
        
        console.log('✅ Создана локальная конфигурация');
        console.log('⚠️  Для продакшена нужно настроить Railway базу данных');
    }
}
