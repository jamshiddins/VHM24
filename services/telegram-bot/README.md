# VHM24 Telegram Bot Service

Telegram Bot интерфейс для управления вендинговыми машинами через платформу VHM24.

## 🚀 Возможности

- 🔐 **Аутентификация** - Безопасный вход через username/password
- 🏭 **Управление машинами** - Просмотр состояния, телеметрии, QR-коды
- 📦 **Управление инвентарем** - Контроль остатков, low stock уведомления
- 📋 **Система задач** - Создание, назначение и отслеживание задач
- 📊 **Отчеты** - Генерация отчетов в Excel/PDF форматах
- 🔔 **Уведомления** - Умные оповещения о важных событиях
- 🌐 **Мультиязычность** - Поддержка EN/RU/UZ/KZ языков
- 📱 **QR-коды** - Быстрый доступ к машинам и задачам

## 📋 Требования

- Node.js 18+
- Telegram Bot Token (получить у [@BotFather](https://t.me/botfather))
- Доступ к VHM24 API Gateway

## 🛠️ Установка

1. Установите зависимости:
```bash
cd services/telegram-bot
npm install
```

2. Настройте переменные окружения:
```bash
# Скопируйте .env.example в корень проекта
cp ../../.env.example ../../.env

# Отредактируйте .env и добавьте:
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
ADMIN_IDS=your-telegram-id,other-admin-id
API_URL=http://localhost:4000/api/v1
```

3. Создайте директорию для логов:
```bash
mkdir -p logs
```

## 🚀 Запуск

### Development режим:
```bash
npm run dev
```

### Production режим:
```bash
npm start
```

## 🤖 Команды бота

- `/start` - Начать работу и авторизоваться
- `/machines` - Управление вендинговыми машинами
- `/inventory` - Управление инвентарем
- `/tasks` - Просмотр и управление задачами
- `/reports` - Генерация отчетов
- `/settings` - Настройки бота
- `/help` - Справка по командам

## 🏗️ Архитектура

```
services/telegram-bot/
├── src/
│   ├── index.js              # Точка входа
│   ├── handlers/             # Обработчики команд
│   │   ├── startHandler.js   # Авторизация
│   │   ├── machinesHandler.js # Машины
│   │   ├── inventoryHandler.js # Инвентарь
│   │   ├── tasksHandler.js   # Задачи
│   │   ├── reportsHandler.js # Отчеты
│   │   ├── settingsHandler.js # Настройки
│   │   └── callbackHandler.js # Callback queries
│   ├── utils/                # Утилиты
│   │   ├── auth.js           # Авторизация
│   │   ├── errorHandler.js   # Обработка ошибок
│   │   ├── formatters.js     # Форматирование данных
│   │   ├── pagination.js     # Пагинация
│   │   ├── qrGenerator.js    # Генерация QR
│   │   └── reportGenerator.js # Генерация отчетов
│   └── keyboards/            # Клавиатуры (будущее)
├── logs/                     # Логи
├── package.json
└── README.md
```

## 🔧 Конфигурация

### Переменные окружения:

- `TELEGRAM_BOT_TOKEN` - Токен бота от BotFather
- `ADMIN_IDS` - Telegram ID администраторов (через запятую)
- `API_URL` - URL API Gateway (default: http://localhost:4000/api/v1)
- `NODE_ENV` - Окружение (development/production)

### Получение Telegram ID:

1. Отправьте любое сообщение боту [@userinfobot](https://t.me/userinfobot)
2. Бот ответит вашим ID
3. Добавьте ID в ADMIN_IDS

## 📸 Скриншоты

### Главное меню
```
🏠 Main Menu

Choose an option from the menu below:
[🏭 Machines] [📦 Inventory]
[📋 Tasks] [📊 Reports]
[⚙️ Settings] [❓ Help]
[🚪 Logout]
```

### Список машин
```
🏭 Vending Machines

1. Coffee Machine A1
   📍 Building A, Floor 1
   🔧 Status: ✅ Active
   🆔 ID: `cm_a1_001`

2. Snack Machine B2
   📍 Building B, Floor 2
   🔧 Status: 🔧 Maintenance
   🆔 ID: `sm_b2_001`

Total machines: 15
```

## 🔒 Безопасность

- Пароли удаляются из чата сразу после ввода
- JWT токены хранятся в памяти
- Поддержка 2FA (в разработке)
- Ролевая модель доступа

## 🐛 Отладка

### Включить debug логи:
```bash
export DEBUG=telegram-bot:*
npm run dev
```

### Просмотр логов:
```bash
# Все логи
tail -f logs/combined.log

# Только ошибки
tail -f logs/error.log
```

## 🚧 В разработке

- [ ] Inline режим для быстрого поиска
- [ ] Голосовые команды
- [ ] Интеграция с платежными системами
- [ ] Push уведомления
- [ ] Веб-интерфейс для настройки
- [ ] Автоматические бэкапы

## 📝 Примеры использования

### Быстрый доступ к машине:
1. Отправьте фото QR-кода машины
2. Бот автоматически откроет информацию о машине

### Поиск ближайших машин:
1. Отправьте свою геолокацию
2. Бот покажет 5 ближайших машин с расстоянием

### Экспорт отчета:
1. `/reports` → Выберите тип отчета
2. Выберите период
3. Выберите формат (Excel/PDF)
4. Получите файл

## 🤝 Поддержка

- Telegram: @vhm24_support
- Email: support@vhm24.com
- Документация: https://docs.vhm24.com

## 📄 Лицензия

Proprietary - VHM24 Platform
