const fs = require('fs');
const path = require('path');

module.exports = class ProjectAuditor {
    constructor() {
        this.projectRoot = process.cwd();
        this.envVariables = new Map();
        this.fixes = [];
        this.errors = [];
    }

    getAllFiles(dir, extension) {
        let results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                results = results.concat(this.getAllFiles(filePath, extension));
            } else if (file.endsWith(extension)) {
                results.push(filePath);
            }
        }
        
        return results;
    }

    async findHardcodedVariables() {
        

        const patterns = [
            { pattern: /process.env.TELEGRAM_BOT_TOKEN/g, replacement: process.env.API_KEY_188 || 'process.env.TELEGRAM_BOT_TOKEN', env: 'TELEGRAM_BOT_TOKEN' },
            { pattern: /process.env.API_URL/g, replacement: 'process.env.API_URL', env: 'API_URL' },
            { pattern: /http:\/\/127\.0\.0\.1/g, replacement: 'process.env.API_URL', env: 'API_URL' },
            { pattern: /http:\/\/localhost:3000/g, replacement: 'process.env.API_URL', env: 'API_URL' },
            { pattern: /process.env.DB_PASSWORD/g, replacement: process.env.API_KEY_189 || 'process.env.DB_PASSWORD', env: 'DB_PASSWORD' },
            { pattern: /process.env.JWT_SECRET/g, replacement: process.env.API_KEY_190 || 'process.env.JWT_SECRET', env: 'JWT_SECRET' }
        ];

        const allFiles = this.getAllFiles(this.projectRoot, '.js');

        for (const file of allFiles) {
            if (file.includes('node_modules') || file.includes('.git')) continue;

            try {
                let content = fs.readFileSync(file, 'utf8');
                let modified = false;

                patterns.forEach(({ pattern, replacement, env }) => {
                    if (pattern.test(content)) {
                        content = content.replace(pattern, replacement);
                        modified = true;
                        this.envVariables.set(env, `REQUIRED_${env}`);
                        this.fixes.push(`${path.relative(this.projectRoot, file)}: Заменена захардкоженная переменная на ${env}`);
                    }
                });

                if (modified) {
                    fs.writeFileSync(file, content);
                }
            } catch (error) {
                this.errors.push(`Ошибка обработки ${file}: ${error.message}`);
            }
        }
    }
}
