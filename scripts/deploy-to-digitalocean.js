/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для деплоя на DigitalOcean
 * 
 * Использование:
 * node scripts/deploy-to-digitalocean.js
 * 
 * Опции:
 * --production: деплой в production режиме
 * --monolith: деплой в монолитном режиме
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Конфигурация
const config = {
  production: process.argv.includes('--production'),
  monolith: process.argv.includes('--monolith'),
  doApiToken: process.env.DO_API_TOKEN,
  projectName: 'vhm24',
  environment: process.argv.includes('--production') ? 'production' : 'development',
  region: 'fra1', // Frankfurt
  minioEndpoint: process.env.MINIO_ENDPOINT,
  minioAccessKey: process.env.MINIO_ACCESS_KEY,
  minioSecretKey: process.env.MINIO_SECRET_KEY
};

// Проверка наличия doctl
async function checkDoctl() {
  try {
    console.log('🔍 Проверка наличия doctl...');
    
    await execAsync('doctl version');
    console.log('✅ doctl найден');
    return true;
  } catch (error) {
    console.log('⚠️ doctl не найден, установка...');
    
    try {
      if (process.platform === 'win32') {
        console.log('Для Windows необходимо установить doctl вручную с https://github.com/digitalocean/doctl/releases');
      } else if (process.platform === 'darwin') {
        await execAsync('brew install doctl');
      } else {
        await execAsync(`
          cd ~
          wget https://github.com/digitalocean/doctl/releases/download/v1.92.1/doctl-1.92.1-linux-amd64.tar.gz
          tar xf ~/doctl-1.92.1-linux-amd64.tar.gz
          sudo mv ~/doctl /usr/local/bin
        `);
      }
      console.log('✅ doctl установлен');
      return true;
    } catch (installError) {
      console.error('❌ Не удалось установить doctl:', installError.message);
      return false;
    }
  }
}

// Проверка наличия токена DigitalOcean
function checkDoApiToken() {
  console.log('🔍 Проверка наличия токена DigitalOcean...');
  
  if (config.doApiToken) {
    console.log('✅ Токен DigitalOcean найден');
    return true;
  } else {
    console.error('❌ Токен DigitalOcean не найден. Установите переменную окружения DO_API_TOKEN');
    console.log('Получить токен можно в панели управления DigitalOcean: https://cloud.digitalocean.com/account/api/tokens');
    return false;
  }
}

// Проверка наличия файла .env
async function checkEnvFile() {
  console.log('🔍 Проверка наличия файла .env...');
  
  const envPath = path.join(process.cwd(), '.env');
  const exists = await fs.access(envPath).then(() => true).catch(() => false);
  
  if (exists) {
    console.log('✅ Файл .env найден');
    return true;
  } else {
    console.error('❌ Файл .env не найден');
    return false;
  }
}

// Логин в DigitalOcean
async function loginToDigitalOcean() {
  console.log('🔑 Вход в DigitalOcean...');
  
  try {
    await execAsync(`doctl auth init -t ${config.doApiToken}`);
    console.log('✅ Вход в DigitalOcean выполнен успешно');
    return true;
  } catch (error) {
    console.error('❌ Не удалось войти в DigitalOcean:', error.message);
    return false;
  }
}

