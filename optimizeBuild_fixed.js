const path = require('path');
const fs = require('fs');

class ProjectOptimizer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.fixes = [];
        this.errors = [];
    }

    async optimizeBuild() {
        

        // Проверяем package.json
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                // Добавляем необходимые скрипты
                const requiredScripts = {
                    "start": "node index.js",
                    "start:dev": "nodemon index.js",
                    "start:backend": "cd backend && npm run start",
                    "start:telegram": "cd apps/telegram-bot && npm run start",
                    "build": "npm run build:backend",
                    "build:backend": "cd backend && npm run build",
                    "test": "jest",
                    "lint": "eslint .",
                    "lint:fix": "eslint . --fix",
                    "prisma:generate": "cd backend && npx prisma generate",
                    "prisma:migrate": "cd backend && npx prisma migrate deploy",
                    "prisma:studio": "cd backend && npx prisma studio"
                };

                packageJson.scripts = { ...packageJson.scripts, ...requiredScripts };

                // Добавляем необходимые зависимости
                if (!packageJson.dependencies) {
                    packageJson.dependencies = {};
                }

                const requiredDependencies = {
                    "dotenv": "^16.0.3",
                    "express": "^4.18.2",
                    "cors": "^2.8.5",
                    "helmet": "^6.0.1",
                    "winston": "^3.8.2"
                };

                packageJson.dependencies = { ...packageJson.dependencies, ...requiredDependencies };

                // Добавляем необходимые dev-зависимости
                if (!packageJson.devDependencies) {
                    packageJson.devDependencies = {};
                }

                const requiredDevDependencies = {
                    "eslint": "^8.35.0",
                    "jest": "^29.4.3",
                    "nodemon": "^2.0.21"
                };

                packageJson.devDependencies = { ...packageJson.devDependencies, ...requiredDevDependencies };

                // Сохраняем обновленный package.json
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                this.fixes.push('Обновлен package.json');
            } catch (error) {
                this.errors.push(`Ошибка обновления package.json: ${error.message}`);
            }
        }

        // Создаем .nvmrc для фиксации версии Node.js
        const nvmrcPath = path.join(this.projectRoot, '.nvmrc');
        if (!fs.existsSync(nvmrcPath)) {
            fs.writeFileSync(nvmrcPath, '18');
            this.fixes.push('Создан .nvmrc с версией Node.js 18');
        }

        // Создаем .node-version для Netlify/Vercel
        const nodeVersionPath = path.join(this.projectRoot, '.node-version');
        if (!fs.existsSync(nodeVersionPath)) {
            fs.writeFileSync(nodeVersionPath, '18.14.2');
            this.fixes.push('Создан .node-version с версией Node.js 18.14.2');
        }
    }
}
