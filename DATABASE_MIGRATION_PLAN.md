# 🔄 План миграции с Supabase на масштабируемую архитектуру БД

## 📋 Текущее состояние
- Используется Supabase как единая PostgreSQL база
- Все микросервисы используют одну схему
- Проблемы с масштабированием и изоляцией

## 🎯 Целевая архитектура

### Вариант 1: Railway PostgreSQL с разделением по схемам
```
Railway PostgreSQL
├── Schema: auth_service
│   ├── users
│   └── audit_logs (только auth)
├── Schema: machines_service  
│   ├── machines
│   ├── locations
│   ├── machine_telemetry
│   └── service_history
├── Schema: inventory_service
│   ├── inventory_items
│   ├── stock_movements
│   └── machine_inventory
├── Schema: tasks_service
│   ├── tasks
│   └── task_actions
└── Schema: shared
    └── transactions
```

### Вариант 2: Отдельные базы для каждого сервиса
- auth_db → Railway PostgreSQL / Neon
- machines_db → Railway PostgreSQL / Neon  
- inventory_db → Railway PostgreSQL / Neon
- tasks_db → Railway PostgreSQL / Neon

## 🛠️ План миграции

### Фаза 1: Подготовка инфраструктуры
1. Создать Railway PostgreSQL или подключить Neon
2. Настроить Redis для кеширования (уже есть в Railway)
3. Подготовить переменные окружения

### Фаза 2: Разделение схем Prisma
1. Создать отдельные schema файлы для каждого сервиса
2. Настроить множественные Prisma клиенты
3. Обновить импорты в сервисах

### Фаза 3: Миграция данных
1. Экспорт данных из Supabase
2. Трансформация и разделение по схемам
3. Импорт в новые базы

### Фаза 4: Обновление сервисов
1. Обновить подключения в каждом микросервисе
2. Добавить Redis кеширование
3. Настроить connection pooling

## 📁 Структура файлов после миграции

```
packages/database/
├── prisma/
│   ├── auth/
│   │   └── schema.prisma
│   ├── machines/
│   │   └── schema.prisma
│   ├── inventory/
│   │   └── schema.prisma
│   ├── tasks/
│   │   └── schema.prisma
│   └── shared/
│       └── schema.prisma
├── src/
│   ├── clients/
│   │   ├── auth.client.ts
│   │   ├── machines.client.ts
│   │   ├── inventory.client.ts
│   │   └── tasks.client.ts
│   └── index.ts
└── package.json
```

## 🔧 Технические детали

### Connection Pooling
```javascript
// Для Railway PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/dbname?pgbouncer=true&connection_limit=10"

// Для Neon
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
```

### Redis для кеширования
```javascript
REDIS_URL="redis://default:password@redis.railway.internal:6379"
```

## ⚡ Преимущества новой архитектуры
1. ✅ Изоляция данных между сервисами
2. ✅ Независимое масштабирование
3. ✅ Лучшая производительность
4. ✅ Упрощенные миграции
5. ✅ Возможность использования разных БД для разных сервисов
