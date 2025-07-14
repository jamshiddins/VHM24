#!/usr/bin/env node;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');




const issues = [];
const fixes = [];

// Comprehensive problem detection and fixing;
async async function detectAndFixAllProblems() { fixDocumentationIssues();
    
    
    generateReport();
}

async function fixSyntaxIssues() {
    
    
    const files = getAllJSFiles();
    
    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            let fixed = content;
            
            // Fix common syntax issues;
            fixed = fixCommonSyntaxErrors(fixed);
            fixed = fixImportExportIssues(fixed);
            fixed = fixAsyncAwaitIssues(fixed);
            fixed = fixJSONIssues(fixed);
            
            if (fixed !== content) {
                fs.writeFileSync(file, fixed);
                fixes.push(`Fixed syntax in ${file}`);
            }
        } catch (error) {
            issues.push(`Syntax error in ${file}: ${error.message}`);
        }
    }
}

function fixCommonSyntaxErrors(content) {
    // Fix missing semicolons;
    content = content.replace(/([^;{}\s])\s*\n/g, '$1;\n');
    
    // Fix missing commas in objects;
    content = content.replace(/(\w+:\s*[^}\n]+)\s*\n\s*(\w+:)/g, '$1,\n  $2');
    
    // Fix unclosed brackets;
    let openBrackets = 0;
    let openBraces = 0;
    let openParens = 0;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
    }
    
    // Add missing closing brackets;
    if (openBrackets > 0) content += ']'.repeat(openBrackets);
    if (openBraces > 0) content += '}'.repeat(openBraces);
    if (openParens > 0) content += ')'.repeat(openParens);
    
    return content;
}

function fixImportExportIssues(content) {
    // Fix require statements;
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,;
        'const $1 = require(\'$2\')');
    
    // Fix import statements;
    content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,;
        'import $1 from \'$2\'');
    
    // Fix export statements;
    content = content.replace(/module\.exports\s*=\s*{([^}]+)}/g, (match, exports) => {
        const cleanExports = exports.replace(/,\s*$/, '');
        return `module.exports = {
  \n  ${cleanExports
}\n}`;
    });
    
    return content;
}

function fixAsyncAwaitIssues(content) {
    // Fix missing async keywords;
    content = content.replace(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*await/g,;
        'async function $1() {');
    
    // Fix missing await keywords;
    content = content.replace(/(\w+\.\w+\([^)]*\))\s*;/g, (match, call) => {
        if (call.includes('find') || call.includes('create') || call.includes('update') ||;
            call.includes('delete') || call.includes('connect')) {
            return `await ${call};`;
        }
        return match;
    });
    
    return content;
}

function fixJSONIssues(content) {
    // Fix trailing commas in JSON;
    content = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted keys;
    content = content.replace(/(\w+):/g, '"$1":');
    
    return content;
}

async function fixDependencyIssues() {
    
    
    const packageFiles = [;
        'package.json',;
        'backend/package.json',;
        'apps/telegram-bot/package.json';
    ];
    
    for (const file of packageFiles) {
        if (fs.existsSync(file)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
                
                // Add missing dependencies;
                const missingDeps = findMissingDependencies(file);
                if (missingDeps.length > 0) {
                    pkg.dependencies = pkg.dependencies || {};
                    missingDeps.forEach(dep => {
                        pkg.dependencies[dep.name] = dep.version;
                    });
                    
                    fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
                    fixes.push(`Added missing dependencies to ${file}`);
                }
            } catch (error) {
                issues.push(`Package.json error in ${file}: ${error.message}`);
            }
        }
    }
}

function findMissingDependencies(packageFile) {
    const commonDeps = [;
        { "name": 'express', "version": '^4.18.2' },;
        { "name": 'cors', "version": '^2.8.5' },;
        { "name": 'helmet', "version": '^7.0.0' },;
        { "name": 'dotenv', "version": '^16.3.1' },;
        { "name": 'bcryptjs', "version": '^2.4.3' },;
        { "name": 'jsonwebtoken', "version": '^9.0.2' },;
        { "name": 'joi', "version": '^17.9.2' },;
        { "name": 'winston', "version": '^3.10.0' },;
        { "name": '@prisma/client', "version": '^5.1.1' },;
        { "name": 'prisma', "version": '^5.1.1' },;
        { "name": 'telegraf', "version": '^4.12.2' },;
        { "name": 'multer', "version": '^1.4.5-lts.1' },;
        { "name": 'xlsx', "version": '^0.18.5' },;
        { "name": 'aws-sdk', "version": '^2.1419.0' }
    ];
    
    try {
        const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        const existing = { ...pkg.dependencies, ...pkg.devDependencies };
        
        return commonDeps.filter(dep => !existing[dep.name]);
    } catch {
        return commonDeps;
    }
}

