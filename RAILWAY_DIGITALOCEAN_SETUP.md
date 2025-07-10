# 🚀 Добавление DigitalOcean Spaces в Railway

## Переменные для добавления в Railway:

```
S3_ACCESS_KEY=DO00XEB6BC6XZ8Q2M4KQ
S3_SECRET_KEY=SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=vhm24-uploads
S3_REGION=nyc3
```

## Пошаговая инструкция:

### 1. Откройте Railway Dashboard
- Перейдите на https://railway.app/dashboard
- Выберите ваш проект VHM24

### 2. Перейдите в Variables
- Нажмите на вкладку **"Variables"**
- Вы увидите список существующих переменных

### 3. Добавьте новые переменные
Нажмите **"+ New Variable"** и добавьте по очереди:

| Имя переменной | Значение |
|----------------|----------|
| S3_ACCESS_KEY | DO00XEB6BC6XZ8Q2M4KQ |
| S3_SECRET_KEY | SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk |
| S3_ENDPOINT | https://nyc3.digitaloceanspaces.com |
| S3_BUCKET | vhm24-uploads |
| S3_REGION | nyc3 |

### 4. Сохраните изменения
- После добавления всех переменных Railway автоматически передеплоит проект
- Подождите 2-3 минуты пока деплой завершится

## Проверка работы:

После деплоя ваш проект на Railway будет иметь доступ к:
- ✅ PostgreSQL (уже настроен)
- ✅ Redis (уже настроен)
- ✅ DigitalOcean Spaces (новые переменные)
- ✅ Telegram Bot (уже настроен)

## Тестирование загрузки файлов:

1. Откройте https://vhm24-production.up.railway.app
2. Попробуйте загрузить файл через интерфейс
3. Файл должен сохраниться в DigitalOcean Spaces

## Примечание:

Убедитесь, что в DigitalOcean Spaces:
1. Создан bucket с именем `vhm24-uploads`
2. Настроены правильные CORS правила для вашего домена
3. Включен публичный доступ если нужно

## Готово! 🎉

После добавления этих переменных ваш проект на Railway будет полностью интегрирован с DigitalOcean Spaces для хранения файлов.
