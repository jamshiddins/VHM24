# 🚀 Запустите VHM24 на Railway прямо сейчас!

## Быстрый старт (5 минут)

### Шаг 1: Подготовка переменных окружения

#### Вариант А: Автоматическая настройка (рекомендуется)
```bash
node setup-railway-env.js
```

#### Вариант Б: Ручная настройка
1. Откройте [Railway Dashboard](https://railway.app/dashboard)
2. Выберите проект `vhm24-production`
3. Перейдите в Variables
4. Добавьте минимальный набор переменных:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
NODE_ENV=production
```

### Шаг 2: Деплой изменений

```bash
# Добавляем все изменения
git add .

# Коммитим с понятным сообщением
git commit -m "Fix Railway deployment - use single process mode"

# Пушим в репозиторий
git push origin main
```

### Шаг 3: Проверка работы (через 2-3 минуты)

```bash
# Проверяем health endpoint
curl https://vhm24-production.up.railway.app/health

# Проверяем подключение к БД
curl https://vhm24-production.up.railway.app/api/v1/test-db

# Смотрим логи
railway logs
```

## Что мы исправили

1. **Создали `railway-start.js`** - специальный файл запуска для Railway
2. **Обновили `package.json`** - теперь использует правильный start скрипт
3. **Документировали переменные** - четкие инструкции по настройке
4. **Упростили архитектуру** - все сервисы в одном процессе для Railway

## Ожидаемый результат

После успешного деплоя вы увидите:

```json
// GET https://vhm24-production.up.railway.app/health
{
  "status": "ok",
  "service": "gateway",
  "services": {
    "auth": "ok",
    "machines": "ok",
    "inventory": "ok",
    "tasks": "ok",
    "bunkers": "ok"
  },
  "database": "supabase",
  "dbStatus": "connected",
  "timestamp": "2025-01-09T..."
}
```

## Если что-то пошло не так

### База данных не подключается
- Проверьте DATABASE_URL в Railway Variables
- Убедитесь что Supabase проект активен
- Проверьте пароль в строке подключения

### Сервисы показывают offline
- Проверьте логи: `railway logs`
- Убедитесь что все npm пакеты установлены
- Попробуйте перезапустить: `railway restart`

### 404 на API endpoints
- Дождитесь полного запуска (2-3 минуты)
- Проверьте что Gateway запустился на правильном порту
- Убедитесь что переменная PORT не переопределена

## Полезные команды

```bash
# Просмотр логов в реальном времени
railway logs -f

# Проверка переменных
railway variables

# Перезапуск приложения
railway restart

# Открыть в браузере
railway open
```

## Следующие шаги после запуска

1. **Создайте первого пользователя** через seed скрипт
2. **Настройте Telegram бота** если нужно
3. **Добавьте мониторинг** для отслеживания работы
4. **Настройте бэкапы** базы данных

## Контакты для помощи

Если возникли проблемы:
1. Проверьте файл `RAILWAY_API_STATUS.md`
2. Изучите логи через `railway logs`
3. Убедитесь что все переменные установлены правильно

---

**Готово к деплою!** Следуйте инструкциям выше и через 5 минут ваш API будет работать на Railway. 🎉
