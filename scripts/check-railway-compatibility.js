const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка совместимости с Railway...\n');

const checks = {
  'Monorepo structure': checkMonorepoStructure(),
  'Package.json in root': fs.existsSync('package.json'),
  'Start scripts': checkStartScripts(),
  'Port configuration': checkPortConfig(),
  'Database compatibility': checkDatabase(),
  'File storage': checkFileStorage(),
  'Environment variables': checkEnvVars(),
  'Docker configuration': checkDockerConfig(),
  'Service dependencies': checkServiceDependencies()
};

function checkMonorepoStructure() {
  return fs.existsSync('services') && fs.existsSync('packages');
}

function checkStartScripts() {
  try {
    const services = fs.readdirSync('services');
    let allHaveScripts = true;
    const serviceScripts = {};
    
    services.forEach(service => {
      const pkgPath = path.join('services', service, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const hasStart = pkg.scripts && (pkg.scripts.start || pkg.scripts.dev);
        serviceScripts[service] = hasStart;
        if (!hasStart) allHaveScripts = false;
      } else {
        serviceScripts[service] = false;
        allHaveScripts = false;
      }
    });
    
    console.log('📦 Service start scripts:');
    Object.entries(serviceScripts).forEach(([service, hasScript]) => {
      console.log(`  ${hasScript ? '✅' : '❌'} ${service}`);
    });
    
    return allHaveScripts;
  } catch (error) {
    console.error('Error checking start scripts:', error.message);
    return false;
  }
}

function checkPortConfig() {
  try {
    const services = fs.readdirSync('services');
    const portIssues = [];
    
    services.forEach(service => {
      const indexPath = path.join('services', service, 'src', 'index.js');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Проверяем на hardcoded порты
        if (content.includes('const PORT =') && !content.includes('process.env.PORT')) {
          portIssues.push(`${service}: hardcoded port detected`);
        }
      }
    });
    
    if (portIssues.length > 0) {
      console.log('⚠️ Port configuration issues:');
      portIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return portIssues.length === 0;
  } catch (error) {
    console.error('Error checking port config:', error.message);
    return false;
  }
}

function checkDatabase() {
  const hasEnv = fs.existsSync('.env');
  const hasPrisma = fs.existsSync('packages/database/prisma/schema.prisma');
  
  if (hasEnv) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL');
    
    console.log('🗄️ Database configuration:');
    console.log(`  ${hasDatabaseUrl ? '✅' : '❌'} DATABASE_URL found`);
    console.log(`  ${hasPrisma ? '✅' : '❌'} Prisma schema exists`);
    
    return hasDatabaseUrl && hasPrisma;
  }
  
  return false;
}

function checkFileStorage() {
  // MinIO не будет работать на Railway - нужен внешний S3
  const hasMinIO = fs.existsSync('docker-compose.yml') && 
    fs.readFileSync('docker-compose.yml', 'utf8').includes('minio');
  
  const hasS3Adapter = fs.existsSync('packages/shared/storage') ||
    fs.existsSync('packages/shared/utils') && 
    fs.readFileSync('packages/shared/utils/index.js', 'utf8').includes('s3');
  
  console.log('📁 File storage:');
  console.log(`  ${hasMinIO ? '⚠️' : '✅'} MinIO detected (needs S3 replacement)`);
  console.log(`  ${hasS3Adapter ? '✅' : '❌'} S3 adapter available`);
  
  return !hasMinIO || hasS3Adapter;
}

function checkEnvVars() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL'
  ];
  
  const optional = [
    'TELEGRAM_BOT_TOKEN',
    'S3_BUCKET',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY'
  ];
  
  if (!fs.existsSync('.env')) {
    console.log('❌ .env file not found');
    return false;
  }
  
  const env = fs.readFileSync('.env', 'utf8');
  const missing = required.filter(v => !env.includes(v));
  const missingOptional = optional.filter(v => !env.includes(v));
  
  console.log('🔐 Environment variables:');
  required.forEach(v => {
    console.log(`  ${env.includes(v) ? '✅' : '❌'} ${v} (required)`);
  });
  
  optional.forEach(v => {
    console.log(`  ${env.includes(v) ? '✅' : '⚠️'} ${v} (optional)`);
  });
  
  return missing.length === 0;
}

function checkDockerConfig() {
  const hasDockerCompose = fs.existsSync('docker-compose.yml');
  const hasDockerfile = fs.existsSync('Dockerfile');
  
  console.log('🐳 Docker configuration:');
  console.log(`  ${hasDockerCompose ? '✅' : '❌'} docker-compose.yml`);
  console.log(`  ${hasDockerfile ? '✅' : '❌'} Dockerfile`);
  
  return hasDockerCompose;
}

function checkServiceDependencies() {
  try {
    const services = fs.readdirSync('services');
    const dependencyIssues = [];
    
    services.forEach(service => {
      const pkgPath = path.join('services', service, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        
        // Проверяем на устаревшие зависимости
        if (pkg.dependencies) {
          Object.entries(pkg.dependencies).forEach(([dep, version]) => {
            if (version.includes('^0.') || version.includes('~0.')) {
              dependencyIssues.push(`${service}: ${dep}@${version} (potentially unstable)`);
            }
          });
        }
      }
    });
    
    if (dependencyIssues.length > 0) {
      console.log('⚠️ Dependency issues:');
      dependencyIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return dependencyIssues.length === 0;
  } catch (error) {
    console.error('Error checking dependencies:', error.message);
    return false;
  }
}

// Вывод результатов
console.log('\n📊 Railway Compatibility Report:');
console.log('================================');

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

// Подсчет совместимости
const passedChecks = Object.values(checks).filter(Boolean).length;
const totalChecks = Object.keys(checks).length;
const compatibilityScore = Math.round((passedChecks / totalChecks) * 100);

console.log(`\n🎯 Compatibility Score: ${compatibilityScore}%`);

if (compatibilityScore >= 80) {
  console.log('✅ Project is ready for Railway deployment with minor fixes');
} else if (compatibilityScore >= 60) {
  console.log('⚠️ Project needs moderate changes for Railway deployment');
} else {
  console.log('❌ Project needs significant changes for Railway deployment');
}

// Сохранение результатов
const report = {
  timestamp: new Date().toISOString(),
  compatibilityScore,
  checks,
  recommendations: generateRecommendations(checks)
};

fs.writeFileSync('railway-compatibility-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to: railway-compatibility-report.json');

function generateRecommendations(checks) {
  const recommendations = [];
  
  if (!checks['Port configuration']) {
    recommendations.push('Fix hardcoded ports to use process.env.PORT');
  }
  
  if (!checks['File storage']) {
    recommendations.push('Replace MinIO with external S3 service');
  }
  
  if (!checks['Environment variables']) {
    recommendations.push('Add missing environment variables');
  }
  
  if (!checks['Start scripts']) {
    recommendations.push('Add start scripts to all services');
  }
  
  return recommendations;
}
