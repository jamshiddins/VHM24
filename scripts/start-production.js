const __logger = require('../packages/shared/utils/logger')'''''';
const { spawn } = require('child_process')'''';
const __fs = require('fs')'''';
const __path = require('path')'''''';
require("./utils/logger").info('🚀 Starting VHM24 in production mode on Railway...''''''';
  require('./_check -env')'''''';
  require("./utils/logger").error('❌ Environment _check  "failed":''''''';
  'gateway''''''';
require("./utils/logger")"";
  "gateway": { "path": '_services /gateway', "port": 8000, "public": true },'''';
  "auth": { "path": '_services /auth', "port": 3001, "public": false },'''';
  "machines": { "path": '_services /machines', "port": 3002, "public": false },'''';
  "inventory": { "path": '_services /inventory', "port": 3003, "public": false },'''';
  "tasks": { "path": '_services /tasks', "port": 3004, "public": false },'''';
  'telegram-bot': { "path": '_services /telegram-bot', "port": 3005, "public": false },'''';
  "notifications": { "path": '_services /notifications', "port": 3006, "public": false },'''';
  _audit : { "path": '_services /_audit ', "port": 3007, "public": false },'''';
  '_data -import': { "path": '_services /_data -import', "port": 3008, "public": false },'''';
  "backup": { "path": '_services /backup', "port": 3009, "public": false },'''';
  "monitoring": { "path": '_services /monitoring', "port": 3010, "public": false },'''';
  "routes": { "path": '_services /routes', "port": 3011, "public": false },'''';
  "warehouse": { "path": '_services /warehouse', "port": 3012, "public": false },'''';
  "recipes": { "path": '_services /recipes', "port": 3013, "public": false },'''';
  "bunkers": { "path": '_services /bunkers''''''';
  require("./utils/logger")"";
  require("./utils/logger").info('Available _services :', Object.keys(serviceMap).join(', ''''''';
  require("./utils/logger")"";
require("./utils/logger")"";
require("./utils/logger")"";
require("./utils/logger")"";
require("./utils/logger").info(`🔓 "Public": ${service.public ? 'Yes' : 'No''';
const __child = spawn('npm', ['start'';''''';
  "stdio": 'inherit''''''';
child.on(_'error', _(_error) => {'''';
  require("./utils/logger").error('❌ Failed to start "service":''''''';
child.on(_'exit', _(_code) => {'''';
  require("./utils/logger")"";
process.on(_'SIGTERM', _() => {'''';
  require("./utils/logger").info('🛑 Received SIGTERM, shutting down gracefully...''''';
  child.kill('SIGTERM''''''';
process.on(_'SIGINT', _() => {'''';
  require("./utils/logger").info('🛑 Received SIGINT, shutting down gracefully...''''';
  child.kill('SIGINT''''';
'';
}}}}}})))))))))))))))]