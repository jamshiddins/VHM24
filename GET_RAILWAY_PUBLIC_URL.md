# Как получить публичный DATABASE_URL из Railway

## Важно!

URL вида `postgres.railway.internal` работает только внутри Railway контейнеров. Для локальной
разработки нужен публичный URL.

## Шаги:

1. **Откройте Railway Dashboard**
   - Перейдите на https://railway.app/dashboard

2. **Выберите ваш проект**

3. **Кликните на PostgreSQL сервис**

4. **Перейдите во вкладку "Connect"**

5. **Найдите секцию "Available Variables"**

6. **Скопируйте PUBLIC DATABASE_URL**
   - Он должен выглядеть примерно так:

   ```
   postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway
   ```

   - Где HOST обычно что-то вроде: roundhouse, monorail, viaduct и т.д.

## Альтернативный способ:

1. В Railway Dashboard откройте PostgreSQL сервис
2. Перейдите в "Settings" → "Networking"
3. Если "Public Networking" выключен - включите его
4. Скопируйте "Connection String"

## Проверка подключения:

```bash
# Windows
set DATABASE_URL=postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway
cd packages/database && npx prisma db pull

# Linux/Mac
export DATABASE_URL=postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway
cd packages/database && npx prisma db pull
```

## Если не работает:

1. Проверьте, что Public Networking включен в Railway
2. Попробуйте добавить ?sslmode=require к URL
3. Проверьте firewall/антивирус
4. Убедитесь, что порт правильный (обычно не 5432)

## Для production в Railway:

Используйте внутренний URL в переменных Railway:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

или

```
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```
