/**
 * VHM24 - Start Web Dashboard
 * Запуск веб-дашборда
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function startDashboard() {
  const dashboardPath = path.join(__dirname, 'apps', 'web-dashboard');
  
  // Проверяем существование директории
  if (!fs.existsSync(dashboardPath)) {
    log('❌ Web dashboard directory not found', 'error');
    return false;
  }

  // Проверяем package.json
  const packageJsonPath = path.join(dashboardPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found in web dashboard', 'error');
    return false;
  }

  // Проверяем node_modules
  const nodeModulesPath = path.join(dashboardPath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️  node_modules not found, installing dependencies...', 'warning');
    
    // Устанавливаем зависимости
    const installProcess = spawn('npm', ['install'], {
      cwd: dashboardPath,
      stdio: 'inherit'
    });

    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          log('✅ Dependencies installed successfully', 'success');
          resolve();
        } else {
          log('❌ Failed to install dependencies', 'error');
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  log('🚀 Starting web dashboard...', 'info');

  // Запускаем dev сервер
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: dashboardPath,
    stdio: 'inherit'
  });

  devProcess.on('error', (error) => {
    log(`❌ Failed to start dashboard: ${error.message}`, 'error');
  });

  // Обработка завершения
  process.on('SIGINT', () => {
    log('\n🛑 Stopping dashboard...', 'warning');
    devProcess.kill('SIGTERM');
    process.exit(0);
  });

  return true;
}

if (require.main === module) {
  startDashboard().catch(error => {
    log(`❌ Failed to start dashboard: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { startDashboard };
