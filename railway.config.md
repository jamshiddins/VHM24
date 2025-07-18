# 🚂 Конфигурация Railway для проекта VHM24

## 📋 Обзор

Этот документ содержит информацию о конфигурации проекта VHM24 на платформе Railway.

## 🔑 Информация о проекте

- **Название проекта**: VHM24-1.0
- **ID проекта**: 9820e0f0-e39b-4719-9580-de68a0e3498f
- **Публичный URL**: https://web-production-73916.up.railway.app
- **Публичный домен**: web-production-73916.up.railway.app
- **Окружение**: production

## 🌐 Сервисы

### 1. Web

Основной сервис, который запускает веб-приложение и API.

- **Тип**: Web Service
- **Исходный код**: GitHub
- **Репозиторий**: https://github.com/jamshiddins/VHM24.git
- **Ветка**: main
- **Команда запуска**: `npm run start:prod`
- **Порт**: 3000
- **Автоматический деплой**: Включен

### 2. PostgreSQL

База данных PostgreSQL для хранения данных приложения.

- **Тип**: PostgreSQL
- **Версия**: 15.0
- **Имя пользователя**: postgres
- **Пароль**: Автоматически сгенерирован Railway
- **База данных**: railway
- **Порт**: 36258
- **Хост**: metro.proxy.rlwy.net

### 3. Redis

Redis для кэширования и обмена сообщениями.

- **Тип**: Redis
- **Версия**: 7.0
- **Пароль**: Автоматически сгенерирован Railway
- **Порт**: 6379
- **Хост**: redis.railway.internal

## 🔐 Переменные окружения

### Основные переменные

| Имя | Описание | Пример значения |
|-----|----------|-----------------|
| `DATABASE_URL` | URL для подключения к базе данных | `postgresql://postgres:password@metro.proxy.rlwy.net:36258/railway` |
| `REDIS_URL` | URL для подключения к Redis | `redis://default:password@yamanote.proxy.rlwy.net:21211` |
| `PORT` | Порт для запуска приложения | `3000` |
| `NODE_ENV` | Окружение Node.js | `production` |
| `RAILWAY_PUBLIC_URL` | Публичный URL приложения | `https://web-production-73916.up.railway.app` |
| `RAILWAY_PUBLIC_DOMAIN` | Публичный домен приложения | `web-production-73916.up.railway.app` |
| `RAILWAY_PROJECT_ID` | ID проекта Railway | `9820e0f0-e39b-4719-9580-de68a0e3498f` |
| `RAILWAY_ENVIRONMENT` | Окружение Railway | `production` |

### Переменные для Telegram бота

| Имя | Описание | Пример значения |
|-----|----------|-----------------|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ` |
| `ADMIN_IDS` | ID администраторов | `42283329` |
| `WEBHOOK_URL` | URL для вебхука Telegram | `https://web-production-73916.up.railway.app/api/telegram/webhook` |

### Переменные для аутентификации и безопасности

| Имя | Описание | Пример значения |
|-----|----------|-----------------|
| `JWT_SECRET` | Секретный ключ для JWT | `a8f5f167f44f4964e6c998dee827110c8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e` |
| `SESSION_SECRET` | Секретный ключ для сессий | `a8f5f167f44f4964e6c998dee827110c8c8e4c8e` |
| `API_KEY` | Ключ для API | `8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e` |
| `ENCRYPTION_KEY` | Ключ для шифрования | `a8f5f167f44f4964e6c998dee827110c8c8e4c8e8c8e4c8e` |

### Переменные для хранения файлов (DigitalOcean Spaces)

| Имя | Описание | Пример значения |
|-----|----------|-----------------|
| `S3_ACCESS_KEY` | Ключ доступа S3 | `DO00XEB6BC6XZ8Q2M4KQ` |
| `S3_SECRET_KEY` | Секретный ключ S3 | `SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk` |
| `S3_BUCKET` | Имя бакета S3 | `vhm24-uploads-prod` |
| `S3_BACKUP_BUCKET` | Имя бакета для резервных копий | `vhm24-backups-prod` |
| `S3_ENDPOINT` | Эндпоинт S3 | `https://fra1.digitaloceanspaces.com` |
| `S3_REGION` | Регион S3 | `fra1` |
| `UPLOADS_ENDPOINT` | Эндпоинт для загрузок | `https://vhm24-uploads-prod.fra1.digitaloceanspaces.com` |
| `BACKUPS_ENDPOINT` | Эндпоинт для резервных копий | `https://vhm24-backups-prod.fra1.digitaloceanspaces.com` |

