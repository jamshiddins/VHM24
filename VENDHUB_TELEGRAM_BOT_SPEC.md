# VendHub Telegram Bot Specification

## Архитектура бота

### Технологии
- **Framework**: Telegraf.js v4
- **State Management**: FSM (Finite State Machine)
- **База данных**: PostgreSQL через Prisma ORM
- **Кеширование**: Redis для сессий
- **Медиа хранилище**: S3-совместимое (MinIO/AWS S3)

### Структура FSM состояний

```
START
├── AUTH
│   ├── PHONE_REQUEST
│   └── PHONE_CONFIRM
├── MAIN_MENU
│   ├── WAREHOUSE_MENU
│   ├── OPERATOR_MENU
│   ├── MANAGER_MENU
│   └── ADMIN_MENU
└── OPERATIONS
    ├── BUNKER_*
    ├── SYRUP_*
    ├── WATER_*
    ├── MACHINE_*
    ├── FINANCE_*
    └── REPORTS_*
```

## Роли и права доступа

### WAREHOUSE (Склад)
- Прием товаров и партий
- Выдача компонентов операторам
- Инвентаризация склада
- Просмотр остатков

### OPERATOR (Оператор)
- Обслуживание автоматов
- Операции с бункерами/сиропами/водой
- Сбор выручки
- Фотоотчеты

### MANAGER (Менеджер)
- Все функции OPERATOR
- Просмотр отчетов
- Управление контрактами
- Аналитика

### ADMIN (Администратор)
- Полный доступ
- Управление пользователями
- Корректировка данных
- Системные настройки

## Основные команды

### Общие команды
- `/start` - Начало работы
- `/menu` - Главное меню
- `/help` - Помощь
- `/profile` - Профиль пользователя
- `/cancel` - Отмена текущей операции

### Команды по ролям
- `/machines` - Список автоматов (OPERATOR+)
- `/stock` - Остатки на складе (WAREHOUSE+)
- `/reports` - Отчеты (MANAGER+)
- `/users` - Управление пользователями (ADMIN)

## Детальные сценарии

### 1. Авторизация

```mermaid
graph TD
    A[/start] --> B{Есть в базе?}
    B -->|Нет| C[Запрос телефона]
    B -->|Да| D[Главное меню]
    C --> E[Отправка кода]
    E --> F[Проверка кода]
    F --> G{Код верный?}
    G -->|Да| D
    G -->|Нет| E
```

#### Состояния:
- `AUTH.PHONE_REQUEST` - Запрос номера телефона
- `AUTH.PHONE_CONFIRM` - Подтверждение кода

#### Клавиатуры:
```javascript
// Запрос телефона
{
  keyboard: [[{
    text: "📱 Отправить номер телефона",
    request_contact: true
  }]],
  resize_keyboard: true
}

// Подтверждение кода
{
  keyboard: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["⬅️ Удалить", "0", "✅ OK"]
  ],
  resize_keyboard: true
}
```

### 2. Операции с бункерами

#### 2.1 Заполнение бункера

**Состояния:**
- `BUNKER.SELECT` - Выбор бункера
- `BUNKER.SCAN_QR` - Сканирование QR кода (опционально)
- `BUNKER.WEIGH_EMPTY` - Взвешивание пустого
- `BUNKER.FILL_INGREDIENT` - Выбор ингредиента и партии
- `BUNKER.WEIGH_FULL` - Взвешивание полного
- `BUNKER.PHOTO` - Фотофиксация
- `BUNKER.CONFIRM` - Подтверждение

**Пример диалога:**
```
БОТ: 🗃 Выберите бункер или отправьте фото QR-кода
    [Inline клавиатура со списком бункеров]

USER: [Выбирает SET-005-1CO]

БОТ: Бункер SET-005-1CO (Кофе)
    📊 Текущий статус: На складе
    ⚖️ Введите вес пустого бункера (г):

USER: 450

БОТ: ✅ Вес пустого: 450г
    🌟 Выберите партию для заполнения:
    
    1️⃣ PARTY-2024-COFF-08
    📦 Остаток: 45.5 кг
    📅 Годен до: 01.12.2024
    
    2️⃣ PARTY-2024-COFF-10
    📦 Остаток: 80 кг
    📅 Годен до: 15.01.2025

USER: [Выбирает партию 2]

БОТ: ✅ Выбрана партия PARTY-2024-COFF-10
    🔄 Заполните бункер и взвесьте
    ⚖️ Введите вес полного бункера (г):

USER: 1450

БОТ: 📊 Результаты заполнения:
    • Пустой: 450г
    • Полный: 1450г
    • Нетто: 1000г
    
    📸 Отправьте фото заполненного бункера

USER: [Отправляет фото]

БОТ: ✅ Операция сохранена!
    
    🗃 Бункер: SET-005-1CO
    ☕ Ингредиент: Кофе (1000г)
    📦 Партия: PARTY-2024-COFF-10
    🕐 Время: 15.01.2024 09:00
    
    [Вернуться в меню]
```

