# Настройка Worker и Scheduler в Railway

В этом документе описаны шаги по настройке и проверке работы worker и scheduler в Railway.

## Содержание

1. [Введение](#введение)
2. [Настройка Railway](#настройка-railway)
3. [Проверка работы](#проверка-работы)
4. [Устранение неполадок](#устранение-неполадок)
5. [Мониторинг](#мониторинг)

## Введение

VHM24 использует архитектуру с несколькими сервисами:

- **Web** - основной веб-сервер, обрабатывающий HTTP-запросы
- **Worker** - фоновый процесс для обработки задач
- **Scheduler** - планировщик задач

Worker и Scheduler взаимодействуют через Redis, используя механизм публикации/подписки (pub/sub). Scheduler создает задачи и публикует их в канале Redis, а Worker подписывается на этот канал и обрабатывает задачи.

## Настройка Railway

### 1. Обновление файла railway.json

Файл `railway.json` должен содержать настройки для всех трех сервисов: web, worker и scheduler. Убедитесь, что файл содержит следующую структуру:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "numReplicas": 1,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "healthcheckInterval": 60,
    "startCommand": "node start-vendhub-with-sqlite.js",
    "envVars": [
      {
        "name": "NODE_ENV",
        "value": "production"
      },
      {
        "name": "PORT",
        "value": "3000"
      }
    ]
  },
  "services": [
    {
      "name": "web",
      "startCommand": "node start-vendhub-with-sqlite.js",
      "healthcheckPath": "/api/health",
      "healthcheckTimeout": 300,
      "healthcheckInterval": 60,
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10,
      "numReplicas": 1
    },
    {
      "name": "worker",
      "startCommand": "npm run start:worker",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10,
      "numReplicas": 1
    },
    {
      "name": "scheduler",
      "startCommand": "npm run start:scheduler",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10,
      "numReplicas": 1
    }
  ]
}
```

### 2. Настройка переменных окружения

Убедитесь, что в Railway настроены все необходимые переменные окружения, особенно `REDIS_URL`. Эта переменная должна указывать на экземпляр Redis, доступный для всех сервисов.

Для проверки переменных окружения можно использовать скрипт `check-railway-env.js`:

```bash
node check-railway-env.js
```

### 3. Деплой в Railway

После обновления `railway.json` и настройки переменных окружения, выполните деплой в Railway:

```bash
npm run deploy:railway
```

## Проверка работы

### 1. Проверка статуса сервисов

После деплоя в Railway, проверьте статус всех сервисов в панели управления Railway. Все три сервиса (web, worker и scheduler) должны быть запущены и работать без ошибок.

### 2. Проверка подключения к Redis

Для проверки подключения worker и scheduler к Redis и их взаимодействия, запустите скрипт проверки:

```bash
npm run check:worker-scheduler
```

Этот скрипт проверит:
- Подключение к Redis
- Возможность публикации и подписки на сообщения
- Взаимодействие между worker и scheduler

Результаты проверки будут сохранены в файле отчета в директории `reports/`.

### 3. Проверка логов

Проверьте логи сервисов в панели управления Railway. Логи должны содержать информацию о подключении к Redis и обработке задач.

## Устранение неполадок

### Проблема: Worker или Scheduler не запускаются

**Решение:**
1. Проверьте логи сервиса в Railway
2. Убедитесь, что скрипты `start:worker` и `start:scheduler` правильно настроены в `package.json`
3. Проверьте, что файлы `src/worker.js` и `src/scheduler.js` существуют и не содержат ошибок

### Проблема: Worker и Scheduler не могут подключиться к Redis

**Решение:**
1. Проверьте переменную окружения `REDIS_URL` в Railway
2. Убедитесь, что Redis запущен и доступен
3. Проверьте, что порт Redis не заблокирован файрволом

### Проблема: Worker не получает задачи от Scheduler

**Решение:**
1. Проверьте, что оба сервиса используют одинаковое имя канала Redis для обмена сообщениями
2. Убедитесь, что формат сообщений соответствует ожидаемому
3. Проверьте логи обоих сервисов на наличие ошибок

## Мониторинг

Для мониторинга работы worker и scheduler рекомендуется:

1. Настроить алерты в Railway на ошибки в логах
2. Регулярно запускать скрипт проверки `npm run check:worker-scheduler`
3. Настроить мониторинг Redis для отслеживания количества сообщений в каналах

## Дополнительные ресурсы

- [Документация Railway](https://docs.railway.app/)
- [Документация Redis](https://redis.io/documentation)
- [Документация Node.js Redis клиента](https://github.com/redis/node-redis)