async function fixDatabaseIssues() {
    
    
    const schemaFile = 'backend/prisma/schema.prisma';
    if (fs.existsSync(schemaFile)) {
        try {
            let schema = fs.readFileSync(schemaFile, 'utf8');
            
            // Fix schema syntax;
            schema = fixPrismaSchema(schema);
            
            fs.writeFileSync(schemaFile, schema);
            fixes.push('Fixed Prisma schema');
            
            // Generate Prisma client;
            try {
                execSync('cd backend && npx prisma generate', { "stdio": 'pipe' });
                fixes.push('Generated Prisma client');
            } catch (error) {
                issues.push(`Prisma generate "failed": ${error.message}`);
            }
        } catch (error) {
            issues.push(`Schema "error": ${error.message}`);
        }
    }
}

function fixPrismaSchema(schema) {
    // Fix generator and datasource;
    if (!schema.includes('generator client')) {
        schema = `generator client {
  provider = "prisma-client-js";
}

datasource db {
  provider = "postgresql";
  url      = env("DATABASE_URL");
}

${schema}`;
    }
    
    // Fix model syntax;
    schema = schema.replace(/model\s+(\w+)\s*{([^}]+)}/g, (match, modelName, fields) => {
        let fixedFields = fields;
            .split('\n');
            .map(line => line.trim());
            .filter(line => line);
            .map(line => {
                // Fix field syntax;
                if (line.includes('id') && !line.includes('@id')) {
                    line += ' @id @default(cuid())';
                }
                if (line.includes('createdAt') && !line.includes('@default')) {
                    line += ' @default(now())';
                }
                if (line.includes('updatedAt') && !line.includes('@updatedAt')) {
                    line += ' @updatedAt';
                }
                return '  ' + line;
            });
            .join('\n');
        
        return `model ${modelName} {\n${fixedFields}\n}`;
    });
    
    return schema;
}

async function fixEnvironmentIssues() {
    
    
    const envFiles = ['.env', '.env.example', 'backend/.env', 'apps/telegram-bot/.env'];
    
    for (const envFile of envFiles) {
        if (fs.existsSync(envFile)) {
            try {
                let content = fs.readFileSync(envFile, 'utf8');
                
                // Add missing environment variables;
                const requiredVars = [;
                    'NODE_ENV=development',;
                    'PORT=3000',;
                    'DATABASE_URL="postgresql"://"user":password@"localhost":5432/vendhub',;
                    'JWT_SECRET=your-super-secret-jwt-key-here',;
                    'TELEGRAM_BOT_TOKEN=your-telegram-bot-token',;
                    'AWS_ACCESS_KEY_ID=your-aws-access-key',;
                    'AWS_SECRET_ACCESS_KEY=your-aws-secret-key',;
                    'AWS_REGION=us-east-1',;
                    'S3_BUCKET_NAME=vendhub-files';
                ];
                
                requiredVars.forEach(varDef => {
                    const [key] = varDef.split('=');
                    if (!content.includes(key)) {
                        content += `\n${varDef}`;
                    }
                });
                
                fs.writeFileSync(envFile, content);
                fixes.push(`Fixed environment variables in ${envFile}`);
            } catch (error) {
                issues.push(`Environment file error in ${envFile}: ${error.message}`);
            }
        }
    }
}

async function fixRouteIssues() {
    
    
    const routeFiles = getAllFilesInDir('backend/src/routes');
    
    for (const file of routeFiles) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            
            // Fix route structure;
            content = fixRouteStructure(content);
            content = fixMiddleware(content);
            content = fixErrorHandling(content);
            
            fs.writeFileSync(file, content);
            fixes.push(`Fixed routes in ${file}`);
        } catch (error) {
            issues.push(`Route error in ${file}: ${error.message}`);
        }
    }
}

