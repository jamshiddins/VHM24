# VHM24 - VendHub Manager 24/7

Современная платформа для управления вендинговыми машинами с поддержкой работы 24/7.

## 🚀 Особенности

- **Микросервисная архитектура** - масштабируемая и отказоустойчивая система
- **Telegram интеграция** - управление через Telegram бота
- **Real-time мониторинг** - WebSocket для мгновенных обновлений
- **Безопасность** - JWT аутентификация, rate limiting, валидация данных
- **API документация** - OpenAPI/Swagger спецификация
- **Мониторинг** - Prometheus метрики и health checks
- **Резервное копирование** - автоматические бэкапы с S3 интеграцией
- **Кеширование** - Redis для высокой производительности

## 📋 Требования

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis (настроен для кеширования)
- MinIO или S3 (опционально, для хранения файлов)

## 🛠️ Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

Скопируйте `.env.example` в `.env` и заполните необходимые переменные:

```bash
cp .env.example .env
```

Основные переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота (опционально)
- `REDIS_URL` - строка подключения к Redis для кеширования

### 4. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение начальными данными
npm run db:seed
```

## 🚀 Запуск

### Режим разработки

```bash
npm run dev
```

### Production с PM2

```bash
node start-pm2.js
```

### Docker

```bash
docker-compose up -d
```

## 📚 Архитектура

### Микросервисы

1. **Auth Service** (порт 3001)
   - Аутентификация и авторизация
   - JWT токены
   - Управление пользователями

2. **Machines Service** (порт 3002)
   - CRUD операции с машинами
   - Телеметрия
   - Статистика
   - Redis кеширование для оптимизации

3. **Inventory Service** (порт 3003)
   - Управление складом
   - Отслеживание запасов
   - Движение товаров

4. **Tasks Service** (порт 3004)
   - Управление задачами
   - Назначение исполнителей
   - Отслеживание выполнения

5. **Bunkers Service** (порт 3005)
   - Управление бункерами машин
   - Критические уровни
   - Планирование пополнения

6. **Notifications Service** (порт 3006)
   - Email уведомления
   - Telegram уведомления
   - Массовые рассылки

7. **Backup Service** (порт 3007)
   - Автоматические бэкапы
   - S3 интеграция
   - Восстановление данных

8. **Monitoring Service** (порт 3008)
   - Prometheus метрики
   - Статистика системы
   - Health checks

9. **Gateway Service** (порт 8000)
   - API Gateway
   - Прокси к микросервисам
   - WebSocket
   - Загрузка файлов

10. **Telegram Bot**
    - Управление через Telegram
    - Уведомления
    - Быстрый доступ 24/7

## 🔒 Безопасность

### Реализованные меры

1. **Аутентификация**
   - JWT токены с истечением срока
   - Refresh токены
   - Поддержка входа через Telegram

2. **Авторизация**
   - Ролевая модель (RBAC)
   - Проверка прав на уровне эндпоинтов
   - Аудит лог всех действий

3. **Защита API**
   - Rate limiting
   - CORS настройки
   - Helmet для защиты заголовков
   - Валидация входных данных

4. **Защита данных**
   - Хеширование паролей (bcrypt)
   - Санитизация входных данных
   - Проверка типов файлов при загрузке
   - SQL injection защита (Prisma)

## 📊 Мониторинг

### Prometheus метрики

Доступны по адресу: `http://localhost:3008/metrics`

Основные метрики:
- HTTP запросы (количество, длительность)
- Состояние машин (онлайн/офлайн/ошибки)
- Открытые задачи
- Активные пользователи
- Ошибки API

### Grafana дашборды

Примеры дашбордов в директории `docs/grafana/`

## 🔧 API

### Документация

OpenAPI спецификация: `docs/api/openapi.yaml`

Swagger UI доступен по адресу: `http://localhost:8000/docs`

### Примеры запросов

#### Аутентификация

```bash
# Регистрация
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "Иван Иванов"
  }'

# Вход
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Работа с машинами

```bash
# Получить список машин
curl -X GET http://localhost:8000/api/v1/machines \
  -H "Authorization: Bearer YOUR_TOKEN"

# Создать машину
curl -X POST http://localhost:8000/api/v1/machines \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CVM-00001",
    "serialNumber": "SN123456",
    "type": "COFFEE",
    "name": "Кофейный автомат №1"
  }'
```

## 🤖 Telegram Bot

### Команды

- `/start` - Начало работы
- `/machines` - Список машин
- `/inventory` - Управление складом
- `/tasks` - Задачи
- `/reports` - Отчеты
- `/settings` - Настройки

### Настройка

1. Создайте бота через @BotFather
2. Получите токен
3. Добавьте токен в `.env`: `TELEGRAM_BOT_TOKEN=your_token`
4. Запустите бота

## 📦 Deployment

### Railway

1. Создайте проект на Railway
2. Добавьте PostgreSQL
3. Настройте переменные окружения
4. Деплой через GitHub

### Docker

```bash
docker-compose up -d
```

### PM2

```bash
# Установка PM2
npm install -g pm2

# Запуск
node start-pm2.js

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm test

# Тест сервисов
node test-all-services.js
```

### Проверка здоровья

```bash
curl http://localhost:8000/health
```

## 📝 Скрипты

- `npm start` - запуск в production режиме
- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка проекта
- `npm run db:migrate` - применение миграций
- `npm run db:seed` - заполнение тестовыми данными
- `npm run format` - форматирование кода
- `npm run monitor` - запуск мониторинга

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 👥 Команда

- **Разработка**: VHM24 Team
- **Email**: support@vhm24.ru
- **Telegram**: @vhm24_support

## 🆘 Поддержка

- **Документация**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/jamshiddins/VHM24/issues)
- **Telegram**: @vhm24_support
- **Email**: support@vhm24.ru

---

© 2025 VHM24 - VendHub Manager 24/7. Все права защищены.
