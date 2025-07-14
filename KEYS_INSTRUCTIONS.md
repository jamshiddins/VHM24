
# ИНСТРУКЦИИ ПО ПОЛУЧЕНИЮ КЛЮЧЕЙ VHM24

## 1. DigitalOcean Spaces Secret Key

### Способ 1: Найти существующий ключ
1. Откройте: https://cloud.digitalocean.com/account/api/spaces
2. Найдите ключ: DO00XEB6BC6XZ8Q2M4KQ
3. Если есть - скопируйте Secret Key
4. Если нет - переходите к способу 2

### Способ 2: Создать новый ключ
1. На той же странице нажмите "Generate New Key"
2. Имя: VHM24-Production
3. Скопируйте Access Key и Secret Key
4. Обновите в .env оба значения

## 2. Telegram Bot Token
1. Откройте: https://t.me/BotFather
2. Команда: /newbot
3. Имя бота: VHM24 VendHub Bot
4. Username: vhm24_vendhub_bot (или любой доступный)
5. Скопируйте токен

## 3. Railway Database & Redis
1. Откройте: https://railway.app/dashboard
2. Выберите проект VHM24
3. PostgreSQL -> Variables -> DATABASE_URL
4. Redis -> Variables -> REDIS_URL
5. Скопируйте значения

## 4. Обновление .env файла
После получения всех ключей выполните:
```bash
node update-env-with-keys.js
```

## 5. Проверка
```bash
node test-all-connections.js
```