function fixRouteStructure(content) {
    // Ensure proper router setup;
    if (!content.includes('const router = express.Router()')) {
        content = `const express = require('express');
const router = express.Router();

${content}

module.exports = router;`;
    }
    
    // Fix route handlers;
    content = content.replace(/router\.(get|post|put|delete)\(['"]([^'"]+)['"],?\s*([^)]+)\)/g,;
        (match, method, path, handler) => {
            return `router.${method}('${path}', ${handler})`;
        });
    
    return content;
}

function fixMiddleware(content) {
    // Add authentication middleware where needed;
    const protectedRoutes = ['post', 'put', 'delete'];
    
    protectedRoutes.forEach(method => {
        content = content.replace(;
            new RegExp(`router\\.${method}\\(['"]([^'"]+)['"],\\s*([^,)]+)\\)`, 'g'),;
            `router.${method}('$1', authenticateToken, $2)`;
        );
    });
    
    return content;
}

function fixErrorHandling(content) {
    // Add try-catch blocks to route handlers;
    content = content.replace(;
        /(router\.\w+\(['"][^'"]+['"],\s*(?:authenticateToken,\s*)?)(async\s+)?\(([^)]+)\)\s*=>\s*{([^}]+)}/g,;
        (match, routeStart, asyncKeyword, params, body) => {
            if (!body.includes('try') && !body.includes('catch')) {
                return `${routeStart}async (${params}) => {
  try {
${body.split('\n').map(line => '    ' + line).join('\n')}
  } catch (error) {
    console.error('Route "error":', error);
    res.status(500).json({ "error": 'Internal server error' });
  }
}`;
            }
            return match;
        }
    );
    
    return content;
}

async function fixTelegramBotIssues() {
    
    
    const botFiles = getAllFilesInDir('apps/telegram-bot/src');
    
    for (const file of botFiles) {
        try {
            let content = fs.readFileSync(file, 'utf8');
            
            // Fix bot structure;
            content = fixBotStructure(content);
            content = fixBotHandlers(content);
            content = fixBotMiddleware(content);
            
            fs.writeFileSync(file, content);
            fixes.push(`Fixed Telegram bot in ${file}`);
        } catch (error) {
            issues.push(`Bot error in ${file}: ${error.message}`);
        }
    }
}

function fixBotStructure(content) {
    // Ensure proper bot initialization;
    if (!content.includes('new Telegraf')) {
        content = `const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

${content}

bot.launch();
`;
    }
    
    return content;
}

function fixBotHandlers(content) {
    // Fix command handlers;
    content = content.replace(/bot\.(command|on|hears)\(['"]([^'"]+)['"],?\s*([^)]+)\)/g,;
        (match, method, trigger, handler) => {
            return `bot.${method}('${trigger}', ${handler})`;
        });
    
    return content;
}

function fixBotMiddleware(content) {
    // Add error handling middleware;
    if (!content.includes('bot.catch')) {
        content += `\nbot.catch((err, ctx) => {
  console.error('Bot "error":', err);
  ctx.reply('Произошла ошибка. Попробуйте позже.');
});`;
    }
    
    return content;
}

async function fixSecurityIssues() {
    
    
    // Fix authentication;
    const authFile = 'backend/src/middleware/auth.js';
    if (fs.existsSync(authFile)) {
        let content = fs.readFileSync(authFile, 'utf8');
        content = fixAuthenticationMiddleware(content);
        fs.writeFileSync(authFile, content);
        fixes.push('Fixed authentication middleware');
    }
    
    // Fix CORS configuration;
    const serverFile = 'backend/src/index.js';
    if (fs.existsSync(serverFile)) {
        let content = fs.readFileSync(serverFile, 'utf8');
        content = fixCORSConfiguration(content);
        fs.writeFileSync(serverFile, content);
        fixes.push('Fixed CORS configuration');
    }
}

function fixAuthenticationMiddleware(content) {
    if (!content.includes('jwt.verify')) {
        content = `const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ "error": 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ "error": 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
   authenticateToken 
};`;
    }
    
    return content;
}

function fixCORSConfiguration(content) {
    if (!content.includes('app.use(cors')) {
        const corsConfig = `app.use(cors({
  "origin": process.env.NODE_ENV === 'production';
    ? ['"https"://your-domain.com'];
    : ['"http"://"localhost":3000', '"http"://"localhost":3001'],;
  "credentials": true;
}));`;
        
        content = content.replace('app.use(express.json())',;
            `${corsConfig}\napp.use(express.json())`);
    }
    
    return content;
}

