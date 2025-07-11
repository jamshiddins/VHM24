# 🔍 Как получить публичный URL для Railway PostgreSQL

## Ваш текущий URL (работает только внутри Railway):

```
postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@postgres.railway.internal:5432/railway
```

## Чтобы получить публичный URL:

### Способ 1: Railway Dashboard

1. Откройте https://railway.app/dashboard
2. Выберите ваш проект VHM24
3. Нажмите на PostgreSQL сервис
4. Перейдите во вкладку **"Connect"**
5. В секции **"Connect from outside Railway"** найдите публичный URL
6. Он будет выглядеть примерно так:
   ```
   postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@[публичный-хост]:[порт]/railway
   ```

### Способ 2: Railway CLI

```bash
# Установите Railway CLI если нет
npm install -g @railway/cli

# Войдите в аккаунт
railway login

# Выберите проект
railway link

# Получите переменные
railway variables
```

## Временное решение - используйте mock режим:

Пока вы получаете публичный URL, можете работать без базы данных:

1. **Запустите только Web Dashboard:**

   ```bash
   cd apps/web-dashboard
   npm run dev
   ```

   Откройте http://localhost:3000

2. **Создайте временный .env для разработки:**

   ```bash
   # Скопируйте текущий .env
   copy .env .env.railway

   # Создайте локальный .env
   echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vhm24" > .env
   ```

## После получения публичного URL:

1. Обновите .env файл с публичным URL
2. Запустите миграции:
   ```bash
   npx prisma db push --schema=packages/database/prisma/schema.prisma
   ```
3. Запустите все сервисы:
   ```bash
   node start-with-railway.js
   ```

## 📝 Примечание:

Railway предоставляет два URL:

- **Internal** (postgres.railway.internal) - для production
- **Public** (обычно через proxy.rlwy.net) - для локальной разработки

Вам нужен второй для работы с локального компьютера.
