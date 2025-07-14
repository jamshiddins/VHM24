# 🚀 VHM24 Vercel Deployment Guide

**Статус:** ✅ Готов к деплою на Vercel  
**URL после деплоя:** `https://vhm24-yourname.vercel.app`

---

## 📋 Пошаговый Deployment

### 1. Установка Vercel CLI (если не установлен)
```bash
npm install -g vercel
```

### 2. Логин в Vercel
```bash
vercel login
```

### 3. Деплой проекта
```bash
# В корневой директории VHM24
vercel

# Следуйте инструкциям:
# ? Set up and deploy "~/VHM24"? [Y/n] y
# ? Which scope do you want to deploy to? [Select your account]
# ? Link to existing project? [Y/n] n
# ? What's your project's name? vhm24-backend
# ? In which directory is your code located? ./
```

### 4. Настройка Environment Variables
В Vercel Dashboard или через CLI:

```bash
# Установка переменных через CLI
vercel env add NODE_ENV production
vercel env add JWT_SECRET your-super-secret-jwt-key-production-2025
vercel env add DATABASE_URL postgresql://user:pass@host:5432/vhm24_prod
vercel env add REDIS_URL redis://redis-host:6379
vercel env add TELEGRAM_BOT_TOKEN your-telegram-bot-token
vercel env add PORT 8000
```

### 5. Повторный деплой с переменными
```bash
vercel --prod
```

---

## 🔧 Vercel Configuration

### vercel.json настройки:
- ✅ Node.js serverless функция
- ✅ API routes настроены
- ✅ Health check endpoint
- ✅ CORS headers
- ✅ 30 секунд timeout

### Поддерживаемые routes:
- ✅ `GET /health` - Health check
- ✅ `POST /api/v1/auth/login` - Аутентификация
- ✅ `GET /api/v1/auth/me` - Current user
- ✅ `GET /api/v1/users` - Users management
- ✅ `GET /api/v1/bags` - Bags management
- ✅ `GET /api/v1/expenses` - Expenses
- ✅ `GET /api/v1/revenues` - Revenues
- ✅ `GET /api/v1/incassations` - Incassations
- ✅ Все остальные API endpoints

---

## 🌐 Production URLs

После успешного деплоя:

### Health Check:
```
GET https://vhm24-yourname.vercel.app/health
```

### API Endpoints:
```
POST https://vhm24-yourname.vercel.app/api/v1/auth/login
GET  https://vhm24-yourname.vercel.app/api/v1/auth/me
GET  https://vhm24-yourname.vercel.app/api/v1/users
GET  https://vhm24-yourname.vercel.app/api/v1/bags
GET  https://vhm24-yourname.vercel.app/api/v1/expenses
GET  https://vhm24-yourname.vercel.app/api/v1/revenues
```

---

## 🔐 Environment Variables для Vercel

### Обязательные:
```bash
NODE_ENV=production
PORT=8000
JWT_SECRET=your-super-secret-jwt-key-production-2025
```

### Database (выберите один вариант):

#### Option 1: Supabase (рекомендуется для Vercel)
```bash
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

#### Option 2: PlanetScale
```bash
DATABASE_URL=mysql://user:pass@xxx.planetscale.com/vhm24?sslaccept=strict
```

#### Option 3: Railway
```bash
DATABASE_URL=postgresql://postgres:pass@xxx.railway.app:5432/railway
```

### Optional (для расширенного функционала):
```bash
REDIS_URL=redis://redis-host:6379
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

---

## 📊 Vercel Serverless Limits

### Function Limits:
- ✅ **Execution time:** 30 seconds (настроено)
- ✅ **Memory:** 1024 MB (default)
- ✅ **Payload:** 4.5 MB
- ✅ **Cold starts:** ~200-500ms

### Оптимизации:
- Минимальные зависимости в package.json
- Efficient database queries через Prisma
- Caching strategy для статических данных
- Health check для monitoring

---

## 🔍 Troubleshooting

### 1. Build Errors
```bash
# Проверить локально
npm install
npm start

# Проверить Vercel логи
vercel logs
```

### 2. Database Connection
```bash
# Тестировать DATABASE_URL
npx prisma db push
npx prisma studio
```

### 3. Environment Variables
```bash
# Проверить переменные
vercel env ls

# Обновить переменную
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME new_value
```

### 4. Function Timeout
```bash
# Если timeout 30 секунд не хватает
# Обновить vercel.json:
"functions": {
  "backend/src/index.js": {
    "maxDuration": 60
  }
}
```

---

## 🚀 Quick Deploy Commands

### Быстрый деплой:
```bash
# 1. Клонировать и настроить
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24

# 2. Установить Vercel CLI
npm install -g vercel

# 3. Деплой
vercel

# 4. Настроить environment variables через dashboard
# https://vercel.com/dashboard

# 5. Production деплой
vercel --prod
```

### После деплоя - тестирование:
```bash
# Health check
curl https://your-app.vercel.app/health

# Auth test
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📈 Monitoring & Analytics

### Vercel Dashboard:
- ✅ Function invocations
- ✅ Response times
- ✅ Error rates
- ✅ Bandwidth usage

### Health Check Monitoring:
```bash
# Endpoint для мониторинга
GET /health

# Ожидаемый ответ:
{
  "status": "ok",
  "service": "VHM24 Backend",
  "timestamp": "2025-07-14T08:00:00.000Z"
}
```

---

## 🎯 Next Steps

### После успешного деплоя:

1. **Настроить Database**
   - Создать production БД (Supabase/PlanetScale)
   - Запустить Prisma migrations
   - Импортировать начальные данные

2. **Настроить Telegram Bot**
   - Получить bot token от @BotFather
   - Обновить TELEGRAM_BOT_TOKEN в Vercel
   - Настроить webhook на Vercel URL

3. **Custom Domain (опционально)**
   ```bash
   vercel domains add yourdomain.com
   ```

4. **SSL Certificate**
   - Автоматически предоставляется Vercel
   - HTTPS по умолчанию

5. **Мониторинг**
   - Настроить Vercel Analytics
   - Добавить external monitoring (UptimeRobot)

---

## ✅ Vercel Deployment Checklist

### Pre-deployment:
- [x] vercel.json конфигурация создана
- [x] Environment variables подготовлены  
- [x] Backend код адаптирован для serverless
- [x] Health check endpoint работает
- [x] API routes протестированы локально

### During deployment:
- [ ] Vercel CLI установлен
- [ ] Успешный логин в Vercel
- [ ] Project создан в Vercel
- [ ] Environment variables настроены
- [ ] Production деплой выполнен

### Post-deployment:
- [ ] Health check работает на production URL
- [ ] API endpoints отвечают корректно
- [ ] Database подключена и миграции применены
- [ ] SSL certificate активен
- [ ] Custom domain настроен (опционально)

---

**VHM24 готов к деплою на Vercel! 🚀**

*Простой, быстрый и масштабируемый serverless deployment*
