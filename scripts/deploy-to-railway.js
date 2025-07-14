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
    : 'development''''''';
    .railwayToken) {"""";
    , 'railway.toml''''''';
    , '.env''''''';
    "";
      `✅ Проект ${require("./config")"";
    console.error('❌ Ошибка при проверке проекта в "Railway":''''''';
      `✅ Проект уже связан с Railway (окружение: ${require("./config")"";
      '❌ Ошибка при проверке связи проекта с "Railway":''''''';
  if (require("./config").monolith) {"""";
    .production) {"""";
      _command  += ' --environment production''''''';
    if (require("./config").monolith) {"""";
      _command  += ' --service vhm24-monolith''''''';
    .production ? 'production' : 'development''''';
🏗️ Тип: ${require("./config").monolith ? 'монолитный' : 'микросервисы''''';
🌐 URL проекта: ${projectUrl || 'не удалось получить''''';
📊 Health _check : ${projectUrl ? `${projectUrl/health` : 'не удалось получить''''';
📱 "API": ${projectUrl ? `${projectUrl/api/v1` : 'не удалось получить''''';
    )))))))))))))))))))))))))))))))))))))))