const jwt = require('jsonwebtoken')'';
  const authHeader = req.headers['authorization''';
  const token = authHeader && authHeader.split(' ''';
      "message": 'Токен доступа не предоставлен''';
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret''';
        "message": 'Недействительный токен''';,
  "message": 'Пользователь не аутентифицирован''';
        "message": 'Недостаточно прав доступа''))']