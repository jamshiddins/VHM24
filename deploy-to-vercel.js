#!/usr/bin/env node

/**
 * Быстрый деплой VHM24 на Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Быстрый деплой VHM24 на Vercel...\n');

try {
  // 1. Проверка Vercel CLI
  console.log('🔍 1. Проверка Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI установлен');
  } catch (error) {
    console.log('❌ Vercel CLI не найден');
    console.log('📦 Установка Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI установлен');
  }

  // 2. Проверка конфигурации
  console.log('\n🔧 2. Проверка конфигурации...');
  if (fs.existsSync('vercel.json')) {
    console.log('✅ vercel.json найден');
  } else {
    console.log('❌ vercel.json не найден');
    process.exit(1);
  }

  // 3. Git коммит с Vercel файлами
  console.log('\n📦 3. Обновление Git...');
  execSync('git add vercel.json VERCEL_DEPLOYMENT_GUIDE.md deploy-to-vercel.js', { stdio: 'inherit' });
  execSync('git commit -m "feat: add Vercel deployment configuration\n\n- Add vercel.json for serverless deployment\n- Add comprehensive Vercel deployment guide\n- Add quick deploy script\n- Ready for Vercel production deployment"', { stdio: 'inherit' });
  console.log('✅ Git обновлен');

  // 4. Push к remote
  console.log('\n📤 4. Push to remote...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Changes pushed to GitHub');
  } catch (error) {
    console.log('⚠️ Push to remote failed, но локальные изменения сохранены');
  }

  // 5. Vercel деплой
  console.log('\n🚀 5. Запуск Vercel деплоя...');
  console.log('📋 Следуйте инструкциям Vercel CLI:');
  console.log('   - Project name: vhm24-backend');
  console.log('   - Directory: ./');
  console.log('   - Build command: (default)');
  console.log('   - Output directory: (default)\n');

  // Интерактивный деплой
  execSync('vercel', { stdio: 'inherit' });

  console.log('\n🎉 Деплой завершен!');
  console.log('📋 Следующие шаги:');
  console.log('1. Настроить environment variables в Vercel Dashboard');
  console.log('2. Запустить production деплой: vercel --prod');
  console.log('3. Проверить health check на вашем Vercel URL');
  console.log('4. Настроить database (Supabase/PlanetScale)');

} catch (error) {
  console.error('❌ Ошибка деплоя:', error.message);
  console.log('\n📋 Ручной деплой:');
  console.log('1. npm install -g vercel');
  console.log('2. vercel login');
  console.log('3. vercel');
  console.log('4. Настроить environment variables');
  console.log('5. vercel --prod');
}
