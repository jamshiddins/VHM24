# 🔧 Railway Build Fix - VHM24

## Проблема
Railway пытался использовать Turborepo для сборки, но:
1. Отсутствовало поле `packageManager` в package.json
2. Turbo требовал сборку фронтенда, которого нет в проекте
3. Конфликт между монорепозиторием и Railway build процессом

## Решение

### 1. Удален Turborepo
- Убран из зависимостей
- Удален turbo.json
- Обновлены скрипты в package.json

### 2. Создан nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm install --workspaces --if-present"]

[phases.build]
cmds = ["npm run db:generate"]

[start]
cmd = "node index.js"
```

### 3. Обновлен railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install --workspaces --if-present && npm run db:generate"
  },
  "deploy": {
    "startCommand": "node index.js"
  }
}
```

### 4. Упрощен package.json
- Убран turbo из devDependencies
- Обновлены скрипты для прямого запуска
- Сохранена структура workspaces

## Теперь Railway должен:
1. ✅ Установить зависимости для всех workspaces
2. ✅ Сгенерировать Prisma клиент
3. ✅ Запустить index.js который стартует все сервисы

## Проверка
После деплоя проверьте:
- Build logs не содержат ошибок turbo
- Все сервисы запускаются через index.js
- Health check возвращает статус всех сервисов

---
*Исправлено: 09.01.2025*
