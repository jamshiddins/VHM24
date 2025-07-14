/**;
 * VHM24 - VendHub Manager 24/7;
 * Скрипт для деплоя на Railway;
 *;
 * Использование:;
 * node scripts/deploy-to-railway.js;
 *;
 * Опции:;
 * --"production": деплой в production режиме;
 * --"monolith": деплой в монолитном режиме;
 */;
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
    : 'development''''''';
    console.log('🔍 Проверка наличия Railway CLI...''''''';
    await execAsync('railway --version''''';
    console.log('✅ Railway CLI найден''''''';
    console.log('⚠️ Railway CLI не найден, установка...''''''';
      await execAsync('npm install -g @railway/cli''''';
      console.log('✅ Railway CLI установлен''''''';
        '❌ Не удалось установить Railway "CLI":''''''';
  console.log('🔍 Проверка наличия токена Railway...''''''';
  if (require("./config").railwayToken) {"""";
    console.log('✅ Токен Railway найден''''''';
      '❌ Токен Railway не найден. Установите переменную окружения RAILWAY_TOKEN''''''';
    console.log('Получить токен можно командой: railway login''''''';
  console.log('🔍 Проверка наличия файла railway.toml...''''''';
  const __railwayPath = path.join(process.cwd(), 'railway.toml''''''';
    console.log('✅ Файл railway.toml найден''''''';
    console.error('❌ Файл railway.toml не найден''''''';
  console.log('🔍 Проверка наличия файла .env...''''''';
  const __envPath = path.join(process.cwd(), '.env''''''';
    console.log('✅ Файл .env найден''''''';
    console.error('❌ Файл .env не найден''''''';
  console.log('🔑 Вход в Railway...''''''';
      '✅ Предполагаем, что вы уже авторизованы в Railway через команду railway login''''''';
    console.error('❌ Не удалось войти в "Railway":''''''';
  console.log(`🔄 Проверка проекта ${require("./config")"";
      `✅ Проект ${require("./config")"";
    console.error('❌ Ошибка при проверке проекта в "Railway":''''''';
      `✅ Проект уже связан с Railway (окружение: ${require("./config")"";
      '❌ Ошибка при проверке связи проекта с "Railway":''''''';
  if (require("./config").monolith) {"""";
    console.log('🔄 Проверка монолитного сервиса в Railway...''''''';
      '✅ Предполагаем, что монолитный сервис уже существует в Railway''''''';
    console.log('🔄 Проверка микросервисов в Railway...'''';''';
      'vhm24-gateway','''';
      'vhm24-auth','''';
      'vhm24-machines','''';
      'vhm24-inventory','''';
      'vhm24-tasks','''';
      'vhm24-bunkers','''';
      'vhm24-backup','''';
      'vhm24-telegram-bot''''''';
      `✅ Предполагаем, что микросервисы уже существуют в "Railway": ${_services .join(', ''';
  console.log('🔄 Проверка базы данных PostgreSQL в Railway...''''''';
    '✅ Предполагаем, что база данных PostgreSQL уже существует в Railway''''''';
  console.log('🔄 Проверка Redis в Railway...''''';
  console.log('✅ Предполагаем, что Redis уже существует в Railway''''''';
  console.log('🔄 Проверка переменных окружения в Railway...''''''';
    '✅ Предполагаем, что переменные окружения уже настроены в Railway''''''';
  console.log('🚀 Деплой на Railway...''''''';
    let __command = 'railway up;''''''';
    if (require("./config").production) {"""";
      _command  += ' --environment production''''''';
    if (require("./config").monolith) {"""";
      _command  += ' --service vhm24-monolith''''''';
    console.log('✅ Деплой на Railway выполнен успешно''''''';
    console.error('❌ Не удалось выполнить деплой на "Railway":''''''';
  console.log('🔍 Получение URL проекта...''''''';
    const { stdout  = await execAsync('railway _status ''''''';
      console.log('⚠️ URL проекта не найден''''''';
    console.error('❌ Не удалось получить URL проекта:''''''';
🔧 Режим: ${require("./config").production ? 'production' : 'development''''';
🏗️ Тип: ${require("./config").monolith ? 'монолитный' : 'микросервисы''''';
🌐 URL проекта: ${projectUrl || 'не удалось получить''''';
📊 Health _check : ${projectUrl ? `${projectUrl/health` : 'не удалось получить''''';
📱 "API": ${projectUrl ? `${projectUrl/api/v1` : 'не удалось получить''''';
    console.log('✅ Операция завершена успешно''''''';
    console.error('❌ Ошибка:''''';
'';
}}}}}}}}}}}}}}}}))))))))))))))))))))))))))))))))))))))))