# 📊 Настройка мониторинга для проекта VHM24

## 📋 Обзор

Этот документ содержит инструкции по настройке мониторинга для проекта VHM24 с использованием Prometheus и Grafana.

## 🔧 Настройка Prometheus

### 1. Установка Prometheus

#### Локальная установка

1. Скачайте Prometheus с официального сайта: https://prometheus.io/download/
2. Распакуйте архив
3. Создайте файл конфигурации `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vhm24'
    static_configs:
      - targets: ['localhost:3000']
```

4. Запустите Prometheus:

```bash
./prometheus --config.file=prometheus.yml
```

#### Установка в Docker

1. Создайте файл `docker-compose.yml`:

```yaml
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

2. Создайте файл конфигурации `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vhm24'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

3. Запустите Prometheus:

```bash
docker-compose up -d
```

### 2. Интеграция Prometheus в Express

1. Установите пакет `prom-client`:

```bash
npm install prom-client
```

2. Создайте файл `src/metrics.js`:

```javascript
const promClient = require('prom-client');

// Создаем реестр метрик
const register = new promClient.Registry();

// Добавляем стандартные метрики
promClient.collectDefaultMetrics({ register });

// Создаем метрики
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

const databaseQueryDurationMicroseconds = new promClient.Histogram({
  name: 'database_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['query', 'table'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const redisOperationDurationMicroseconds = new promClient.Histogram({
  name: 'redis_operation_duration_ms',
  help: 'Duration of Redis operations in ms',
  labelNames: ['operation'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const telegramBotRequestCounter = new promClient.Counter({
  name: 'telegram_bot_requests_total',
  help: 'Total number of Telegram bot requests',
  labelNames: ['command', 'scene']
});

// Регистрируем метрики
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(databaseQueryDurationMicroseconds);
register.registerMetric(redisOperationDurationMicroseconds);
register.registerMetric(telegramBotRequestCounter);

module.exports = {
  register,
  httpRequestDurationMicroseconds,
  httpRequestCounter,
  databaseQueryDurationMicroseconds,
  redisOperationDurationMicroseconds,
  telegramBotRequestCounter
};
```

3. Добавьте middleware для сбора метрик в `server.js`:

```javascript
const express = require('express');
const { register, httpRequestDurationMicroseconds, httpRequestCounter } = require('./src/metrics');

const app = express();

// Middleware для сбора метрик
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const code = res.statusCode;
    end({ method: req.method, route, code });
    httpRequestCounter.inc({ method: req.method, route, code });
  });
  next();
});

// Endpoint для метрик
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Остальные маршруты
// ...

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

4. Добавьте сбор метрик для базы данных в `backend/src/db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const { databaseQueryDurationMicroseconds } = require('../../src/metrics');

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  const end = databaseQueryDurationMicroseconds.startTimer();
  e.query.finally(() => {
    const table = e.query.match(/FROM\s+([^\s]+)/i)?.[1] || 'unknown';
    end({ query: e.query.substring(0, 50), table });
  });
});

module.exports = prisma;
```

5. Добавьте сбор метрик для Redis в `src/redis.js`:

```javascript
const { createClient } = require('redis');
const { redisOperationDurationMicroseconds } = require('./metrics');

const client = createClient({
  url: process.env.REDIS_URL
});

// Оборачиваем методы Redis для сбора метрик
const originalGet = client.get;
client.get = async function (key) {
  const end = redisOperationDurationMicroseconds.startTimer();
  try {
    const result = await originalGet.call(this, key);
    end({ operation: 'get' });
    return result;
  } catch (error) {
    end({ operation: 'get' });
    throw error;
  }
};

const originalSet = client.set;
client.set = async function (key, value, options) {
  const end = redisOperationDurationMicroseconds.startTimer();
  try {
    const result = await originalSet.call(this, key, value, options);
    end({ operation: 'set' });
    return result;
  } catch (error) {
    end({ operation: 'set' });
    throw error;
  }
};

