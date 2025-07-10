const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

logger.info('🔧 Fixing Railway deployment compatibility issues...\n');

// Исправления для зависимостей
const fixes = {
  'fastify': '^4.24.3',
  '@fastify/cors': '^8.4.0',
  '@fastify/helmet': '^11.1.1',
  '@fastify/jwt': '^7.2.4',
  '@fastify/rate-limit': '^9.0.1',
  'xlsx': '^0.18.5'
};

// Зависимости для удаления из backend сервисов
const removeFromBackend = ['next'];

// Исключения - где next разрешен
const allowNext = ['apps/web-dashboard'];

let filesFixed = 0;
let issuesFixed = 0;

function fixPackageJson(filePath, serviceName = 'root') {
  if (!fs.existsSync(filePath)) return;
  
  try {
    const packageJson = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    let modified = false;
    
    logger.info(`📦 Fixing ${serviceName}...`);
    
    // Исправление dependencies
    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(name => {
        // Исправление версий
        if (fixes[name] && packageJson.dependencies[name] !== fixes[name]) {
          logger.info(`  🔧 ${name}: ${packageJson.dependencies[name]} → ${fixes[name]}`);
          packageJson.dependencies[name] = fixes[name];
          modified = true;
          issuesFixed++;
        }
        
        // Удаление ненужных зависимостей из backend сервисов
        if (removeFromBackend.includes(name) && serviceName.includes('services/')) {
          logger.info(`  🗑️  Removing ${name} from backend service`);
          delete packageJson.dependencies[name];
          modified = true;
          issuesFixed++;
        }
      });
    }
    
    // Исправление devDependencies
    if (packageJson.devDependencies) {
      Object.keys(packageJson.devDependencies).forEach(name => {
        // Исправление версий
        if (fixes[name] && packageJson.devDependencies[name] !== fixes[name]) {
          logger.info(`  🔧 ${name}: ${packageJson.devDependencies[name]} → ${fixes[name]}`);
          packageJson.devDependencies[name] = fixes[name];
          modified = true;
          issuesFixed++;
        }
        
        // Удаление ненужных зависимостей из backend сервисов
        if (removeFromBackend.includes(name) && serviceName.includes('services/')) {
          logger.info(`  🗑️  Removing ${name} from backend service`);
          delete packageJson.devDependencies[name];
          modified = true;
          issuesFixed++;
        }
      });
    }
    
    if (modified) {
      await fsPromises.writeFile(filePath, JSON.stringify(packageJson, null, 2) + '\n');
      filesFixed++;
      logger.info(`  ✅ Fixed and saved`);
    } else {
      logger.info(`  ✅ No issues found`);
    }
    
    logger.info('');
    
  } catch (error) {
    logger.info(`  ❌ Error fixing ${filePath}: ${error.message}\n`);
  }
}

// Исправление основного package.json
fixPackageJson('./package.json', 'root');

// Исправление всех сервисов
const servicesDir = './services';
if (fs.existsSync(servicesDir)) {
  const services = fs.readdirSync(servicesDir);
  
  services.forEach(service => {
    const servicePath = path.join(servicesDir, service);
    const packagePath = path.join(servicePath, 'package.json');
    
    if (fs.statSync(servicePath).isDirectory()) {
      fixPackageJson(packagePath, `services/${service}`);
    }
  });
}

// Исправление приложений (но оставляем next в web-dashboard)
const appsDir = './apps';
if (fs.existsSync(appsDir)) {
  const apps = fs.readdirSync(appsDir);
  
  apps.forEach(app => {
    const appPath = path.join(appsDir, app);
    const packagePath = path.join(appPath, 'package.json');
    
    if (fs.statSync(appPath).isDirectory()) {
      // Для web-dashboard не удаляем next
      if (app === 'web-dashboard') {
        // Только исправляем версии, но не удаляем next
        if (fs.existsSync(packagePath)) {
          try {
            const packageJson = JSON.parse(await fsPromises.readFile(packagePath, 'utf8'));
            let modified = false;
            
            logger.info(`📦 Fixing apps/${app}...`);
            
            // Исправляем только версии, не удаляем next
            ['dependencies', 'devDependencies'].forEach(depType => {
              if (packageJson[depType]) {
                Object.keys(packageJson[depType]).forEach(name => {
                  if (fixes[name] && packageJson[depType][name] !== fixes[name]) {
                    logger.info(`  🔧 ${name}: ${packageJson[depType][name]} → ${fixes[name]}`);
                    packageJson[depType][name] = fixes[name];
                    modified = true;
                    issuesFixed++;
                  }
                });
              }
            });
            
            if (modified) {
              await fsPromises.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
              filesFixed++;
              logger.info(`  ✅ Fixed and saved`);
            } else {
              logger.info(`  ✅ No issues found`);
            }
            
            logger.info('');
            
          } catch (error) {
            logger.info(`  ❌ Error fixing ${packagePath}: ${error.message}\n`);
          }
        }
      } else {
        fixPackageJson(packagePath, `apps/${app}`);
      }
    }
  });
}

// Исправление пакетов
const packagesDir = './packages';
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir);
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    const packagePath = path.join(pkgPath, 'package.json');
    
    if (fs.statSync(pkgPath).isDirectory()) {
      fixPackageJson(packagePath, `packages/${pkg}`);
    }
  });
}

// Итоговый отчёт
logger.info('=' .repeat(50));
logger.info(`📊 SUMMARY:`);
logger.info(`   Files fixed: ${filesFixed}`);
logger.info(`   Issues fixed: ${issuesFixed}`);

if (issuesFixed > 0) {
  logger.info(`   ✅ Fixed ${issuesFixed} compatibility issues!`);
  logger.info(`   🚀 Project is now Railway deployment ready`);
} else {
  logger.info(`   ✅ No issues found - project is already Railway compatible!`);
}