### Другие переменные

| Имя | Описание | Пример значения |
|-----|----------|-----------------|
| `API_URL` | URL для API | `https://web-production-73916.up.railway.app/api/v1` |
| `UPLOAD_DIR` | Директория для загрузок | `uploads` |
| `MAX_FILE_SIZE` | Максимальный размер файла | `10485760` |
| `CORS_ORIGIN` | Разрешенные источники для CORS | `https://web-production-73916.up.railway.app,http://localhost:3001` |
| `LOG_LEVEL` | Уровень логирования | `info` |
| `LOG_FILE` | Файл для логов | `logs/app.log` |
| `BACKUP_SCHEDULE` | Расписание резервного копирования | `0 */6 * * *` |
| `BACKUP_RETENTION_DAYS` | Количество дней хранения резервных копий | `30` |
| `AUTO_BACKUP_ENABLED` | Включено ли автоматическое резервное копирование | `true` |
| `ENABLE_AUTO_BACKUP` | Включено ли автоматическое резервное копирование | `true` |
| `HEALTH_CHECK_INTERVAL` | Интервал проверки здоровья | `30000` |
| `METRICS_ENABLED` | Включены ли метрики | `true` |
| `ENABLE_MONITORING` | Включен ли мониторинг | `true` |

## 🚀 Деплой

### Автоматический деплой

Автоматический деплой настроен через GitHub Actions. При пуше в ветку `main` происходит автоматический деплой на Railway.

### Ручной деплой

Для ручного деплоя можно использовать следующие команды:

```bash
# Деплой на Railway
npm run deploy:railway

# Настройка вебхука Telegram
npm run setup:webhook

# Проверка здоровья системы
npm run check:health
```

## 📊 Мониторинг

### Проверка здоровья

Для проверки здоровья системы можно использовать следующий эндпоинт:

```
GET https://web-production-73916.up.railway.app/api/health
```

### Логи

Логи доступны в Railway Dashboard:

1. Перейдите в Railway Dashboard
2. Выберите проект VHM24-1.0
3. Выберите сервис Web
4. Перейдите на вкладку Logs

## 🔄 Масштабирование

### Вертикальное масштабирование

Для вертикального масштабирования можно изменить план сервиса в Railway Dashboard:

1. Перейдите в Railway Dashboard
2. Выберите проект VHM24-1.0
3. Выберите сервис Web
4. Перейдите на вкладку Settings
5. Выберите план с большим количеством ресурсов

### Горизонтальное масштабирование

Для горизонтального масштабирования можно увеличить количество инстансов сервиса:

1. Перейдите в Railway Dashboard
2. Выберите проект VHM24-1.0
3. Выберите сервис Web
4. Перейдите на вкладку Settings
5. Увеличьте количество инстансов

## 🔒 Безопасность

### Обновление секретов

Для обновления секретов можно использовать Railway Dashboard:

1. Перейдите в Railway Dashboard
2. Выберите проект VHM24-1.0
3. Выберите сервис Web
4. Перейдите на вкладку Variables
5. Обновите необходимые переменные

### Ротация ключей

Рекомендуется регулярно обновлять следующие ключи:

- `JWT_SECRET`
- `SESSION_SECRET`
- `API_KEY`
- `ENCRYPTION_KEY`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

## 📝 Рекомендации

1. **Регулярно проверяйте здоровье системы**:
   ```bash
   npm run check:health
   ```

2. **Настройте мониторинг и алертинг**:
   - Используйте Prometheus и Grafana для мониторинга
   - Настройте алерты при возникновении проблем
   - Настройте отправку уведомлений в Telegram при возникновении критических ошибок

3. **Регулярно делайте резервные копии**:
   - Настройте автоматическое резервное копирование базы данных
   - Храните резервные копии в отдельном бакете
   - Регулярно проверяйте возможность восстановления из резервной копии

4. **Обновляйте зависимости**:
   - Регулярно обновляйте зависимости проекта
   - Проверяйте наличие уязвимостей в зависимостях
   - Используйте `npm audit` для проверки уязвимостей

5. **Оптимизируйте производительность**:
   - Используйте кэширование для часто используемых данных
   - Оптимизируйте запросы к базе данных
   - Используйте индексы для часто используемых полей
