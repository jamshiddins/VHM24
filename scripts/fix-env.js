const fs = require('fs');
const path = require('path');

console.log('🔧 Запуск исправления файла .env...\n');

// Функция для проверки наличия файла
function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// Проверка наличия файла .env
if (checkFileExists('.env')) {
  console.log('📋 Чтение файла .env...');
  let envContent = fs.readFileSync('.env', 'utf8');
  
  // Проверка наличия некорректных шаблонов
  if (envContent.includes('${process.env.')) {
    console.log('⚠️ Обнаружены некорректные шаблоны в файле .env');
    
    // Создание резервной копии
    fs.writeFileSync('.env.backup', envContent);
    console.log('✅ Создана резервная копия файла .env в .env.backup');
    
    // Исправление шаблонов
    envContent = envContent.replace(/\${process\.env\.([^}]+)}/g, (match, varName) => {
      console.log(`🔄 Замена шаблона ${match} на пустую строку`);
      return '';
    });
    
    // Сохранение исправленного файла
    fs.writeFileSync('.env', envContent);
    console.log('✅ Файл .env исправлен');
  } else {
    console.log('✅ Файл .env не содержит некорректных шаблонов');
  }
} else {
  console.log('⚠️ Файл .env не найден');
  
  // Проверка наличия файла .env.example
  if (checkFileExists('.env.example')) {
    console.log('📋 Создание файла .env из .env.example...');
    let envExampleContent = fs.readFileSync('.env.example', 'utf8');
    
    // Исправление шаблонов в .env.example
    envExampleContent = envExampleContent.replace(/\${process\.env\.([^}]+)}/g, '');
    
    // Сохранение исправленного файла .env
    fs.writeFileSync('.env', envExampleContent);
    console.log('✅ Файл .env создан из .env.example');
  } else {
    console.log('⚠️ Файл .env.example не найден');
    
    // Создание минимального файла .env
    const minimalEnvContent = `# Минимальный файл .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vhm24
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
`;
    
    fs.writeFileSync('.env', minimalEnvContent);
    console.log('✅ Создан минимальный файл .env');
  }
}

console.log('\n✅ Исправление файла .env завершено!');