#### 2.2 Установка в автомат

**Состояния:**
- `BUNKER.SELECT_FOR_INSTALL` - Выбор бункера
- `BUNKER.SELECT_MACHINE` - Выбор автомата
- `BUNKER.SELECT_POSITION` - Выбор позиции
- `BUNKER.CONFIRM_INSTALL` - Подтверждение

**Клавиатуры:**
```javascript
// Выбор автомата - inline keyboard
{
  inline_keyboard: [
    [{text: "VM-001-TASH-CENT 📍", callback_data: "machine:VM-001"}],
    [{text: "VM-015-TASH-WEST 📍", callback_data: "machine:VM-015"}],
    [{text: "🔍 Поиск по коду", callback_data: "search_machine"}]
  ]
}

// Выбор позиции - визуальная схема
{
  inline_keyboard: [
    [
      {text: "1️⃣ Кофе", callback_data: "pos:1"},
      {text: "2️⃣ Сливки", callback_data: "pos:2"}
    ],
    [
      {text: "3️⃣ Шоколад", callback_data: "pos:3"},
      {text: "4️⃣ Сахар", callback_data: "pos:4"}
    ],
    [
      {text: "5️⃣ Молоко", callback_data: "pos:5"},
      {text: "6️⃣ Капучино", callback_data: "pos:6"}
    ],
    [
      {text: "7️⃣ Декаф", callback_data: "pos:7"},
      {text: "8️⃣ Чай", callback_data: "pos:8"}
    ]
  ]
}
```

#### 2.3 Снятие из автомата

**Состояния:**
- `BUNKER.SELECT_MACHINE_REMOVE` - Выбор автомата
- `BUNKER.SELECT_BUNKER_REMOVE` - Выбор бункера для снятия
- `BUNKER.WEIGH_RETURN` - Взвешивание возврата
- `BUNKER.WASTE_WEIGHT` - Вес отходов (опционально)
- `BUNKER.PHOTO_REMOVE` - Фото состояния
- `BUNKER.CONFIRM_REMOVE` - Подтверждение

### 3. Операции с сиропами

#### 3.1 Прием нового сиропа

**Состояния:**
- `SYRUP.NEW_TYPE` - Выбор типа
- `SYRUP.NEW_VOLUME` - Ввод объема
- `SYRUP.NEW_BATCH` - Выбор партии
- `SYRUP.NEW_EXPIRY` - Срок годности
- `SYRUP.NEW_PHOTO` - Фото
- `SYRUP.NEW_CONFIRM` - Подтверждение

**Пример inline клавиатуры для типов:**
```javascript
{
  inline_keyboard: [
    [
      {text: "🍯 Карамель", callback_data: "syrup:CARAMEL"},
      {text: "🍦 Ваниль", callback_data: "syrup:VANILLA"}
    ],
    [
      {text: "🥥 Кокос", callback_data: "syrup:COCONUT"},
      {text: "🌰 Лесной орех", callback_data: "syrup:HAZELNUT"}
    ],
    [
      {text: "🥃 Амаретто", callback_data: "syrup:AMARETTO"},
      {text: "☘️ Ирландский крем", callback_data: "syrup:IRISH_CREAM"}
    ],
    [
      {text: "🍫 Шоколад", callback_data: "syrup:CHOCOLATE"}
    ],
    [
      {text: "➕ Другой тип", callback_data: "syrup:CUSTOM"}
    ]
  ]
}
```

### 4. Обслуживание автомата

#### 4.1 Комплексное обслуживание

