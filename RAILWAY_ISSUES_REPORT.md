# 🚨 Отчет о проблемах с Railway и их решения

## Текущий статус

✅ **Проект работает локально** - все сервисы успешно запускаются через `npm start` ❌ **Проект не
деплоится на Railway** - обнаружены следующие проблемы:

## Обнаруженные проблемы

### 1. ✅ ИСПРАВЛЕНО: Неправильный файл запуска в nixpacks.toml

- **Проблема**: В `nixpacks.toml` был указан несуществующий файл `railway-start.js`
- **Решение**: Изменен на `start.js`

### 2. ❌ Отсутствует railway.json

- **Проблема**: В документации упоминается `railway.json`, но файл отсутствует
- **Решение**: Создать файл конфигурации Railway

### 3. ⚠️ Возможные проблемы с переменными окружения

- **Проблема**: Railway требует специфичные переменные окружения
- **Решение**: Убедиться, что все переменные настроены в Railway Dashboard

### 4. ⚠️ Проблемы с Prisma в production

- **Проблема**: Prisma требует генерации клиента перед запуском
- **Решение**: В `nixpacks.toml` уже есть команда `npm run db:generate`

## Рекомендуемые действия

### 1. Создать railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Обновить nixpacks.toml для лучшей совместимости

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = [
  "npm ci --workspaces --if-present",
  "npm install"
]

[phases.build]
cmds = [
  "cd packages/database && npx prisma generate",
  "npm run build --workspaces --if-present"
]

[start]
cmd = "node start.js"
```

### 3. Проверить переменные окружения в Railway

Обязательные переменные:

- `DATABASE_URL` - должна быть от Railway PostgreSQL
- `JWT_SECRET` - сгенерировать безопасный ключ
- `PORT` - Railway автоматически назначает
- `RAILWAY_ENVIRONMENT` - Railway устанавливает автоматически

Опциональные:

- `REDIS_URL` - если используется Redis
- `TELEGRAM_BOT_TOKEN` - для Telegram бота
- `ADMIN_IDS` - ID администраторов

### 4. Проверить логи деплоя в Railway

```bash
railway logs -d
```

### 5. Убедиться в правильной структуре проекта

Railway ожидает:

- `package.json` в корне ✅
- Скрипт `start` в package.json ✅
- Правильные пути к файлам ✅

## Альтернативное решение - упрощенный запуск

Если проблемы продолжаются, можно создать упрощенный файл запуска для Railway:

```javascript
// railway-start.js
if (process.env.RAILWAY_ENVIRONMENT) {
  // Запуск только Gateway в Railway
  process.env.PORT = process.env.PORT || 8000;
  require('./services/gateway/src/index.js');
} else {
  // Локальный запуск всех сервисов
  require('./start.js');
}
```

И обновить nixpacks.toml:

```toml
[start]
cmd = "node railway-start.js"
```

## Проверка после исправлений

1. Закоммитить изменения в Git
2. Запушить в репозиторий
3. Railway автоматически начнет новый деплой
4. Проверить логи: `railway logs`
5. Проверить статус: `railway status`

## Контакты поддержки

- Railway Discord: https://discord.gg/railway
- Railway Status: https://railway.app/status
- Документация: https://docs.railway.app
