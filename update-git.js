#!/usr/bin/env node
/**
 * Скрипт для обновления Git репозитория
 * Запускается командой: npm run update:git
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Создание интерфейса для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    return null;
  }
}

// Функция для проверки статуса Git
function checkGitStatus() {
  try {
    const status = executeCommand('git status --porcelain');
    
    if (status) {
      log('Обнаружены неотслеживаемые или измененные файлы:', 'warning');
      console.log(status);
      return false;
    } else {
      log('Рабочая директория чиста', 'success');
      return true;
    }
  } catch (error) {
    log(`Ошибка при проверке статуса Git: ${error.message}`, 'error');
    return false;
  }
}

// Функция для добавления файлов в индекс
function addFiles() {
  try {
    executeCommand('git add .');
    log('Файлы добавлены в индекс', 'success');
    return true;
  } catch (error) {
    log(`Ошибка при добавлении файлов в индекс: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания коммита
async function createCommit() {
  try {
    // Запрос сообщения коммита у пользователя
    const commitMessage = await new Promise((resolve) => {
      rl.question('Введите сообщение коммита (по умолчанию: "Update VHM24 for Railway deployment"): ', (answer) => {
        resolve(answer.trim() || 'Update VHM24 for Railway deployment');
      });
    });
    
    executeCommand(`git commit -m "${commitMessage}"`);
    log(`Коммит создан с сообщением: ${commitMessage}`, 'success');
    return true;
  } catch (error) {
    log(`Ошибка при создании коммита: ${error.message}`, 'error');
    return false;
  }
}

// Функция для отправки изменений в удаленный репозиторий
async function pushChanges() {
  try {
    // Запрос ветки у пользователя
    const branch = await new Promise((resolve) => {
      rl.question('Введите имя ветки (по умолчанию: "main"): ', (answer) => {
        resolve(answer.trim() || 'main');
      });
    });
    
    executeCommand(`git push origin ${branch}`);
    log(`Изменения отправлены в удаленный репозиторий в ветку ${branch}`, 'success');
    return true;
  } catch (error) {
    log(`Ошибка при отправке изменений в удаленный репозиторий: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ОБНОВЛЕНИЕ GIT РЕПОЗИТОРИЯ ===', 'title');
  
  try {
    // Проверка статуса Git
    const isClean = checkGitStatus();
    
    if (!isClean) {
      // Запрос у пользователя, хочет ли он добавить файлы в индекс
      await new Promise((resolve) => {
        rl.question('Хотите добавить все файлы в индекс? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            const addSuccessful = addFiles();
            
            if (!addSuccessful) {
              log('❌ Не удалось добавить файлы в индекс', 'error');
              rl.close();
              process.exit(1);
            }
          } else {
            log('Добавление файлов отменено', 'warning');
            rl.close();
            process.exit(0);
          }
          
          resolve();
        });
      });
    }
    
    // Создание коммита
    const commitSuccessful = await createCommit();
    
    if (!commitSuccessful) {
      log('❌ Не удалось создать коммит', 'error');
      rl.close();
      return;
    }
    
    // Запрос у пользователя, хочет ли он отправить изменения в удаленный репозиторий
    await new Promise((resolve) => {
      rl.question('Хотите отправить изменения в удаленный репозиторий? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const pushSuccessful = await pushChanges();
          
          if (!pushSuccessful) {
            log('❌ Не удалось отправить изменения в удаленный репозиторий', 'error');
            rl.close();
            process.exit(1);
          }
        } else {
          log('Отправка изменений отменена', 'warning');
        }
        
        resolve();
      });
    });
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log('✅ Git репозиторий успешно обновлен', 'success');
    
    rl.close();
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    rl.close();
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
