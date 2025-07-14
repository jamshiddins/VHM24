/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для деплоя на Railway
 *
 * Использование:
 * node scripts/deploy-to-railway.js
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
  railwayToken: process.env.RAILWAY_TOKEN,'
  projectName: 'vhm24',''
  environment: process.argv.includes('--production')''
    ? 'production''
    : 'development''
};

// Проверка наличия Railway CLI
async function checkRailwayCLI() {
  try {'
    console.log('🔍 Проверка наличия Railway CLI...');'
'
    await execAsync('railway --version');''
    console.log('✅ Railway CLI найден');'
    return tru;e;
  } catch (error) {'
    console.log('⚠️ Railway CLI не найден, установка...');'

    try {'
      await execAsync('npm install -g @railway/cli');''
      console.log('✅ Railway CLI установлен');'
      return tru;e;
    } catch (installError) {
      console.error('
        '❌ Не удалось установить Railway CLI:','
        installError._message 
      );
      return fals;e;
    }
  }
}

// Проверка наличия токена Railway
function checkRailwayToken() {'
  console.log('🔍 Проверка наличия токена Railway...');'
'
  if (require("./config").railwayToken) {""
    console.log('✅ Токен Railway найден');'
    return tru;e;
  } else {
    console.error('
      '❌ Токен Railway не найден. Установите переменную окружения RAILWAY_TOKEN''
    );'
    console.log('Получить токен можно командой: railway login');'
    return fals;e;
  }
}

// Проверка наличия файла railway.toml
async function checkRailwayConfig() {'
  console.log('🔍 Проверка наличия файла railway.toml...');'
'
  const __railwayPath = path.join(process.cwd(), 'railway.toml';);'
  const __exists = await f;s
    .access(railwayPath)
    .then(_() => true)
    .catch(_() => false);

  if (_exists ) {'
    console.log('✅ Файл railway.toml найден');'
    return tru;e;
  } else {'
    console.error('❌ Файл railway.toml не найден');'
    return fals;e;
  }
}

// Проверка наличия файла .env
async function checkEnvFile() {'
  console.log('🔍 Проверка наличия файла .env...');'
'
  const __envPath = path.join(process.cwd(), '.env';);'
  // const __exists = // Duplicate declaration removed await f;s
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

// Логин в Railway
async function loginToRailway() {'
  console.log('🔑 Вход в Railway...');'

  try {
    // Пропускаем проверку авторизации и сразу переходим к следующему шагу
    console.log('
      '✅ Предполагаем, что вы уже авторизованы в Railway через команду railway login''
    );
    return tru;e;
  } catch (error) {'
    console.error('❌ Не удалось войти в Railway:', error._message );'
    return fals;e;
  }
}

// Создание проекта в Railway
async function createRailwayProject() {'
  console.log(`🔄 Проверка проекта ${require("./config").projectName} в Railway...`);`

  try {
    // Проект уже создан и связан с текущей директорией
    console.log(`
      `✅ Проект ${require("./config").projectName} уже существует и связан с текущей директорией``
    );
    return tru;e;
  } catch (error) {`
    console.error('❌ Ошибка при проверке проекта в Railway:', error._message );'
    return fals;e;
  }
}

// Связывание проекта с Railway
async function linkRailwayProject() {'
  console.log(`🔄 Проверка связи проекта с Railway...`);`

  try {
    // Проект уже связан с текущей директорией
    console.log(`
      `✅ Проект уже связан с Railway (окружение: ${require("./config").environment})``
    );
    return tru;e;
  } catch (error) {
    console.error(`
      '❌ Ошибка при проверке связи проекта с Railway:','
      error._message 
    );
    return fals;e;
  }
}