**Состояния:**
- `MACHINE.SELECT_SERVICE` - Выбор автомата
- `MACHINE.SERVICE_TYPE` - Тип обслуживания
- `MACHINE.SERVICE_CHECKLIST` - Чек-лист операций
- `MACHINE.SERVICE_COMPONENTS` - Замена компонентов
- `MACHINE.SERVICE_REVENUE` - Сбор выручки
- `MACHINE.SERVICE_PHOTOS` - Фотоотчет
- `MACHINE.SERVICE_COMPLETE` - Завершение

**Чек-лист обслуживания:**
```
☐ Проверка работоспособности
☐ Чистка поддона
☐ Проверка уровней ингредиентов
☐ Чистка миксеров
☐ Проверка системы подачи воды
☐ Тест приготовления напитков
☐ Сбор выручки
☐ Фотоотчет
```

### 5. Финансовые операции

#### 5.1 Сбор выручки

**Состояния:**
- `FINANCE.REVENUE_MACHINE` - Выбор автомата
- `FINANCE.REVENUE_CASH` - Ввод наличных
- `FINANCE.REVENUE_QR` - QR платежи (автоматически)
- `FINANCE.REVENUE_PHOTO` - Фото чеков/отчета
- `FINANCE.REVENUE_CONFIRM` - Подтверждение

**Пример ввода:**
```
БОТ: 💰 Сбор выручки VM-015-TASH-WEST
    
    📊 Последний сбор: 10.01.2024
    💳 QR платежи: 125,000 сум (автоматически)
    
    💵 Введите сумму наличных:

USER: 45000

БОТ: ✅ Наличные: 45,000 сум
    💳 QR: 125,000 сум
    💰 Итого: 170,000 сум
    
    📸 Отправьте фото Z-отчета или чеков

USER: [Отправляет фото]

БОТ: ✅ Выручка зафиксирована!
    
    🏪 Автомат: VM-015-TASH-WEST
    💰 Сумма: 170,000 сум
    📅 Период: 10.01 - 15.01.2024
    
    [Распечатать отчет] [В меню]
```

#### 5.2 Регистрация расхода

**Состояния:**
- `FINANCE.EXPENSE_CATEGORY` - Категория расхода
- `FINANCE.EXPENSE_AMOUNT` - Сумма
- `FINANCE.EXPENSE_DETAILS` - Детали
- `FINANCE.EXPENSE_DOCUMENT` - Документы
- `FINANCE.EXPENSE_CONFIRM` - Подтверждение

### 6. Отчеты

#### 6.1 Оперативные отчеты

**Доступные отчеты:**
```
📊 ОПЕРАТИВНЫЕ ОТЧЕТЫ

1️⃣ Состояние автоматов
2️⃣ Низкие остатки ингредиентов
3️⃣ Требуемые пополнения
4️⃣ График обслуживания
5️⃣ Активные неисправности

📈 АНАЛИТИКА

6️⃣ Доходность по автоматам
7️⃣ Популярность напитков
8️⃣ Эффективность операторов
```

**Пример отчета:**
```
📊 СОСТОЯНИЕ АВТОМАТОВ
Дата: 15.01.2024 11:00

✅ Активные: 38 из 45
⚠️ Требуют внимания: 5
🔧 На ремонте: 2

ТРЕБУЮТ ВНИМАНИЯ:
━━━━━━━━━━━━━━━
🔴 VM-005-TASH-NORTH
├ 📍 ТЦ Мега Планет
├ ⚠️ Кофе < 10%
└ 👤 Оператор: Петров И.

🟡 VM-015-TASH-WEST
├ 📍 ул. Амира Темура, 15
├ ⚠️ Требует чистки
└ 👤 Оператор: Сидоров А.

[Подробнее] [Экспорт PDF]
```

### 7. Дополнительные функции

#### 7.1 Сканирование QR кодов

Бот поддерживает QR коды для:
- Идентификации автоматов
- Идентификации бункеров
- Быстрого доступа к операциям

Формат QR кода:
```json
{
  "type": "machine|bunker|operation",
  "code": "VM-015-TASH-WEST",
  "action": "service|fill|install"
}
```

#### 7.2 Геолокация

При операциях фиксируется:
- GPS координаты пользователя
- Сверка с локацией автомата
- Автоматическое определение ближайших автоматов

#### 7.3 Уведомления

**Автоматические уведомления:**
- Низкий уровень ингредиентов
- Приближение срока обслуживания
- Истечение срока годности
- Неисправности автоматов
- Новые задачи

