# Отчет о проверке подключения worker и scheduler в Railway
Дата: 16.07.2025, 18:09:07

## Переменные окружения
- REDIS_URL: Настроен
- NODE_ENV: production
- RAILWAY_PUBLIC_URL: https://web-production-d9582.up.railway.app

## Результаты проверки
[2025-07-16T13:09:07.158Z] [INFO] Запуск проверки подключения worker и scheduler в Railway...
[2025-07-16T13:09:07.182Z] [INFO] Проверка настроек Railway...
[2025-07-16T13:09:07.182Z] [SUCCESS] Все переменные окружения Railway настроены
[2025-07-16T13:09:07.183Z] [SUCCESS] Файл railway.json найден
[2025-07-16T13:09:07.183Z] [SUCCESS] Найдено 3 сервисов в railway.json
[2025-07-16T13:09:07.184Z] [SUCCESS] Сервис worker настроен в railway.json
[2025-07-16T13:09:07.184Z] [INFO] Команда запуска worker: npm run start:worker
[2025-07-16T13:09:07.185Z] [SUCCESS] Сервис scheduler настроен в railway.json
[2025-07-16T13:09:07.185Z] [INFO] Команда запуска scheduler: npm run start:scheduler
[2025-07-16T13:09:07.186Z] [INFO] Проверка подключения к Redis...
[2025-07-16T13:09:07.186Z] [INFO] Используется REDIS_URL: redis://default:AlBz...
[2025-07-16T13:09:07.873Z] [SUCCESS] Подключение к Redis успешно
[2025-07-16T13:09:07.874Z] [INFO] Тестирование публикации и подписки...
[2025-07-16T13:09:08.814Z] [SUCCESS] Подписка на канал test-channel успешна
[2025-07-16T13:09:09.083Z] [SUCCESS] Получено сообщение: Тестовое сообщение
[2025-07-16T13:09:09.085Z] [SUCCESS] Сообщение отправлено 1 подписчикам
[2025-07-16T13:09:09.620Z] [INFO] Соединение с Redis закрыто
[2025-07-16T13:09:09.620Z] [INFO] Имитация работы worker...
[2025-07-16T13:09:10.151Z] [SUCCESS] Worker подключен к Redis
[2025-07-16T13:09:10.419Z] [SUCCESS] Worker подписан на канал tasks
[2025-07-16T13:09:10.420Z] [INFO] Ожидание задачи от scheduler...
[2025-07-16T13:09:10.623Z] [INFO] Имитация работы scheduler...
[2025-07-16T13:09:11.164Z] [SUCCESS] Scheduler подключен к Redis
[2025-07-16T13:09:11.429Z] [SUCCESS] Задача отправлена 3 подписчикам
[2025-07-16T13:09:11.430Z] [SUCCESS] Worker получил задачу: TEST_TASK (test-task-1752671351165)
[2025-07-16T13:09:11.430Z] [INFO] Данные задачи: {"message":"Это тестовая задача от scheduler","timestamp":"2025-07-16T13:09:11.165Z"}
[2025-07-16T13:09:11.697Z] [INFO] Scheduler отключен от Redis
