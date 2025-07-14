# VendHub VHM24 - Быстрый чеклист для продакшена
## ⚡ Готов к запуску за 5 минут

---

## 🚀 ЭКСПРЕСС-ДЕПЛОЙ

### ✅ Шаг 1: Проверка готовности (30 сек)
```bash
# Проверьте .env файл
cat .env | grep -E "(DATABASE_URL|BOT_TOKEN|AWS_)"
```

### ✅ Шаг 2: Деплой Backend (2 мин)
```bash
cd backend
npm install
npx prisma generate
railway up
```

### ✅ Шаг 3: Запуск Telegram Bot (1 мин)
```bash
cd apps/telegram-bot
npm install
npm start
```

### ✅ Шаг 4: Проверка работы (1 мин)
```bash
# Проверьте API
curl https://your-app.railway.app/api/health

# Отправьте /start боту в Telegram
```

---

## 🔧 КРИТИЧЕСКИЕ ПЕРЕМЕННЫЕ

Убедитесь, что настроены:
- `DATABASE_URL` - Railway PostgreSQL
- `BOT_TOKEN` - Telegram Bot Token
- `AWS_ACCESS_KEY_ID` - AWS ключ
- `AWS_SECRET_ACCESS_KEY` - AWS секрет
- `AWS_S3_BUCKET` - S3 bucket имя
- `JWT_SECRET` - JWT секретный ключ

---

## 🎯 БЫСТРАЯ ПРОВЕРКА

### API Endpoints:
- ✅ `/api/health` - Статус системы
- ✅ `/api/users` - Управление пользователями
- ✅ `/api/machines` - Автоматы
- ✅ `/api/tasks` - Задачи
- ✅ `/api/inventory` - Склад

### Telegram Bot Commands:
- ✅ `/start` - Запуск бота
- ✅ `/menu` - Главное меню
- ✅ `/profile` - Профиль пользователя

---

## 🚨 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### Backend не запускается:
```bash
# Проверьте логи
railway logs

# Проверьте переменные
railway variables
```

### Bot не отвечает:
```bash
# Проверьте токен
echo $BOT_TOKEN

# Перезапустите бота
pm2 restart vendhub-bot
```

### База данных недоступна:
```bash
# Проверьте подключение
npx prisma db push
```

---

## 📞 ЭКСТРЕННАЯ ПОДДЕРЖКА

1. **Логи**: `railway logs --follow`
2. **Статус**: `railway status`
3. **Переменные**: `railway variables`
4. **Откат**: `railway rollback`

---

**🎉 СИСТЕМА ГОТОВА К РАБОТЕ!**

*Время деплоя: ~5 минут*
*Статус: PRODUCTION READY ✅*
