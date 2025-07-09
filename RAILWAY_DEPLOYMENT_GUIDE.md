# Railway Deployment Guide for VHM24

## 🎯 Обзор

VHM24 готов к деплою на Railway как monorepo с несколькими сервисами.

## 📋 Pre-deployment Checklist

### 1. Подготовка Railway проекта
- [ ] Создан аккаунт на Railway
- [ ] Установлен Railway CLI
- [ ] Выполнен вход

### 2. Настройка внешних сервисов
- [ ] Настроен S3-совместимый storage
- [ ] Создан Telegram Bot
- [ ] Настроен Sentry (опционально)

## 🚀 Deployment Steps

### Шаг 1: Создание Railway проекта
railway new vhm24-production
railway link

### Шаг 2: Добавление баз данных
railway add postgresql
railway add redis

### Шаг 3: Настройка переменных окружения
Скопируйте переменные из .env.railway.example

### Шаг 4: Деплой
railway variables set RAILWAY_SERVICE_NAME="gateway"
railway up

## ⚠️ Важные замечания

- MinIO заменен на внешний S3 - настройте S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
- Каждый сервис будет иметь свой Railway URL, обновите CORS настройки

## 🔧 Troubleshooting

### Проблема: Сервис не запускается
railway logs
railway variables
railway status

### Проблема: База данных не подключается
- Проверьте DATABASE_URL
- Убедитесь что PostgreSQL addon активен

### Проблема: Файлы не загружаются
- Проверьте S3 credentials
- Убедитесь что bucket существует

## 📞 Поддержка

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
