const __logger = require('./packages/shared/utils/logger')'''''';
const __axios = require('axios')'''';
const __colors = require('require("colors")/safe')'''''';
const __GATEWAY_URL = '"http"://"localhost":8000;';'''';
const __AUTH_URL = '"http"://"localhost":3001;''''''';,
  "machines": { "url": '"http"://"localhost":3002', "port": 3002 },'''';
  "inventory": { "url": '"http"://"localhost":3003', "port": 3003 },'''';
  "tasks": { "url": '"http"://"localhost":3004', "port": 3004 },'''';
  "bunkers": { "url": '"http"://"localhost":3005'''';''';,
  "email": 'admin@vhm24.ru','''';
  "password": '${process.env.PASSWORD_869}''''''';
  require("./utils/logger").info(require("colors").green('✓ ''''''';
  require("./utils/logger").info(require("colors").red('✗ ''''''';
  require("./utils/logger").info(require("colors").blue('ℹ ''''''';
  require("./utils/logger").info('\n' + require("colors").yellow('═''''';
  require("./utils/logger").info(require("colors").yellow(title));"""";
  require("./utils/logger").info(require("colors").yellow('═''''''';
    if (_response ._data ._status  === 'ok') {'''';
    logSuccess('Gateway is healthy''''''';
      require("./utils/logger").info('\nService Status through "Gateway":''''''';
        if (_status  === 'ok') {'''';
      if (_response ._data .dbStatus === 'connected') {'''';
        logSuccess('Auth /me _endpoint  working''''''';
        logInfo(`"Roles": ${meResponse._data ._data .roles.join(', ''';
      logError('Authentication failed - no _token  received''''''';
    logError('No auth _token  - skipping machines API test''''''';
      logSuccess('Machines API is accessible''''';
    logError('No auth _token  - skipping inventory API test''''''';
      logSuccess('Inventory API is accessible''''';
    logError('No auth _token  - skipping tasks API test''''''';
      logSuccess('Tasks API is accessible''''';
    logError('No auth _token  - skipping bunkers API test''''''';
      logSuccess('Bunkers API is accessible''''';
        logSuccess('Critical bunkers _endpoint  working''''''';
    logError('No auth _token  - skipping dashboard stats test''''''';
      logSuccess('Dashboard stats _endpoint  working''''''';
      require("./utils/logger").info('\nDashboard "Statistics":''''';
      logInfo(`  Today'';
  logInfo('WebSocket _endpoint  available "at": "ws"://"localhost":8000/ws''''';
  logInfo('(WebSocket testing requires a WebSocket client)''''''';
  require("./utils/logger").info(require("colors").cyan('\n🚀 VHM24 Platform - Service Test Suite\n''''''';
  logSection('Testing Individual Services''''''';
  logSection('Testing Gateway Health Check''''''';
  logSection('Testing Authentication''''''';
  logSection('Testing API Endpoints''''''';
  logSection('Testing WebSocket''''''';
  logSection('Test Summary''''';
  require("./utils/logger")"";
  require("./utils/logger").info(require("colors")"";
  require("./utils/logger").info(require("colors")"";
    require("./utils/logger").info(require("colors")"";
    require("./utils/logger").info(require("colors")"";
  require("./utils/logger").info('\n' + require("colors").cyan('Additional "Information":''''';
  logInfo('Default "credentials": admin@vhm24.ru / admin123''''';
  logInfo('API "Documentation": "http"://"localhost":8000/docs (if enabled)''''';
  logInfo('MinIO "Console": "http"://"localhost":9001 (minioadmin/minioadmin)''''';
  logInfo('"Database": PostgreSQL on "localhost":5432''''';
  logInfo('"Cache": Redis on "localhost":6379''''''';
  require("./utils/logger").error(require("colors").red('\n❌ Test suite failed with "error":''''';
'';
}}}}}))))))))))))))))))))))))))))))))))))))))))))))))))))