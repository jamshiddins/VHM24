# Статус API VHM24 на Railway

## URL развернутого приложения
- **Production URL**: https://vhm24-production.up.railway.app
- **API Base URL**: https://vhm24-production.up.railway.app/api/v1

## Текущий статус (09.01.2025)

### ✅ Что работает:
1. **API Gateway** - запущен и отвечает на запросы
2. **Health endpoint** - доступен по адресу `/health`
3. **Основная инфраструктура** - Railway успешно развернул приложение

### ❌ Проблемы:
1. **База данных Supabase** - не может подключиться
   - Ошибка: `Can't reach database server at db.pgghdmepazenwkrmagvy.supabase.co:5432`
   - Возможные причины:
     - Неправильные учетные данные в переменных окружения
     - База данных приостановлена или удалена
     - Проблемы с сетевым доступом

2. **Все микросервисы offline**:
   - auth service (порт 3001)
   - machines service (порт 3002)
   - inventory service (порт 3003)
   - tasks service (порт 3004)
   - bunkers service (порт 3005)

## Доступные эндпоинты

### Публичные (без авторизации):
- `GET /health` - проверка состояния системы
- `GET /api/v1/test-db` - тест подключения к БД

### Защищенные (требуют JWT токен):
- `POST /api/v1/upload` - загрузка файлов
- `GET /api/v1/dashboard/stats` - статистика дашборда
- `GET /api/v1/audit-log` - журнал аудита

### Proxy маршруты к микросервисам:
- `/api/v1/auth/*` → Auth Service
- `/api/v1/machines/*` → Machines Service
- `/api/v1/inventory/*` → Inventory Service
- `/api/v1/tasks/*` → Tasks Service
- `/api/v1/bunkers/*` → Bunkers Service

### WebSocket:
- `ws://[domain]/ws` - real-time обновления

## Рекомендации по исправлению

### 1. Проверить переменные окружения в Railway:
```
DATABASE_URL - строка подключения к Supabase
JWT_SECRET - секретный ключ для JWT
SUPABASE_URL - URL вашего проекта Supabase
SUPABASE_ANON_KEY - анонимный ключ Supabase
```

### 2. Проверить статус Supabase:
- Войдите в dashboard Supabase
- Проверьте, что проект активен
- Получите актуальную строку подключения

### 3. Развернуть микросервисы:
В текущей конфигурации все сервисы должны быть в одном процессе.
Проверьте файл `index.js` в корне проекта.

### 4. Проверить логи в Railway:
```bash
railway logs
```

## Тестирование API

### Проверка здоровья:
```bash
curl https://vhm24-production.up.railway.app/health
```

### Тест базы данных:
```bash
curl https://vhm24-production.up.railway.app/api/v1/test-db
```

### Авторизация (когда БД будет работать):
```bash
curl -X POST https://vhm24-production.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Следующие шаги

1. **Срочно**: Исправить подключение к базе данных
   - Проверьте переменную DATABASE_URL в Railway
   - Убедитесь, что Supabase проект активен
   - Обновите строку подключения если необходимо

2. **Важно**: Изменить стратегию запуска
   - Текущий `index.js` пытается запустить все сервисы как отдельные процессы
   - На Railway лучше использовать один процесс (Gateway) или контейнеризацию
   - Временное решение: использовать `index-gateway-only.js`

3. **Альтернативные решения**:
   - **Вариант 1**: Запускать только Gateway (рекомендуется для начала)
     ```json
     // В package.json измените start скрипт:
     "start": "node index-gateway-only.js"
     ```
   
   - **Вариант 2**: Развернуть каждый сервис как отдельное приложение Railway
   
   - **Вариант 3**: Использовать Docker Compose для локальной разработки

4. **Желательно**: Настроить мониторинг и логирование
5. **Опционально**: Добавить SSL сертификат (Railway предоставляет автоматически)

## Полезные команды Railway CLI

```bash
# Просмотр логов
railway logs

# Просмотр переменных окружения
railway variables

# Перезапуск приложения
railway restart

# Открыть приложение в браузере
railway open
```

## Быстрое исправление для Railway

### Шаг 1: Обновите переменные окружения в Railway Dashboard

Необходимые переменные:
```
DATABASE_URL=postgresql://postgres:[password]@db.pgghdmepazenwkrmagvy.supabase.co:5432/postgres
JWT_SECRET=your-secret-key-here
SUPABASE_URL=https://pgghdmepazenwkrmagvy.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Шаг 2: Используйте упрощенный запуск (только Gateway)

1. Измените `package.json`:
```json
{
  "scripts": {
    "start": "node index-gateway-only.js"
  }
}
```

2. Сделайте commit и push:
```bash
git add .
git commit -m "Use gateway-only mode for Railway"
git push
```

3. Railway автоматически передеплоит приложение

### Шаг 3: Проверьте работу

После деплоя проверьте:
- https://vhm24-production.up.railway.app/health
- https://vhm24-production.up.railway.app/api/v1/test-db

## Текущий статус компонентов

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| API Gateway | ✅ Работает | Доступен по URL |
| База данных | ❌ Ошибка | Проверьте DATABASE_URL |
| Auth Service | ❌ Offline | Не запущен |
| Machines Service | ❌ Offline | Не запущен |
| Inventory Service | ❌ Offline | Не запущен |
| Tasks Service | ❌ Offline | Не запущен |
| Bunkers Service | ❌ Offline | Не запущен |
| Telegram Bot | ❓ Неизвестно | Зависит от переменных |

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи: `railway logs`
2. Проверьте переменные: `railway variables`
3. Убедитесь, что Supabase проект активен
4. Проверьте правильность DATABASE_URL
