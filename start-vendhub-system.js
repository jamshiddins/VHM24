const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск системы VendHub...\n');

// Функция для запуска процесса
function startProcess(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Запуск ${name}...`);
        
        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('error', (error) => {
            console.error(`❌ Ошибка запуска ${name}:`, error);
            reject(error);
        });

        process.on('exit', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} запущен успешно`);
                resolve();
            } else {
                console.error(`❌ ${name} завершился с кодом ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        // Даем процессу время на запуск
        setTimeout(() => {
            console.log(`✅ ${name} запущен`);
            resolve();
        }, 3000);
    });
}

async function startSystem() {
    try {
        console.log('🔧 Проверка зависимостей...');
        
        // Установка зависимостей backend
        console.log('📦 Установка зависимостей backend...');
        await startProcess('npm', ['install'], './backend', 'Backend Dependencies');
        
        // Установка зависимостей telegram-bot
        console.log('📦 Установка зависимостей telegram-bot...');
        await startProcess('npm', ['install'], './apps/telegram-bot', 'Telegram Bot Dependencies');
        
        console.log('\n🗄️ Настройка базы данных...');
        
        // Генерация Prisma клиента
        await startProcess('npx', ['prisma', 'generate'], './backend', 'Prisma Generate');
        
        // Применение миграций
        await startProcess('npx', ['prisma', 'db', 'push'], './backend', 'Database Migration');
        
        console.log('\n🚀 Запуск сервисов...');
        
        // Запуск backend в фоне
        const backendProcess = spawn('npm', ['start'], {
            cwd: './backend',
            stdio: 'pipe',
            shell: true
        });
        
        backendProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`);
        });
        
        backendProcess.stderr.on('data', (data) => {
            console.error(`[Backend Error] ${data.toString().trim()}`);
        });
        
        // Ждем запуска backend
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Запуск telegram bot
        const botProcess = spawn('npm', ['start'], {
            cwd: './apps/telegram-bot',
            stdio: 'pipe',
            shell: true
        });
        
        botProcess.stdout.on('data', (data) => {
            console.log(`[Bot] ${data.toString().trim()}`);
        });
        
        botProcess.stderr.on('data', (data) => {
            console.error(`[Bot Error] ${data.toString().trim()}`);
        });
        
        console.log('\n🎉 Система VendHub запущена!');
        console.log('📋 Сервисы:');
        console.log('   🔧 Backend API: process.env.API_URL');
        console.log('   🤖 Telegram Bot: Активен');
        console.log('   🗄️ База данных: Подключена');
        console.log('\n💡 Для остановки нажмите Ctrl+C');
        
        // Обработка сигналов завершения
        process.on('SIGINT', () => {
            console.log('\n🛑 Остановка системы...');
            backendProcess.kill();
            botProcess.kill();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Остановка системы...');
            backendProcess.kill();
            botProcess.kill();
            process.exit(0);
        });
        
        // Держим процесс активным
        setInterval(() => {
            // Проверяем статус процессов
        }, 10000);
        
    } catch (error) {
        console.error('❌ Ошибка запуска системы:', error);
        process.exit(1);
    }
}

// Запуск системы
startSystem();
