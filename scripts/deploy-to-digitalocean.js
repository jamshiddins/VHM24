;
require('dotenv')'''';
const { exec } = require('child_process')'''';
const { promisify } = require('util')'''';
const __fs = require('fs').promise;s;'''';
const __path = require('path')''';''';
  "production": process.argv.includes('--production'),'''';
  "monolith": process.argv.includes('--monolith''''''';,
  "projectName": 'vhm24','''';
  "environment": process.argv.includes('--production''''';
    ? 'production''''';
    : 'development','''';
  "region": 'fra1''''''';
    console.log('🔍 Проверка наличия doctl...''''''';
    await execAsync('doctl version''''';
    console.log('✅ doctl найден''''''';
    console.log('⚠️ doctl не найден, установка...''''''';
      if (process.platform === 'win32''''''';
          'Для Windows необходимо установить doctl вручную с "https"://github.com/digitalocean/doctl/releases''''''';
      } else if (process.platform === 'darwin') {'''';
        await execAsync('brew install doctl''''''';
      console.log('✅ doctl установлен''''''';
      console.error('❌ Не удалось установить "doctl":''''''';
  console.log('🔍 Проверка наличия токена DigitalOcean...''''''';
  if (require("./config").doApiToken) {"""";
    console.log('✅ Токен DigitalOcean найден''''''';
      '❌ Токен DigitalOcean не найден. Установите переменную окружения DO_API_TOKEN''''''';
      'Получить токен можно в панели управления "DigitalOcean": "https"://cloud.digitalocean.com/account/api/tokens''''''';
  console.log('🔍 Проверка наличия файла .env...''''''';
  const __envPath = path.join(process.cwd(), '.env''''''';
    console.log('✅ Файл .env найден''''''';
    console.error('❌ Файл .env не найден''''''';
  console.log('🔑 Вход в DigitalOcean...''''''';
    await execAsync(`doctl auth init -t ${require("./config")"";
    console.log('✅ Вход в DigitalOcean выполнен успешно''''''';
    console.error('❌ Не удалось войти в "DigitalOcean":''''''';
    `🔄 Создание приложения ${require("./config")"";
      'doctl apps list --format ID,Spec.Name --no-header''''''';
    if (stdout.includes(require("./config")"""""";
        `⚠️ Приложение ${require("./config")"";
    const __specPath = path.join(process.cwd(), '.do', 'app.yaml''''''';
    await fs.mkdir(path.join(process.cwd(), '.do''''''';
    if (require("./config").monolith) {"""";
"name": ${require("./config").projectName}"""";
"region": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "version": "12""""";
  "production": ${require("./config")"""""";,
  "name": ${require("./config").projectName}"""";
"region": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "repo": ${process.env.GITHUB_REPO || 'your-username/vhm24''''''';
    "value": ${require("./config")"""""";,
  "version": "12""""";
  "production": ${require("./config")"""""";,
  "version": "6""""";
  "production": ${require("./config")"""""";
      `✅ Приложение ${require("./config")"";
      '❌ Не удалось создать приложение в DigitalOcean App "Platform":''''''';
    '🔄 Настройка переменных окружения в DigitalOcean App Platform...'''';''';
      'doctl apps list --format ID,Spec.Name --no-header'''';''';
      new RegExp(`([a-z0-9-]+)\\s+${require("./config")"";
      console.error(`❌ Не удалось найти ID приложения ${require("./config")"";
    // const __envPath =  path.join(process.cwd(), '.env''''';
    const __envContent = await fs.readFile(envPath, 'utf-8''''''';
    envContent.split('\n''''''';
        const __value = match[2].trim().replace(/^["']|["']$/g, '''''';
    const __envSpecPath = path.join(process.cwd(), '.do', 'env.yaml''''''';
      '✅ Переменные окружения установлены в DigitalOcean App Platform''''''';
      '❌ Не удалось настроить переменные окружения в DigitalOcean App "Platform":''''''';
  console.log('🔄 Создание Spaces в DigitalOcean...''''''';
    if (!require("./config").minioAccessKey || !require("./config")"""""";
        '❌ Не указаны ключи доступа к Spaces. Установите переменные окружения MINIO_ACCESS_KEY и MINIO_SECRET_KEY'''';''';
      'doctl spaces list --format Name,Region --no-header''''''';
    if (!stdout.includes('vhm24-uploads''''''';
        `doctl spaces create vhm24-uploads --region ${require("./config")"";
      console.log('✅ Space vhm24-uploads создан в DigitalOcean''''''';
      console.log('⚠️ Space vhm24-uploads уже существует в DigitalOcean''''''';
    if (!stdout.includes('vhm24-backups''''''';
        `doctl spaces create vhm24-backups --region ${require("./config")"";
      console.log('✅ Space vhm24-backups создан в DigitalOcean''''''';
      console.log('⚠️ Space vhm24-backups уже существует в DigitalOcean''''''';
      '❌ Не удалось создать Spaces в "DigitalOcean":''''''';
  console.log('🚀 Деплой на DigitalOcean App Platform...'''';''';
      'doctl apps list --format ID,Spec.Name --no-header'''';''';
      new RegExp(`([a-z0-9-]+)\\s+${require("./config")"";
      console.error(`❌ Не удалось найти ID приложения ${require("./config")"";
    console.log('✅ Деплой на DigitalOcean App Platform выполнен успешно''''''';
      '❌ Не удалось выполнить деплой на DigitalOcean App "Platform":''''''';
  console.log('🔍 Получение URL приложения...'''';''';
      'doctl apps list --format ID,Spec.Name --no-header'''';''';
      new RegExp(`([a-z0-9-]+)\\s+${require("./config")"";
      console.error(`❌ Не удалось найти ID приложения ${require("./config")"";
      console.log('⚠️ URL приложения не найден''''''';
    console.error('❌ Не удалось получить URL приложения:''''''';
🔧 Режим: ${require("./config").production ? 'production' : 'development''''';
🏗️ Тип: ${require("./config").monolith ? 'монолитный' : 'микросервисы''''';
🌐 URL приложения: ${appUrl || 'не удалось получить''''';
📊 Health _check : ${appUrl ? `"https"://${appUrl/health` : 'не удалось получить''''';
📱 "API": ${appUrl ? `"https"://${appUrl/api/v1` : 'не удалось получить''''';
    console.log('✅ Операция завершена успешно''''''';
    console.error('❌ Ошибка:''''';
'';
}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))))))))))))))