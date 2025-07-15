# Инструкции по настройке VHM24 в Railway

## Введение

Этот документ содержит пошаговые инструкции по настройке и развертыванию проекта VHM24 (VendHub Management System) на платформе Railway. Следуя этим инструкциям, вы сможете настроить все необходимые компоненты системы и запустить их в продакшен-режиме.

## Предварительные требования

- Аккаунт на [Railway](https://railway.app/)
- Установленный [Node.js](https://nodejs.org/) (версия 18 или выше)
- Установленный [npm](https://www.npmjs.com/) (версия 8 или выше)
- Установленный [Git](https://git-scm.com/)
- Токен Telegram-бота (получить можно у [@BotFather](https://t.me/BotFather))
- Доступ к DigitalOcean Spaces (S3) или другому S3-совместимому хранилищу

## Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24
```

## Шаг 2: Установка зависимостей

```bash
npm install
```

## Шаг 3: Настройка переменных окружения

Для настройки переменных окружения в Railway используйте скрипт `fix-railway-variables.js`:

```bash
npm run fix:railway-variables
```

Скрипт выполнит следующие действия:
1. Проверит наличие Railway CLI и при необходимости установит его
2. Выполнит вход в Railway
3. Создаст новый проект или выберет существующий
4. Настроит переменные окружения

Во время выполнения скрипта вам будет предложено ввести значения для следующих переменных:
- `JWT_SECRET` - секретный ключ для JWT (будет сгенерирован автоматически, если не указан)
- `TELEGRAM_BOT_TOKEN` - токен Telegram-бота
- `ADMIN_IDS` - список ID администраторов Telegram (через запятую)
- `S3_ACCESS_KEY` - ключ доступа к S3
- `S3_SECRET_KEY` - секретный ключ S3
- `S3_BUCKET` - имя бакета S3
- `S3_REGION` - регион S3
- `S3_ENDPOINT` - эндпоинт S3

## Шаг 4: Настройка внешней базы данных

Для настройки использования внешней базы данных используйте скрипт `use-external-database.js`:

```bash
npm run use:external-database
```

Скрипт выполнит следующие действия:
1. Проверит наличие переменной окружения `DATABASE_URL`
2. Если переменная не установлена, предложит создать PostgreSQL в Railway или ввести URL внешней базы данных
3. Обновит `docker-compose.yml` для использования внешней базы данных

## Шаг 5: Генерация Prisma клиента

```bash
npm run prisma:generate
```

## Шаг 6: Подготовка к деплою

```bash
# Очистка проекта от ненужных файлов и обновление Git
npm run prepare:deploy
```

Этот скрипт выполнит следующие действия:
1. Очистит проект от ненужных файлов
2. Обновит Git репозиторий
3. Выполнит деплой в Railway

Или вы можете выполнить эти действия по отдельности:

```bash
# Очистка проекта от ненужных файлов
npm run cleanup

# Обновление Git репозитория
npm run update:git

# Деплой в Railway
npm run deploy
```

## Шаг 7: Настройка вебхука для Telegram-бота

После успешного деплоя необходимо настроить вебхук для Telegram-бота:

```bash
npm run setup:webhook
```

## Шаг 8: Проверка работоспособности

Для проверки работоспособности системы выполните:

```bash
npm run check:health
```

Этот скрипт проверит:
1. Доступность API
2. Подключение к базе данных
3. Подключение к Redis
4. Работоспособность Telegram-бота

## Локальный запуск

Для локального запуска всех компонентов системы используйте:

```bash
# Запуск всех компонентов одновременно
npm run start:all

# Или запуск системы через скрипт start-vendhub-system.js
npm run start:system

# Или запуск отдельных компонентов
npm start           # API сервер
npm run start:bot   # Telegram-бот
npm run start:worker    # Worker для фоновых задач
npm run start:scheduler # Scheduler для планирования задач
```

## Структура проекта в Railway

После деплоя в Railway будут запущены следующие сервисы:

1. **web** - API сервер (Express.js)
2. **worker** - Обработчик фоновых задач
3. **scheduler** - Планировщик задач

Также будут созданы следующие сервисы:

1. **PostgreSQL** - База данных (или используется внешняя база данных)
2. **Redis** - Кэширование и очереди задач

## Мониторинг и логирование

Railway предоставляет встроенные инструменты для мониторинга и логирования. Для просмотра логов выполните:

```bash
railway logs
```

Для просмотра логов конкретного сервиса:

```bash
railway logs -s web
railway logs -s worker
railway logs -s scheduler
```

Для просмотра статуса проекта:

```bash
railway status
```

## Обновление проекта

Для обновления проекта в Railway выполните:

```bash
git pull
npm install
npm run deploy
```

## Очистка проекта

Если вам нужно очистить проект от ненужных файлов перед деплоем, выполните:

```bash
npm run cleanup
```

## Устранение неполадок

### Проблемы с подключением к базе данных

1. Проверьте переменную окружения `DATABASE_URL`
2. Убедитесь, что база данных запущена
3. Проверьте логи базы данных

```bash
railway logs -s postgresql
```

### Проблемы с Telegram-ботом

1. Проверьте переменную окружения `TELEGRAM_BOT_TOKEN`
2. Убедитесь, что вебхук настроен правильно
3. Проверьте логи Telegram-бота

```bash
railway logs -s web
```

### Проблемы с Redis

1. Проверьте переменную окружения `REDIS_URL`
2. Убедитесь, что Redis запущен
3. Проверьте логи Redis

```bash
railway logs -s redis
```

### Проблемы с Railway CLI

Если у вас возникают проблемы с Railway CLI, попробуйте следующие решения:

1. Обновите Railway CLI до последней версии:
   ```bash
   npm install -g @railway/cli
   ```

2. Выполните повторный вход:
   ```bash
   railway login
   ```

3. Проверьте, что вы выбрали правильный проект:
   ```bash
   railway link
   ```

4. Если команды не работают, проверьте документацию Railway CLI:
   ```bash
   railway --help
   ```

## Заключение

Следуя этим инструкциям, вы сможете настроить и запустить проект VHM24 на платформе Railway. Если у вас возникнут вопросы или проблемы, обратитесь к документации Railway или создайте issue в репозитории проекта.

## Актуальные переменные окружения для продакшена

Ниже приведены актуальные переменные окружения для продакшена:

```
# Railway Project
RAILWAY_PROJECT_ID=4387df52-2176-4b52-83ea-b8c36b9e9957
RAILWAY_PUBLIC_URL=https://web-production-d9582.up.railway.app
RAILWAY_PUBLIC_DOMAIN=web-production-d9582.up.railway.app

# API / App URLs
API_URL=https://web-production-d9582.up.railway.app/api/v1
WEBHOOK_URL=https://web-production-d9582.up.railway.app/api/telegram/webhook
CORS_ORIGIN=https://web-production-d9582.up.railway.app,http://localhost:3001

# PostgreSQL (Railway DB)
DATABASE_URL=postgresql://postgres:TnKaHJbWffrqtZOIklgKNSlNZHDcxsQh@postgres.railway.internal:5432/railway

# Redis (Railway Cache)
REDIS_URL=redis://default:AlBzXGfakMRiVrFolnlZITTgniXFVBPX@redis.railway.internal:6379

# Telegram Bot
TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ
ADMIN_IDS=42283329

# App Config
PORT=3000
NODE_ENV=production
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e
LOG_LEVEL=info

# DigitalOcean Spaces (S3-compatible)
S3_ACCESS_KEY=DO00XEB6BC6XZ8Q2M4KQ
S3_SECRET_KEY=SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk
S3_BUCKET=vhm24-uploads-prod
S3_BACKUP_BUCKET=vhm24-backups-prod
S3_ENDPOINT=https://fra1.digitaloceanspaces.com
S3_REGION=fra1
UPLOADS_ENDPOINT=https://vhm24-uploads.fra1.digitaloceanspaces.com
BACKUPS_ENDPOINT=https://vhm24-backups.fra1.digitaloceanspaces.com

# Monitoring
METRICS_ENABLED=true
```

Эти переменные окружения уже настроены в проекте Railway. Если вы хотите изменить какие-либо значения, используйте скрипт `fix-railway-variables.js`.
