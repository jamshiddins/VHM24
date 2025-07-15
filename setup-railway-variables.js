#!/usr/bin/env node
/**
 * Скрипт для настройки переменных окружения в Railway
 * Запускается командой: npm run setup:railway-variables
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Создание интерфейса для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для выполнения команды и возврата результата
function executeCommand(command) {
  try {
    console.log(`Выполнение команды: ${command}`);
    const result = execSync(command, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error(`Ошибка выполнения команды: ${error.message}`);
    if (error.stdout) console.error(`Вывод stdout: ${error.stdout}`);
    if (error.stderr) console.error(`Вывод stderr: ${error.stderr}`);
    return null;
  }
}

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    // В Windows команда railway может быть доступна как railway.exe
    try {
      const version = executeCommand('railway version');
      console.log(`✅ Railway CLI установлен, версия: ${version}`);
      return true;
    } catch (error) {
      // Пробуем с .exe
      try {
        const version = executeCommand('railway.exe version');
        console.log(`✅ Railway CLI установлен, версия: ${version}`);
        return true;
      } catch (exeError) {
        throw error; // Если обе команды не работают, выбрасываем исходную ошибку
      }
    }
  } catch (error) {
    console.error('❌ Railway CLI не установлен');
    console.log('Установка Railway CLI...');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      try {
        const version = executeCommand('railway version');
        console.log(`✅ Railway CLI успешно установлен, версия: ${version}`);
        return true;
      } catch (error) {
        try {
          const version = executeCommand('railway.exe version');
          console.log(`✅ Railway CLI успешно установлен, версия: ${version}`);
          return true;
        } catch (exeError) {
          throw error;
        }
      }
    } catch (installError) {
      console.error(`❌ Не удалось установить Railway CLI: ${installError.message}`);
      console.log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli');
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
      console.log(`✅ Вы уже авторизованы в Railway как: ${whoami}`);
      return true;
    } catch (error) {
      // Пробуем с .exe
      try {
        const whoami = executeCommand('railway.exe whoami');
        console.log(`✅ Вы уже авторизованы в Railway как: ${whoami}`);
        return true;
      } catch (exeError) {
        // Пользователь не авторизован, выполняем вход
        console.log('Вы не авторизованы в Railway, выполняем вход...');
        
        console.log('Для входа в Railway откроется браузер. Пожалуйста, авторизуйтесь в браузере.');
        try {
          executeCommand('railway login');
        } catch (error) {
          try {
            executeCommand('railway.exe login');
          } catch (exeError) {
            throw error;
          }
        }
        
        // Проверка успешности входа
        try {
          const whoami = executeCommand('railway whoami');
          console.log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`);
          return true;
        } catch (error) {
          try {
            const whoami = executeCommand('railway.exe whoami');
            console.log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`);
            return true;
          } catch (exeError) {
            console.error(`❌ Не удалось авторизоваться в Railway: ${error.message}`);
            return false;
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка при входе в Railway: ${error.message}`);
    return false;
  }
}

// Функция для проверки наличия проекта
async function checkProject() {
  try {
    // Проверка наличия существующего проекта
    try {
      const currentProject = executeCommand('railway project');
      console.log(`✅ Текущий проект Railway: ${currentProject}`);
      return currentProject;
    } catch (error) {
      try {
        const currentProject = executeCommand('railway.exe project');
        console.log(`✅ Текущий проект Railway: ${currentProject}`);
        return currentProject;
      } catch (exeError) {
        console.log('❌ Проект не выбран');
        
        // Запрос у пользователя, хочет ли он создать новый проект или выбрать существующий
        return new Promise((resolve) => {
          rl.question('Хотите создать новый проект? (y/n): ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
              // Создание нового проекта
              const projectName = 'vhm24-' + Math.floor(Date.now() / 1000);
              try {
                executeCommand(`railway project create ${projectName}`);
              } catch (error) {
                try {
                  executeCommand(`railway.exe project create ${projectName}`);
                } catch (exeError) {
                  console.error(`❌ Не удалось создать проект: ${error.message}`);
                  resolve(null);
                  return;
                }
              }
              
              // Проверка создания проекта
              try {
                const currentProject = executeCommand('railway project');
                console.log(`✅ Создан новый проект Railway: ${currentProject}`);
                resolve(currentProject);
              } catch (error) {
                try {
                  const currentProject = executeCommand('railway.exe project');
                  console.log(`✅ Создан новый проект Railway: ${currentProject}`);
                  resolve(currentProject);
                } catch (exeError) {
                  console.error(`❌ Не удалось получить информацию о проекте: ${error.message}`);
                  resolve(null);
                }
              }
            } else {
              // Выбор существующего проекта
              try {
                executeCommand('railway project');
              } catch (error) {
                try {
                  executeCommand('railway.exe project');
                } catch (exeError) {
                  console.error(`❌ Не удалось выбрать проект: ${error.message}`);
                  resolve(null);
                  return;
                }
              }
              
              // Проверка выбора проекта
              try {
                const currentProject = executeCommand('railway project');
                console.log(`✅ Выбран проект Railway: ${currentProject}`);
                resolve(currentProject);
              } catch (error) {
                try {
                  const currentProject = executeCommand('railway.exe project');
                  console.log(`✅ Выбран проект Railway: ${currentProject}`);
                  resolve(currentProject);
                } catch (exeError) {
                  console.error(`❌ Не удалось получить информацию о проекте: ${error.message}`);
                  resolve(null);
                }
              }
            }
          });
        });
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка при проверке проекта: ${error.message}`);
    return null;
  }
}

// Функция для создания базы данных PostgreSQL
async function createPostgresDatabase() {
  try {
    // Проверка наличия существующей базы данных
    try {
      const plugins = executeCommand('railway plugin list');
      
      if (plugins.includes('postgresql')) {
        console.log('✅ База данных PostgreSQL уже создана');
        return true;
      } else {
        // База данных не создана, создаем новую
        console.log('База данных PostgreSQL не создана, создаем новую...');
        
        // Создание базы данных PostgreSQL
        try {
          executeCommand('railway plugin add postgresql');
        } catch (error) {
          try {
            executeCommand('railway.exe plugin add postgresql');
          } catch (exeError) {
            throw error;
          }
        }
        
        console.log('✅ База данных PostgreSQL успешно создана');
        return true;
      }
    } catch (error) {
      console.error(`❌ Ошибка при проверке плагинов: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка при создании базы данных PostgreSQL: ${error.message}`);
    return false;
  }
}

// Функция для создания Redis
async function createRedis() {
  try {
    // Проверка наличия существующего Redis
    try {
      const plugins = executeCommand('railway plugin list');
      
      if (plugins.includes('redis')) {
        console.log('✅ Redis уже создан');
        return true;
      } else {
        // Redis не создан, создаем новый
        console.log('Redis не создан, создаем новый...');
        
        // Создание Redis
        try {
          executeCommand('railway plugin add redis');
        } catch (error) {
          try {
            executeCommand('railway.exe plugin add redis');
          } catch (exeError) {
            throw error;
          }
        }
        
        console.log('✅ Redis успешно создан');
        return true;
      }
    } catch (error) {
      console.error(`❌ Ошибка при проверке плагинов: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка при создании Redis: ${error.message}`);
    return false;
  }
}

// Функция для получения переменных окружения из .env.railway.example
function getEnvVariables() {
  try {
    // Проверка наличия файла .env.railway.example
    const envExamplePath = path.join(__dirname, '.env.railway.example');
    if (!fs.existsSync(envExamplePath)) {
      console.error('❌ Файл .env.railway.example не найден');
      return null;
    }
    
    // Чтение файла .env.railway.example
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const lines = envExample.split('\n');
    
    // Парсинг переменных окружения
    const envVars = {};
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    }
    
    return envVars;
  } catch (error) {
    console.error(`❌ Ошибка при получении переменных окружения: ${error.message}`);
    return null;
  }
}

// Функция для настройки переменных окружения
async function setupEnvironmentVariables() {
  try {
    // Получение переменных окружения из .env.railway.example
    const envVars = getEnvVariables();
    
    if (!envVars) {
      console.error('❌ Не удалось получить переменные окружения');
      return false;
    }
    
    // Получение текущих переменных окружения из Railway
    let currentEnvVars = {};
    try {
      const railwayEnvVars = executeCommand('railway variables get');
      const lines = railwayEnvVars.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const [key, value] = line.split('=');
          if (key && value) {
            currentEnvVars[key.trim()] = value.trim();
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Не удалось получить текущие переменные окружения: ${error.message}`);
    }
    
    // Запрос у пользователя значений для переменных окружения
    const newEnvVars = {};
    
    // Запрос JWT_SECRET
    await new Promise((resolve) => {
      const defaultJwtSecret = currentEnvVars.JWT_SECRET || envVars.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
      rl.question(`JWT_SECRET (по умолчанию: ${defaultJwtSecret}): `, (answer) => {
        newEnvVars.JWT_SECRET = answer.trim() || defaultJwtSecret;
        resolve();
      });
    });
    
    // Запрос TELEGRAM_BOT_TOKEN
    await new Promise((resolve) => {
      const defaultTelegramBotToken = currentEnvVars.TELEGRAM_BOT_TOKEN || envVars.TELEGRAM_BOT_TOKEN;
      rl.question(`TELEGRAM_BOT_TOKEN (по умолчанию: ${defaultTelegramBotToken}): `, (answer) => {
        newEnvVars.TELEGRAM_BOT_TOKEN = answer.trim() || defaultTelegramBotToken;
        resolve();
      });
    });
    
    // Запрос ADMIN_IDS
    await new Promise((resolve) => {
      const defaultAdminIds = currentEnvVars.ADMIN_IDS || envVars.ADMIN_IDS;
      rl.question(`ADMIN_IDS (по умолчанию: ${defaultAdminIds}): `, (answer) => {
        newEnvVars.ADMIN_IDS = answer.trim() || defaultAdminIds;
        resolve();
      });
    });
    
    // Запрос S3_ACCESS_KEY
    await new Promise((resolve) => {
      const defaultS3AccessKey = currentEnvVars.S3_ACCESS_KEY || envVars.S3_ACCESS_KEY;
      rl.question(`S3_ACCESS_KEY (по умолчанию: ${defaultS3AccessKey}): `, (answer) => {
        newEnvVars.S3_ACCESS_KEY = answer.trim() || defaultS3AccessKey;
        resolve();
      });
    });
    
    // Запрос S3_SECRET_KEY
    await new Promise((resolve) => {
      const defaultS3SecretKey = currentEnvVars.S3_SECRET_KEY || envVars.S3_SECRET_KEY;
      rl.question(`S3_SECRET_KEY (по умолчанию: ${defaultS3SecretKey}): `, (answer) => {
        newEnvVars.S3_SECRET_KEY = answer.trim() || defaultS3SecretKey;
        resolve();
      });
    });
    
    // Запрос S3_BUCKET
    await new Promise((resolve) => {
      const defaultS3Bucket = currentEnvVars.S3_BUCKET || envVars.S3_BUCKET;
      rl.question(`S3_BUCKET (по умолчанию: ${defaultS3Bucket}): `, (answer) => {
        newEnvVars.S3_BUCKET = answer.trim() || defaultS3Bucket;
        resolve();
      });
    });
    
    // Запрос S3_REGION
    await new Promise((resolve) => {
      const defaultS3Region = currentEnvVars.S3_REGION || envVars.S3_REGION;
      rl.question(`S3_REGION (по умолчанию: ${defaultS3Region}): `, (answer) => {
        newEnvVars.S3_REGION = answer.trim() || defaultS3Region;
        resolve();
      });
    });
    
    // Запрос S3_ENDPOINT
    await new Promise((resolve) => {
      const defaultS3Endpoint = currentEnvVars.S3_ENDPOINT || envVars.S3_ENDPOINT;
      rl.question(`S3_ENDPOINT (по умолчанию: ${defaultS3Endpoint}): `, (answer) => {
        newEnvVars.S3_ENDPOINT = answer.trim() || defaultS3Endpoint;
        resolve();
      });
    });
    
    // Установка переменных окружения в Railway
    console.log('Установка переменных окружения в Railway...');
    
    for (const [key, value] of Object.entries(newEnvVars)) {
      try {
        executeCommand(`railway variables set ${key}=${value}`);
      } catch (error) {
        try {
          executeCommand(`railway.exe variables set ${key}=${value}`);
        } catch (exeError) {
          console.error(`❌ Ошибка при установке переменной ${key}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Переменные окружения успешно установлены');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при настройке переменных окружения: ${error.message}`);
    return false;
  }
}

// Главная функция
async function main() {
  console.log('=== НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ В RAILWAY ===');
  
  try {
    // Проверка наличия Railway CLI
    const railwayCLIInstalled = checkRailwayCLI();
    
    if (!railwayCLIInstalled) {
      console.error('❌ Не удалось установить Railway CLI');
      rl.close();
      return;
    }
    
    // Вход в Railway
    const loggedIn = await loginToRailway();
    
    if (!loggedIn) {
      console.error('❌ Не удалось войти в Railway');
      rl.close();
      return;
    }
    
    // Проверка наличия проекта
    const projectName = await checkProject();
    
    if (!projectName) {
      console.error('❌ Не удалось выбрать проект');
      rl.close();
      return;
    }
    
    // Создание базы данных PostgreSQL
    const databaseCreated = await createPostgresDatabase();
    
    if (!databaseCreated) {
      console.error('❌ Не удалось создать базу данных PostgreSQL');
      rl.close();
      return;
    }
    
    // Создание Redis
    const redisCreated = await createRedis();
    
    if (!redisCreated) {
      console.error('❌ Не удалось создать Redis');
      rl.close();
      return;
    }
    
    // Настройка переменных окружения
    const environmentVariablesSetup = await setupEnvironmentVariables();
    
    if (!environmentVariablesSetup) {
      console.error('❌ Не удалось настроить переменные окружения');
      rl.close();
      return;
    }
    
    // Вывод итогового результата
    console.log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
    console.log(`✅ Переменные окружения успешно настроены в проекте ${projectName}`);
    console.log('✅ База данных PostgreSQL создана');
    console.log('✅ Redis создан');
    
    console.log('');
    console.log('Для управления проектом в Railway выполните команду:');
    console.log('railway open');
    
    rl.close();
  } catch (error) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  console.error(`❌ Критическая ошибка: ${error.message}`);
  rl.close();
  process.exit(1);
});
