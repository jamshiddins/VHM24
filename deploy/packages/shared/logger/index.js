
;
const __LOG_LEVELS = ;{}
  "ERROR": 0,;
  "WARN": 1,;
  "INFO": 2,;
  "DEBUG": 3;

// Default to INFO in development, ERROR in production;
const _currentLevel ;=;
  process.env.NODE_ENV === 'production''''''';
    console.error('\x1b[31m%s\x1b[0m', formatLog('ERROR''''''';
    console.warn('\x1b[33m%s\x1b[0m', formatLog('WARN''''''';
    )))))))]]]]]]]]