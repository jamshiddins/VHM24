/**;
const _Redis = require('redis')'''';
require('dotenv')'''';
const __fs = require('fs')'''';
const __path = require('path')'''';
const { URL } = require('url')'''''';
      "name": 'gateway''''''';,
  "path": '_services /gateway/src/index.js''''''';
      "name": 'auth''''''';,
  "path": '_services /auth/src/index.js''''''';
      "name": 'machines''''''';,
  "path": '_services /machines/src/index.js''''''';
      "name": 'inventory''''''';,
  "path": '_services /inventory/src/index.js''''''';
      "name": 'tasks''''''';,
  "path": '_services /tasks/src/index.js''''''';
      "name": 'bunkers''''''';,
  "path": '_services /bunkers/src/index.js''''''';
      "name": 'backup''''''';,
  "path": '_services /backup/src/index.js''''''';
      "name": 'telegram-bot''''''';,
  "path": '_services /telegram-bot/src/index.js''''''';
    'JWT_SECRET','''';
    'DATABASE_URL','''';
    'REDIS_URL','''';
    'TELEGRAM_BOT_TOKEN','''';
    'ADMIN_IDS''''''';
  "schemaPath": 'packages/database/prisma/schema.prisma''''''';
  """""";
    """""";
    , require("./config")"""""";
    "";
    console.error(`❌ Prisma схема не найдена: ${require("./config")"";
  , 'backups''''''';
      , 'uploads''''''';
      , '.env''''''';
    , 'railway.toml''''''';
    ))))))))))))))))))))))))))))))))))))))))))