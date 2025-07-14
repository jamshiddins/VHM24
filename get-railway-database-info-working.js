const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function getRailwayDatabaseInfo() {
    

    try {
        // Проверяем, установлен ли Railway CLI
        try {
            execSync('railway --version', { stdio: 'pipe' });
            
        } catch (error) {
            
            try {
                execSync('npm install -g @railway/cli', { stdio: 'inherit' });
                
            } catch (installError) {
                
                return;
            }
        }

        // Проверяем авторизацию
        try {
            const loginCheck = execSync('railway whoami', { stdio: 'pipe', encoding: 'utf8' });
            console.log('✅ Авторизован в Railway:', loginCheck.trim());
        } catch (error) {
            
            
            return;
        }

        // Получаем список проектов
        try {
            const projects = execSync('railway projects', { stdio: 'pipe', encoding: 'utf8' });
            
            
        } catch (error) {
            
        }

        // Пытаемся подключиться к проекту
        try {
            const status = execSync('railway status', { stdio: 'pipe', encoding: 'utf8' });
            
            
        } catch (error) {
            
            
            return;
        }

        // Получаем переменные окружения
        try {
            const variables = execSync('railway variables', { stdio: 'pipe', encoding: 'utf8' });
            
            

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
                
            } else {
                
            }

        } catch (error) {
            
        }

        // Получаем информацию о сервисах
        try {
            const services = execSync('railway services', { stdio: 'pipe', encoding: 'utf8' });
            
            
        } catch (error) {
            
        }

    } catch (error) {
        
    }
}

// Запускаем функцию
getRailwayDatabaseInfo().catch(console.error);
