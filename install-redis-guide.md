# 🔴 УСТАНОВКА REDIS ДЛЯ VHM24

## Windows

### Вариант 1: Memurai (рекомендуется для Windows)
```bash
# Скачать с https://www.memurai.com/
# Установить и запустить как сервис
```

### Вариант 2: Redis через WSL
```bash
# Установить WSL2
wsl --install

# В WSL установить Redis
sudo apt update
sudo apt install redis-server

# Запустить Redis
sudo service redis-server start

# Проверить
redis-cli ping
```

### Вариант 3: Docker
```bash
# Запустить Redis в Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Проверить
docker ps
```

## Linux/macOS

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS
brew install redis
brew services start redis

# Проверка
redis-cli ping
```

## Проверка подключения

```bash
# Тест подключения
redis-cli ping
# Должен вернуть: PONG

# Тест из Node.js
node -e "
const Redis = require('ioredis');
const redis = new Redis('redis://localhost:6379');
redis.ping().then(result => {
  console.log('Redis connected:', result);
  process.exit(0);
}).catch(err => {
  console.error('Redis error:', err.message);
  process.exit(1);
});
"
```

## Настройка для VHM24

После установки Redis обновите .env файлы:

```env
# .env (корневой)
REDIS_URL=redis://localhost:6379

# apps/telegram-bot/.env
REDIS_URL=redis://localhost:6379
```

Затем запустите полную версию бота:
```bash
cd apps/telegram-bot && npm start
