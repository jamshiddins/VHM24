# VHM24 Platform - Быстрый старт

## 🚀 Запуск за 3 минуты

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone [repository-url]
cd vhm24-platform

# Скопируйте и настройте .env
copy .env.example .env
# Отредактируйте .env и добавьте DATABASE_URL от Supabase
```

### 2. Запуск инфраструктуры

```bash
# Запустите Docker контейнеры
docker-compose up -d
```

### 3. Установка зависимостей

```bash
# Установите все пакеты
npm install
npm install --workspaces
npm install redis  # Для тестирования
```

### 4. Запуск платформы

```bash
# Windows
.\start-all.bat

# Linux/Mac
./start-all.sh
```

### 5. Проверка работоспособности

```bash
# Быстрая проверка
curl http://localhost:8000/health

# Полное тестирование
node test-all-endpoints.js
```

## 🔍 Что где находится?

| Сервис        | Порт | Описание            |
| ------------- | ---- | ------------------- |
| Gateway       | 8000 | Основной API        |
| Auth          | 3001 | Аутентификация      |
| Machines      | 3002 | Управление машинами |
| Inventory     | 3003 | Инвентаризация      |
| Tasks         | 3004 | Задачи              |
| Redis         | 6379 | Кеш                 |
| MinIO         | 9000 | S3 хранилище        |
| MinIO Console | 9001 | Веб-интерфейс       |

## 🧪 Тестовый вход

- Email: `admin@vhm24.ru`
- Password: `admin123`

## 📝 Примеры запросов

### Авторизация

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vhm24.ru","password":"admin123"}'
```

### Получение статистики

```bash
curl http://localhost:8000/api/v1/dashboard/stats
```

## 🛑 Остановка платформы

```bash
# Остановить все сервисы
.\stop-all.bat

# Остановить Docker контейнеры
docker-compose down
```

## ❓ Troubleshooting

### Порт занят

```bash
# Найти процесс на порту (например, 8000)
netstat -ano | findstr :8000

# Завершить процесс по PID
taskkill /PID [PID] /F
```

### База данных не подключается

1. Проверьте DATABASE_URL в .env
2. Убедитесь, что Supabase проект активен
3. Запустите `node test-connection.js`

### Сервис не запускается

1. Проверьте логи в окне терминала сервиса
2. Убедитесь, что порт не занят
3. Переустановите зависимости: `npm install`

---

Готово! Платформа запущена и работает 🎉
