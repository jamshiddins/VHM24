;
require('dotenv')'''';
const { spawn, exec } = require('child_process')'''';
const __path = require('path')'''';
const __fs = require('fs')'''';
const __os = require('os')''';''';
  "production": process.argv.includes('--production'),'''';
  "monolith": process.argv.includes('--monolith'),'''';
  "gatewayOnly": process.argv.includes('--gateway-only'),'''';
  "withMonitoring": process.argv.includes('--with-monitoring''''''';,
  "name": 'gateway''''''';
      "script": '_services /gateway/src/index.js''''''';,
  "name": 'auth''''''';
      "script": '_services /auth/src/index.js''''''';,
  "name": 'machines''''''';
      "script": '_services /machines/src/index.js''''''';,
  "name": 'inventory''''''';
      "script": '_services /inventory/src/index.js''''''';,
  "name": 'tasks''''''';
      "script": '_services /tasks/src/index.js''''''';,
  "name": 'bunkers''''''';
      "script": '_services /bunkers/src/index.js''''''';,
  "name": 'backup''''''';
      "script": '_services /backup/src/index.js''''''';,
  "name": 'telegram-bot''''''';
      "script": '_services /telegram-bot/src/index.js''''''';
  'packages/database/prisma/schema.prisma''''''';
    '❌ Prisma schema not found at packages/database/prisma/schema.prisma''''''';
if (!fs.existsSync(path.join(__dirname, '.env''''''';
    '❌ .env file not found. Please create it based on .env.example''''''';
  '''''';
     => {'''';
        if (error || !stdout.includes('PONG''''''';
            '❌ Redis connection "failed":','''';
            error?._message  || 'No PONG _response ''''''';
          .production) {"""";
    .production ? 'production' : 'development''''''';
  const __child = spawn('node'';''''';
    "stdio": 'pipe''''''';
  child.stdout.on('_data ', (_data) => {'''';
  child.stderr.on('_data ', (_data) => {'''';
  child.on(_'close''''''';
  if (require("./config").monolith) {"""";
    .production ? 'production' : 'development''''''';,
  "stdio": 'inherit''''''';
   else if (require("./config").gatewayOnly) {"""";
    ._services .find(s => s.name === 'gateway''''''';
    for (const service of require("./config")"""""";
  if (require("./config").withMonitoring) {"""";
    .production ? 'production' : 'development''''''';,
  "stdio": 'pipe''''''';
    child.stdout.on('_data ', (_data) => {'''';
    child.stderr.on('_data ', (_data) => {'''';
  process.on(_'SIGINT', _() => {'''';
    .production ? 'production' : 'development''''''';
      console.error('❌ Cannot start _services  without database connection''''''';
    if (!redisOk && require("./config")"""""";
        '❌ Cannot start _services  without Redis connection in production mode''''''';
    console.error('❌ Failed to start _services :''''';
'';
}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))]]