**Настройка уведомлений:**
```
⚙️ НАСТРОЙКИ УВЕДОМЛЕНИЙ

🔔 Низкие остатки: ВКЛ
├ Порог: < 20%
└ Время: 08:00

🔔 График обслуживания: ВКЛ
├ За: 1 день
└ Время: 09:00

🔔 Сроки годности: ВКЛ
├ За: 7 дней
└ Время: 10:00
```

#### 7.4 Исторический ввод данных

**Возможности:**
- Указание фактического времени операции
- Пакетный ввод за прошлые периоды
- Импорт из Excel/CSV

**Пример:**
```
БОТ: 📅 Когда была выполнена операция?
    
    [Сегодня] [Вчера] [Выбрать дату]

USER: [Выбрать дату]

БОТ: 📅 Выберите дату:
    [Календарь inline keyboard]

USER: [15.01.2024]

БОТ: 🕐 Введите время (ЧЧ:ММ):

USER: 14:30

БОТ: ✅ Дата и время: 15.01.2024 14:30
```

## Технические детали

### Структура состояний FSM

```javascript
// states.js
const states = {
  AUTH: {
    PHONE_REQUEST: 'auth.phone_request',
    PHONE_CONFIRM: 'auth.phone_confirm'
  },
  MAIN_MENU: 'main_menu',
  BUNKER: {
    SELECT: 'bunker.select',
    SCAN_QR: 'bunker.scan_qr',
    WEIGH_EMPTY: 'bunker.weigh_empty',
    FILL_INGREDIENT: 'bunker.fill_ingredient',
    WEIGH_FULL: 'bunker.weigh_full',
    PHOTO: 'bunker.photo',
    CONFIRM: 'bunker.confirm'
  },
  // ... другие состояния
};
```

### Middleware для проверки прав

```javascript
// middleware/auth.js
const requireRole = (roles) => async (ctx, next) => {
  const user = await getUser(ctx.from.id);
  
  if (!user || !roles.some(role => user.roles.includes(role))) {
    return ctx.reply('❌ У вас нет доступа к этой функции');
  }
  
  ctx.state.user = user;
  return next();
};
```

### Обработка медиа файлов

```javascript
// handlers/media.js
const handlePhoto = async (ctx, operation) => {
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileId = photo.file_id;
  
  // Загрузка в S3
  const url = await uploadToS3(fileId, operation);
  
  // Сохранение в контексте операции
  ctx.session.currentOperation.photos.push(url);
  
  return url;
};
```

### Валидация данных

```javascript
// validators/bunker.js
const validateWeight = (weight) => {
  if (!weight || weight < 0 || weight > 5000) {
    throw new Error('Вес должен быть от 0 до 5000 грамм');
  }
  return true;
};

const validateNetWeight = (empty, full) => {
  if (full <= empty) {
    throw new Error('Вес полного бункера должен быть больше пустого');
  }
  return true;
};
```

## Интеграция с API

### Синхронизация данных

```javascript
// services/api.js
class VendHubAPI {
  async createBunkerOperation(data) {
    return await fetch('/api/bunkers/operations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }
}
```

### Обработка оффлайн режима

```javascript
// services/offline.js
class OfflineQueue {
  async add(operation) {
    await redis.lpush('offline_queue', JSON.stringify(operation));
  }
  
  async sync() {
    const operations = await redis.lrange('offline_queue', 0, -1);
    for (const op of operations) {
      try {
        await api.sync(JSON.parse(op));
        await redis.lrem('offline_queue', 1, op);
      } catch (e) {
        console.error('Sync failed:', e);
      }
    }
  }
}
```

## Мониторинг и логирование

### Метрики

- Количество активных пользователей
- Количество операций по типам
- Время ответа бота
- Ошибки и исключения

### Логирование

```javascript
// utils/logger.js
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Развертывание

### Docker контейнер

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "src/index.js"]
```

### Переменные окружения

```env
# Telegram
BOT_TOKEN=your_bot_token
WEBHOOK_URL=https://api.vendhub.uz/telegram/webhook

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vendhub

# Redis
REDIS_URL=redis://localhost:6379

# S3
S3_ENDPOINT=https://s3.vendhub.uz
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=vendhub-media

# API
API_BASE_URL=https://api.vendhub.uz
API_KEY=your_api_key
