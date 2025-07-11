# 📋 Следующие шаги для завершения миграции с Supabase

## 1️⃣ Создайте PostgreSQL в Railway (5 минут)

```bash
# В Railway Dashboard:
1. Откройте ваш проект
2. Нажмите "New Service"
3. Выберите "Database" → "PostgreSQL"
4. Дождитесь создания
5. Скопируйте DATABASE_URL из вкладки "Connect"
```

## 2️⃣ Обновите переменные в Railway (2 минуты)

```bash
# Добавьте новые переменные:
railway variables --set "DATABASE_URL=postgresql://..." # из шага 1
railway variables --set "USE_MULTIPLE_DATABASES=false"

# Удалите старые Supabase переменные:
railway variables --remove "SUPABASE_URL"
railway variables --remove "SUPABASE_ANON_KEY"
```

## 3️⃣ Запустите настройку локально (5 минут)

```bash
# Windows:
setup-new-database.bat

# Linux/Mac:
chmod +x setup-new-database.sh
./setup-new-database.sh
```

## 4️⃣ Создайте миграции в новой БД (10 минут)

```bash
cd packages/database

# Создайте .env файл с вашим DATABASE_URL
echo "DATABASE_URL=postgresql://..." > .env

# Запустите миграции
npm run migrate:dev:all
```

## 5️⃣ Мигрируйте данные из Supabase (если нужно)

```bash
# Установите переменные
set SUPABASE_DATABASE_URL=postgresql://postgres.pgghdmepazenwkrmagvy:5FuFtpsZcBHvjFng@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=ваш-новый-url-из-railway

# Запустите миграцию
node migrate-from-supabase.js
```

## 6️⃣ Обновите сервисы (15 минут)

### Auth Service

```javascript
// services/auth/src/index.js
// Найдите:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Замените на:
const { getAuthClient } = require('../../../packages/database');
const prisma = getAuthClient();
```

### Machines Service

```javascript
// services/machines/src/index.js
const { getMachinesClient } = require('../../../packages/database');
const prisma = getMachinesClient();
```

### Inventory Service

```javascript
// services/inventory/src/index.js
const { getInventoryClient } = require('../../../packages/database');
const prisma = getInventoryClient();
```

### Tasks Service

```javascript
// services/tasks/src/index.js
const { getTasksClient } = require('../../../packages/database');
const prisma = getTasksClient();
```

### Telegram Bot

```javascript
// services/telegram-bot/src/index.js
const { getAuthClient, getMachinesClient, getTasksClient } = require('../../../packages/database');
```

## 7️⃣ Протестируйте локально (5 минут)

```bash
# Запустите все сервисы
npm run dev

# Проверьте API
node test-railway-api.js
```

## 8️⃣ Закоммитьте и задеплойте (5 минут)

```bash
git add .
git commit -m "feat: Migrate from Supabase to scalable PostgreSQL architecture"
git push

# Railway автоматически задеплоит
```

## 9️⃣ Проверьте продакшн (5 минут)

```bash
# Проверьте логи
railway logs

# Протестируйте API
curl https://vhm24-production.up.railway.app/health
```

## 🎯 Итого: ~50 минут

### ✅ После выполнения всех шагов у вас будет:

- Полностью независимая от Supabase архитектура
- Масштабируемая система с разделением по сервисам
- Redis кеширование (от Railway)
- Готовность к росту и развитию

### 🆘 Если возникли проблемы:

1. Проверьте DATABASE_URL - он должен быть правильным
2. Убедитесь, что все миграции прошли успешно
3. Проверьте логи: `railway logs`
4. Откатитесь на предыдущий коммит если нужно

---

**Начните с шага 1** - создания PostgreSQL в Railway!
