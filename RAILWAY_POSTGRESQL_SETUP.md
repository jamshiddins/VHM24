# Настройка Railway PostgreSQL для VHM24

## 🚀 Быстрая настройка

### 1. Создайте PostgreSQL в Railway

1. Откройте ваш проект в [Railway Dashboard](https://railway.app/dashboard)
2. Нажмите **"New Service"**
3. Выберите **"Database" → "Add PostgreSQL"**
4. Railway автоматически создаст базу данных

### 2. Получите DATABASE_URL

1. Кликните на созданный PostgreSQL сервис
2. Перейдите во вкладку **"Variables"**
3. Найдите переменную `DATABASE_URL`
4. Скопируйте значение (выглядит примерно так):
   ```
   postgresql://postgres:XXXXXX@roundhouse.proxy.rlwy.net:XXXXX/railway
   ```

### 3. Обновите переменные окружения

#### Для локальной разработки (.env):

```env
DATABASE_URL=postgresql://postgres:XXXXXX@roundhouse.proxy.rlwy.net:XXXXX/railway
```

#### Для Railway (в Dashboard):

1. Откройте ваш основной сервис (не PostgreSQL)
2. Перейдите в **"Variables"**
3. Добавьте:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secure-jwt-secret
   TELEGRAM_BOT_TOKEN=your-bot-token
   ```

### 4. Примените миграции

#### Локально:

```bash
# Генерация Prisma клиента
cd packages/database && npx prisma generate

# Применение миграций
cd packages/database && npx prisma migrate deploy

# Создание начальных данных (опционально)
cd packages/database && npm run seed
```

#### В Railway:

Используйте Railway Shell или добавьте в build команды:

```bash
cd packages/database && npx prisma migrate deploy
```

## 🔍 Проверка подключения

### 1. Тест подключения локально:

```bash
# Установите переменные окружения
set DATABASE_URL=postgresql://...

# Проверьте подключение
cd packages/database && npx prisma db pull
```

### 2. Проверка через API:

```bash
# Запустите проект
npm run dev

# Проверьте health check
curl http://localhost:8000/health
```

## ⚠️ Частые проблемы

### Ошибка: Can't reach database server

**Причины:**

- Неправильный DATABASE_URL
- База данных спит (Railway Free tier)
- Сетевые ограничения

**Решение:**

1. Проверьте DATABASE_URL
2. Откройте Railway Dashboard - база проснется
3. Проверьте firewall/VPN

### Ошибка: SSL required

**Решение:** Добавьте к DATABASE_URL:

```
?sslmode=require
```

### Ошибка: Database does not exist

**Решение:** Railway создает БД автоматически. Проверьте, что используете правильное имя БД из URL.

## 📊 Мониторинг

В Railway Dashboard вы можете:

- Просматривать метрики использования
- Видеть логи подключений
- Мониторить производительность

## 🔐 Безопасность

1. **Никогда не коммитьте DATABASE_URL в Git**
2. Используйте переменные окружения
3. Регулярно меняйте пароли
4. Включите SSL для production

## 📝 Полезные команды

```bash
# Просмотр схемы БД
cd packages/database && npx prisma studio

# Сброс БД (осторожно!)
cd packages/database && npx prisma migrate reset

# Создание новой миграции
cd packages/database && npx prisma migrate dev --name your_migration_name
```

## 🎯 Следующие шаги

1. Обновите .env с актуальным DATABASE_URL
2. Запустите `npm run dev`
3. Проверьте http://localhost:8000/health
4. Если все работает - деплойте на Railway!
