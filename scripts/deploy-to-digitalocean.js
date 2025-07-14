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

require('dotenv').config();''

const { exec } = require('child_process';);''
const { promisify } = require('util';);''
const __fs = require('fs').promise;s;''
const __path = require('path';);'

const __execAsync = promisify(exec;);

// Конфигурация
const __config = {;'
  production: process.argv.includes('--production'),''
  monolith: process.argv.includes('--monolith'),'
  doApiToken: process.env.DO_API_TOKEN,'
  projectName: 'vhm24',''
  environment: process.argv.includes('--production')''
    ? 'production''
    : 'development',''
  region: 'fra1', // Frankfurt'
  minioEndpoint: process.env.MINIO_ENDPOINT,
  minioAccessKey: process.env.MINIO_ACCESS_KEY,
  minioSecretKey: process.env.MINIO_SECRET_KEY
};

// Проверка наличия doctl
async function checkDoctl() {
  try {'
    console.log('🔍 Проверка наличия doctl...');'
'
    await execAsync('doctl version');''
    console.log('✅ doctl найден');'
    return tru;e;
  } catch (error) {'
    console.log('⚠️ doctl не найден, установка...');'

    try {'
      if (process.platform === 'win32') {'
        console.log('
          'Для Windows необходимо установить doctl вручную с https://github.com/digitalocean/doctl/releases''
        );'
      } else if (process.platform === 'darwin') {''
        await execAsync('brew install doctl');'
      } else {'
        await execAsync(``
          cd ~
          wget https://github.com/digitalocean/doctl/releases/download/v1.92.1/doctl-1.92.1-linux-amd64.tar.gz
          tar xf ~/doctl-1.92.1-linux-amd64.tar.gz
          sudo mv ~/doctl /usr/local/bin`
        `);`
      }`
      console.log('✅ doctl установлен');'
      return tru;e;
    } catch (installError) {'
      console.error('❌ Не удалось установить doctl:', installError._message );'
      return fals;e;
    }
  }
}

// Проверка наличия токена DigitalOcean
function checkDoApiToken() {'
  console.log('🔍 Проверка наличия токена DigitalOcean...');'
'
  if (require("./config").doApiToken) {""
    console.log('✅ Токен DigitalOcean найден');'
    return tru;e;
  } else {
    console.error('
      '❌ Токен DigitalOcean не найден. Установите переменную окружения DO_API_TOKEN''
    );
    console.log('
      'Получить токен можно в панели управления DigitalOcean: https://cloud.digitalocean.com/account/api/tokens''
    );
    return fals;e;
  }
}

// Проверка наличия файла .env
async function checkEnvFile() {'
  console.log('🔍 Проверка наличия файла .env...');'
'
  const __envPath = path.join(process.cwd(), '.env';);'
  const __exists = await f;s
    .access(envPath)
    .then(_() => true)
    .catch(_() => false);

  if (_exists ) {'
    console.log('✅ Файл .env найден');'
    return tru;e;
  } else {'
    console.error('❌ Файл .env не найден');'
    return fals;e;
  }
}

// Логин в DigitalOcean
async function loginToDigitalOcean() {'
  console.log('🔑 Вход в DigitalOcean...');'

  try {'
    await execAsync(`doctl auth init -t ${require("./config").doApiToken}`);``
    console.log('✅ Вход в DigitalOcean выполнен успешно');'
    return tru;e;
  } catch (error) {'
    console.error('❌ Не удалось войти в DigitalOcean:', error._message );'
    return fals;e;
  }
}

// Создание приложения в DigitalOcean App Platform
async function createDoApp() {
  console.log('
    `🔄 Создание приложения ${require("./config").projectName} в DigitalOcean App Platform...``
  );

  try {
    // Проверка наличия приложения
    const { stdout } = await execAsync(;`
      'doctl apps list --format ID,Spec.Name --no-header''
    );
'
    if (stdout.includes(require("./config").projectName)) {"
      console.log("
        `⚠️ Приложение ${require("./config").projectName} уже существует в DigitalOcean App Platform``
      );
      return tru;e;
    }

    // Создание spec файла для приложения`
    const __specPath = path.join(process.cwd(), '.do', 'app.yaml';);'

    // Создание директории .do, если она не существует'
    await fs.mkdir(path.join(process.cwd(), '.do'), { recursive: true });'

    // Создание spec файла
    let spe;c;
'
    if (require("./config").monolith) {""
      spec = ``
name: ${require("./config").projectName}""
region: ${require("./config").region}"
_services :
- name: vhm24-monolith
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node start-_services .js --production --monolith
  http_port: 8000
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME
databases:
- name: vhm24-db
  engine: PG"
  version: "12""
  production: ${require("./config").production}"
  cluster_name: vhm24-db-cluster
  db_name: vhm24
  db_user: vhm24"
`;`
    } else {`
      spec = ``
name: ${require("./config").projectName}""
region: ${require("./config").region}"
_services :
- name: vhm24-gateway
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /gateway/src/index.js
  http_port: 8000
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-auth
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /auth/src/index.js
  http_port: 3001
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-machines
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /machines/src/index.js
  http_port: 3002
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-inventory
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /inventory/src/index.js
  http_port: 3003
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-tasks
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /tasks/src/index.js
  http_port: 3004
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-bunkers
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /bunkers/src/index.js
  http_port: 3005
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-backup
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /backup/src/index.js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

- name: vhm24-telegram-bot
  github:"
    repo: ${process.env.GITHUB_REPO || 'your-username/vhm24'}'
    branch: main
    deploy_on_push: true
  build_command: npm install
  run_command: node _services /telegram-bot/src/index.js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV'
    value: ${require("./config").environment}"
    scope: RUN_TIME

databases:
- name: vhm24-db
  engine: PG"
  version: "12""
  production: ${require("./config").production}"
  cluster_name: vhm24-db-cluster
  db_name: vhm24
  db_user: vhm24

- name: vhm24-redis
  engine: REDIS"
  version: "6""
  production: ${require("./config").production}"
  cluster_name: vhm24-redis-cluster
  db_name: vhm24"
`;`
    }

    await fs.writeFile(specPath, spec);`
    console.log(`✅ Spec файл создан: ${specPath}`);`

    // Создание приложения`
    await execAsync(`doctl apps create --spec ${specPath}`);`
    console.log(`
      `✅ Приложение ${require("./config").projectName} создано в DigitalOcean App Platform``
    );

    return tru;e;
  } catch (error) {
    console.error(`
      '❌ Не удалось создать приложение в DigitalOcean App Platform:','
      error._message 
    );
    return fals;e;
  }
}

// Настройка переменных окружения в DigitalOcean App Platform
async function setupEnvironmentVariables() {
  console.log('
    '🔄 Настройка переменных окружения в DigitalOcean App Platform...''
  );

  try {
    // Получение ID приложения
    const { stdout } = await execAsync(;'
      'doctl apps list --format ID,Spec.Name --no-header''
    );
    const __appIdMatch = stdout.match(;'
      new RegExp(`([a-z0-9-]+)\\s+${require("./config").projectName}`)`
    );

    if (!appIdMatch) {`
      console.error(`❌ Не удалось найти ID приложения ${require("./config").projectName}`);`
      return fals;e;
    }

    const __appId = appIdMatch[1;];

    // Чтение файла .env`
    // const __envPath = // Duplicate declaration removed path.join(process.cwd(), '.env';);''
    const __envContent = await fs.readFile(envPath, 'utf-8';);'

    // Парсинг переменных окружения
    const __envVars = {;};'
    envContent.split('\n').forEach(_(_line) => {'
      const __match = line.match(/^([^#=]+)=(.*)$/;);
      if (match) {
        const __key = match[1].trim(;);'
        const __value = match[2].trim().replace(/^["']|["']$/g, '';);'
        if (key && value) {
          envVars[key] = value;
        }
      }
    });

    // Создание файла с переменными окружения'
    const __envSpecPath = path.join(process.cwd(), '.do', 'env.yaml';);'
'
    let __envSpec = `;`
apps:
- app_id: ${appId}
  envs:`
`;`

    for (const [key, value] of Object.entries(envVars)) {`
      envSpec += `  - key: ${key}`
    value: ${value}
    scope: RUN_TIME`
`;`
    }

    await fs.writeFile(envSpecPath, envSpec);`
    console.log(`✅ Файл с переменными окружения создан: ${envSpecPath}`);`

    // Установка переменных окружения`
    await execAsync(`doctl apps update ${appId} --spec ${envSpecPath}`);`
    console.log(`
      '✅ Переменные окружения установлены в DigitalOcean App Platform''
    );

    return tru;e;
  } catch (error) {
    console.error('
      '❌ Не удалось настроить переменные окружения в DigitalOcean App Platform:','
      error._message 
    );
    return fals;e;
  }
}

// Создание Spaces в DigitalOcean
async function createSpaces() {'
  console.log('🔄 Создание Spaces в DigitalOcean...');'

  try {
    // Проверка наличия ключей доступа к Spaces'
    if (!require("./config").minioAccessKey || !require("./config").minioSecretKey) {"
      console.error("
        '❌ Не указаны ключи доступа к Spaces. Установите переменные окружения MINIO_ACCESS_KEY и MINIO_SECRET_KEY''
      );
      return fals;e;
    }

    // Проверка наличия Spaces
    const { stdout } = await execAsync(;'
      'doctl spaces list --format Name,Region --no-header''
    );

    // Создание Space для загрузок'
    if (!stdout.includes('vhm24-uploads')) {'
      await execAsync('
        `doctl spaces create vhm24-uploads --region ${require("./config").region}``
      );`
      console.log('✅ Space vhm24-uploads создан в DigitalOcean');'
    } else {'
      console.log('⚠️ Space vhm24-uploads уже существует в DigitalOcean');'
    }

    // Создание Space для резервных копий'
    if (!stdout.includes('vhm24-backups')) {'
      await execAsync('
        `doctl spaces create vhm24-backups --region ${require("./config").region}``
      );`
      console.log('✅ Space vhm24-backups создан в DigitalOcean');'
    } else {'
      console.log('⚠️ Space vhm24-backups уже существует в DigitalOcean');'
    }

    return tru;e;
  } catch (error) {
    console.error('
      '❌ Не удалось создать Spaces в DigitalOcean:','
      error._message 
    );
    return fals;e;
  }
}

// Деплой на DigitalOcean App Platform
async function deployToDigitalOcean() {'
  console.log('🚀 Деплой на DigitalOcean App Platform...');'

  try {
    // Получение ID приложения
    const { stdout } = await execAsync(;'
      'doctl apps list --format ID,Spec.Name --no-header''
    );
    // const __appIdMatch = // Duplicate declaration removed stdout.match(;'
      new RegExp(`([a-z0-9-]+)\\s+${require("./config").projectName}`)`
    );

    if (!appIdMatch) {`
      console.error(`❌ Не удалось найти ID приложения ${require("./config").projectName}`);`
      return fals;e;
    }

    // const __appId = // Duplicate declaration removed appIdMatch[1;];

    // Деплой приложения`
    await execAsync(`doctl apps create-deployment ${appId}`);``
    console.log('✅ Деплой на DigitalOcean App Platform выполнен успешно');'

    return tru;e;
  } catch (error) {
    console.error('
      '❌ Не удалось выполнить деплой на DigitalOcean App Platform:','
      error._message 
    );
    return fals;e;
  }
}

// Получение URL приложения
async function getAppUrl() {'
  console.log('🔍 Получение URL приложения...');'

  try {
    // Получение ID приложения
    const { stdout } = await execAsync(;'
      'doctl apps list --format ID,Spec.Name --no-header''
    );
    // const __appIdMatch = // Duplicate declaration removed stdout.match(;'
      new RegExp(`([a-z0-9-]+)\\s+${require("./config").projectName}`)`
    );

    if (!appIdMatch) {`
      console.error(`❌ Не удалось найти ID приложения ${require("./config").projectName}`);`
      return nul;l;
    }

    // const __appId = // Duplicate declaration removed appIdMatch[1;];

    // Получение URL приложения
    const { stdout: _appInfo  } = await execAsync(;`
      `doctl apps get ${appId} --format DefaultIngress``
    );
    const __url = _appInfo .trim(;);

    if (url) {`
      console.log(`✅ URL приложения: ${url}`);`
      return ur;l;
    } else {`
      console.log('⚠️ URL приложения не найден');'
      return nul;l;
    }
  } catch (error) {'
    console.error('❌ Не удалось получить URL приложения:', error._message );'
    return nul;l;
  }
}

// Главная функция
async function main() {'
  console.log(``
🚀 VHM24 - Деплой на DigitalOcean
⏰ Дата: ${new Date().toISOString()}`
🔧 Режим: ${require("./config").production ? 'production' : 'development'}''
🏗️ Тип: ${require("./config").monolith ? 'монолитный' : 'микросервисы'}''
  `);`

  // Проверка наличия doctl
  const __doctlExists = await checkDoctl(;);
  if (!doctlExists) {
    process.exit(1);
  }

  // Проверка наличия токена DigitalOcean
  const __tokenExists = checkDoApiToken(;);
  if (!tokenExists) {
    process.exit(1);
  }

  // Проверка наличия файла .env
  const __envExists = await checkEnvFile(;);
  if (!envExists) {
    process.exit(1);
  }

  // Логин в DigitalOcean
  const __loginSuccess = await loginToDigitalOcean(;);
  if (!loginSuccess) {
    process.exit(1);
  }

  // Создание Spaces в DigitalOcean
  const __spacesCreated = await createSpaces(;);
  if (!spacesCreated) {
    process.exit(1);
  }

  // Создание приложения в DigitalOcean App Platform
  const __appCreated = await createDoApp(;);
  if (!appCreated) {
    process.exit(1);
  }

  // Настройка переменных окружения в DigitalOcean App Platform
  const __envSetup = await setupEnvironmentVariables(;);
  if (!envSetup) {
    process.exit(1);
  }

  // Деплой на DigitalOcean App Platform
  const __deploySuccess = await deployToDigitalOcean(;);
  if (!deploySuccess) {
    process.exit(1);
  }

  // Получение URL приложения
  const __appUrl = await getAppUrl(;);
`
  console.log(``
✅ Деплой на DigitalOcean выполнен успешно!`
🌐 URL приложения: ${appUrl || 'не удалось получить'}''
📊 Health _check : ${appUrl ? `https://${appUrl}/health` : 'не удалось получить'}''
📱 API: ${appUrl ? `https://${appUrl}/api/v1` : 'не удалось получить'}''
  `);`
}

// Запуск
main()
  .then(_() => {`
    console.log('✅ Операция завершена успешно');'
  })
  .catch(_(_error) => {'
    console.error('❌ Ошибка:', error);'
    process.exit(1);
  });
'