// Создание приложения в DigitalOcean App Platform
async function createDoApp() {
  console.log(`🔄 Создание приложения ${config.projectName} в DigitalOcean App Platform...`);
  
  try {
    // Проверка наличия приложения
    const { stdout } = await execAsync('doctl apps list --format ID,Spec.Name --no-header');
    
    if (stdout.includes(config.projectName)) {
      console.log(`⚠️ Приложение ${config.projectName} уже существует в DigitalOcean App Platform`);
      return true;
    }
    
    // Создание spec файла для приложения
    const specPath = path.join(process.cwd(), '.do', 'app.yaml');
    
    // Создание директории .do, если она не существует
    await fs.mkdir(path.join(process.cwd(), '.do'), { recursive: true });
    
    // Создание spec файла
    let spec;
    
    if (config.monolith) {
      spec = `
name: ${config.projectName}
region: ${config.region}
services:
- name: vhm24-monolith
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node start-services.js --production --monolith
  http_port: 8000
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME
databases:
- name: vhm24-db
  engine: PG
  version: "12"
  production: ${config.production}
  cluster_name: vhm24-db-cluster
  db_name: vhm24
  db_user: vhm24
`;
    } else {
      spec = `
name: ${config.projectName}
region: ${config.region}
services:
- name: vhm24-gateway
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/gateway/src/index.js
  http_port: 8000
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-auth
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/auth/src/index.js
  http_port: 3001
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-machines
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/machines/src/index.js
  http_port: 3002
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-inventory
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/inventory/src/index.js
  http_port: 3003
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-tasks
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/tasks/src/index.js
  http_port: 3004
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-bunkers
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/bunkers/src/index.js
  http_port: 3005
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-backup
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/backup/src/index.js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

- name: vhm24-telegram-bot
  github:
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node services/telegram-bot/src/index.js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: ${config.environment}
    scope: RUN_TIME

databases:
- name: vhm24-db
  engine: PG
  version: "12"
  production: ${config.production}
  cluster_name: vhm24-db-cluster
  db_name: vhm24
  db_user: vhm24

- name: vhm24-redis
  engine: REDIS
  version: "6"
  production: ${config.production}
  cluster_name: vhm24-redis-cluster
  db_name: vhm24
`;
    }
    
    await fs.writeFile(specPath, spec);
    console.log(`✅ Spec файл создан: ${specPath}`);
    
    // Создание приложения
    await execAsync(`doctl apps create --spec ${specPath}`);
    console.log(`✅ Приложение ${config.projectName} создано в DigitalOcean App Platform`);
    
    return true;
  } catch (error) {
    console.error('❌ Не удалось создать приложение в DigitalOcean App Platform:', error.message);
    return false;
  }
}

// Настройка переменных окружения в DigitalOcean App Platform
async function setupEnvironmentVariables() {
  console.log('🔄 Настройка переменных окружения в DigitalOcean App Platform...');
  
  try {
    // Получение ID приложения
    const { stdout } = await execAsync('doctl apps list --format ID,Spec.Name --no-header');
    const appIdMatch = stdout.match(new RegExp(`([a-z0-9-]+)\\s+${config.projectName}`));
    
    if (!appIdMatch) {
      console.error(`❌ Не удалось найти ID приложения ${config.projectName}`);
      return false;
    }
    
    const appId = appIdMatch[1];
    
    // Чтение файла .env
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    // Парсинг переменных окружения
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          envVars[key] = value;
        }
      }
    });
    
    // Создание файла с переменными окружения
    const envSpecPath = path.join(process.cwd(), '.do', 'env.yaml');
    
    let envSpec = `
apps:
- app_id: ${appId}
  envs:
`;
    
    for (const [key, value] of Object.entries(envVars)) {
      envSpec += `  - key: ${key}
    value: ${value}
    scope: RUN_TIME
`;
    }
    
    await fs.writeFile(envSpecPath, envSpec);
    console.log(`✅ Файл с переменными окружения создан: ${envSpecPath}`);
    
    // Установка переменных окружения
    await execAsync(`doctl apps update ${appId} --spec ${envSpecPath}`);
    console.log('✅ Переменные окружения установлены в DigitalOcean App Platform');
    
    return true;
  } catch (error) {
    console.error('❌ Не удалось настроить переменные окружения в DigitalOcean App Platform:', error.message);
    return false;
  }
}

