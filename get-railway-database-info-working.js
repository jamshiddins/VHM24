const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function getRailwayDatabaseInfo() {
    console.log('🚂 Получение информации о базе данных Railway...\n');

    try {
        // Проверяем, установлен ли Railway CLI
        try {
            execSync('railway --version', { stdio: 'pipe' });
            console.log('✅ Railway CLI установлен');
        } catch (error) {
            console.log('❌ Railway CLI не установлен. Устанавливаем...');
            try {
                execSync('npm install -g @railway/cli', { stdio: 'inherit' });
                console.log('✅ Railway CLI установлен');
            } catch (installError) {
                console.log('❌ Ошибка установки Railway CLI:', installError.message);
                return;
            }
        }

        // Проверяем авторизацию
        try {
            const loginCheck = execSync('railway whoami', { stdio: 'pipe', encoding: 'utf8' });
            console.log('✅ Авторизован в Railway:', loginCheck.trim());
        } catch (error) {
            console.log('❌ Не авторизован в Railway. Запускаем авторизацию...');
            console.log('Выполните команду: railway login');
            return;
        }

        // Получаем список проектов
        try {
            const projects = execSync('railway projects', { stdio: 'pipe', encoding: 'utf8' });
            console.log('📋 Доступные проекты Railway:');
            console.log(projects);
        } catch (error) {
            console.log('❌ Ошибка получения списка проектов:', error.message);
        }

        // Пытаемся подключиться к проекту
        try {
            const status = execSync('railway status', { stdio: 'pipe', encoding: 'utf8' });
            console.log('📊 Статус текущего проекта:');
            console.log(status);
        } catch (error) {
            console.log('❌ Не подключен к проекту Railway');
            console.log('Выполните команду: railway link');
            return;
        }

        // Получаем переменные окружения
        try {
            const variables = execSync('railway variables', { stdio: 'pipe', encoding: 'utf8' });
            console.log('🔧 Переменные окружения Railway:');
            console.log(variables);

            // Пытаемся найти DATABASE_URL
            const lines = variables.split('\n');
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
                console.log('\n✅ Найден DATABASE_URL:', databaseUrl.substring(0, 50) + '...');
                
                // Обновляем .env файл
                const envPath = path.join(__dirname, '.env');
                let envContent = '';
                
                if (fs.existsSync(envPath)) {
                    envContent = fs.readFileSync(envPath, 'utf8');
                }

                // Обновляем или добавляем DATABASE_URL
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

                fs.writeFileSync(envPath, lines.join('\n'));
                console.log('✅ Файл .env обновлен с новым DATABASE_URL');
            } else {
                console.log('❌ DATABASE_URL не найден в переменных окружения');
            }

        } catch (error) {
            console.log('❌ Ошибка получения переменных окружения:', error.message);
        }

        // Получаем информацию о сервисах
        try {
            const services = execSync('railway services', { stdio: 'pipe', encoding: 'utf8' });
            console.log('\n🔧 Сервисы Railway:');
            console.log(services);
        } catch (error) {
            console.log('❌ Ошибка получения списка сервисов:', error.message);
        }

    } catch (error) {
        console.log('❌ Общая ошибка:', error.message);
    }
}

// Запускаем функцию
getRailwayDatabaseInfo().catch(console.error);