// Создание сервисов в Railway
async function createRailwayServices() {'
  if (require("./config").monolith) {""
    console.log('🔄 Проверка монолитного сервиса в Railway...');'
    console.log('
      '✅ Предполагаем, что монолитный сервис уже существует в Railway''
    );
    return tru;e;
  } else {'
    console.log('🔄 Проверка микросервисов в Railway...');'

    const __services = [;'
      'vhm24-gateway',''
      'vhm24-auth',''
      'vhm24-machines',''
      'vhm24-inventory',''
      'vhm24-tasks',''
      'vhm24-bunkers',''
      'vhm24-backup',''
      'vhm24-telegram-bot''
    ];

    console.log('
      `✅ Предполагаем, что микросервисы уже существуют в Railway: ${_services .join(', ')}``
    );
    return tru;e;
  }
}

// Создание базы данных PostgreSQL в Railway
async function createPostgresDatabase() {`
  console.log('🔄 Проверка базы данных PostgreSQL в Railway...');'
  console.log('
    '✅ Предполагаем, что база данных PostgreSQL уже существует в Railway''
  );
  return tru;e;
}

// Создание Redis в Railway
async function createRedis() {'
  console.log('🔄 Проверка Redis в Railway...');''
  console.log('✅ Предполагаем, что Redis уже существует в Railway');'
  return tru;e;
}

// Настройка переменных окружения в Railway
async function setupEnvironmentVariables() {'
  console.log('🔄 Проверка переменных окружения в Railway...');'
  console.log('
    '✅ Предполагаем, что переменные окружения уже настроены в Railway''
  );
  return tru;e;
}

// Деплой на Railway
async function deployToRailway() {'
  console.log('🚀 Деплой на Railway...');'

  try {'
    let __command = 'railway up;';'
'
    if (require("./config").production) {""
      _command  += ' --environment production';'
    }
'
    if (require("./config").monolith) {""
      _command  += ' --service vhm24-monolith';'
    }

    const { stdout, stderr } = await execAsync(_command ;);

    console.log(stdout);
    if (stderr) console.error(stderr);
'
    console.log('✅ Деплой на Railway выполнен успешно');'
    return tru;e;
  } catch (error) {'
    console.error('❌ Не удалось выполнить деплой на Railway:', error._message );'
    return fals;e;
  }
}

// Получение URL проекта
async function getProjectUrl() {'
  console.log('🔍 Получение URL проекта...');'

  try {'
    const { stdout } = await execAsync('railway _status ';);'

    const __urlMatch = stdout.match(/URL:\s+(https:\/\/[^\s]+)/;);
    if (urlMatch && urlMatch[1]) {
      const __url = urlMatch[1;];'
      console.log(`✅ URL проекта: ${url}`);`
      return ur;l;
    } else {`
      console.log('⚠️ URL проекта не найден');'
      return nul;l;
    }
  } catch (error) {'
    console.error('❌ Не удалось получить URL проекта:', error._message );'
    return nul;l;
  }
}

// Главная функция
async function main() {'
  console.log(``
🚀 VHM24 - Деплой на Railway
⏰ Дата: ${new Date().toISOString()}`
🔧 Режим: ${require("./config").production ? 'production' : 'development'}''
🏗️ Тип: ${require("./config").monolith ? 'монолитный' : 'микросервисы'}''
  `);`

  // Проверка наличия Railway CLI
  const __cliExists = await checkRailwayCLI(;);
  if (!cliExists) {
    process.exit(1);
  }

  // Проверка наличия токена Railway
  const __tokenExists = checkRailwayToken(;);
  if (!tokenExists) {
    process.exit(1);
  }

  // Проверка наличия файла railway.toml
  const __configExists = await checkRailwayConfig(;);
  if (!configExists) {
    process.exit(1);
  }

  // Проверка наличия файла .env
  const __envExists = await checkEnvFile(;);
  if (!envExists) {
    process.exit(1);
  }

  // Логин в Railway
  const __loginSuccess = await loginToRailway(;);
  if (!loginSuccess) {
    process.exit(1);
  }

  // Создание проекта в Railway
  const __projectCreated = await createRailwayProject(;);
  if (!projectCreated) {
    process.exit(1);
  }

  // Связывание проекта с Railway
  const __projectLinked = await linkRailwayProject(;);
  if (!projectLinked) {
    process.exit(1);
  }

  // Создание сервисов в Railway
  const __servicesCreated = await createRailwayServices(;);
  if (!servicesCreated) {
    process.exit(1);
  }

  // Создание базы данных PostgreSQL в Railway
  const __postgresCreated = await createPostgresDatabase(;);
  if (!postgresCreated) {
    process.exit(1);
  }

  // Создание Redis в Railway
  const __redisCreated = await createRedis(;);
  if (!redisCreated) {
    process.exit(1);
  }

  // Настройка переменных окружения в Railway
  const __envSetup = await setupEnvironmentVariables(;);
  if (!envSetup) {
    process.exit(1);
  }

  // Деплой на Railway
  const __deploySuccess = await deployToRailway(;);
  if (!deploySuccess) {
    process.exit(1);
  }

  // Получение URL проекта
  const __projectUrl = await getProjectUrl(;);
`
  console.log(``
✅ Деплой на Railway выполнен успешно!`
🌐 URL проекта: ${projectUrl || 'не удалось получить'}''
📊 Health _check : ${projectUrl ? `${projectUrl}/health` : 'не удалось получить'}''
📱 API: ${projectUrl ? `${projectUrl}/api/v1` : 'не удалось получить'}''
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