# VendHub Manager (VHM24) - Telegram Bot

Интеллектуальный Telegram бот с FSM архитектурой для управления операциями VendHub Manager - системы торговых автоматов.

## 🚀 Возможности

### Role-based интерфейсы
- **Операторы**: Управление задачами, возврат сумок, инкассация
- **Складские работники**: Сборка сумок, инвентаризация, мойка бункеров  
- **Менеджеры**: Создание задач, отчеты, управление системой
- **Техники**: Диагностика, ремонт, техобслуживание

### FSM (Finite State Machine)
- Пошаговое выполнение сложных операций
- Контекстные переходы между состояниями
- Сохранение прогресса в Redis

### Интеграция с API
- Полная интеграция с VendHub Backend API
- Авторизация пользователей через Telegram ID
- Real-time синхронизация данных

### Мультимедиа поддержка
- Загрузка и обработка фотографий
- Геолокация для контроля местоположения
- QR код сканирование
- Голосовые сообщения (опционально)

## 📋 Требования

### Системные требования
- Node.js >= 18.0.0
- Redis >= 6.0
- Доступ к VendHub Backend API
- Telegram Bot Token

### Зависимости
- **telegraf** - Telegram Bot framework
- **redis** - Сессии и кэширование
- **axios** - HTTP клиент для API
- **winston** - Логирование
- **moment** - Работа с датами
- **joi** - Валидация данных

## 🛠 Установка

### 1. Клонирование проекта
```bash
cd telegram-bot
npm install
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
```bash
# Telegram Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook

# Backend API Configuration  
API_BASE_URL=http://localhost:3000/api/v1
API_AUTH_TOKEN=your_api_auth_token

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. Получение Telegram Bot Token
1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Используйте команду `/newbot`
3. Следуйте инструкциям для получения токена
4. Добавьте токен в `.env` файл

### 4. Настройка Redis
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# macOS с Homebrew
brew install redis
brew services start redis

# Windows
# Скачайте и установите Redis с официального сайта
```

## 🚀 Запуск

### Development режим
```bash
npm run dev
```

### Production режим
```bash
npm start
```

### С использованием PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📖 Использование

### Команды бота

#### Общие команды
- `/start` - Запуск бота и авторизация
- `/help` - Справка по командам
- `/profile` - Профиль пользователя  
- `/status` - Текущий статус и задачи
- `/ping` - Проверка соединения
- `/version` - Версия бота

#### Для операторов
- `/tasks` - Мои активные задачи
- `/return` - Возврат сумок
- `/collect` - Инкассация наличных
- `/report` - Отчет за смену

#### Для складских работников
- `/inventory` - Остатки склада
- `/bags` - Управление сумками

#### Для менеджеров
- `/create` - Создать новую задачу
- `/reports` - Отчеты системы
- `/system` - Статус системы (только для ADMIN/MANAGER)

### FSM Сценарии

#### Выполнение задачи оператором
```
1. Выбор задачи → 2. Начало выполнения → 3. Пошаговый чек-лист
   ↓
4. Фото/GPS/Вес → 5. Завершение → 6. Возврат в меню
```

#### Создание сумки на складе
```
1. Выбор задачи → 2. Выбор бункеров → 3. Взвешивание
   ↓
4. Фото сумки → 5. Маркировка → 6. Готово к выдаче
```

## 🏗 Архитектура

### Структура проекта
```
src/
├── bot.js              # Основной файл бота
├── config/             # Конфигурация
├── middleware/         # Middleware функции
├── handlers/           # Обработчики команд по ролям
├── fsm/               # FSM состояния и переходы
├── keyboards/         # Клавиатуры и кнопки
├── services/          # API сервисы
├── utils/             # Утилиты
└── package.json
```

### FSM Состояния
- **IDLE** - Начальное состояние
- **MAIN_MENU** - Главное меню по ролям
- **TASK_EXECUTION** - Выполнение задач
- **PHOTO_UPLOAD** - Загрузка фотографий
- **GPS_LOCATION** - Запрос геолокации
- **WEIGHT_INPUT** - Ввод весовых данных

### API Интеграция
```javascript
// Получение задач пользователя
const tasks = await apiService.getUserTasks(userId, filters);

