const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 Запуск скрипта для обеспечения безопасности учетных данных VHM24\n');

// Функция для создания директории, если она не существует
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Создана директория: ${dirPath}`);
    return true;
  }
  return false;
}

// Функция для генерации безопасного JWT секрета
function generateSecureJwtSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Функция для поиска hardcoded credentials в файле
function findHardcodedCredentials(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const credentials = [];

  // Регулярные выражения для поиска различных типов credentials
  const patterns = [
    // Пароли
    { regex: /(?:password|pwd|passwd|secret)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, type: 'password' },
    // API ключи
    { regex: /(?:api[_-]?key|apikey|token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"]/gi, type: 'api_key' },
    // JWT секреты
    { regex: /(?:jwt[_-]?secret|jwtsecret)\s*[:=]\s*['"]([^'"]{16,})['"]/gi, type: 'jwt_secret' },
    // URL с credentials
    { regex: /(?:https?:\/\/)([^:]+):([^@]+)@/gi, type: 'url_with_credentials' },
    // Хардкодед ID
    { regex: /PASSWORD_\d+\s*=\s*['"]([^'"]+)['"]/gi, type: 'hardcoded_password' }
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      credentials.push({
        type: pattern.type,
        value: match[1],
        line: content.substring(0, match.index).split('\n').length,
        match: match[0]
      });
    }
  });

  return credentials;
}

// Функция для замены hardcoded credentials на переменные окружения
function replaceHardcodedCredentials(filePath, credentials) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const envVars = {};

  credentials.forEach(cred => {
    // Генерируем имя переменной окружения
    let envVarName;
    switch (cred.type) {
      case 'password':
        envVarName = `PASSWORD_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'api_key':
        envVarName = `API_KEY_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'jwt_secret':
        envVarName = 'JWT_SECRET';
        break;
      case 'url_with_credentials':
        envVarName = `URL_${Math.floor(Math.random() * 1000)}`;
        break;
      case 'hardcoded_password':
        // Для PASSWORD_123 = "value" оставляем имя переменной как есть
        const passwordMatch = cred.match.match(/PASSWORD_\d+/);
        if (passwordMatch) {
          envVarName = passwordMatch[0];
        } else {
          envVarName = `PASSWORD_${Math.floor(Math.random() * 1000)}`;
        }
        break;
      default:
        envVarName = `SECRET_${Math.floor(Math.random() * 1000)}`;
    }

    // Заменяем hardcoded credentials на process.env
    const replacement = cred.match.replace(cred.value, `\${process.env.${envVarName}}`);
    content = content.replace(cred.match, replacement);
    
    // Сохраняем значение для добавления в .env
    envVars[envVarName] = cred.value;
    
    modified = true;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Заменены hardcoded credentials в ${filePath}`);
    
    // Добавляем переменные в .env файл
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    let envUpdated = false;
    Object.entries(envVars).forEach(([key, value]) => {
      if (!envContent.includes(`${key}=`)) {
        envContent += `\n${key}=${value}`;
        envUpdated = true;
      }
    });
    
    if (envUpdated) {
      fs.writeFileSync('.env', envContent);
      console.log(`✅ Добавлены переменные окружения в .env файл`);
    }
    
    return true;
  }

  return false;
}

