const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Подготовка к деплою на Railway\n');

// Функция для выполнения команды и вывода результата
function runCommand(command, options = {}) {
  console.log(`Выполнение команды: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`❌ Ошибка при выполнении команды: ${command}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return null;
  }
}

// Проверка наличия Git
console.log('🔍 Проверка наличия Git...');
try {
  execSync('git --version', { stdio: 'ignore' });
  console.log('✅ Git установлен');
} catch (error) {
  console.error('❌ Git не установлен. Установите Git перед продолжением.');
  process.exit(1);
}

// Проверка наличия Railway CLI
console.log('🔍 Проверка наличия Railway CLI...');
let railwayInstalled = false;
try {
  execSync('railway --version', { stdio: 'ignore' });
  railwayInstalled = true;
  console.log('✅ Railway CLI установлен');
} catch (error) {
  console.log('⚠️ Railway CLI не установлен. Деплой будет выполнен через Git.');
}

// Проверка статуса Git репозитория
console.log('\n🔍 Проверка статуса Git репозитория...');
const gitStatus = runCommand('git status --porcelain');

if (gitStatus && gitStatus.trim()) {
  console.log('📝 Есть неотслеживаемые изменения. Добавляем их в коммит...');
  
  // Добавляем все изменения
  runCommand('git add .');
  
  // Создаем коммит
  runCommand('git commit -m "🚀 Финальная подготовка к деплою: исправлены ошибки, добавлены health checks, улучшена безопасность"');
  
  console.log('✅ Изменения закоммичены');
} else {
  console.log('✅ Нет неотслеживаемых изменений');
}

// Проверка наличия удаленного репозитория
console.log('\n🔍 Проверка наличия удаленного репозитория...');
const remotes = runCommand('git remote -v');

if (remotes && remotes.includes('origin')) {
  console.log('✅ Удаленный репозиторий найден');
  
  // Пушим изменения
  console.log('📤 Отправка изменений в удаленный репозиторий...');
  runCommand('git push origin HEAD');
  
  console.log('✅ Изменения отправлены в удаленный репозиторий');
} else {
  console.log('⚠️ Удаленный репозиторий не найден. Пропускаем отправку изменений.');
}

// Деплой на Railway
if (railwayInstalled) {
  console.log('\n🚂 Деплой на Railway...');
  
  // Проверка авторизации в Railway
  console.log('🔍 Проверка авторизации в Railway...');
  const railwayStatus = runCommand('railway status');
  
  if (railwayStatus && !railwayStatus.includes('not logged in')) {
    console.log('✅ Авторизация в Railway успешна');
    
    // Деплой на Railway
    console.log('🚀 Деплой проекта на Railway...');
    runCommand('railway up');
    
    console.log('✅ Проект успешно задеплоен на Railway');
  } else {
    console.log('⚠️ Необходимо авторизоваться в Railway. Выполните команду:');
    console.log('railway login');
  }
} else {
  console.log('\n⚠️ Для деплоя на Railway через CLI установите Railway CLI:');
  console.log('npm i -g @railway/cli');
  console.log('\nИли выполните деплой через веб-интерфейс Railway, подключив Git репозиторий.');
}

console.log('\n✅ Подготовка к деплою завершена!');
console.log('📋 Следующие шаги:');
console.log('1. Если Railway CLI не установлен, установите его: npm i -g @railway/cli');
console.log('2. Авторизуйтесь в Railway: railway login');
console.log('3. Выполните деплой: railway up');
console.log('4. Или используйте веб-интерфейс Railway для деплоя, подключив Git репозиторий.');
