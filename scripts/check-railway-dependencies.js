const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

logger.info('🔍 Checking Railway deployment compatibility...\n');

// Проблемные зависимости и их исправления
const knownIssues = {
  'xlsx': {
    problematic: ['^0.20.0', '^0.19.0'],
    recommended: '^0.18.5',
    reason: 'Version 0.20.0+ not available in npm registry'
  },
  'fastify': {
    problematic: ['^5.0.0', '^5.4.0'],
    recommended: '^4.24.3',
    reason: 'Plugin compatibility issues with v5'
  },
  '@fastify/cors': {
    problematic: ['^11.0.0'],
    recommended: '^8.4.0',
    reason: 'Requires fastify v4 compatibility'
  },
  '@fastify/helmet': {
    problematic: ['^13.0.0'],
    recommended: '^11.1.1',
    reason: 'Requires fastify v4 compatibility'
  },
  '@fastify/jwt': {
    problematic: ['^9.0.0'],
    recommended: '^7.2.4',
    reason: 'Requires fastify v4 compatibility'
  },
  '@fastify/rate-limit': {
    problematic: ['^10.0.0'],
    recommended: '^9.0.1',
    reason: 'Requires fastify v4 compatibility'
  },
  'next': {
    problematic: ['*'],
    recommended: 'remove',
    reason: 'Not needed in backend services',
    allowedIn: ['apps/web-dashboard']
  }
};

// Ненужные зависимости для backend сервисов
const backendUnnecessary = ['next', 'react', 'react-dom', '@types/react'];

let issuesFound = 0;
let servicesChecked = 0;

// Функция для проверки версии
function isProblematicVersion(packageName, version, issues) {
  if (!issues[packageName]) return false;
  
  const problematic = issues[packageName].problematic;
  return problematic.some(prob => {
    if (prob === '*') return true;
    if (prob === version) return true;
    if (prob.startsWith('^') && version.startsWith('^')) {
      return prob === version;
    }
    return false;
  });
}

// Функция для проверки package.json
function checkPackageJson(filePath, serviceName = 'root') {
  if (!fs.existsSync(filePath)) return;
  
  try {
    const packageJson = JSON.parse(fs.await fsPromises.readFile(filePath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    logger.info(`📦 Checking ${serviceName}...`);
    servicesChecked++;
    
    let serviceIssues = 0;
    
    Object.entries(dependencies).forEach(([name, version]) => {
      // Проверка проблемных версий
      if (isProblematicVersion(name, version, knownIssues)) {
        const issue = knownIssues[name];
        
        // Проверка исключений
        if (issue.allowedIn && issue.allowedIn.some(allowed => filePath.replace(/\\/g, '/').includes(allowed))) {
          return; // Разрешено в этом контексте
        }
        
        logger.info(`  ❌ ${name}: ${version}`);
        logger.info(`     Issue: ${issue.reason}`);
        logger.info(`     Fix: Use ${issue.recommended}`);
        issuesFound++;
        serviceIssues++;
      }
      
      // Проверка ненужных зависимостей в backend сервисах
      if (serviceName.includes('services/') && backendUnnecessary.includes(name)) {
        logger.info(`  ⚠️  ${name}: ${version}`);
        logger.info(`     Warning: Unnecessary for backend service`);
        logger.info(`     Fix: Remove this dependency`);
        issuesFound++;
        serviceIssues++;
      }
    });
    
    if (serviceIssues === 0) {
      logger.info(`  ✅ No issues found`);
    }
    
    logger.info('');
    
  } catch (error) {
    logger.info(`  ❌ Error reading ${filePath}: ${error.message}\n`);
  }
}

// Проверка основного package.json
checkPackageJson('./package.json', 'root');

// Проверка всех сервисов
const servicesDir = './services';
if (fs.existsSync(servicesDir)) {
  const services = fs.readdirSync(servicesDir);
  
  services.forEach(service => {
    const servicePath = path.join(servicesDir, service);
    const packagePath = path.join(servicePath, 'package.json');
    
    if (fs.statSync(servicePath).isDirectory()) {
      checkPackageJson(packagePath, `services/${service}`);
    }
  });
}

// Проверка приложений
const appsDir = './apps';
if (fs.existsSync(appsDir)) {
  const apps = fs.readdirSync(appsDir);
  
  apps.forEach(app => {
    const appPath = path.join(appsDir, app);
    const packagePath = path.join(appPath, 'package.json');
    
    if (fs.statSync(appPath).isDirectory()) {
      checkPackageJson(packagePath, `apps/${app}`);
    }
  });
}

// Проверка пакетов
const packagesDir = './packages';
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir);
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    const packagePath = path.join(pkgPath, 'package.json');
    
    if (fs.statSync(pkgPath).isDirectory()) {
      checkPackageJson(packagePath, `packages/${pkg}`);
    }
  });
}

// Итоговый отчёт
logger.info('=' .repeat(50));
logger.info(`📊 SUMMARY:`);
logger.info(`   Services checked: ${servicesChecked}`);
logger.info(`   Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  logger.info(`   ✅ All dependencies are Railway compatible!`);
  process.exit(0);
} else {
  logger.info(`   ❌ Found ${issuesFound} compatibility issues`);
  logger.info(`   🔧 Please fix the issues above before deploying to Railway`);
  process.exit(1);
}