// Создание Spaces в DigitalOcean
async function createSpaces() {
  console.log('🔄 Создание Spaces в DigitalOcean...');
  
  try {
    // Проверка наличия ключей доступа к Spaces
    if (!config.minioAccessKey || !config.minioSecretKey) {
      console.error('❌ Не указаны ключи доступа к Spaces. Установите переменные окружения MINIO_ACCESS_KEY и MINIO_SECRET_KEY');
      return false;
    }
    
    // Проверка наличия Spaces
    const { stdout } = await execAsync('doctl spaces list --format Name,Region --no-header');
    
    // Создание Space для загрузок
    if (!stdout.includes('vhm24-uploads')) {
      await execAsync(`doctl spaces create vhm24-uploads --region ${config.region}`);
      console.log('✅ Space vhm24-uploads создан в DigitalOcean');
    } else {
      console.log('⚠️ Space vhm24-uploads уже существует в DigitalOcean');
    }
    
    // Создание Space для резервных копий
    if (!stdout.includes('vhm24-backups')) {
      await execAsync(`doctl spaces create vhm24-backups --region ${config.region}`);
      console.log('✅ Space vhm24-backups создан в DigitalOcean');
    } else {
      console.log('⚠️ Space vhm24-backups уже существует в DigitalOcean');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Не удалось создать Spaces в DigitalOcean:', error.message);
    return false;
  }
}

// Деплой на DigitalOcean App Platform
async function deployToDigitalOcean() {
  console.log('🚀 Деплой на DigitalOcean App Platform...');
  
  try {
    // Получение ID приложения
    const { stdout } = await execAsync('doctl apps list --format ID,Spec.Name --no-header');
    const appIdMatch = stdout.match(new RegExp(`([a-z0-9-]+)\\s+${config.projectName}`));
    
    if (!appIdMatch) {
      console.error(`❌ Не удалось найти ID приложения ${config.projectName}`);
      return false;
    }
    
    const appId = appIdMatch[1];
    
    // Деплой приложения
    await execAsync(`doctl apps create-deployment ${appId}`);
    console.log('✅ Деплой на DigitalOcean App Platform выполнен успешно');
    
    return true;
  } catch (error) {
    console.error('❌ Не удалось выполнить деплой на DigitalOcean App Platform:', error.message);
    return false;
  }
}

// Получение URL приложения
async function getAppUrl() {
  console.log('🔍 Получение URL приложения...');
  
  try {
    // Получение ID приложения
    const { stdout } = await execAsync('doctl apps list --format ID,Spec.Name --no-header');
    const appIdMatch = stdout.match(new RegExp(`([a-z0-9-]+)\\s+${config.projectName}`));
    
    if (!appIdMatch) {
      console.error(`❌ Не удалось найти ID приложения ${config.projectName}`);
      return null;
    }
    
    const appId = appIdMatch[1];
    
    // Получение URL приложения
    const { stdout: appInfo } = await execAsync(`doctl apps get ${appId} --format DefaultIngress`);
    const url = appInfo.trim();
    
    if (url) {
      console.log(`✅ URL приложения: ${url}`);
      return url;
    } else {
      console.log('⚠️ URL приложения не найден');
      return null;
    }
  } catch (error) {
    console.error('❌ Не удалось получить URL приложения:', error.message);
    return null;
  }
}

// Главная функция
async function main() {
  console.log(`
🚀 VHM24 - Деплой на DigitalOcean
⏰ Дата: ${new Date().toISOString()}
🔧 Режим: ${config.production ? 'production' : 'development'}
🏗️ Тип: ${config.monolith ? 'монолитный' : 'микросервисы'}
  `);
  
  // Проверка наличия doctl
  const doctlExists = await checkDoctl();
  if (!doctlExists) {
    process.exit(1);
  }
  
  // Проверка наличия токена DigitalOcean
  const tokenExists = checkDoApiToken();
  if (!tokenExists) {
    process.exit(1);
  }
  
  // Проверка наличия файла .env
  const envExists = await checkEnvFile();
  if (!envExists) {
    process.exit(1);
  }
  
  // Логин в DigitalOcean
  const loginSuccess = await loginToDigitalOcean();
  if (!loginSuccess) {
    process.exit(1);
  }
  
  // Создание Spaces в DigitalOcean
  const spacesCreated = await createSpaces();
  if (!spacesCreated) {
    process.exit(1);
  }
  
  // Создание приложения в DigitalOcean App Platform
  const appCreated = await createDoApp();
  if (!appCreated) {
    process.exit(1);
  }
  
  // Настройка переменных окружения в DigitalOcean App Platform
  const envSetup = await setupEnvironmentVariables();
  if (!envSetup) {
    process.exit(1);
  }
  
  // Деплой на DigitalOcean App Platform
  const deploySuccess = await deployToDigitalOcean();
  if (!deploySuccess) {
    process.exit(1);
  }
  
  // Получение URL приложения
  const appUrl = await getAppUrl();
  
  console.log(`
✅ Деплой на DigitalOcean выполнен успешно!
🌐 URL приложения: ${appUrl || 'не удалось получить'}
📊 Health check: ${appUrl ? `https://${appUrl}/health` : 'не удалось получить'}
📱 API: ${appUrl ? `https://${appUrl}/api/v1` : 'не удалось получить'}
  `);
}

// Запуск
main()
  .then(() => {
    console.log('✅ Операция завершена успешно');
  })
  .catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
