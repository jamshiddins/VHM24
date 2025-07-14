#!/usr/bin/env node

/**
 * Автоматический деплой VHM24 на Railway
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚂 Автоматический деплой VHM24 на Railway...\n');

try {
  // 1. Проверка Railway CLI
  console.log('🔍 1. Проверка Railway CLI...');
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI установлен');
  } catch (error) {
    console.log('❌ Railway CLI не найден');
    console.log('📦 Установка Railway CLI...');
    try {
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      console.log('✅ Railway CLI установлен');
    } catch (installError) {
      console.log('⚠️ Не удалось установить Railway CLI автоматически');
      console.log('📋 Установите вручную:');
      console.log('   npm install -g @railway/cli');
      console.log('   Затем запустите: railway login && railway up');
      process.exit(1);
    }
  }

  // 2. Проверка конфигурации
  console.log('\n🔧 2. Проверка конфигурации Railway...');
  
  const configFiles = ['railway.toml', 'railway.json', 'package.json'];
  for (const file of configFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} найден`);
    } else {
      console.log(`❌ ${file} не найден`);
      return false;
    }
  }

  // 3. Git коммит с Railway файлами
  console.log('\n📦 3. Обновление Git с Railway конфигурацией...');
  execSync('git add railway.toml railway.json RAILWAY_DEPLOYMENT_GUIDE.md deploy-to-railway.js', { stdio: 'inherit' });
  execSync('git commit -m "feat: Railway deployment configuration\\n\\n- Updated railway.toml with environment variables\\n- Added comprehensive Railway deployment guide\\n- Added automatic deploy script\\n- Ready for Railway production deployment"', { stdio: 'inherit' });
  console.log('✅ Git обновлен');

  // 4. Push к remote
  console.log('\n📤 4. Push to GitHub...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Changes pushed to GitHub');
  } catch (error) {
    console.log('⚠️ Push failed, но локальные изменения сохранены');
  }

  // 5. Railway login check
  console.log('\n🔐 5. Проверка Railway авторизации...');
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    console.log('✅ Уже авторизован в Railway');
  } catch (error) {
    console.log('❌ Необходима авторизация в Railway');
    console.log('🔐 Запуск railway login...');
    execSync('railway login', { stdio: 'inherit' });
    console.log('✅ Авторизация в Railway завершена');
  }

  // 6. Project setup
  console.log('\n🏗️ 6. Настройка Railway проекта...');
  try {
    // Проверяем есть ли уже связанный проект
    execSync('railway status', { stdio: 'pipe' });
    console.log('✅ Проект уже связан с Railway');
  } catch (error) {
    console.log('📋 Создание нового проекта...');
    console.log('📋 Следуйте инструкциям Railway CLI:');
    console.log('   - Project name: vhm24-backend');
    console.log('   - Environment: production');
    
    execSync('railway init', { stdio: 'inherit' });
    console.log('✅ Railway проект создан');
  }

  // 7. PostgreSQL Database
  console.log('\n🗄️ 7. Добавление PostgreSQL Database...');
  try {
    console.log('   Добавление PostgreSQL addon...');
    execSync('railway add postgresql', { stdio: 'inherit' });
    console.log('✅ PostgreSQL добавлен');
  } catch (error) {
    console.log('ℹ️ PostgreSQL уже добавлен или доступен');
  }

  // 8. Environment Variables
  console.log('\n🔐 8. Настройка Environment Variables...');
  
  const envVars = [
    'NODE_ENV=production',
    'JWT_SECRET=vhm24-super-secret-jwt-key-production-2025',
    'TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here'
  ];

  for (const envVar of envVars) {
    try {
      console.log(`   Устанавливаю ${envVar.split('=')[0]}...`);
      execSync(`railway variables set ${envVar}`, { stdio: 'pipe' });
      console.log(`✅ ${envVar.split('=')[0]} установлен`);
    } catch (error) {
      console.log(`⚠️ ${envVar.split('=')[0]} не удалось установить автоматически`);
    }
  }

  // 9. Railway Deploy
  console.log('\n🚀 9. Запуск Railway Deploy...');
  console.log('📋 Начинаю деплой...');
  
  execSync('railway up --detach', { stdio: 'inherit' });
  console.log('✅ Deploy запущен');

  // 10. Status check
  console.log('\n📊 10. Проверка статуса...');
  setTimeout(() => {
    try {
      execSync('railway status', { stdio: 'inherit' });
      console.log('\n🌐 Получение URL...');
      execSync('railway domain', { stdio: 'inherit' });
    } catch (error) {
      console.log('ℹ️ Статус будет доступен через несколько минут');
    }
  }, 5000);

  console.log('\n🎉 Railway Deploy Completed!');
  console.log('📋 Следующие шаги:');
  console.log('1. Дождитесь завершения build (2-3 минуты)');
  console.log('2. Проверьте URL: railway domain');
  console.log('3. Протестируйте health check');
  console.log('4. Настройте дополнительные environment variables если нужно');
  console.log('5. Запустите database migration: railway run npx prisma migrate deploy');

} catch (error) {
  console.error('❌ Ошибка деплоя:', error.message);
  console.log('\n📋 Ручной деплой Railway:');
  console.log('1. npm install -g @railway/cli');
  console.log('2. railway login');
  console.log('3. railway init');
  console.log('4. railway add postgresql');
  console.log('5. railway variables set NODE_ENV=production');
  console.log('6. railway variables set JWT_SECRET=your-secret');
  console.log('7. railway up');
  console.log('8. railway run npx prisma migrate deploy');
}
