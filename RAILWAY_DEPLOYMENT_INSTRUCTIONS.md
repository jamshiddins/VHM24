# Инструкция по деплою VHM24 на Railway

## Подготовка к деплою

### 1. Установка Railway CLI

Для деплоя на Railway необходимо установить Railway CLI:

```bash
npm install -g @railway/cli
```

### 2. Получение токена Railway

1. Войдите в свой аккаунт Railway:

```bash
railway login
```

2. После успешного входа получите токен:

```bash
railway whoami --token
```

3. Скопируйте полученный токен и добавьте его в файл `.env`:

```
RAILWAY_TOKEN=your-token-here
```

## Деплой на Railway

### 1. Запуск скрипта деплоя

После добавления токена в файл `.env`, запустите скрипт деплоя:

```bash
node scripts/deploy-to-railway.js
```

Для деплоя в production режиме:

```bash
node scripts/deploy-to-railway.js --production
```

Для деплоя в монолитном режиме:

```bash
node scripts/deploy-to-railway.js --monolith
```

### 2. Проверка деплоя

После успешного деплоя скрипт выведет URL проекта. Проверьте работоспособность системы, открыв следующие URL:

- Health check: `https://your-project-url.railway.app/health`
- API: `https://your-project-url.railway.app/api/v1`

## Настройка домена (опционально)

Для настройки собственного домена:

1. Перейдите в [Railway Dashboard](https://railway.app/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел "Settings"
4. В разделе "Domains" нажмите "Add Domain"
5. Введите ваш домен (например, `api.vhm24.com`)
6. Следуйте инструкциям по настройке DNS

## Настройка автоматического деплоя (опционально)

Для настройки автоматического деплоя при пуше в репозиторий:

1. Перейдите в [Railway Dashboard](https://railway.app/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел "Settings"
4. В разделе "GitHub" нажмите "Connect Repository"
5. Выберите ваш репозиторий
6. Настройте ветку для деплоя (например, `main` или `production`)

## Мониторинг и логи

Для просмотра логов:

```bash
railway logs
```

Для просмотра статуса сервисов:

```bash
railway status
```

## Откат изменений

В случае проблем с новой версией:

1. Перейдите в [Railway Dashboard](https://railway.app/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел "Deployments"
4. Найдите последнюю стабильную версию
5. Нажмите "Rollback to this deployment"

## Заключение

После успешного деплоя VHM24 на Railway, система будет доступна по URL, предоставленному Railway. Вы можете использовать этот URL для доступа к API и веб-интерфейсу.

Для настройки Telegram-бота, убедитесь, что переменная окружения `TELEGRAM_BOT_TOKEN` установлена корректно, и бот запущен.

Для мониторинга системы используйте инструкции из файла `MONITORING_SETUP.md`.
