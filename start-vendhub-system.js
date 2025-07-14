const { spawn } = require('child_process');
const path = require('path');



// Функция для запуска процесса
function startProcess(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        
        
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
                
                resolve();
            } else {
                console.error(`❌ ${name} завершился с кодом ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        // Даем процессу время на запуск
        setTimeout(() => {
            
            resolve();
        }, 3000);
    });
}

async function startSystem() {
    try {
        
        
        // Установка зависимостей backend
        
        await startProcess('npm', ['install'], './backend', 'Backend Dependencies');
        
        // Установка зависимостей telegram-bot
        
        await startProcess('npm', ['install'], './apps/telegram-bot', 'Telegram Bot Dependencies');
        
        
        
        // Генерация Prisma клиента
        await startProcess('npx', ['prisma', 'generate'], './backend', 'Prisma Generate');
        
        // Применение миграций
        await startProcess('npx', ['prisma', 'db', 'push'], './backend', 'Database Migration');
        
        
        
        // Запуск backend в фоне
        const backendProcess = spawn('npm', ['start'], {
            cwd: './backend',
            stdio: 'pipe',
            shell: true
        });
        
        backendProcess.stdout.on('data', (data) => {
            .trim()}`);
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
            .trim()}`);
        });
        
        botProcess.stderr.on('data', (data) => {
            console.error(`[Bot Error] ${data.toString().trim()}`);
        });
        
        
        
        
        
        
        
        
        // Обработка сигналов завершения
        process.on('SIGINT', () => {
            
            backendProcess.kill();
            botProcess.kill();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            
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
