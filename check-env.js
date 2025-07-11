const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Конфигурация переменных окружения для каждого сервиса
const envConfig = {
  backend: {
    required: ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'],
    optional: [
      'PORT',
      'LOG_LEVEL',
      'REDIS_URL',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'TELEGRAM_BOT_TOKEN'
    ]
  },
  frontend: {
    required: ['NEXT_PUBLIC_API_URL'],
    optional: ['NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_VERSION']
  },
  telegram: {
    required: ['TELEGRAM_BOT_TOKEN', 'DATABASE_URL'],
    optional: ['WEBHOOK_URL', 'WEBHOOK_PORT']
  },
  redis: {
    required: ['REDIS_URL'],
    optional: ['REDIS_PASSWORD', 'REDIS_DB']
  }
};

// Функция для загрузки .env файла
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');
      }
    }
  });

  return envVars;
}

// Функция для проверки переменных окружения
function checkEnvironmentVariables(serviceName, config, envVars) {
  console.log(
    `${colors.cyan}🔍 Проверка переменных окружения для ${serviceName}:${colors.reset}`
  );

  let hasErrors = false;
  let hasWarnings = false;

  // Проверка обязательных переменных
  console.log(`${colors.blue}  Обязательные переменные:${colors.reset}`);
  config.required.forEach(varName => {
    if (envVars[varName]) {
      console.log(`    ${colors.green}✓${colors.reset} ${varName}`);
    } else {
      console.log(`    ${colors.red}✗${colors.reset} ${varName} - ОТСУТСТВУЕТ`);
      hasErrors = true;
    }
  });

  // Проверка опциональных переменных
  if (config.optional && config.optional.length > 0) {
    console.log(`${colors.blue}  Опциональные переменные:${colors.reset}`);
    config.optional.forEach(varName => {
      if (envVars[varName]) {
        console.log(`    ${colors.green}✓${colors.reset} ${varName}`);
      } else {
        console.log(
          `    ${colors.yellow}!${colors.reset} ${varName} - не установлена`
        );
        hasWarnings = true;
      }
    });
  }

  return { hasErrors, hasWarnings };
}

// Функция для проверки специфичных значений
function validateSpecificValues(envVars) {
  console.log(`${colors.cyan}🔧 Проверка специфичных значений:${colors.reset}`);

  let hasErrors = false;

  // Проверка NODE_ENV
  if (envVars.NODE_ENV) {
    const validNodeEnvs = ['development', 'production', 'test'];
    if (validNodeEnvs.includes(envVars.NODE_ENV)) {
      console.log(
        `    ${colors.green}✓${colors.reset} NODE_ENV: ${envVars.NODE_ENV}`
      );
    } else {
      console.log(
        `    ${colors.red}✗${colors.reset} NODE_ENV: недопустимое значение "${envVars.NODE_ENV}"`
      );
      console.log(`      Допустимые значения: ${validNodeEnvs.join(', ')}`);
      hasErrors = true;
    }
  }

  // Проверка PORT
  if (envVars.PORT) {
    const port = parseInt(envVars.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.log(
        `    ${colors.red}✗${colors.reset} PORT: недопустимое значение "${envVars.PORT}"`
      );
      hasErrors = true;
    } else {
      console.log(`    ${colors.green}✓${colors.reset} PORT: ${port}`);
    }
  }

  // Проверка DATABASE_URL
  if (envVars.DATABASE_URL) {
    if (
      envVars.DATABASE_URL.startsWith('postgresql://') ||
      envVars.DATABASE_URL.startsWith('postgres://')
    ) {
      console.log(
        `    ${colors.green}✓${colors.reset} DATABASE_URL: корректный PostgreSQL URL`
      );
    } else {
      console.log(
        `    ${colors.yellow}!${colors.reset} DATABASE_URL: возможно некорректный формат`
      );
    }
  }

  // Проверка JWT_SECRET
  if (envVars.JWT_SECRET) {
    if (envVars.JWT_SECRET.length < 32) {
      console.log(
        `    ${colors.yellow}!${colors.reset} JWT_SECRET: рекомендуется использовать ключ длиной не менее 32 символов`
      );
    } else {
      console.log(
        `    ${colors.green}✓${colors.reset} JWT_SECRET: достаточная длина`
      );
    }
  }

  return hasErrors;
}

// Основная функция
function main() {
  console.log(
    `${colors.magenta}🚀 VHM24 - Проверка переменных окружения${colors.reset}\n`
  );

  // Загружаем переменные окружения
  const envFiles = ['.env', '.env.local', '.env.production'];
  let allEnvVars = { ...process.env };

  envFiles.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.blue}📁 Загружен файл: ${fileName}${colors.reset}`);
      const fileVars = loadEnvFile(filePath);
      allEnvVars = { ...allEnvVars, ...fileVars };
    }
  });

  console.log('');

  let totalErrors = 0;
  let totalWarnings = 0;

  // Проверяем каждый сервис
  Object.entries(envConfig).forEach(([serviceName, config]) => {
    const { hasErrors, hasWarnings } = checkEnvironmentVariables(
      serviceName,
      config,
      allEnvVars
    );
    if (hasErrors) totalErrors++;
    if (hasWarnings) totalWarnings++;
    console.log('');
  });

  // Проверяем специфичные значения
  const hasValidationErrors = validateSpecificValues(allEnvVars);
  if (hasValidationErrors) totalErrors++;

  console.log('');

  // Итоговый отчет
  console.log(`${colors.cyan}📊 Итоговый отчет:${colors.reset}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(
      `${colors.green}✅ Все переменные окружения настроены корректно!${colors.reset}`
    );
    return true;
  } else {
    if (totalErrors > 0) {
      console.log(
        `${colors.red}❌ Найдено критических ошибок: ${totalErrors}${colors.reset}`
      );
    }
    if (totalWarnings > 0) {
      console.log(
        `${colors.yellow}⚠️  Найдено предупреждений: ${totalWarnings}${colors.reset}`
      );
    }

    console.log(`\n${colors.blue}💡 Рекомендации:${colors.reset}`);
    console.log('   1. Создайте файл .env на основе .env.example');
    console.log('   2. Заполните все обязательные переменные');
    console.log('   3. Проверьте корректность значений');
    console.log('   4. Запустите проверку повторно');

    if (totalErrors > 0) {
      throw new Error(`Найдено критических ошибок: ${totalErrors}`);
    }
    return false;
  }
}

// Запуск только если файл вызван напрямую
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

module.exports = {
  checkEnvironmentVariables,
  validateSpecificValues,
  loadEnvFile,
  envConfig
};