// Начало выполнения задачи
const task = await apiService.startTask(taskId, userId, location);

// Выполнение шага чек-листа
const result = await apiService.executeStep(stepId, executionData);
```

## 🔧 Разработка

### Добавление новых обработчиков
```javascript
// handlers/operator/myHandler.js
function setupMyHandlers(bot) {
  bot.action('my_action', async (ctx) => {
    await ctx.answerCbQuery();
    // Логика обработчика
  });
}

module.exports = setupMyHandlers;
```

### Добавление новых состояний FSM
```javascript
// fsm/states.js
const BOT_STATES = {
  // ... существующие состояния
  MY_NEW_STATE: 'my_new_state'
};
```

### Логирование
```javascript
const logger = require('../utils/logger');

// Различные уровни логирования
logger.info('Информационное сообщение');
logger.warn('Предупреждение');  
logger.error('Ошибка', error);

// Специальные методы
logger.userAction(userId, 'ACTION_NAME', metadata);
logger.apiCall('GET', '/api/tasks', 200, 150);
```

## 🐛 Отладка

### Логи
```bash
# Просмотр логов в development
tail -f logs/vendhub-bot.log

# Логи ошибок
tail -f logs/vendhub-bot-errors.log
```

### Мониторинг Redis
```bash
redis-cli monitor
```

### Проверка состояния бота
```bash
# Проверка процесса PM2
pm2 status

# Логи PM2  
pm2 logs vendhub-bot
```

## 📊 Мониторинг

### Метрики
- Количество активных пользователей
- Время выполнения команд
- Количество ошибок
- Использование памяти и CPU

### Алерты
- Критические ошибки → Telegram уведомления
- Высокая нагрузка → Email алерты
- Недоступность API → SMS уведомления

## 🔒 Безопасность

### Авторизация
- Проверка Telegram ID против базы пользователей
- Role-based доступ к функциям
- Ограничение rate limit на запросы

### Данные
- Шифрование чувствительных данных в Redis
- Логирование всех действий пользователей
- Регулярная очистка временных данных

## 🚢 Деплой

### Docker (рекомендуется)
```bash
# Сборка образа
docker build -t vendhub-bot .

# Запуск контейнера
docker run -d --name vendhub-bot \
  --env-file .env \
  -p 3001:3001 \
  vendhub-bot
```

### Railway/Heroku
```bash
# Подключение к Railway
railway login
railway link
railway up

# Установка переменных окружения
railway variables set BOT_TOKEN=your_token_here
```

### Webhook настройка
```javascript
// Для production с HTTPS
await bot.telegram.setWebhook('https://your-domain.com/webhook');

// Для development с ngrok
await bot.telegram.setWebhook('https://abc123.ngrok.io/webhook');
```

## 📝 Конфигурация

### Переменные окружения
```bash
# Основные
NODE_ENV=production
LOG_LEVEL=info
PORT=3001

# Telegram
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
WEBHOOK_URL=https://your-domain.com/webhook

# API
API_BASE_URL=https://api.vendhub.uz/v1
API_AUTH_TOKEN=your_jwt_token

# Redis
REDIS_URL=redis://user:pass@host:port
REDIS_DB=0

# Функции
ENABLE_QR_SCANNING=true
ENABLE_GPS_LOCATION=true
ENABLE_PHOTO_PROCESSING=true
```

## 🤝 Участие в разработке

### Стиль кода
- Используется ESLint + Prettier
- Комментарии на русском языке для бизнес-логики
- JSDoc для функций API

### Тестирование
```bash
npm test
```

### Линтинг
```bash
npm run lint
npm run lint:fix
```

## 📄 Лицензия

MIT License - подробности в файле LICENSE

## 🆘 Поддержка

- **Документация**: [VendHub Docs](https://docs.vendhub.uz)
- **Issues**: [GitHub Issues](https://github.com/your-org/vendhub/issues)
- **Email**: support@vendhub.uz
- **Telegram**: @vendhub_support

---

*VendHub Telegram Bot - Делаем управление торговыми автоматами простым и эффективным! 🤖*
