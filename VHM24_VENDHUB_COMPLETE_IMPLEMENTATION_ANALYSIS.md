# VHM24 VendHub - Полный анализ и план реализации

## 📋 Анализ технического задания

### Основные компоненты системы:

1. **Telegram-бот** - основной интерфейс для сотрудников
2. **Web-интерфейс** - админ-панель и отчеты
3. **API** - REST API для интеграций
4. **База данных** - PostgreSQL с полной схемой
5. **Файловое хранилище** - S3/DigitalOcean Spaces

### Роли пользователей:
- **admin** - полный доступ
- **manager** - управление задачами, отчеты, справочники
- **warehouse** - склад, приём/выдача, сумки, бункеры
- **operator** - выполнение задач, маршруты, замены
- **technician** - ремонт, диагностика
- **driver** - маршруты, доставка

## 🏗️ Архитектура системы

### 1. База данных (PostgreSQL)

#### Основные таблицы:
```sql
-- Пользователи и роли
users (id, telegram_id, name, role, status, created_at)
roles (id, name, permissions)

-- Автоматы и локации
machines (id, internal_code, model, serial_number, location_id, status, sim_card, electricity_meter)
locations (id, name, address, coordinates, rent_cost, electricity_cost)

-- Ингредиенты и бункеры
ingredients (id, name, type, unit, shelf_life_days, min_stock, price)
hoppers (id, code, ingredient_id, weight_empty, weight_current, status, cycles_count)

-- Сумки и комплекты
bags (id, code, assigned_machine_id, status, created_at)
bag_contents (bag_id, hopper_id, syrup_id, quantity)

-- Сиропы и вода
syrups (id, name, bottle_volume, status, expiry_date)
water_bottles (id, unique_code, volume, weight_full, weight_current, status)

-- Задачи и чек-листы
tasks (id, type, machine_id, assigned_user_id, status, created_at, deadline)
task_checklists (id, task_id, step_name, status, photo_url, weight, timestamp)

-- Продажи и платежи
sales (id, machine_id, product_name, amount, payment_method, timestamp)
payments (id, sale_id, provider, amount, status, transaction_id)

-- Финансы
expenses (id, category, amount, date, machine_id, user_id, description)
incomes (id, source, amount, date, machine_id, description)

-- Журнал действий
action_logs (id, user_id, action_type, object_type, object_id, timestamp, details)
```

### 2. API Endpoints

#### Аутентификация
- `POST /api/auth/telegram` - авторизация через Telegram
- `GET /api/auth/me` - получить текущего пользователя

#### Пользователи
- `GET /api/users` - список пользователей
- `POST /api/users` - создать пользователя
- `PUT /api/users/:id` - обновить пользователя
- `DELETE /api/users/:id` - удалить пользователя

#### Автоматы
- `GET /api/machines` - список автоматов
- `POST /api/machines` - создать автомат
- `PUT /api/machines/:id` - обновить автомат
- `GET /api/machines/:id/status` - статус автомата

#### Задачи
- `GET /api/tasks` - список задач
- `POST /api/tasks` - создать задачу
- `PUT /api/tasks/:id` - обновить задачу
- `POST /api/tasks/:id/complete` - завершить задачу

#### Склад
- `GET /api/inventory` - остатки на складе
- `POST /api/inventory/receive` - приём товара
- `POST /api/inventory/issue` - выдача товара
- `GET /api/bags` - список сумок
- `POST /api/bags` - создать сумку

#### Отчеты
- `GET /api/reports/sales` - отчет по продажам
- `GET /api/reports/inventory` - отчет по остаткам
- `GET /api/reports/tasks` - отчет по задачам
- `GET /api/reports/finance` - финансовый отчет

### 3. Telegram Bot FSM

#### Состояния по ролям:

**Manager:**
```
START → MAIN_MENU
├── CREATE_TASK → SELECT_MACHINE → SELECT_TYPE → CONFIRM
├── VIEW_REPORTS → SELECT_REPORT → SHOW_REPORT
├── MANAGE_INVENTORY → SELECT_ACTION → PROCESS
└── SETTINGS → SELECT_SETTING → UPDATE
```

**Warehouse:**
```
START → MAIN_MENU
├── RECEIVE_GOODS → SCAN_ITEM → ENTER_WEIGHT → CONFIRM
├── PREPARE_BAG → SELECT_TASK → SELECT_HOPPERS → PACK
├── ISSUE_BAG → SELECT_BAG → CONFIRM_ISSUE
└── RETURN_PROCESS → SCAN_BAG → WEIGH_ITEMS → CONFIRM
```

