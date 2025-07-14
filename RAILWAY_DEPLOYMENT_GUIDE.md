# Руководство по деплою на Railway

## Проблемы и решения

### Типичные проблемы

1. **Сборка проходит, но не происходит деплой**
   - Нет active deployment
   - Логи пустые
   - Приложение не запускается

2. **404 "Application not found"**
   - Railway не видит сервер
   - Приложение не подключено к web-порту

### Решения

#### 1. Проверьте `package.json`

Railway должен понять, как запускать сервер:

```json
"scripts": {
  "start": "node index.js" // или app.js / server.js
}
```

#### 2. Проверьте прослушивание порта

В коде должно быть:

```js
app.listen(process.env.PORT || 3000, () => {
  console.log('Server running...')
})
```

Railway **требует** слушать `process.env.PORT`.

#### 3. Проверьте `Procfile`

Файл `Procfile` в корне проекта:

```
web: npm start
```

#### 4. Проверьте настройки в Railway Dashboard

Зайдите в:

> **Railway → Project → Web Service → Settings → Start Command**

И пропишите:

```
npm start
```

#### 5. Проверьте тип сервиса

В:

> **Railway → Web Service → Settings → Service Type**

Установите:

```
🟢 Web (exposes HTTP port)
```

#### 6. Проверьте переменные окружения

В `.env`:

```env
PORT=3000
RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app
```

#### 7. Обходной путь: вручную вызовите добавление деплоймента

1. Откройте Railway → Web Service → Deployments
2. Нажмите "New Deployment" вручную
3. Выберите Git ветку или zip-архив
4. Пропишите "Start command": `npm start`

## Чек-лист

| Проверка           | Статус                                        |
| ------------------ | --------------------------------------------- |
| Код                | ✅ готов                                       |
| Сервер             | ✅ корректен                                   |
| PORT               | ✅ настроен на `process.env.PORT`             |
| Web Role           | ❗ проверить в Dashboard                       |
| Deployment Trigger | ❗ проверить в Dashboard                       |
| Railway Platform   | ❗ может требовать ручного деплоя             |

## Полезные команды

```bash
# Деплой
railway up

# Статус
railway status

# Логи
railway logs

# Переменные
railway variables

# Перезапуск
railway restart
```
