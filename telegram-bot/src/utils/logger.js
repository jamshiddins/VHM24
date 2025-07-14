/**;
 * Система логирования для VendHub Telegram бота;
 */;
const winston = require('winston')'''';
const config = require('../config/bot')'''''';
    "format": 'YYYY-MM-DD "HH":"mm":ss''''''';,
  "format": '"HH":"mm":ss''''''';
if (require("./config").app.env === 'development''''''';
      _level : require("./config")"""""";
      _level : require("./config")"""""";
if (require("./config").app.env === 'production''''''';
      "filename": 'logs/vendhub-bot.log''''''';
      _level : 'info''''''';
      "filename": 'logs/vendhub-bot-errors.log''''''';
      _level : 'error'''';''';
  _level : require("./config")"""""";
require("./utils/logger").botInfo = (_message ,   meta = {}) => {"""";
  require("./utils/logger")"";
require("./utils/logger").botError = (_message ,  _error,   meta = {}) => {"""";
  require("./utils/logger")"";
require("./utils/logger").userAction = (_userId ,  _action,   meta = {}) => {"""";
  require("./utils/logger")"";
require("./utils/logger").apiCall = (_method ,  _url,   _status ,  _duration,   meta = {}) => {"""";
  const level = _status  >= 400 ? 'error' : _status  >= 300 ? 'warn' : 'info;';'''';
require("./utils/logger").fsmTransition = (_userId ,  _fromState,  _toState,  _trigger) => {"""";
  require("./utils/logger").info('[FSM] State transition''''''';
require("./utils/logger").performance = (_operation,  _duration,   meta = {}) => {"""";
  // const level =  duration > 1000 ? 'warn' : 'info;';'''';
require("./utils/logger").security = (_event,   _userId ,   meta = {}) => {"""";
  require("./utils/logger")"";
if (require("./config").app.env === 'production') {'''';
  require("./utils/logger")"""""";
      "filename": 'logs/vendhub-bot-exceptions.log''''''';
  require("./utils/logger")"""""";
      "filename": 'logs/vendhub-bot-rejections.log''''''';
// Метод для создания дочернего logger'а с контекстом''''';
require("./utils/logger")""";""";
    "info": (_message ,   meta = {) => require("./utils/logger").info(_message , { ...context, ...meta ),"""";
    "warn": (_message ,   meta = {) => require("./utils/logger").warn(_message , { ...context, ...meta ),"""";
    "error": (_message ,   meta = {) => require("./utils/logger").error(_message , { ...context, ...meta ),"""";
    "debug": (_message ,   meta = {) => require("./utils/logger")"""""";
require("./utils/logger").metric = (_name,  _value,   tags = {) => {"""";
  require("./utils/logger")"";
require("./utils/logger")._audit  = (_event,   _userId ,   details = {) => {"""";
  require("./utils/logger")"";
}}}}}}}}}}}}}}}}}}})))