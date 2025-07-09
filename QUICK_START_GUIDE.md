# 🚀 VHM24 - Руководство по быстрому запуску

## 📋 Обзор

VHM24 - это современная система управления вендинговыми автоматами с микросервисной архитектурой и веб-дашбордом.

---

## ⚡ Быстрый запуск (3 простых шага)

### 1. 🔧 Запуск всех микросервисов
```bash
node start-all-services.js
```

### 2. 🧪 Тестирование системы (в новом терминале)
```bash
node test-system-comprehensive.js
```

### 3. 🖥️ Запуск веб-дашборда (в новом терминале)
```bash
node start-dashboard.js
```

---

## 📊 Что будет доступно

### 🌐 Веб-интерфейсы:
- **Веб-дашборд**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

### 🔌 API Endpoints:
- **Dashboard Stats**: http://localhost:8000/api/v1/dashboard/stats
- **Machines**: http://localhost:8000/api/v1/machines
- **Database Test**: http://localhost:8000/api/v1/test-db

### 📱 Telegram Bot:
- Автоматически запускается с микросервисами
- Поддерживает команды управления автоматами

---

## 🛠️ Детальные инструкции

### Шаг 1: Запуск микросервисов

```bash
# Запускает все 9 микросервисов:
node start-all-services.js

# Сервисы:
# ✅ Gateway (8000) - API Gateway с WebSocket
# ✅ Auth (3001) - Аутентификация и авторизация  
# ✅ Machines (3002) - Управление автоматами
# ✅ Inventory (3003) - Управление инвентарем
# ✅ Tasks (3004) - Управление задачами
# ✅ Bunkers (3005) - Управление бункерами
# ✅ Notifications (3006) - Уведомления
# ✅ Backup (3007) - Резервное копирование
# ✅ Monitoring (3008) - Мониторинг системы
```

**Ожидаемый результат:**
```
🚀 Starting VHM24 Services...
==================================================
✅ gateway service started successfully
✅ auth service started successfully
✅ machines service started successfully
...
🎯 Summary: 9/9 services started
```

### Шаг 2: Тестирование системы

```bash
# В новом терминале:
node test-system-comprehensive.js

# Выполняет 25+ тестов:
# 📋 Service Health Tests (9 тестов)
# 🔌 API Tests (6 тестов) 
# 🗄️ Database Tests (2 теста)
# 🛡️ Security Tests (3 теста)
# ⚡ Performance Tests (3 теста)
# 🔗 Integration Tests (2 теста)
```

**Ожидаемый результат:**
```
📊 Test Results Summary
============================================================
Total Tests: 25
✅ Passed: 23
❌ Failed: 0
⚠️ Warnings: 2
📈 Success Rate: 92.0%
⏱️ Total Time: 5.2s
```

### Шаг 3: Запуск веб-дашборда

```bash
# В новом терминале:
node start-dashboard.js

# Автоматически:
# 1. Проверит зависимости
# 2. Установит их при необходимости
# 3. Запустит Next.js dev сервер
```

**Ожидаемый результат:**
```
🚀 Starting web dashboard...
✅ Dependencies installed successfully
▲ Next.js 14.2.30
- Local: http://localhost:3000
- Ready in 2.1s
```

---

## 🎯 Проверка работоспособности

### 1. Проверьте микросервисы:
```bash
curl http://localhost:8000/health
# Ответ: {"status":"ok","service":"gateway",...}
```

### 2. Проверьте базу данных:
```bash
curl http://localhost:8000/api/v1/test-db
# Ответ: {"success":true,"data":{...}}
```

### 3. Откройте веб-дашборд:
- Перейдите на http://localhost:3000
- Должен открыться современный дашборд с метриками

---

## 🔧 Устранение неполадок

### Проблема: Сервисы не запускаются
**Решение:**
```bash
# Проверьте переменные окружения
cat .env

# Убедитесь, что порты свободны
netstat -an | findstr "8000\|3001\|3002"

# Перезапустите сервисы
node start-all-services.js
```

### Проблема: Тесты не проходят
**Решение:**
```bash
# Убедитесь, что сервисы запущены
curl http://localhost:8000/health

# Подождите 10-15 секунд после запуска сервисов
# Затем запустите тесты снова
node test-system-comprehensive.js
```

### Проблема: Веб-дашборд не открывается
**Решение:**
```bash
# Проверьте зависимости
cd apps/web-dashboard
npm install

# Запустите вручную
npm run dev

# Или используйте наш скрипт
cd ../..
node start-dashboard.js
```

### Проблема: Ошибки TypeScript в дашборде
**Решение:**
```bash
# Установите недостающие зависимости
cd apps/web-dashboard
npm install @heroicons/react axios recharts date-fns

# Перезапустите
npm run dev
```

---

## 📱 Использование системы

### Веб-дашборд:
1. **Главная страница** - общая статистика и метрики
2. **Автоматы** - управление вендинговыми автоматами
3. **Инвентарь** - управление товарами
4. **Задачи** - управление задачами обслуживания
5. **Отчеты** - аналитика и отчеты

### API:
```bash
# Получить статистику
curl http://localhost:8000/api/v1/dashboard/stats

# Получить список автоматов
curl http://localhost:8000/api/v1/machines

# Получить статистику автоматов
curl http://localhost:8000/api/v1/machines/stats
```

### Telegram Bot:
- `/start` - начать работу с ботом
- `/machines` - просмотр автоматов
- `/tasks` - управление задачами
- `/help` - справка по командам

---

## 🛑 Остановка системы

### Остановить все сервисы:
```bash
# В терминале с запущенными сервисами:
Ctrl + C
```

### Остановить веб-дашборд:
```bash
# В терминале с дашбордом:
Ctrl + C
```

---

## 📈 Следующие шаги

### Для разработки:
1. Добавьте новые страницы в веб-дашборд
2. Расширьте функциональность API
3. Добавьте новые тесты
4. Настройте CI/CD pipeline

### Для production:
1. Настройте переменные окружения
2. Настройте базу данных PostgreSQL
3. Настройте Redis для кеширования
4. Настройте мониторинг и логирование

---

## 🆘 Поддержка

### Логи системы:
- Сервисы выводят логи в консоль
- Telegram bot логи: `services/telegram-bot/logs/`
- Отчеты тестирования: `test-report-*.json`

### Полезные команды:
```bash
# Проверка статуса всех сервисов
node test-system-comprehensive.js

# Быстрая проверка API
curl http://localhost:8000/health

# Просмотр логов конкретного сервиса
# (логи выводятся в консоль с префиксом [service-name])
```

---

## ✅ Контрольный список готовности

- [ ] Все 9 микросервисов запущены
- [ ] Тесты проходят с успешностью >80%
- [ ] Веб-дашборд открывается на localhost:3000
- [ ] API отвечает на localhost:8000
- [ ] База данных подключена
- [ ] Telegram bot активен

**Если все пункты выполнены - система готова к использованию! 🎉**

---

**Дата создания:** 09.07.2025  
**Версия:** 1.0  
**Проект:** VHM24 - VendHub Manager 24/7
