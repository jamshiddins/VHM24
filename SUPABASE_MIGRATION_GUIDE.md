# 🔄 Руководство по миграции с Supabase на масштабируемую архитектуру

## 📋 Обзор изменений

### Было (Supabase):

- Единая база данных для всех сервисов
- Проблемы с масштабированием
- Зависимость от Supabase SDK
- Сложности с миграциями Prisma

### Стало (Новая архитектура):

- Разделенные схемы/базы для каждого микросервиса
- Независимое масштабирование
- Чистый PostgreSQL (Railway/Neon)
- Redis для кеширования
- Упрощенные миграции

## 🚀 Пошаговая инструкция миграции

### Шаг 1: Подготовка инфраструктуры

#### Вариант A: Railway PostgreSQL (рекомендуется)

```bash
# В Railway Dashboard:
1. Add Service → Database → PostgreSQL
2. Скопируйте DATABASE_URL
3. Добавьте в Railway Variables:
   DATABASE_URL=postgresql://...
   USE_MULTIPLE_DATABASES=false
```

#### Вариант B: Neon PostgreSQL

```bash
# Создайте проект на neon.tech
# Получите connection string
# Добавьте в переменные:
DATABASE_URL=postgresql://...@xxx.neon.tech/neondb?sslmode=require
```

### Шаг 2: Установка зависимостей

```bash
# В корне проекта
cd packages/database
npm install ioredis
npm install -D prisma-redis-middleware

# Генерация Prisma клиентов
npm run generate:all
```

### Шаг 3: Создание схем в базе данных

```bash
# Для единой базы с разными схемами
cd packages/database

# Создайте миграции для каждого сервиса
npm run migrate:dev:auth
npm run migrate:dev:machines
npm run migrate:dev:inventory
npm run migrate:dev:tasks
npm run migrate:dev:shared
```

### Шаг 4: Миграция данных

```bash
# Установите переменные окружения
export SUPABASE_DATABASE_URL="ваш-старый-url-supabase"
export DATABASE_URL="новый-url-postgresql"

# Запустите миграцию
node migrate-from-supabase.js
```

### Шаг 5: Обновление сервисов

#### Auth Service (services/auth/src/index.js):

```javascript
// Было:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Стало:
const { getAuthClient } = require('@vhm24/database');
const prisma = getAuthClient();
```

#### Machines Service (services/machines/src/index.js):

```javascript
// Было:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Стало:
const { getMachinesClient } = require('@vhm24/database');
const prisma = getMachinesClient();
```

#### Inventory Service (services/inventory/src/index.js):

```javascript
// Было:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Стало:
const { getInventoryClient } = require('@vhm24/database');
const prisma = getInventoryClient();
```

#### Tasks Service (services/tasks/src/index.js):

```javascript
// Было:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Стало:
const { getTasksClient } = require('@vhm24/database');
const prisma = getTasksClient();
```

### Шаг 6: Обновление переменных Railway

```bash
# Удалите старые Supabase переменные
railway variables --remove SUPABASE_URL
railway variables --remove SUPABASE_ANON_KEY

# Добавьте новые переменные (если используете разные БД)
railway variables --set "AUTH_DATABASE_URL=..."
railway variables --set "MACHINES_DATABASE_URL=..."
railway variables --set "INVENTORY_DATABASE_URL=..."
railway variables --set "TASKS_DATABASE_URL=..."
railway variables --set "SHARED_DATABASE_URL=..."
```

### Шаг 7: Деплой

```bash
# Закоммитьте изменения
git add .
git commit -m "Migrate from Supabase to scalable database architecture"
git push

# Railway автоматически задеплоит
```

## 🔧 Конфигурация для разных сценариев

### Сценарий 1: Единая БД с схемами (Railway)

```env
DATABASE_URL=postgresql://user:pass@host:5432/vhm24
USE_MULTIPLE_DATABASES=false
```

### Сценарий 2: Отдельные БД (Neon/Railway)

```env
USE_MULTIPLE_DATABASES=true
AUTH_DATABASE_URL=postgresql://...
MACHINES_DATABASE_URL=postgresql://...
INVENTORY_DATABASE_URL=postgresql://...
TASKS_DATABASE_URL=postgresql://...
SHARED_DATABASE_URL=postgresql://...
```

## 📊 Мониторинг после миграции

### Проверка работы:

```bash
# Тест API
node test-railway-api.js

# Проверка логов
railway logs

# Мониторинг БД
railway run prisma studio --schema=packages/database/prisma/auth/schema.prisma
```

### Метрики для отслеживания:

- Время ответа API
- Использование памяти
- Количество подключений к БД
- Размер кеша Redis

## ⚠️ Важные замечания

1. **Backup**: Всегда делайте бекап перед миграцией
2. **Тестирование**: Протестируйте на staging окружении
3. **Rollback план**: Сохраните старую конфигурацию
4. **Мониторинг**: Следите за метриками после миграции

## 🎯 Результат

После успешной миграции вы получите:

- ✅ Независимые базы данных для каждого сервиса
- ✅ Возможность масштабирования отдельных компонентов
- ✅ Улучшенную производительность с Redis кешированием
- ✅ Упрощенное управление миграциями
- ✅ Полный контроль над инфраструктурой БД

## 🆘 Troubleshooting

### Ошибка подключения к БД

```bash
# Проверьте DATABASE_URL
railway variables

# Проверьте доступность БД
railway run prisma db pull --schema=packages/database/prisma/auth/schema.prisma
```

### Ошибки миграции

```bash
# Сбросьте миграции
rm -rf packages/database/prisma/*/migrations

# Создайте заново
npm run migrate:dev:all
```

### Проблемы с типами TypeScript

```bash
# Перегенерируйте клиенты
cd packages/database
npm run generate:all
npm run build
```