module.exports = client;
```

6. Добавьте сбор метрик для Telegram бота в `apps/telegram-bot/src/index.js`:

```javascript
const { Telegraf } = require('telegraf');
const { telegramBotRequestCounter } = require('../../../src/metrics');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Middleware для сбора метрик
bot.use((ctx, next) => {
  const command = ctx.message?.text?.split(' ')[0] || 'unknown';
  const scene = ctx.scene?.current?.id || 'unknown';
  telegramBotRequestCounter.inc({ command, scene });
  return next();
});

// Остальной код бота
// ...

bot.launch();
```

## 🔧 Настройка Grafana

### 1. Установка Grafana

#### Локальная установка

1. Скачайте Grafana с официального сайта: https://grafana.com/grafana/download
2. Распакуйте архив
3. Запустите Grafana:

```bash
./bin/grafana-server
```

#### Установка в Docker

1. Добавьте Grafana в `docker-compose.yml`:

```yaml
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - 3001:3000
    volumes:
      - grafana-storage:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  grafana-storage:
```

2. Запустите Grafana:

```bash
docker-compose up -d
```

### 2. Настройка Grafana

1. Откройте Grafana в браузере: http://localhost:3001
2. Войдите с логином `admin` и паролем `admin`
3. Добавьте источник данных Prometheus:
   - Перейдите в Configuration → Data Sources
   - Нажмите "Add data source"
   - Выберите "Prometheus"
   - Укажите URL: http://prometheus:9090
   - Нажмите "Save & Test"

### 3. Создание дашбордов

#### Дашборд для HTTP-запросов

1. Создайте новый дашборд:
   - Нажмите "+" → "Dashboard"
   - Нажмите "Add new panel"
2. Настройте панель для отображения количества HTTP-запросов:
   - Название: "HTTP Requests"
   - Запрос: `sum(rate(http_requests_total[5m])) by (method, route)`
   - Тип визуализации: "Graph"
   - Нажмите "Apply"

#### Дашборд для времени выполнения HTTP-запросов

1. Добавьте новую панель:
   - Нажмите "Add panel"
2. Настройте панель для отображения времени выполнения HTTP-запросов:
   - Название: "HTTP Request Duration"
   - Запрос: `histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, method, route))`
   - Тип визуализации: "Graph"
   - Нажмите "Apply"

#### Дашборд для базы данных

1. Добавьте новую панель:
   - Нажмите "Add panel"
2. Настройте панель для отображения времени выполнения запросов к базе данных:
   - Название: "Database Query Duration"
   - Запрос: `histogram_quantile(0.95, sum(rate(database_query_duration_ms_bucket[5m])) by (le, table))`
   - Тип визуализации: "Graph"
   - Нажмите "Apply"

#### Дашборд для Redis

1. Добавьте новую панель:
   - Нажмите "Add panel"
2. Настройте панель для отображения времени выполнения операций Redis:
   - Название: "Redis Operation Duration"
   - Запрос: `histogram_quantile(0.95, sum(rate(redis_operation_duration_ms_bucket[5m])) by (le, operation))`
   - Тип визуализации: "Graph"
   - Нажмите "Apply"

#### Дашборд для Telegram бота

1. Добавьте новую панель:
   - Нажмите "Add panel"
2. Настройте панель для отображения количества запросов к Telegram боту:
   - Название: "Telegram Bot Requests"
   - Запрос: `sum(rate(telegram_bot_requests_total[5m])) by (command, scene)`
   - Тип визуализации: "Graph"
   - Нажмите "Apply"

### 4. Настройка алертов

1. Создайте алерт для времени выполнения HTTP-запросов:
   - Перейдите в Alerting → Alert rules
   - Нажмите "New alert rule"
   - Название: "High HTTP Request Duration"
   - Запрос: `histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, method, route)) > 500`
   - Условие: "IS ABOVE 500"
   - Период оценки: "5m"
   - Нажмите "Save"

2. Создайте алерт для количества ошибок HTTP:
   - Перейдите в Alerting → Alert rules
   - Нажмите "New alert rule"
   - Название: "High HTTP Error Rate"
   - Запрос: `sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05`
   - Условие: "IS ABOVE 0.05"
   - Период оценки: "5m"
   - Нажмите "Save"

## 🔧 Настройка AlertManager

### 1. Установка AlertManager

#### Локальная установка

1. Скачайте AlertManager с официального сайта: https://prometheus.io/download/#alertmanager
2. Распакуйте архив
3. Создайте файл конфигурации `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'telegram'

