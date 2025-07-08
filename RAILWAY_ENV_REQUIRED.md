# Обязательные переменные окружения для Railway

## Критически важные переменные

Скопируйте эти переменные в Railway Dashboard → Variables:

```env
# База данных (получите из Supabase Dashboard)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT секрет (сгенерируйте случайную строку)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Supabase (получите из Supabase Dashboard → Settings → API)
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://vhm24-production.up.railway.app/webhook

# Порты (Railway автоматически устанавливает PORT)
# PORT устанавливается Railway автоматически
GATEWAY_PORT=8000
AUTH_PORT=3001
MACHINES_PORT=3002
INVENTORY_PORT=3003
TASKS_PORT=3004
BUNKERS_PORT=3005

# Окружение
NODE_ENV=production
```

## Как получить значения переменных

### 1. DATABASE_URL из Supabase:
1. Войдите в [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Settings → Database
4. Connection string → URI (используйте режим "Transaction")
5. Скопируйте и замените [YOUR-PASSWORD] на ваш пароль

### 2. SUPABASE_URL и SUPABASE_ANON_KEY:
1. В Supabase Dashboard
2. Settings → API
3. Project URL = SUPABASE_URL
4. Project API keys → anon public = SUPABASE_ANON_KEY

### 3. JWT_SECRET:
Сгенерируйте случайную строку (минимум 32 символа):
```bash
openssl rand -base64 32
```
Или используйте онлайн генератор: https://generate-secret.vercel.app/32

### 4. TELEGRAM_BOT_TOKEN (опционально):
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте /newbot
4. Следуйте инструкциям
5. Скопируйте токен

## Установка переменных в Railway

### Способ 1: Через веб-интерфейс
1. Откройте [Railway Dashboard](https://railway.app/dashboard)
2. Выберите ваш проект
3. Перейдите в Variables
4. Нажмите "Raw Editor"
5. Вставьте все переменные
6. Нажмите "Update Variables"

### Способ 2: Через Railway CLI
```bash
# Установите переменные одну за другой
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"
railway variables set SUPABASE_URL="https://..."
railway variables set SUPABASE_ANON_KEY="eyJ..."

# Или все сразу из файла .env
railway variables set < .env.production
```

## Проверка после установки

После установки переменных и деплоя проверьте:

1. **Health check:**
```bash
curl https://vhm24-production.up.railway.app/health
```

2. **Database connection:**
```bash
curl https://vhm24-production.up.railway.app/api/v1/test-db
```

3. **Logs:**
```bash
railway logs
```

## Важные замечания

1. **НЕ коммитьте** эти переменные в Git
2. **Используйте** разные значения для production и development
3. **Регулярно меняйте** JWT_SECRET для безопасности
4. **Проверьте** что Supabase проект активен (не приостановлен)
5. **Убедитесь** что используете правильный DATABASE_URL (с паролем)

## Если что-то не работает

1. Проверьте логи: `railway logs`
2. Убедитесь что все переменные установлены: `railway variables`
3. Проверьте статус Supabase проекта
4. Попробуйте перезапустить: `railway restart`
