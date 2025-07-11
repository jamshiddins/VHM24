# Настройка CI/CD для VHM24

## Обзор

Данная инструкция описывает процесс настройки непрерывной интеграции и непрерывного развертывания
(CI/CD) для проекта VHM24 с использованием GitHub Actions и Railway.

## Преимущества CI/CD

1. **Автоматизация процесса деплоя** - исключение ручных операций и связанных с ними ошибок
2. **Быстрая обратная связь** - немедленное обнаружение проблем интеграции
3. **Частые релизы** - возможность быстро выпускать новые версии
4. **Стандартизация процесса** - единый процесс для всех разработчиков
5. **Улучшение качества кода** - автоматические тесты и проверки

## Необходимые инструменты

- GitHub аккаунт
- Railway аккаунт
- DigitalOcean аккаунт (для хранения файлов и резервных копий)

## Настройка GitHub Actions

### 1. Создание файла конфигурации

Создайте файл `.github/workflows/railway-deploy.yml` в корне вашего репозитория:

```yaml
name: Deploy to Railway

on:
  push:
    branches:
      - main
      - production
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. Настройка секретов GitHub

1. Перейдите в настройки вашего репозитория на GitHub
2. Выберите "Settings" > "Secrets and variables" > "Actions"
3. Нажмите "New repository secret"
4. Добавьте следующие секреты:
   - `RAILWAY_TOKEN` - токен доступа к Railway (получите в настройках Railway)

## Настройка Railway

### 1. Создание проекта в Railway

1. Зарегистрируйтесь или войдите в [Railway](https://railway.app/)
2. Создайте новый проект
3. Выберите "Deploy from GitHub repo"
4. Выберите ваш репозиторий

### 2. Настройка переменных окружения

1. В проекте Railway перейдите в раздел "Variables"
2. Добавьте все необходимые переменные окружения из файла `.env`:

```
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
TELEGRAM_BOT_TOKEN=your-bot-token
ADMIN_IDS=comma,separated,ids
MINIO_ENDPOINT=your-digitalocean-endpoint
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=vhm24-backups
```

### 3. Настройка базы данных

1. В проекте Railway перейдите в раздел "New"
2. Выберите "Database" > "PostgreSQL"
3. После создания базы данных, переменная `DATABASE_URL` будет автоматически добавлена в переменные
   окружения

### 4. Настройка Redis

1. В проекте Railway перейдите в раздел "New"
2. Выберите "Database" > "Redis"
3. После создания Redis, переменная `REDIS_URL` будет автоматически добавлена в переменные окружения

### 5. Настройка команды запуска

1. В проекте Railway перейдите в раздел "Settings"
2. В поле "Start Command" введите:
   ```
   node start-services.js --production
   ```

## Настройка DigitalOcean Spaces

### 1. Создание Spaces

1. Зарегистрируйтесь или войдите в [DigitalOcean](https://www.digitalocean.com/)
2. Перейдите в раздел "Spaces"
3. Нажмите "Create Space"
4. Выберите регион (ближайший к вашим пользователям)
5. Введите имя для вашего Space (например, `vhm24-uploads`)
6. Нажмите "Create Space"

### 2. Создание ключей доступа

1. В DigitalOcean перейдите в раздел "API" > "Tokens/Keys"
2. В разделе "Spaces access keys" нажмите "Generate New Key"
3. Введите имя для ключа (например, `vhm24-spaces-key`)
4. Скопируйте ключ доступа и секретный ключ
5. Добавьте их в переменные окружения Railway:
   ```
   MINIO_ACCESS_KEY=your-access-key
   MINIO_SECRET_KEY=your-secret-key
   ```

### 3. Настройка CORS

1. В DigitalOcean перейдите в раздел "Spaces" и выберите ваш Space
2. Перейдите в "Settings" > "CORS"
3. Добавьте домен вашего приложения в список разрешенных источников

## Настройка мониторинга

### 1. Настройка Uptime Robot

1. Зарегистрируйтесь или войдите в [Uptime Robot](https://uptimerobot.com/)
2. Нажмите "Add New Monitor"
3. Выберите тип "HTTP(s)"
4. Введите имя монитора (например, "VHM24 API")
5. Введите URL вашего API с путем `/health` (например, `https://api.vhm24.com/health`)
6. Настройте интервал мониторинга (рекомендуется 5 минут)
7. Настройте уведомления

### 2. Настройка Sentry для отслеживания ошибок

1. Зарегистрируйтесь или войдите в [Sentry](https://sentry.io/)
2. Создайте новый проект
3. Выберите платформу "Node.js"
4. Скопируйте DSN
5. Добавьте DSN в переменные окружения Railway:
   ```
   SENTRY_DSN=your-sentry-dsn
   ```

## Процесс деплоя

### Автоматический деплой

1. Разработчик делает коммит и пуш в ветку `main` или `production`
2. GitHub Actions автоматически запускает процесс деплоя:
   - Клонирование репозитория
   - Установка зависимостей
   - Запуск тестов
   - Деплой на Railway

### Ручной деплой

1. Разработчик запускает workflow вручную через GitHub Actions
2. Процесс деплоя выполняется так же, как и при автоматическом деплое

## Откат изменений

В случае проблем с новой версией:

1. Перейдите в Railway
2. Выберите ваш проект
3. Перейдите в раздел "Deployments"
4. Найдите последнюю стабильную версию
5. Нажмите "Rollback to this deployment"

## Рекомендации по безопасности

1. **Не храните секреты в репозитории** - используйте переменные окружения и секреты GitHub
2. **Ограничьте доступ к Railway** - предоставляйте доступ только необходимым членам команды
3. **Регулярно обновляйте зависимости** - используйте `npm audit` для проверки уязвимостей
4. **Настройте двухфакторную аутентификацию** - для GitHub, Railway и DigitalOcean
5. **Регулярно проверяйте логи** - для выявления подозрительной активности

## Проверка работоспособности

После настройки CI/CD и деплоя, проверьте:

1. **Health check endpoints** - должны возвращать статус 200
2. **API endpoints** - должны работать согласно документации
3. **Telegram-бот** - должен отвечать на команды
4. **Резервное копирование** - должно выполняться по расписанию
5. **Мониторинг** - должен отслеживать доступность сервисов

## Заключение

Настроенный CI/CD процесс позволяет автоматизировать деплой приложения VHM24 на Railway и
DigitalOcean, обеспечивая быстрое и надежное обновление системы. Регулярные автоматические тесты и
проверки помогают поддерживать высокое качество кода и стабильность работы приложения.