receivers:
  - name: 'telegram'
    telegram_configs:
      - bot_token: 'YOUR_TELEGRAM_BOT_TOKEN'
        chat_id: YOUR_TELEGRAM_CHAT_ID
        parse_mode: 'HTML'
```

4. Запустите AlertManager:

```bash
./alertmanager --config.file=alertmanager.yml
```

#### Установка в Docker

1. Добавьте AlertManager в `docker-compose.yml`:

```yaml
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  alertmanager:
    image: prom/alertmanager
    ports:
      - 9093:9093
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - 3001:3000
    volumes:
      - grafana-storage:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  grafana-storage:
```

2. Создайте файл конфигурации `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'telegram'

receivers:
  - name: 'telegram'
    telegram_configs:
      - bot_token: 'YOUR_TELEGRAM_BOT_TOKEN'
        chat_id: YOUR_TELEGRAM_CHAT_ID
        parse_mode: 'HTML'
```

3. Обновите файл конфигурации Prometheus `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - 'alerts.yml'

scrape_configs:
  - job_name: 'vhm24'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

4. Создайте файл с правилами алертов `alerts.yml`:

```yaml
groups:
  - name: vhm24
    rules:
      - alert: HighHttpRequestDuration
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, method, route)) > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High HTTP request duration"
          description: "HTTP request duration is above 500ms for 5 minutes"
      
      - alert: HighHttpErrorRate
        expr: sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High HTTP error rate"
          description: "HTTP error rate is above 5% for 5 minutes"
```

5. Запустите AlertManager:

```bash
docker-compose up -d
```

## 📊 Мониторинг в Railway

Railway не предоставляет встроенных инструментов для мониторинга с использованием Prometheus и Grafana. Однако вы можете использовать внешние сервисы для мониторинга вашего приложения в Railway.

### 1. Использование Grafana Cloud

1. Зарегистрируйтесь на Grafana Cloud: https://grafana.com/products/cloud/
2. Создайте новый экземпляр Grafana
3. Настройте источник данных Prometheus
4. Создайте дашборды для мониторинга вашего приложения

### 2. Использование Prometheus в Railway

1. Создайте новый сервис в Railway для Prometheus
2. Настройте Prometheus для сбора метрик с вашего приложения
3. Настройте Grafana для отображения метрик из Prometheus

## 📝 Рекомендации по мониторингу

1. **Мониторьте ключевые метрики**:
   - Время выполнения HTTP-запросов
   - Количество ошибок HTTP
   - Время выполнения запросов к базе данных
   - Время выполнения операций Redis
   - Количество запросов к Telegram боту

2. **Настройте алерты для критических метрик**:
   - Высокое время выполнения HTTP-запросов
   - Высокий процент ошибок HTTP
   - Высокое время выполнения запросов к базе данных
   - Высокое время выполнения операций Redis

3. **Регулярно проверяйте дашборды**:
   - Ежедневно проверяйте дашборды для выявления аномалий
   - Еженедельно анализируйте тренды для выявления проблем производительности

4. **Используйте логирование вместе с мониторингом**:
   - Настройте логирование для сбора информации о событиях
   - Используйте логи для отладки проблем, выявленных мониторингом

## 📝 Заключение

Настройка мониторинга позволяет отслеживать работу приложения в реальном времени, обнаруживать проблемы и оптимизировать производительность. Следуйте рекомендациям по мониторингу для обеспечения стабильной работы приложения.
