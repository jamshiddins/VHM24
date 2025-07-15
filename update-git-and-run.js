/**
 * Скрипт для обновления Git и запуска системы VendHub
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    throw error;
  }
}

// Функция для обновления Git
async function updateGit() {
  log('=== ОБНОВЛЕНИЕ GIT ===', 'title');
  
  try {
    // Проверка наличия .git директории
    if (!fs.existsSync(path.join(__dirname, '.git'))) {
      log('❌ Директория .git не найдена. Это не Git-репозиторий.', 'error');
      return false;
    }
    
    // Получение текущей ветки
    const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD');
    log(`Текущая ветка: ${currentBranch}`, 'info');
    
    // Проверка наличия изменений
    const status = executeCommand('git status --porcelain');
    if (status) {
      log('⚠️ В репозитории есть незакоммиченные изменения:', 'warning');
      log(status, 'info');
      
      // Добавление всех изменений
      log('Добавление всех изменений в индекс...', 'info');
      executeCommand('git add .');
      
      // Создание коммита
      log('Создание коммита...', 'info');
      executeCommand('git commit -m "Автоматический коммит перед обновлением"');
      
      log('✅ Изменения успешно закоммичены', 'success');
    } else {
      log('✅ В репозитории нет незакоммиченных изменений', 'success');
    }
    
    // Получение информации о remote
    const remoteUrl = executeCommand('git remote get-url origin');
    log(`Remote URL: ${remoteUrl}`, 'info');
    
    // Получение последних изменений с сервера
    log('Получение последних изменений с сервера...', 'info');
    executeCommand('git fetch origin');
    
    // Проверка наличия изменений для pull
    const behindCount = executeCommand(`git rev-list --count ${currentBranch}..origin/${currentBranch}`);
    if (parseInt(behindCount) > 0) {
      log(`Ваша ветка отстает от origin/${currentBranch} на ${behindCount} коммитов`, 'warning');
      
      // Pull изменений
      log('Выполнение git pull...', 'info');
      executeCommand('git pull origin ' + currentBranch);
      
      log('✅ Изменения успешно получены с сервера', 'success');
    } else {
      log('✅ Ваша ветка синхронизирована с сервером', 'success');
    }
    
    // Проверка наличия изменений для push
    const aheadCount = executeCommand(`git rev-list --count origin/${currentBranch}..${currentBranch}`);
    if (parseInt(aheadCount) > 0) {
      log(`Ваша ветка опережает origin/${currentBranch} на ${aheadCount} коммитов`, 'warning');
      
      // Push изменений
      log('Выполнение git push...', 'info');
      executeCommand('git push origin ' + currentBranch);
      
      log('✅ Изменения успешно отправлены на сервер', 'success');
    } else {
      log('✅ Нет изменений для отправки на сервер', 'success');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка обновления Git: ${error.message}`, 'error');
    return false;
  }
}

// Функция для установки зависимостей
async function installDependencies() {
  log('=== УСТАНОВКА ЗАВИСИМОСТЕЙ ===', 'title');
  
  try {
    // Проверка наличия package.json
    if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
      log('❌ Файл package.json не найден', 'error');
      return false;
    }
    
    // Установка зависимостей
    log('Установка зависимостей для корневого проекта...', 'info');
    executeCommand('npm install');
    
    // Проверка наличия директории backend
    if (fs.existsSync(path.join(__dirname, 'backend'))) {
      // Проверка наличия package.json в backend
      if (fs.existsSync(path.join(__dirname, 'backend', 'package.json'))) {
        log('Установка зависимостей для backend...', 'info');
        executeCommand('cd backend && npm install');
      }
    }
    
    // Проверка наличия директории apps/telegram-bot
    if (fs.existsSync(path.join(__dirname, 'apps', 'telegram-bot'))) {
      // Проверка наличия package.json в apps/telegram-bot
      if (fs.existsSync(path.join(__dirname, 'apps', 'telegram-bot', 'package.json'))) {
        log('Установка зависимостей для telegram-bot...', 'info');
        executeCommand('cd apps/telegram-bot && npm install');
      }
    }
    
    log('✅ Зависимости успешно установлены', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка установки зависимостей: ${error.message}`, 'error');
    return false;
  }
}

// Функция для запуска системы
async function runSystem() {
  log('=== ЗАПУСК СИСТЕМЫ VENDHUB ===', 'title');
  
  try {
    // Проверка наличия файла run-vendhub.js
    if (fs.existsSync(path.join(__dirname, 'run-vendhub.js'))) {
      log('Запуск системы с помощью run-vendhub.js...', 'info');
      
      // Запуск системы
      const child = spawn('node', ['run-vendhub.js'], {
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
      });
      
      log('✅ Система успешно запущена', 'success');
      return true;
    } else {
      log('❌ Файл run-vendhub.js не найден', 'error');
      
      // Проверка наличия файла start-vendhub-fixed.js
      if (fs.existsSync(path.join(__dirname, 'start-vendhub-fixed.js'))) {
        log('Запуск системы с помощью start-vendhub-fixed.js...', 'info');
        
        // Запуск системы
        const child = spawn('node', ['start-vendhub-fixed.js'], {
          stdio: 'inherit',
          detached: false
        });
        
        child.on('error', (error) => {
          log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
        });
        
        log('✅ Система успешно запущена', 'success');
        return true;
      } else {
        log('❌ Файл start-vendhub-fixed.js не найден', 'error');
        
        // Проверка наличия файла start-vendhub.js
        if (fs.existsSync(path.join(__dirname, 'start-vendhub.js'))) {
          log('Запуск системы с помощью start-vendhub.js...', 'info');
          
          // Запуск системы
          const child = spawn('node', ['start-vendhub.js'], {
            stdio: 'inherit',
            detached: false
          });
          
          child.on('error', (error) => {
            log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
          });
          
          log('✅ Система успешно запущена', 'success');
          return true;
        } else {
          log('❌ Файл start-vendhub.js не найден', 'error');
          return false;
        }
      }
    }
  } catch (error) {
    log(`❌ Ошибка запуска системы: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ОБНОВЛЕНИЕ GIT И ЗАПУСК СИСТЕМЫ VENDHUB ===', 'title');
  
  try {
    // Обновление Git
    const gitUpdated = await updateGit();
    
    if (gitUpdated) {
      log('✅ Git успешно обновлен', 'success');
    } else {
      log('⚠️ Не удалось обновить Git, продолжаем без обновления', 'warning');
    }
    
    // Установка зависимостей
    const dependenciesInstalled = await installDependencies();
    
    if (dependenciesInstalled) {
      log('✅ Зависимости успешно установлены', 'success');
    } else {
      log('⚠️ Не удалось установить зависимости, продолжаем без установки', 'warning');
    }
    
    // Запуск системы
    const systemStarted = await runSystem();
    
    if (systemStarted) {
      log('✅ Система успешно запущена', 'success');
    } else {
      log('❌ Не удалось запустить систему', 'error');
    }
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