// Функция для обновления JWT секрета в .env файле
function updateJwtSecret() {
  if (!fs.existsSync('.env')) {
    console.log(`⚠️ Файл .env не найден`);
    return false;
  }

  let envContent = fs.readFileSync('.env', 'utf8');
  
  // Проверяем, есть ли JWT_SECRET в .env
  if (envContent.includes('JWT_SECRET=')) {
    const jwtSecretRegex = /JWT_SECRET=([^\n]+)/;
    const match = envContent.match(jwtSecretRegex);
    
    if (match && match[1].length < 64) {
      // Генерируем новый безопасный JWT секрет
      const newJwtSecret = generateSecureJwtSecret();
      
      // Заменяем старый JWT секрет на новый
      envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${newJwtSecret}`);
      
      fs.writeFileSync('.env', envContent);
      console.log(`✅ Обновлен JWT_SECRET в .env файле`);
      return true;
    }
  } else {
    // Добавляем JWT_SECRET в .env
    const newJwtSecret = generateSecureJwtSecret();
    envContent += `\nJWT_SECRET=${newJwtSecret}`;
    
    fs.writeFileSync('.env', envContent);
    console.log(`✅ Добавлен JWT_SECRET в .env файл`);
    return true;
  }
  
  return false;
}

// Функция для удаления чувствительных данных из репозитория
function removeCredentialsFromRepo() {
  // Создаем .gitignore, если его нет
  if (!fs.existsSync('.gitignore')) {
    fs.writeFileSync('.gitignore', '');
  }
  
  let gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  
  // Добавляем .env в .gitignore, если его там нет
  if (!gitignoreContent.includes('.env')) {
    gitignoreContent += '\n# Environment variables\n.env\n.env.*\n!.env.example\n';
    fs.writeFileSync('.gitignore', gitignoreContent);
    console.log(`✅ Добавлен .env в .gitignore`);
  }
  
  // Создаем .env.example, если его нет
  if (!fs.existsSync('.env.example')) {
    if (fs.existsSync('.env')) {
      let envContent = fs.readFileSync('.env', 'utf8');
      
      // Заменяем значения переменных на примеры
      envContent = envContent
        .replace(/JWT_SECRET=.+/g, 'JWT_SECRET=your_jwt_secret_here')
        .replace(/DATABASE_URL=.+/g, 'DATABASE_URL=postgresql://user:password@localhost:5432/dbname')
        .replace(/REDIS_URL=.+/g, 'REDIS_URL=redis://localhost:6379')
        .replace(/TELEGRAM_BOT_TOKEN=.+/g, 'TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here')
        .replace(/PASSWORD_\d+=.+/g, 'PASSWORD_XXX=your_password_here');
      
      fs.writeFileSync('.env.example', envContent);
      console.log(`✅ Создан .env.example из .env с удаленными чувствительными данными`);
    } else {
      console.log(`⚠️ Файл .env не найден, невозможно создать .env.example`);
    }
  }
  
  return true;
}

// Функция для проверки безопасности JWT токенов
function checkJwtSecurity() {
  const jwtFiles = [
    'services/auth/src/index.js',
    'services/gateway/src/index.js',
    'packages/shared/middleware/auth.js'
  ];
  
  let modified = false;
  
  jwtFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Файл не найден: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли JWT токены без срока жизни
    const jwtSignRegex = /(jwt\.sign|sign|fastify\.jwt\.sign)\(\s*({[^}]*}|[^,]+)\s*,\s*(['"][^'"]+['"]|[^,)]+)\s*(?:,\s*({[^}]*})?\s*)?\)/g;
    
    let match;
    while ((match = jwtSignRegex.exec(content)) !== null) {
      const [fullMatch, func, payload, secret, options] = match;
      
      // Если нет options или в options нет expiresIn
      if (!options || !options.includes('expiresIn')) {
        // Добавляем expiresIn
        let replacement;
        
        if (!options) {
          replacement = `${func}(${payload}, ${secret}, { expiresIn: '1d' })`;
        } else if (options.trim() === '{}') {
          replacement = `${func}(${payload}, ${secret}, { expiresIn: '1d' })`;
        } else {
          // Удаляем закрывающую скобку и добавляем expiresIn
          replacement = `${func}(${payload}, ${secret}, ${options.slice(0, -1)}, expiresIn: '1d' })`;
        }
        
        content = content.replace(fullMatch, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Добавлен срок жизни JWT токенам в ${filePath}`);
    }
  });
  
  return modified;
}

// Функция для проверки и исправления небезопасной обработки ошибок
function fixErrorHandling() {
  const files = [
    'services/auth/src/index.js',
    'services/inventory/src/index.js',
    'services/tasks/src/index.js',
    'services/data-import/src/index.js',
    'services/gateway/src/index.js',
    'services/machines/src/index.js',
    'services/warehouse/src/index.js',
    'services/telegram-bot/src/index.js'
  ];
  
  let modified = false;
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Файл не найден: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли небезопасная обработка ошибок
    const errorSendRegex = /reply\.send\s*\(\s*err\s*\)/g;
    
    if (errorSendRegex.test(content)) {
      // Заменяем на безопасную обработку ошибок
      content = content.replace(errorSendRegex, `reply.code(500).send({ 
        statusCode: 500, 
        error: 'Internal Server Error', 
        message: 'An unexpected error occurred' 
      })`);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Исправлена небезопасная обработка ошибок в ${filePath}`);
      modified = true;
    }
  });
  
  return modified;
}

// Основные операции

// 1. Обновляем JWT секрет
console.log('\n🔑 Обновление JWT секрета...');
updateJwtSecret();

// 2. Ищем и заменяем hardcoded credentials в файлах
console.log('\n🔍 Поиск и замена hardcoded credentials...');
const filesToCheck = [
  'services/auth/src/index.js',
  'services/inventory/src/index.js',
  'services/tasks/src/index.js',
  'services/data-import/src/index.js',
  'services/gateway/src/index.js',
  'services/machines/src/index.js',
  'services/warehouse/src/index.js',
  'services/telegram-bot/src/index.js',
  'packages/shared/middleware/auth.js',
  'packages/shared/utils/config.js'
];

filesToCheck.forEach(filePath => {
  const credentials = findHardcodedCredentials(filePath);
  if (credentials.length > 0) {
    console.log(`Найдено ${credentials.length} hardcoded credentials в ${filePath}`);
    replaceHardcodedCredentials(filePath, credentials);
  }
});

// 3. Проверяем безопасность JWT токенов
console.log('\n🔒 Проверка безопасности JWT токенов...');
checkJwtSecurity();

// 4. Исправляем небезопасную обработку ошибок
console.log('\n🛡️ Исправление небезопасной обработки ошибок...');
fixErrorHandling();

// 5. Удаляем чувствительные данные из репозитория
console.log('\n🧹 Удаление чувствительных данных из репозитория...');
removeCredentialsFromRepo();

console.log('\n✅ Скрипт для обеспечения безопасности учетных данных завершен!');
