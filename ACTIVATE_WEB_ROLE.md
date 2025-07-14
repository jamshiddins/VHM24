# АКТИВАЦИЯ WEB ROLE В RAILWAY

## КРИТИЧЕСКИ ВАЖНО ДЛЯ РАБОТЫ ПРОЕКТА

### Шаги для активации Web Role:

1. Откройте Railway Dashboard:
   https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c

2. Перейдите в настройки Web Service:
   Railway → Project → Web Service → Settings → Service Type

3. Установите тип сервиса:
   ```
   Web (exposes HTTP port)
   ```

4. Проверьте Start Command:
   ```
   npm run start
   ```

5. Проверьте Health Check Path:
   ```
   /health
   ```

6. Сохраните настройки

7. Перейдите в Deployments и создайте новый деплой:
   - Нажмите "New Deployment"
   - Выберите ветку или загрузите код
   - Дождитесь завершения деплоя

8. Проверьте работу приложения:
   ```
   https://vhm24-1-0.up.railway.app/health
   ```

## ПОЧЕМУ ЭТО ВАЖНО

Без активации Web Role:
- Railway не запускает деплой
- Не проверяет PORT
- Возвращает 404 "Application not found"

## ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

В коде уже настроено:
- Прослушивание process.env.PORT
- Health check endpoint
- Procfile с web: npm run start
- Правильный package.json

Осталось только активировать Web Role в Dashboard!
