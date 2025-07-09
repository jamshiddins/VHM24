const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚂 VHM24 Railway Deployment Script\n');

// Проверяем наличие Railway CLI
function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI найден');
    return true;
  } catch (error) {
    console.error('❌ Railway CLI не найден. Установите: npm install -g @railway/cli');
    return false;
  }
}

// Проверяем авторизацию в Railway
function checkRailwayAuth() {
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    console.log('✅ Авторизация в Railway активна');
    return true;
  } catch (error) {
    console.error('❌ Не авторизованы в Railway. Выполните: railway login');
    return false;
  }
}

// Проверяем наличие необходимых файлов
function checkRequiredFiles() {
  const requiredFiles = [
    'package.json',
    'nixpacks.toml',
    'railway.toml',
    'scripts/start-production.js',
    'scripts/check-env.js',
    'packages/shared/storage/s3.js'
  ];

  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.error(`❌ ${file} не найден`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Основная функция деплоя
async function deployToRailway() {
  console.log('🔍 Проверка готовности к деплою...\n');

  // Проверки
  if (!checkRailwayCLI()) return;
  if (!checkRailwayAuth()) return;
  if (!checkRequiredFiles()) return;

  console.log('\n🚀 Начинаем деплой...\n');

  try {
    // 1. Проверяем текущий проект
    console.log('1️⃣ Проверка Railway проекта...');
    try {
      const projectInfo = execSync('railway status', { stdio: 'pipe' }).toString();
      console.log('✅ Подключен к Railway проекту');
    } catch (error) {
      console.log('⚠️ Не подключен к проекту. Создаем новый...');
      execSync('railway new vhm24-production', { stdio: 'inherit' });
    }

    // 2. Добавляем базы данных если их нет
    console.log('\n2️⃣ Проверка баз данных...');
    try {
      const services = execSync('railway services', { stdio: 'pipe' }).toString();
      
      if (!services.includes('postgresql')) {
        console.log('📦 Добавляем PostgreSQL...');
        execSync('railway add postgresql', { stdio: 'inherit' });
      } else {
        console.log('✅ PostgreSQL уже добавлен');
      }
      
      if (!services.includes('redis')) {
        console.log('📦 Добавляем Redis...');
        execSync('railway add redis', { stdio: 'inherit' });
      } else {
        console.log('✅ Redis уже добавлен');
      }
    } catch (error) {
      console.log('⚠️ Не удалось проверить сервисы, продолжаем...');
    }

    // 3. Устанавливаем переменные окружения
    console.log('\n3️⃣ Настройка переменных окружения...');
    
    const envVars = {
      NODE_ENV: 'production',
      RAILWAY_SERVICE_NAME: 'gateway',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-12345678',
      TELEGRAM_BOT_TOKEN: '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
      ADMIN_IDS: '42283329',
      ALLOWED_ORIGINS: 'https://your-app.railway.app',
      MAX_FILE_SIZE: '10485760',
      RATE_LIMIT_MAX: '100',
      RATE_LIMIT_WINDOW: '60000',
      SESSION_EXPIRY: '86400000',
      EMAIL_FROM: 'noreply@vhm24.ru'
    };

    Object.entries(envVars).forEach(([key, value]) => {
      try {
        execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
        console.log(`✅ ${key} установлен`);
      } catch (error) {
        console.log(`⚠️ Не удалось установить ${key}`);
      }
    });

    // 4. Проверяем переменные окружения
    console.log('\n4️⃣ Проверка переменных окружения...');
    try {
      execSync('node scripts/check-env.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Некоторые переменные отсутствуют, но продолжаем деплой...');
    }

    // 5. Запускаем деплой
    console.log('\n5️⃣ Запуск деплоя...');
    execSync('railway up', { stdio: 'inherit' });

    // 6. Получаем URL приложения
    console.log('\n6️⃣ Получение URL приложения...');
    try {
      const domain = execSync('railway domain', { stdio: 'pipe' }).toString().trim();
      console.log(`🌐 Приложение доступно по адресу: ${domain}`);
      
      // Тестируем health endpoint
      console.log('\n7️⃣ Тестирование приложения...');
      setTimeout(() => {
        try {
          const { execSync } = require('child_process');
          execSync(`curl -f ${domain}/health`, { stdio: 'pipe' });
          console.log('✅ Health check прошел успешно');
        } catch (error) {
          console.log('⚠️ Health check не прошел, проверьте логи');
        }
      }, 30000); // Ждем 30 секунд для запуска

    } catch (error) {
      console.log('⚠️ Не удалось получить домен, проверьте Railway dashboard');
    }

    console.log('\n🎉 Деплой завершен!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Настройте DigitalOcean Spaces (см. DIGITALOCEAN_SPACES_SETUP.md)');
    console.log('2. Обновите ALLOWED_ORIGINS с реальным URL');
    console.log('3. Проверьте логи: railway logs');
    console.log('4. Настройте домен: railway domain add your-domain.com');

  } catch (error) {
    console.error('\n❌ Ошибка деплоя:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Проверьте логи: railway logs');
    console.log('2. Проверьте переменные: railway variables');
    console.log('3. Проверьте статус: railway status');
  }
}

// Запуск
deployToRailway();
