# VHM24 - VendHub Manager 24/7

Система управления вендинговыми машинами с полным циклом обслуживания.

## 🚀 Быстрый старт

### Требования

- Node.js 16-21
- PostgreSQL (или Railway PostgreSQL)
- Redis (опционально)

### Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24
```

2. Скопируйте и настройте переменные окружения:

```bash
cp .env.example .env
# Отредактируйте .env и добавьте ваши данные
```

3. Установите зависимости:

```bash
npm run install:all
```

4. Запустите проект:

```bash
node start-project.js
```

## 📁 Структура проекта

```
VHM24/
├── backend/              # Монолитный backend API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Middleware (auth, validation)
│   │   └── index.js     # Главный сервер
│   └── prisma/          # Схема базы данных
├── apps/
│   └── web-dashboard/   # Next.js frontend
└── packages/
    └── database/        # Общая Prisma схема
```

## 🔧 Доступные команды

```bash
# Разработка
npm run dev              # Запустить backend и frontend
npm run backend:dev      # Запустить только backend
npm run frontend:dev     # Запустить только frontend

# Production
npm run build            # Собрать проект
npm start               # Запустить production версию

# База данных
npm run db:generate     # Сгенерировать Prisma клиент
npm run db:migrate      # Применить миграции
npm run db:studio       # Открыть Prisma Studio

# Тестирование
npm test                # Запустить тесты
npm run test:all        # Тестировать все компоненты
```

## 🌐 API Endpoints

### Основные endpoints:

- `GET /health` - Health check
- `GET /api/v1/dashboard/stats` - Статистика дашборда
- `GET /api/v1/machines` - Список машин
- `GET /api/v1/machines/:id` - Информация о машине
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход

## 🔐 Переменные окружения

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/vhm24

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# S3 Storage (DigitalOcean Spaces)
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=vhm24-uploads
S3_REGION=nyc3

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
```

## 🚀 Деплой на Railway

1. Создайте проект на [Railway](https://railway.app)
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Railway автоматически задеплоит проект

## 📊 Функционал

### Реализовано:

- ✅ Web Dashboard на русском языке
- ✅ Аутентификация и авторизация
- ✅ Управление машинами
- ✅ API для всех операций
- ✅ Интеграция с PostgreSQL
- ✅ Подготовка к S3 storage

### В разработке:

- 🔄 Telegram бот
- 🔄 Система задач
- 🔄 Управление складом
- 🔄 Маршруты водителей
- 🔄 Рецепты и ингредиенты

## 👥 Роли пользователей

- **Admin** - полный доступ
- **Manager** - управление операциями
- **Warehouse** - складские операции
- **Operator** - обслуживание машин
- **Technician** - техническое обслуживание
- **Driver** - доставка и маршруты

## 🛠️ Технологии

- **Backend**: Node.js, Express, Prisma ORM
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: DigitalOcean Spaces (S3)
- **Deploy**: Railway

## 📝 Лицензия

MIT

## 🤝 Контрибьюторы

- [jamshiddins](https://github.com/jamshiddins)

---

**VHM24** - Современная система управления вендинговым бизнесом
