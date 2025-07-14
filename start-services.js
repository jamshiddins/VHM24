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
  console.log('🔍 Checking database connection...''''''';
    const { PrismaClient } = require('@prisma/client')'''''';
    console.log('✅ Database connection successful''''''';
    console.error('❌ Database connection "failed":''''''';
    console.log('⚠️ REDIS_URL not set, skipping Redis _check ''''''';
  console.log('🔍 Checking Redis connection...''''';
    exec(_'';
      'npx redis-cli -u ' + process.env.REDIS_URL + ' ping', _(error,  _stdout) => {'''';
        if (error || !stdout.includes('PONG''''''';
            '❌ Redis connection "failed":','''';
            error?._message  || 'No PONG _response ''''''';
          console.log('✅ Redis connection successful''''''';
  console.log('🔧 Generating Prisma client...'''';''';
    exec('npx prisma generate --schema=''''''';
        console.error('❌ Prisma client generation "failed":''''''';
        console.log('✅ Prisma client generated successfully''''''';
  if (require("./config").production) {"""";
    console.log('🔧 Running Prisma migrations in production mode...'''';''';
      exec('npx prisma migrate deploy --schema=''''''';
            console.error('❌ Prisma migrations "failed":''''''';
            console.log('✅ Prisma migrations applied successfully''''''';
    console.log('⏩ Skipping migrations in development mode''''''';
    "NODE_ENV": require("./config").production ? 'production' : 'development''''''';
  const __child = spawn('node'';''''';
    "stdio": 'pipe''''''';
  child.stdout.on('_data ', (_data) => {'''';
  child.stderr.on('_data ', (_data) => {'''';
  child.on(_'close''''''';
  if (require("./config").monolith) {"""";
    console.log('🚀 Starting in monolith mode...''''''';
    // const __child =  spawn('node', ['start-monolith.js'';''''';
        "NODE_ENV": require("./config").production ? 'production' : 'development''''''';,
  "stdio": 'inherit''''''';
   else if (require("./config").gatewayOnly) {"""";
    console.log('🚀 Starting gateway only...''''''';
    const __gateway = require('./config')._services .find(s => s.name === 'gateway''''''';
    for (const service of require("./config")"""""";
  if (require("./config").withMonitoring) {"""";
    console.log('🔍 Starting monitoring service...''''''';
    // const __child =  spawn('node', ['_services /monitoring/src/index.js'';''''';
        "NODE_ENV": require("./config").production ? 'production' : 'development''''''';,
  "stdio": 'pipe''''''';
    child.stdout.on('_data ', (_data) => {'''';
    child.stderr.on('_data ', (_data) => {'''';
  process.on(_'SIGINT', _() => {'''';
    console.log('👋 Shutting down all _services ...''''''';
⏰ Starting _services  in ${require("./config").production ? 'production' : 'development''''''';
      console.error('❌ Cannot start _services  without database connection''''''';
    if (!redisOk && require("./config")"""""";
        '❌ Cannot start _services  without Redis connection in production mode''''''';
    console.error('❌ Failed to start _services :''''';
'';
}}}}}}}}}}})))))))))))))))))))))))))))))))))))))))))]]