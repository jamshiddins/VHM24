# VendHub VHM24 - Руководство по деплою в продакшен
## Дата: 14 июля 2025

---

## 🚀 БЫСТРЫЙ СТАРТ В ПРОДАКШЕНЕ

### Предварительные требования:
- ✅ Railway.app аккаунт
- ✅ AWS S3 bucket
- ✅ Telegram Bot Token
- ✅ Все переменные окружения настроены

---

## 📋 ШАГ 1: ПОДГОТОВКА К ДЕПЛОЮ

### 1.1 Проверка переменных окружения
```bash
# Убедитесь, что все переменные настроены в .env
cat .env
```

### 1.2 Проверка Railway подключения
```bash
# Установите Railway CLI если не установлен
npm install -g @railway/cli

# Войдите в Railway
railway login

# Подключитесь к проекту
railway link
```

---

## 📋 ШАГ 2: ДЕПЛОЙ BACKEND

### 2.1 Деплой на Railway
```bash
# Перейдите в папку backend
cd backend

# Установите зависимости
npm install

# Выполните миграции базы данных
npx prisma migrate deploy

# Сгенерируйте Prisma Client
npx prisma generate

# Деплой на Railway
railway up
```

### 2.2 Настройка переменных окружения на Railway
```bash
# Установите переменные через Railway CLI
railway variables set DATABASE_URL="your_railway_postgres_url"
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set AWS_ACCESS_KEY_ID="your_aws_key"
railway variables set AWS_SECRET_ACCESS_KEY="your_aws_secret"
railway variables set AWS_REGION="us-east-1"
railway variables set AWS_S3_BUCKET="your_bucket_name"
```

---

## 📋 ШАГ 3: ДЕПЛОЙ TELEGRAM BOT

### 3.1 Настройка бота
```bash
# Перейдите в папку telegram-bot
cd apps/telegram-bot

# Установите зависимости
npm install

# Обновите .env с продакшен URL
echo "API_BASE_URL=https://your-railway-app.railway.app" >> .env
echo "BOT_TOKEN=your_telegram_bot_token" >> .env
```

### 3.2 Запуск бота в продакшене
```bash
# Запустите бота
npm start

# Или используйте PM2 для продакшена
npm install -g pm2
pm2 start src/index.js --name "vendhub-bot"
pm2 save
pm2 startup
```

---

## 📋 ШАГ 4: ПРОВЕРКА ДЕПЛОЯ

### 4.1 Проверка Backend API
```bash
# Проверьте здоровье API
curl https://your-railway-app.railway.app/api/health

# Проверьте подключение к базе данных
curl https://your-railway-app.railway.app/api/test-db
```

### 4.2 Проверка Telegram Bot
```bash
# Отправьте команду /start боту в Telegram
# Проверьте, что бот отвечает и показывает меню
```

---

## 📋 ШАГ 5: НАСТРОЙКА МОНИТОРИНГА

### 5.1 Логи Railway
```bash
# Просмотр логов
railway logs

# Следить за логами в реальном времени
railway logs --follow
```

### 5.2 Мониторинг бота
```bash
# Проверка статуса PM2
pm2 status

# Просмотр логов бота
pm2 logs vendhub-bot
```

---

## 🔧 НАСТРОЙКА WEBHOOK (ОПЦИОНАЛЬНО)

### Для автоматического деплоя при изменениях в Git:

```bash
# Настройте webhook в Railway
# 1. Зайдите в Railway Dashboard
# 2. Выберите ваш проект
# 3. Перейдите в Settings > Deployments
# 4. Настройте автоматический деплой из GitHub
```

---

## 🛡️ БЕЗОПАСНОСТЬ В ПРОДАКШЕНЕ

### Рекомендации:
1. **Переменные окружения**: Никогда не коммитьте .env файлы
2. **JWT Secret**: Используйте сложный секретный ключ
3. **AWS Keys**: Ограничьте права доступа только к нужному S3 bucket
4. **Database**: Используйте SSL подключение
5. **Bot Token**: Храните токен бота в безопасности

---

## 📊 МОНИТОРИНГ И АЛЕРТЫ

### Настройка уведомлений:
```javascript
// Добавьте в код бота уведомления об ошибках
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  // Отправьте уведомление администратору
});
```

---

## 🔄 ОБНОВЛЕНИЯ И ОТКАТЫ

### Обновление системы:
```bash
# 1. Сделайте backup базы данных
railway db backup

# 2. Деплойте новую версию
railway up

# 3. Выполните миграции если нужно
npx prisma migrate deploy
```

### Откат в случае проблем:
```bash
# Откат к предыдущей версии в Railway Dashboard
# или через CLI
railway rollback
```

---

## 📞 ПОДДЕРЖКА

### В случае проблем:
1. Проверьте логи: `railway logs`
2. Проверьте статус сервисов: `railway status`
3. Проверьте переменные окружения: `railway variables`
4. Проверьте подключение к базе данных

---

## ✅ ЧЕКЛИСТ ГОТОВНОСТИ К ПРОДАКШЕНУ

- [ ] Backend развернут на Railway
- [ ] База данных мигрирована
- [ ] Все переменные окружения настроены
- [ ] Telegram Bot запущен и отвечает
- [ ] AWS S3 интеграция работает
- [ ] API эндпоинты отвечают
- [ ] Мониторинг настроен
- [ ] Backup стратегия определена

---

**🎉 СИСТЕМА ГОТОВА К РАБОТЕ В ПРОДАКШЕНЕ!**

*Для получения поддержки обращайтесь к документации или создавайте issue в репозитории.*
