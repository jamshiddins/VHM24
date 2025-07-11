# 🚀 Настройка PostgreSQL в Railway

## ✅ У вас уже есть PostgreSQL!

Вы видите `${{ Postgres.DATABASE_URL }}` - это значит, что PostgreSQL уже создан в вашем проекте
Railway!

## 📋 Как настроить DATABASE_URL:

### Вариант 1: Через Railway Dashboard (рекомендуется)

1. Откройте [Railway Dashboard](https://railway.app/dashboard)
2. Выберите ваш проект VHM24
3. Перейдите в сервис VHM24
4. Откройте вкладку "Variables"
5. Найдите переменную `DATABASE_URL`
6. Установите значение: `${{ Postgres.DATABASE_URL }}`
7. Добавьте новую переменную: `USE_MULTIPLE_DATABASES` = `false`
8. Нажмите "Save"

### Вариант 2: Получить реальный URL

1. В Railway Dashboard откройте сервис Postgres
2. Перейдите во вкладку "Connect"
3. Скопируйте "Postgres Connection URL"
4. Используйте его вместо `${{ Postgres.DATABASE_URL }}`

## 🔧 Дополнительные переменные для добавления:

```env
DATABASE_URL=${{ Postgres.DATABASE_URL }}
USE_MULTIPLE_DATABASES=false
REDIS_URL=${{ Redis.REDIS_URL }}  # если есть Redis

# Опционально для разных схем:
AUTH_DATABASE_URL=${{ Postgres.DATABASE_URL }}
MACHINES_DATABASE_URL=${{ Postgres.DATABASE_URL }}
INVENTORY_DATABASE_URL=${{ Postgres.DATABASE_URL }}
TASKS_DATABASE_URL=${{ Postgres.DATABASE_URL }}
SHARED_DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

## 📝 Важно:

- `${{ Postgres.DATABASE_URL }}` - это ссылка Railway на URL вашей базы данных
- Railway автоматически подставит реальный URL при деплое
- Не нужно копировать реальный URL, используйте ссылку

## 🎯 После настройки переменных:

1. Railway автоматически передеплоит приложение
2. Дождитесь завершения деплоя
3. Проверьте логи: `railway logs`
4. Протестируйте API: https://vhm24-production.up.railway.app/health

---

**Следующий шаг**: Откройте Railway Dashboard и добавьте переменные!
