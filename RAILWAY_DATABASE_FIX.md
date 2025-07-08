# 🔧 Railway - Исправление DATABASE_URL

## ✅ Хорошие новости:
- Все сервисы запускаются успешно
- Telegram Bot работает
- Gateway доступен

## ❌ Проблема:
```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`
```

## 🚨 РЕШЕНИЕ:

### 1. Проверьте переменные в Railway

В Railway Dashboard → Variables проверьте:

1. **Есть ли DATABASE_URL?**
   - Если НЕТ → добавьте: `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - Если ДА → удалите и добавьте заново

2. **Правильный ли формат?**
   - ❌ НЕПРАВИЛЬНО: `DATABASE_URL=какой-то-url`
   - ✅ ПРАВИЛЬНО: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### 2. Убедитесь что PostgreSQL сервис называется "Postgres"

В Railway Dashboard проверьте название PostgreSQL сервиса:
- Если называется иначе (например "PostgreSQL"), используйте:
  ```
  DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
  ```

### 3. Альтернативный способ

Если референс не работает:
1. Откройте PostgreSQL сервис в Railway
2. Скопируйте CONNECTION STRING (начинается с `postgresql://`)
3. Вставьте напрямую:
   ```
   DATABASE_URL=postgresql://postgres:password@host:5432/railway
   ```

## 📋 Проверочный чеклист:

- [ ] PostgreSQL сервис добавлен и запущен
- [ ] В переменных есть DATABASE_URL
- [ ] DATABASE_URL использует правильный референс или прямой URL
- [ ] URL начинается с `postgresql://`

## 🔍 Как проверить что работает:

После исправления DATABASE_URL:
1. Railway автоматически перезапустит
2. В логах не должно быть ошибки "Error validating datasource"
3. Откройте: `https://your-app.railway.app/health`

---
*Основная проблема - DATABASE_URL не подключен правильно к PostgreSQL*
