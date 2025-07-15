#!/usr/bin/env node
/**
 * Скрипт для настройки использования внешней базы данных из DATABASE_URL
 * Запускается командой: node use-external-database.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

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

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    // Проверка наличия Railway CLI
    try {
      const help = executeCommand('railway --help');
      log(`✅ Railway CLI установлен`, 'success');
      return true;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    log('❌ Railway CLI не установлен', 'error');
    log('Установка Railway CLI...', 'info');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      try {
        const version = executeCommand('railway version');
        log(`✅ Railway CLI успешно установлен, версия: ${version}`, 'success');
        return true;
      } catch (error) {
        try {
          const version = executeCommand('railway.exe version');
          log(`✅ Railway CLI успешно установлен, версия: ${version}`, 'success');
          return true;
        } catch (exeError) {
          throw error;
        }
      }
    } catch (installError) {
      log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
      log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
      return false;
    }
  }
}

// Функция для входа в Railway
async function loginToRailway() {
  try {
    // Проверка, авторизован ли пользователь
    try {
      const whoami = executeCommand('railway whoami');
      log(`✅ Вы уже авторизованы в Railway как: ${whoami}`, 'success');
      return true;
    } catch (error) {
      // Пользователь не авторизован, выполняем вход
      log('Вы не авторизованы в Railway, выполняем вход...', 'warning');
      
      log('Для входа в Railway откроется браузер. Пожалуйста, авторизуйтесь в браузере.', 'info');
      try {
        executeCommand('railway login');
      } catch (error) {
        throw error;
      }
      
      // Проверка успешности входа
      try {
        const whoami = executeCommand('railway whoami');
        log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
        return true;
      } catch (error) {
        log(`❌ Не удалось авторизоваться в Railway: ${error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Ошибка при входе в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки наличия проекта
async function checkProject() {
  try {
    // Проверка наличия существующего проекта
    try {
      const currentProject = executeCommand('railway link');
      log(`✅ Текущий проект Railway: ${currentProject}`, 'success');
      return currentProject;
    } catch (error) {
      log('❌ Проект не выбран', 'error');
      
      // Запрос у пользователя, хочет ли он выбрать проект
      return new Promise((resolve) => {
        rl.question('Хотите выбрать проект? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            // Выбор проекта
            try {
              executeCommand('railway link');
            } catch (error) {
              console.error(`❌ Не удалось выбрать проект: ${error.message}`);
              resolve(null);
              return;
            }
            
            // Проверка выбора проекта
            try {
              const currentProject = executeCommand('railway link');
              log(`✅ Выбран проект Railway: ${currentProject}`, 'success');
              resolve(currentProject);
            } catch (error) {
              console.error(`❌ Не удалось получить информацию о проекте: ${error.message}`);
              resolve(null);
            }
          } else {
            log('Выбор проекта отменен', 'warning');
            resolve(null);
          }
        });
      });
    }
  } catch (error) {
    log(`❌ Ошибка при проверке проекта: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения переменных окружения из Railway
async function getRailwayVariables() {
  try {
    // Получение переменных окружения из Railway
    const variables = executeCommand('railway variables');
    
    if (!variables) {
      log('❌ Не удалось получить переменные окружения из Railway', 'error');
      return null;
    }
    
    // Парсинг переменных окружения
    const variablesMap = {};
    const lines = variables.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const [key, value] = line.split('=');
        if (key && value) {
          variablesMap[key.trim()] = value.trim();
        }
      }
    }
    
    return variablesMap;
  } catch (error) {
    log(`❌ Ошибка при получении переменных окружения из Railway: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения информации о PostgreSQL
async function getPostgresInfo() {
  try {
    // Получение информации о PostgreSQL
    const postgresInfo = executeCommand('railway service show postgresql');
    
    if (!postgresInfo) {
      log('❌ Не удалось получить информацию о PostgreSQL', 'error');
      return null;
    }
    
    return postgresInfo;
  } catch (error) {
    log(`❌ Ошибка при получении информации о PostgreSQL: ${error.message}`, 'error');
    return null;
  }
}

// Функция для установки переменной окружения в Railway
async function setRailwayVariable(key, value) {
  try {
    // Установка переменной окружения в Railway
    executeCommand(`railway variables set ${key} ${value}`);
    
    log(`✅ Переменная ${key} успешно установлена`, 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при установке переменной ${key}: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания PostgreSQL
async function createPostgres() {
  try {
    // Создание PostgreSQL
    executeCommand('railway add');
    
    log('✅ PostgreSQL успешно создан', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при создании PostgreSQL: ${error.message}`, 'error');
    return false;
  }
}

// Функция для настройки использования внешней базы данных
async function setupExternalDatabase() {
  try {
    // Получение переменных окружения из Railway
    const variables = await getRailwayVariables();
    
    if (!variables) {
      log('❌ Не удалось получить переменные окружения из Railway', 'error');
      return false;
    }
    
    // Проверка наличия переменной DATABASE_URL
    if (!variables.DATABASE_URL) {
      log('❌ Переменная DATABASE_URL не установлена', 'error');
      
      // Получение информации о PostgreSQL
      const postgresInfo = await getPostgresInfo();
      
      if (postgresInfo) {
        // Парсинг информации о PostgreSQL
        const postgresUrlMatch = postgresInfo.match(/DATABASE_URL=([^\s]+)/);
        
        if (postgresUrlMatch && postgresUrlMatch[1]) {
          const postgresUrl = postgresUrlMatch[1];
          
          // Установка переменной DATABASE_URL
          await setRailwayVariable('DATABASE_URL', postgresUrl);
        } else {
          log('❌ Не удалось получить URL PostgreSQL', 'error');
          
          // Запрос у пользователя, хочет ли он создать PostgreSQL
          await new Promise((resolve) => {
            rl.question('Хотите создать PostgreSQL? (y/n): ', async (answer) => {
              if (answer.toLowerCase() === 'y') {
                const postgresCreated = await createPostgres();
                
                if (!postgresCreated) {
                  log('❌ Не удалось создать PostgreSQL', 'error');
                  resolve(false);
                  return;
                }
                
                // Получение информации о PostgreSQL
                const newPostgresInfo = await getPostgresInfo();
                
                if (newPostgresInfo) {
                  // Парсинг информации о PostgreSQL
                  const newPostgresUrlMatch = newPostgresInfo.match(/DATABASE_URL=([^\s]+)/);
                  
                  if (newPostgresUrlMatch && newPostgresUrlMatch[1]) {
                    const newPostgresUrl = newPostgresUrlMatch[1];
                    
                    // Установка переменной DATABASE_URL
                    await setRailwayVariable('DATABASE_URL', newPostgresUrl);
                  } else {
                    log('❌ Не удалось получить URL PostgreSQL', 'error');
                    resolve(false);
                    return;
                  }
                } else {
                  log('❌ Не удалось получить информацию о PostgreSQL', 'error');
                  resolve(false);
                  return;
                }
              } else {
                // Запрос у пользователя URL внешней базы данных
                rl.question('Введите URL внешней базы данных: ', async (answer) => {
                  if (answer.trim()) {
                    // Установка переменной DATABASE_URL
                    await setRailwayVariable('DATABASE_URL', answer.trim());
                  } else {
                    log('❌ URL внешней базы данных не введен', 'error');
                    resolve(false);
                    return;
                  }
                  
                  resolve(true);
                });
              }
              
              resolve(true);
            });
          });
        }
      } else {
        // Запрос у пользователя URL внешней базы данных
        await new Promise((resolve) => {
          rl.question('Введите URL внешней базы данных: ', async (answer) => {
            if (answer.trim()) {
              // Установка переменной DATABASE_URL
              await setRailwayVariable('DATABASE_URL', answer.trim());
            } else {
              log('❌ URL внешней базы данных не введен', 'error');
              resolve(false);
              return;
            }
            
            resolve(true);
          });
        });
      }
    } else {
      log(`✅ Переменная DATABASE_URL установлена: ${variables.DATABASE_URL}`, 'success');
    }
    
    // Обновление docker-compose.yml
    const dockerComposeFile = path.join(__dirname, 'docker-compose.yml');
    
    if (fs.existsSync(dockerComposeFile)) {
      let dockerComposeContent = fs.readFileSync(dockerComposeFile, 'utf8');
      
      // Удаление локального PostgreSQL сервиса
      dockerComposeContent = dockerComposeContent.replace(/\s+# База данных PostgreSQL\s+db:[\s\S]+?(?=\s+# Redis|$)/m, '\n  # Внешняя база данных PostgreSQL используется из DATABASE_URL\n');
      
      // Обновление зависимостей сервисов
      dockerComposeContent = dockerComposeContent.replace(/depends_on:[\s\S]+?- db[\s\S]+?- redis/gm, 'depends_on:\n      - redis');
      
      // Обновление переменных окружения
      dockerComposeContent = dockerComposeContent.replace(/DATABASE_URL=postgresql:\/\/\$\{DB_USER\}:\$\{DB_PASSWORD\}@db:5432\/\$\{DB_NAME\}/g, 'DATABASE_URL=${DATABASE_URL}');
      
      // Обновление volumes
      dockerComposeContent = dockerComposeContent.replace(/volumes:[\s\S]+?postgres_data:[\s\S]+?redis_data:/gm, 'volumes:\n  redis_data:');
      
      // Запись обновленного содержимого
      fs.writeFileSync(dockerComposeFile, dockerComposeContent);
      
      log('✅ Файл docker-compose.yml успешно обновлен', 'success');
    } else {
      log('⚠️ Файл docker-compose.yml не найден', 'warning');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке использования внешней базы данных: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== НАСТРОЙКА ИСПОЛЬЗОВАНИЯ ВНЕШНЕЙ БАЗЫ ДАННЫХ ===', 'title');
  
  try {
    // Проверка наличия Railway CLI
    const railwayCLIInstalled = checkRailwayCLI();
    
    if (!railwayCLIInstalled) {
      log('❌ Не удалось установить Railway CLI', 'error');
      rl.close();
      return;
    }
    
    // Вход в Railway
    const loggedIn = await loginToRailway();
    
    if (!loggedIn) {
      log('❌ Не удалось войти в Railway', 'error');
      rl.close();
      return;
    }
    
    // Проверка наличия проекта
    const projectName = await checkProject();
    
    if (!projectName) {
      log('❌ Не удалось выбрать проект', 'error');
      rl.close();
      return;
    }
    
    // Настройка использования внешней базы данных
    const externalDatabaseSetup = await setupExternalDatabase();
    
    if (!externalDatabaseSetup) {
      log('❌ Не удалось настроить использование внешней базы данных', 'error');
      rl.close();
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log('✅ Использование внешней базы данных успешно настроено', 'success');
    
    log('', 'info');
    log('Для перезапуска сервисов выполните команду:', 'info');
    log('railway up', 'info');
    
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
