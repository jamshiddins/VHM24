# 📊 Анализ соответствия VHM24 → VendBot Platform

## 🔄 Сравнение проектов

| Компонент | VHM24 (текущий) | VendBot (требуется) | Статус |
|-----------|-----------------|---------------------|---------|
| **Название** | vhm24-platform | vendbot-platform | ❌ Разные |
| **Готовность** | ~70% базовая инфра | 30% по чек-листу | ⚠️ |

## 📋 Детальный анализ по чек-листу

### 1. **Инфраструктура и окружение**
- ✅ Docker окружение (PostgreSQL, Redis, MinIO) - **ЕСТЬ**
- ✅ Node.js зависимости - **ЕСТЬ**
- ❌ Python окружение для Telegram bot - **НЕТ**
- ⚠️ Переменные окружения - **ЧАСТИЧНО** (нет BOT_TOKEN)

### 2. **База данных**
- ✅ Prisma ORM - **ЕСТЬ**
- ❌ Таблицы VendBot - **НЕТ** (другая схема)
  - Отсутствуют: Bunker, BunkerSet, Ingredient, Recipe, Payment, FiscalRecord, Discrepancy
  - Есть простые: Machine, Task, User

### 3. **Сервисы**
| Сервис | VHM24 | VendBot | Реализация |
|--------|-------|---------|------------|
| Gateway | ✅ Есть | ✅ Нужен | Базовая |
| Auth | ✅ Есть | ✅ Нужен | Заглушка |
| Machines | ✅ Есть | ✅ Нужен | Минимальная |
| Inventory | ✅ Есть | ✅ Нужен | Пустой |
| Tasks | ✅ Есть | ✅ Нужен | Пустой |
| Reconciliation | ❌ Нет | ✅ Нужен | - |
| Notifications | ❌ Нет | ✅ Нужен | - |

### 4. **Приложения**
- ❌ **Telegram Bot** - НЕТ (требуется Python/aiogram)
- ❌ **Web Dashboard** - НЕТ (требуется Next.js 14)
- ❌ **Mobile PWA** - НЕТ

### 5. **Функциональность**

#### ❌ **Роли пользователей (RBAC)**
VHM24: Простые роли
VendBot: admin, manager, warehouse, operator, technician, driver

#### ❌ **Учет оборудования**
VHM24: Простые машины
VendBot: 
- Машины с кодами CVM-00001
- Бункеры SET-00001 (комплекты по 8 штук)
- Ингредиенты с рецептами

#### ❌ **Бизнес-процессы**
VHM24: Базовые CRUD
VendBot: Сложная логика с фотофиксацией, взвешиванием, геолокацией

#### ❌ **Модуль сверки платежей**
VHM24: Отсутствует
VendBot: Требуется интеграция с VendHub, мультикассой, QR-шлюзами

## 🚀 План миграции VHM24 → VendBot

### Этап 1: Переименование и структура (1 день)
```bash
# 1. Переименовать проект
mv vhm24-platform vendbot-platform
# Обновить package.json, README

# 2. Создать недостающие директории
mkdir -p apps/mobile-pwa
mkdir -p services/reconciliation
mkdir -p services/notifications
mkdir -p packages/utils
mkdir -p packages/ui-kit
```

### Этап 2: База данных (2-3 дня)
```prisma
// Добавить в schema.prisma:
model Bunker {
  id          String   @id
  code        String   @unique
  setId       String
  position    Int
  weight      Float?
  ingredient  Ingredient?
  // ...
}

model Ingredient {
  id          String   @id
  name        String
  unit        String
  recipes     Recipe[]
  // ...
}

model Payment {
  id          String   @id
  amount      Float
  source      String
  // ...
}

model FiscalRecord {
  id          String   @id
  // ...
}

model Discrepancy {
  id          String   @id
  // ...
}
```

### Этап 3: Python Telegram Bot (3-4 дня)
```python
# apps/telegram-bot/requirements.txt
aiogram==3.3.0
aiohttp==3.9.1
python-dotenv==1.0.0
pydantic==2.5.2

# Реализовать FSM для операторов
# Команды: /start, /task, /inventory, /report
```

### Этап 4: Web Dashboard на Next.js (1 неделя)
```bash
cd apps/web-dashboard
npx create-next-app@latest . --typescript --tailwind --app
# Реализовать страницы:
# - /login
# - /dashboard  
# - /machines
# - /tasks
# - /inventory
# - /reconciliation
```

### Этап 5: Бизнес-логика сервисов (2 недели)

#### Tasks Service
```typescript
// Полный CRUD для задач
// Статусы: CREATED → ASSIGNED → IN_PROGRESS → COMPLETED
// Фотофиксация каждого шага
// Геолокация обязательна
```

#### Inventory Service  
```typescript
// Учет бункеров и ингредиентов
// Взвешивание при установке/снятии
// История перемещений
// Контроль остатков
```

#### Reconciliation Service
```typescript
// Сопоставление транзакций
// Источники: автомат, VendHub, касса
// Автоматическое выявление расхождений
// Формирование отчетов
```

### Этап 6: Интеграции (1-2 недели)
- VendHub API
- Платежные системы
- Фискализация
- SMS/Email уведомления

## 📊 Оценка трудозатрат

| Компонент | Сложность | Время |
|-----------|-----------|--------|
| Переименование | Низкая | 1 день |
| База данных | Средняя | 3 дня |
| Telegram Bot | Высокая | 4 дня |
| Web Dashboard | Высокая | 7 дней |
| Сервисы (3 шт) | Очень высокая | 14 дней |
| Интеграции | Высокая | 10 дней |
| **ИТОГО** | | **~40 дней** |

## 🎯 Рекомендации

### Вариант 1: Полная миграция (рекомендую)
- Переименовать VHM24 в VendBot
- Поэтапно добавлять функционал
- Сохранить работающую базу

### Вариант 2: Новый проект
- Создать vendbot-platform с нуля
- Перенести только нужные компоненты
- Больше времени, но чище код

### Вариант 3: Адаптация
- Оставить название VHM24
- Добавить только критичный функционал
- Быстрее, но не полное соответствие

## ⚠️ Критические различия

1. **Python vs Node.js для Telegram**
   - VendBot требует Python/aiogram
   - VHM24 может использовать Node.js

2. **Сложность бизнес-логики**
   - VendBot: взвешивание, фото, геолокация
   - VHM24: простые CRUD операции

3. **Модуль сверки**
   - VendBot: критичный компонент
   - VHM24: отсутствует

## 📌 Вывод

**VHM24 соответствует VendBot примерно на 20-30%**

Основные расхождения:
- Другая доменная модель (бункеры, ингредиенты)
- Нет Python Telegram bot
- Нет Web Dashboard на Next.js
- Нет модуля сверки платежей
- Упрощенная бизнес-логика

Для полного соответствия потребуется существенная доработка или создание нового проекта.