**Operator:**
```
START → MAIN_MENU
├── MY_ROUTES → SELECT_ROUTE → SELECT_MACHINE → EXECUTE_TASK
├── REPLACE_HOPPERS → PHOTO_BEFORE → REPLACE → PHOTO_AFTER → WEIGH
├── REPLACE_WATER → SELECT_BOTTLES → INSTALL → RETURN_OLD
├── CLEANING → CHECKLIST → PHOTO_BEFORE → CLEAN → PHOTO_AFTER
└── CASH_COLLECTION → COUNT_CASH → PHOTO → SUBMIT
```

### 4. Чек-листы по типам задач

#### Замена бункеров:
1. Фото автомата до замены
2. Снятие старых бункеров (с номерами)
3. Взвешивание снятых бункеров
4. Установка новых бункеров
5. Фото автомата после замены
6. Подтверждение завершения

#### Замена воды:
1. Получение новых бутылей (с номерами)
2. Установка в автомат
3. Фото установленных бутылей
4. Возврат старых бутылей
5. Взвешивание возвращенных бутылей

#### Чистка автомата:
1. Фото до чистки
2. Внешняя чистка корпуса
3. Внутренняя чистка
4. Замена расходников
5. Фото после чистки
6. Тестовая покупка

#### Инкассация:
1. Фото купюроприемника
2. Подсчет наличных
3. Фото наличных
4. Передача менеджеру
5. Подтверждение получения

## 🔧 Текущее состояние проекта

### Что уже реализовано:
✅ Базовая структура проекта
✅ PostgreSQL база данных на Railway
✅ Redis для сессий
✅ Базовые API endpoints
✅ Telegram bot основа
✅ Prisma ORM настроена
✅ Переменные окружения настроены

### Что нужно доработать:

#### 1. База данных
- [ ] Создать полную схему Prisma
- [ ] Добавить все необходимые таблицы
- [ ] Настроить связи между таблицами
- [ ] Создать индексы для производительности

#### 2. API
- [ ] Реализовать все endpoints
- [ ] Добавить валидацию данных
- [ ] Настроить авторизацию по ролям
- [ ] Добавить загрузку файлов

#### 3. Telegram Bot
- [ ] Реализовать FSM для всех ролей
- [ ] Создать меню по ролям
- [ ] Добавить обработку фото
- [ ] Реализовать чек-листы

#### 4. Web интерфейс
- [ ] Создать админ-панель
- [ ] Добавить формы для справочников
- [ ] Реализовать отчеты
- [ ] Настроить экспорт в Excel/PDF

#### 5. Интеграции
- [ ] Настроить S3 для файлов
- [ ] Добавить экспорт отчетов
- [ ] Интеграция с платежными системами
- [ ] Webhook для внешних систем

## 📋 План реализации

### Фаза 1: Основа (1-2 недели)
1. Завершить схему базы данных
2. Реализовать базовые API endpoints
3. Создать основные модели данных
4. Настроить авторизацию и роли

### Фаза 2: Telegram Bot (2-3 недели)
1. Реализовать FSM для всех ролей
2. Создать меню и команды
3. Добавить обработку фото и файлов
4. Реализовать чек-листы

### Фаза 3: Web интерфейс (2-3 недели)
1. Создать админ-панель
2. Реализовать CRUD для справочников
3. Добавить отчеты и аналитику
4. Настроить экспорт данных

### Фаза 4: Интеграции (1-2 недели)
1. Настроить файловое хранилище
2. Добавить внешние интеграции
3. Реализовать уведомления
4. Оптимизация и тестирование

## 🚀 Следующие шаги

1. **Немедленно:**
   - Завершить схему Prisma
   - Создать миграции базы данных
   - Реализовать базовые API endpoints

2. **На этой неделе:**
   - Создать основные модели
   - Настроить авторизацию
   - Начать работу над Telegram bot

3. **В ближайшие 2 недели:**
   - Завершить основную функциональность
   - Добавить web интерфейс
   - Настроить интеграции

## 📊 Оценка сложности

- **База данных:** 🟡 Средняя (много таблиц, но стандартная структура)
- **API:** 🟡 Средняя (много endpoints, но типовая логика)
- **Telegram Bot:** 🔴 Высокая (сложная FSM логика)
- **Web интерфейс:** 🟡 Средняя (стандартная админка)
- **Интеграции:** 🟠 Выше средней (внешние API)

**Общая оценка:** Проект большой и сложный, но реализуемый поэтапно.

## 💡 Рекомендации

1. **Начать с MVP** - реализовать основные функции для одной роли
2. **Поэтапная разработка** - добавлять роли и функции постепенно
3. **Тестирование** - тестировать каждую фазу перед переходом к следующей
4. **Документация** - вести документацию по мере разработки
5. **Резервное копирование** - регулярные бэкапы базы данных

---

*Анализ подготовлен: 14.07.2025*
*Статус: Готов к реализации*
