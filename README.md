# VHM24 - VendHub Manager 24/7

## 🎯 О проекте

VHM24 (VendHub Manager 24/7) - это современная платформа для управления сетью вендинговых автоматов с круглосуточным доступом. Система предоставляет полный контроль над автоматами, инвентарем, задачами и аналитикой через веб-интерфейс и Telegram бота.

### Ключевые особенности
- 🤖 **24/7 доступ** через Telegram бота
- 📊 **Реал-тайм мониторинг** состояния автоматов
- 📦 **Управление инвентарем** с отслеживанием остатков
- 📋 **Система задач** для технического обслуживания
- 📈 **Аналитика и отчеты** по продажам и работе
- 🔐 **Многоуровневая система ролей** (Admin, Manager, Operator, etc.)
- 🌐 **RESTful API** для интеграций
- 🔄 **WebSocket** для real-time обновлений

## 🏗️ Архитектура

Проект построен на микросервисной архитектуре:

```
VHM24/
├── apps/                    # Приложения
│   ├── telegram-bot/       # Telegram бот (в разработке)
│   └── web-dashboard/      # Веб-панель управления (Next.js)
├── packages/               # Общие пакеты
│   ├── database/          # Prisma ORM и модели данных
│   └── shared-types/      # TypeScript типы
├── services/              # Микросервисы
│   ├── gateway/          # API Gateway (порт 8000)
│   ├── auth/            # Сервис авторизации (порт 3001)
│   ├── machines/        # Управление автоматами (порт 3002)
│   ├── inventory/       # Управление инвентарем (порт 3003)
│   ├── tasks/          # Управление задачами (порт 3004)
│   ├── bunkers/        # Управление бункерами (порт 3005)
│   └── telegram-bot/   # Telegram бот сервис
└── ...
```

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24

# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env

# Настройка базы данных
npm run db:setup
```

### Запуск в режиме разработки

```bash
# Запуск всех сервисов
npm run dev

# Или для Windows
quick-start.bat
```

Сервисы будут доступны по адресам:
- Gateway API: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/api/v1

## 📦 Развертывание

### Railway
Подробная инструкция в [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

```bash
# Проект готов к развертыванию на Railway
# Просто подключите GitHub репозиторий
```

### Docker (в разработке)
```bash
docker-compose up -d
```

## 🔧 Конфигурация

### Основные переменные окружения

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/vhm24

# Безопасность
JWT_SECRET=your-secret-key

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your-bot-token

# Порты сервисов
GATEWAY_PORT=8000
AUTH_PORT=3001
MACHINES_PORT=3002
INVENTORY_PORT=3003
TASKS_PORT=3004
BUNKERS_PORT=3005
```

## 📚 API Документация

### Авторизация
```bash
# Регистрация
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Вход
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Управление автоматами
```bash
# Список автоматов
GET /api/v1/machines

# Информация об автомате
GET /api/v1/machines/:id

# Создание автомата
POST /api/v1/machines
Authorization: Bearer <token>
```

Полная документация API доступна после запуска по адресу: http://localhost:8000/api/docs

## 🤖 Telegram Bot

Бот предоставляет быстрый доступ к основным функциям:

### Команды
- `/start` - Начало работы
- `/machines` - Список автоматов
- `/inventory` - Управление инвентарем
- `/tasks` - Текущие задачи
- `/reports` - Отчеты и аналитика
- `/settings` - Настройки

### Активация
1. Создайте бота через @BotFather
2. Добавьте токен в `.env`: `TELEGRAM_BOT_TOKEN=your-token`
3. Перезапустите сервисы

## 🛠️ Разработка

### Структура базы данных
- **Users** - Пользователи системы
- **Machines** - Вендинговые автоматы
- **Products** - Товары
- **InventoryItems** - Складские позиции
- **Tasks** - Задачи обслуживания
- **Transactions** - Транзакции продаж
- **AuditLogs** - Журнал действий

### Скрипты

```bash
# Управление базой данных
npm run db:generate    # Генерация Prisma клиента
npm run db:migrate     # Применение миграций
npm run db:seed        # Заполнение тестовыми данными
npm run db:studio      # Prisma Studio

# Разработка
npm run dev           # Запуск в режиме разработки
npm run test          # Тестирование
npm run format        # Форматирование кода

# Утилиты
npm run clean         # Очистка node_modules
```

## 📊 Мониторинг

Система включает встроенный мониторинг:
- Health checks для всех сервисов
- Логирование всех операций
- Audit trail для критических действий
- WebSocket для real-time обновлений

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Контакты

- GitHub: [@jamshiddins](https://github.com/jamshiddins)
- Telegram: @vhm24_support

---

**VHM24** - Управляйте вендинговым бизнесом 24/7! 🚀
