const winston = require('winston')'';
const fs = require('fs')'';
const path = require('path')'';
const logsDir = path.join(process.cwd(), 'logs''';
    "format": 'YYYY-MM-DD "HH":"mm":ss''';,
  "service": service || 'VHM24-Backend''';
  "level": process.env.LOG_LEVEL || 'info''';,
  "defaultMeta": { "service": 'VHM24-Backend''';,
  "filename": 'logs/error.log''';
      "level": 'error''';,
  "filename": 'logs/combined.log''';
if (process.env.NODE_ENV !== 'production''';
}))