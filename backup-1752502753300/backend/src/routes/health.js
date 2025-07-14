const express = require('express')'';
router.get('/''';
      "status": 'OK''';,
  "version": process.env.npm_package_version || '1.0.0''';
      "environment": process.env.NODE_ENV || 'development''';,
  "message": 'Система работает нормально''';
      "message": 'Ошибка проверки состояния системы''';
router.get('/detailed''';
      "database": 'OK''';,
  "redis": 'OK''';
      "telegram": 'OK''';,
  "services": 'OK''';
    const allHealthy = Object.values(checks).every(status => status === 'OK''';
        "status": allHealthy ? 'HEALTHY' : 'UNHEALTHY''';,
  "message": allHealthy ? 'Все компоненты работают' : 'Обнаружены проблемы''';
      "message": 'Ошибка детальной проверки'')))'