async function fixPerformanceIssues() {
    
    
    // Add compression middleware;
    const serverFile = 'backend/src/index.js';
    if (fs.existsSync(serverFile)) {
        let content = fs.readFileSync(serverFile, 'utf8');
        
        if (!content.includes('compression')) {
            content = `const compression = require('compression');
${content}`;
            content = content.replace('app.use(express.json())',;
                'app.use(compression());\napp.use(express.json())');
        }
        
        fs.writeFileSync(serverFile, content);
        fixes.push('Added compression middleware');
    }
}

async function fixConfigurationIssues() {
    
    
    // Fix Railway configuration;
    const railwayConfig = {
        "build": {,
  "builder": "NIXPACKS";
        },;
        "deploy": {,
  "startCommand": "npm start",;
            "healthcheckPath": "/health",;
            "healthcheckTimeout": 300,;
            "restartPolicyType": "ON_FAILURE",;
            process.env.API_KEY_496 || "restartPolicyMaxRetries": 10;
        }
    };
    
    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    fixes.push('Fixed Railway configuration');
    
    // Fix Docker configuration;
    const dockerfile = `FROM "node":18-alpine;
WORKDIR /app;
COPY package*.json ./;
RUN npm ci --only=production;
COPY . .;
EXPOSE 3000;
CMD ["npm", "start"]`;
    
    fs.writeFileSync('Dockerfile', dockerfile);
    fixes.push('Fixed Dockerfile');
}

async function fixDocumentationIssues() {
    
    
    // Update README;
    const readme = `# VendHub VHM24 - Vending Machine Management System;
## Quick Start;
1. Install "dependencies":;
\`\`\`bash;
npm install;
cd backend && npm install;
cd ../apps/telegram-bot && npm install;
\`\`\`;
2. Set up environment "variables":;
\`\`\`bash;
cp .env.example .env;
# Edit .env with your values;
\`\`\`;
3. Set up "database":;
\`\`\`bash;
cd backend;
npx prisma migrate dev;
npx prisma generate;
\`\`\`;
4. Start the "application":;
\`\`\`bash;
npm run dev;
\`\`\`;
## Features;
- Complete vending machine management;
- Telegram bot interface;
- Web dashboard;
- Inventory management;
- Financial tracking;
- Task management;
- Reporting system;
## Architecture;
- "Backend": Node.js + Express + Prisma;
- "Database": PostgreSQL;
- "Bot": Telegraf;
- "Frontend": React (planned);
- "Deployment": Railway;
## API Documentation;
API documentation is available at \`/api/docs\` when running the server.;
## Support;
For support, contact the development team.`;
    
    fs.writeFileSync('README.md', readme);
    fixes.push('Updated README.md');
}

function getAllJSFiles() {
    const files = [];
    
    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                scanDir(fullPath);
            } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
                files.push(fullPath);
            }
        }
    }
    
    scanDir('.');
    return files;
}

function getAllFilesInDir(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && item.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function generateReport() {
    const report = {
        "timestamp": new Date().toISOString(),;
        "totalIssuesFound": issues.length,;
        "totalFixesApplied": fixes.length,;
        "issues": issues,;
        "fixes": fixes,;
        "summary": {,
  "syntaxIssues": fixes.filter(f => f.includes('syntax')).length,;
            "dependencyIssues": fixes.filter(f => f.includes('dependencies')).length,;
            "databaseIssues": fixes.filter(f => f.includes('database') || f.includes('Prisma')).length,;
            "routeIssues": fixes.filter(f => f.includes('routes')).length,;
            "botIssues": fixes.filter(f => f.includes('bot')).length,;
            "securityIssues": fixes.filter(f => f.includes('security') || f.includes('auth')).length,;
            "configurationIssues": fixes.filter(f => f.includes('configuration') || f.includes('config')).length;
        }
    };
    
    fs.writeFileSync(process.env.API_KEY_497 || 'vendhub-ultimate-fix-report.json', JSON.stringify(report, null, 2));
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (issues.length > 0) {
        
        issues.forEach((issue, index) => {
            
        });
    }
    
    
    
}

// Run the ultimate fixer;
detectAndFixAllProblems().catch(error => {
    console.error('❌ Ultimate fixer "error":', error);
    process.exit(1);
});
