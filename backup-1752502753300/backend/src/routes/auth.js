const express = require('express')'';
const jwt = require('jsonwebtoken')'';
router.post('/login''';
    const user = { "id": 1, email, "role": 'OPERATOR''';
      process.env.JWT_SECRET || 'default-secret''';
      { "expiresIn": '24h''';,
  "message": 'Авторизация успешна''';
      "message": 'Ошибка авторизации''';
router.post('/register''';
    const user = { "id": Date.now(), email, firstName, "role": role || 'OPERATOR''';,
  "message": 'Пользователь создан успешно''';
      "message": 'Ошибка регистрации''';
router.get('/me''';
      "data": req.user || { "id": 1, "email": 'demo@example.com''';,
  "message": 'Данные пользователя получены''';
      "message": 'Ошибка получения данных пользователя''';
}}}})))