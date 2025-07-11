# Инструкция по деплою VHM24 на DigitalOcean

## Подготовка к деплою

### 1. Создание аккаунта DigitalOcean

Если у вас еще нет аккаунта DigitalOcean, зарегистрируйтесь на
[DigitalOcean](https://www.digitalocean.com/).

### 2. Установка doctl

Установите утилиту командной строки DigitalOcean:

- **Windows**: Скачайте и установите с [GitHub](https://github.com/digitalocean/doctl/releases)
- **macOS**: `brew install doctl`
- **Linux**:
  ```bash
  cd ~
  wget https://github.com/digitalocean/doctl/releases/download/v1.92.1/doctl-1.92.1-linux-amd64.tar.gz
  tar xf ~/doctl-1.92.1-linux-amd64.tar.gz
  sudo mv ~/doctl /usr/local/bin
  ```

### 3. Настройка аутентификации

1. Создайте API токен в
   [панели управления DigitalOcean](https://cloud.digitalocean.com/account/api/tokens)
2. Авторизуйтесь с помощью токена:
   ```bash
   doctl auth init
   ```
3. Добавьте токен в файл `.env`:
   ```
   DO_API_TOKEN=your-token-here
   ```

## Настройка DigitalOcean Spaces

### 1. Создание Spaces

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/spaces)
2. Нажмите "Create Space"
3. Выберите регион (ближайший к вашим пользователям)
4. Введите имя для вашего Space (например, `vhm24-uploads`)
5. Нажмите "Create Space"

### 2. Создание ключей доступа

1. В DigitalOcean перейдите в раздел "API" > "Tokens/Keys"
2. В разделе "Spaces access keys" нажмите "Generate New Key"
3. Введите имя для ключа (например, `vhm24-spaces-key`)
4. Скопируйте ключ доступа и секретный ключ
5. Добавьте их в файл `.env`:
   ```
   MINIO_ENDPOINT=your-region.digitaloceanspaces.com
   MINIO_PORT=443
   MINIO_ACCESS_KEY=your-access-key
   MINIO_SECRET_KEY=your-secret-key
   MINIO_USE_SSL=true
   MINIO_BUCKET=vhm24-uploads
   ```

### 3. Создание бакета для резервных копий

1. Создайте еще один Space для резервных копий (например, `vhm24-backups`)
2. Добавьте его в файл `.env`:
   ```
   BACKUP_S3_BUCKET=vhm24-backups
   ```

## Деплой на DigitalOcean App Platform

### 1. Создание приложения

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/apps)
2. Нажмите "Create App"
3. Выберите "GitHub" как источник кода
4. Выберите ваш репозиторий
5. Выберите ветку (например, `main` или `production`)
6. Нажмите "Next"

### 2. Настройка компонентов

1. Выберите тип компонента "Web Service"
2. Настройте параметры:
   - **Name**: `vhm24-gateway`
   - **Build Command**: `npm install`
   - **Run Command**: `node services/gateway/src/index.js`
   - **HTTP Port**: `8000`
3. Нажмите "Add Component" для добавления других сервисов:
   - **Auth Service**: `node services/auth/src/index.js`
   - **Machines Service**: `node services/machines/src/index.js`
   - **Inventory Service**: `node services/inventory/src/index.js`
   - **Tasks Service**: `node services/tasks/src/index.js`
   - **Bunkers Service**: `node services/bunkers/src/index.js`
   - **Backup Service**: `node services/backup/src/index.js`
   - **Telegram Bot**: `node services/telegram-bot/src/index.js`
4. Нажмите "Next"

### 3. Настройка переменных окружения

1. Добавьте все переменные окружения из файла `.env`
2. Нажмите "Next"

### 4. Настройка базы данных

1. Выберите "Add a Database"
2. Выберите "PostgreSQL"
3. Выберите план (например, "Basic")
4. Нажмите "Create and Attach"
5. Переменная `DATABASE_URL` будет автоматически добавлена

### 5. Настройка Redis

1. Выберите "Add a Database"
2. Выберите "Redis"
3. Выберите план (например, "Basic")
4. Нажмите "Create and Attach"
5. Переменная `REDIS_URL` будет автоматически добавлена

### 6. Завершение настройки

1. Выберите регион (ближайший к вашим пользователям)
2. Выберите план (например, "Basic")
3. Нажмите "Create Resources"

## Настройка домена

1. Перейдите в настройки приложения
2. Перейдите в раздел "Domains"
3. Нажмите "Add Domain"
4. Введите ваш домен (например, `api.vhm24.com`)
5. Следуйте инструкциям по настройке DNS

## Настройка автоматического деплоя

Автоматический деплой уже настроен при создании приложения. При пуше в выбранную ветку будет
автоматически запущен деплой.

## Мониторинг и логи

### 1. Просмотр логов

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/apps)
2. Выберите ваше приложение
3. Перейдите в раздел "Logs"
4. Выберите компонент для просмотра логов

### 2. Настройка алертов

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/apps)
2. Выберите ваше приложение
3. Перейдите в раздел "Alerts"
4. Нажмите "Create Alert Policy"
5. Настройте параметры алерта (например, CPU, Memory, Disk)
6. Настройте уведомления (Email, Slack)
7. Нажмите "Create Alert Policy"

## Настройка резервного копирования

### 1. Настройка автоматического резервного копирования

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/databases)
2. Выберите вашу базу данных
3. Перейдите в раздел "Backups"
4. Настройте расписание резервного копирования
5. Нажмите "Save"

### 2. Запуск скрипта резервного копирования

Для запуска скрипта резервного копирования вручную:

```bash
node scripts/backup-database.js
```

Для загрузки резервной копии в DigitalOcean Spaces:

```bash
node scripts/backup-database.js --s3-only
```

## Откат изменений

В случае проблем с новой версией:

1. Перейдите в [панель управления DigitalOcean](https://cloud.digitalocean.com/apps)
2. Выберите ваше приложение
3. Перейдите в раздел "Deployments"
4. Найдите последнюю стабильную версию
5. Нажмите "Rollback to this deployment"

## Заключение

После успешного деплоя VHM24 на DigitalOcean, система будет доступна по URL, предоставленному
DigitalOcean или по вашему собственному домену. Вы можете использовать этот URL для доступа к API и
веб-интерфейсу.

Для настройки Telegram-бота, убедитесь, что переменная окружения `TELEGRAM_BOT_TOKEN` установлена
корректно, и бот запущен.

Для мониторинга системы используйте инструкции из файла `MONITORING_SETUP.md`.
