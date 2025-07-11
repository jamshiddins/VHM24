# 🔧 Руководство по подключению к Railway PostgreSQL

## ⚠️ Важно понимать:

### Internal URL (postgres.railway.internal)

- Работает **ТОЛЬКО** внутри Railway
- Используется когда ваш код запущен на Railway
- НЕ работает локально

### Public URL (roundhouse.proxy.rlwy.net)

- Работает откуда угодно
- Используется для локальной разработки
- Может меняться при пересоздании базы

## 📋 Как получить правильный URL:

1. **Зайдите в Railway Dashboard**
2. **Откройте ваш PostgreSQL сервис**
3. **Перейдите во вкладку "Connect"**
4. **Найдите секцию "Available Variables"**
5. **Скопируйте DATABASE_URL**

## 🔍 Проверка подключения:

```bash
# Установите PostgreSQL клиент если нет
# Windows: скачайте с https://www.postgresql.org/download/windows/

# Проверьте подключение
psql "ваш_DATABASE_URL"
```

## 💡 Решение проблем:

### Если база недоступна локально:

1. **Проверьте Railway Dashboard** - работает ли база
2. **Попробуйте пересоздать базу:**
   - Удалите PostgreSQL сервис
   - Добавьте новый PostgreSQL
   - Скопируйте новый DATABASE_URL

3. **Альтернатива - локальная PostgreSQL:**

   ```bash
   # Установите PostgreSQL локально
   # Создайте базу
   createdb vhm24

   # Используйте локальный URL
   DATABASE_URL="postgresql://postgres:password@localhost:5432/vhm24"
   ```

## 🚀 Запуск без миграций:

Если база недоступна, можно запустить проект в mock режиме:

```bash
# Запустите только Web Dashboard
cd apps/web-dashboard
npm run dev
```

## 📝 Для production на Railway:

В Railway переменные окружения настроены правильно:

- DATABASE_URL использует internal URL
- Все работает автоматически
- Миграции применяются при деплое

## ✅ Итог:

1. **Для локальной разработки** - нужен публичный URL из Railway
2. **Для production** - Railway сам использует internal URL
3. **Если база недоступна** - используйте локальную PostgreSQL или mock режим
