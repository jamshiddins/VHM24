# Настройка мониторинга и алертинга для VHM24

## Обзор

Данная инструкция описывает процесс настройки мониторинга и алертинга для проекта VHM24. Мониторинг позволяет отслеживать состояние системы, выявлять проблемы до того, как они повлияют на пользователей, и получать уведомления о критических событиях.

## Компоненты мониторинга

1. **Health Check** - проверка доступности сервисов
2. **Метрики производительности** - отслеживание использования ресурсов
3. **Логирование** - сбор и анализ логов
4. **Алертинг** - уведомления о проблемах
5. **Дашборды** - визуализация метрик

## Инструменты

- **Uptime Robot** - мониторинг доступности
- **Prometheus** - сбор метрик
- **Grafana** - визуализация метрик
- **Sentry** - отслеживание ошибок
- **Papertrail** - централизованное логирование
- **Telegram Bot** - уведомления

## Настройка Uptime Robot

### 1. Регистрация и создание мониторов

1. Зарегистрируйтесь на [Uptime Robot](https://uptimerobot.com/)
2. Создайте монитор для каждого сервиса:
   - API Gateway: `https://api.vhm24.com/health`
   - Auth Service: `https://api.vhm24.com/auth/health`
   - Machines Service: `https://api.vhm24.com/machines/health`
   - Inventory Service: `https://api.vhm24.com/inventory/health`
   - Tasks Service: `https://api.vhm24.com/tasks/health`
   - Backup Service: `https://api.vhm24.com/backup/health`

### 2. Настройка уведомлений

1. Перейдите в раздел "Alert Contacts"
2. Добавьте контакты для уведомлений:
   - Email
   - SMS
   - Telegram
   - Webhook (для интеграции с другими системами)

### 3. Настройка интервалов проверки

1. Для критичных сервисов (API Gateway, Auth) установите интервал 1 минута
2. Для остальных сервисов установите интервал 5 минут

## Настройка Prometheus и Grafana

### 1. Установка Prometheus

```bash
# Создание конфигурационного файла
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'vhm24'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api.vhm24.com']
EOF

# Запуск Prometheus в Docker
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 2. Установка Grafana

```bash
# Запуск Grafana в Docker
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

### 3. Настройка дашбордов в Grafana

1. Откройте Grafana по адресу `http://localhost:3000` (логин/пароль по умолчанию: admin/admin)
2. Добавьте источник данных Prometheus
3. Импортируйте готовые дашборды для Node.js приложений (ID: 1860, 11159)
4. Создайте собственные дашборды для мониторинга:
   - Количество запросов в секунду
   - Время ответа API
   - Использование CPU и памяти
   - Количество ошибок
   - Состояние базы данных и Redis

## Настройка Sentry

### 1. Регистрация и создание проекта

1. Зарегистрируйтесь на [Sentry](https://sentry.io/)
2. Создайте новый проект для Node.js
3. Получите DSN для интеграции

### 2. Интеграция с приложением

Добавьте следующий код в начало файла `start-services.js`:

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});
```

### 3. Настройка уведомлений

1. В Sentry перейдите в раздел "Settings" > "Alerts"
2. Настройте правила алертинга:
   - Новые ошибки
   - Частые ошибки (более 10 в минуту)
   - Критические ошибки (затрагивающие большое количество пользователей)

## Настройка Papertrail

### 1. Регистрация и получение endpoint

1. Зарегистрируйтесь на [Papertrail](https://www.papertrail.com/)
2. Получите endpoint для отправки логов (например, `logs.papertrailapp.com:12345`)

### 2. Настройка отправки логов

Добавьте следующий код в файл `start-services.js`:

```javascript
const winston = require('winston');
require('winston-papertrail').Papertrail;

const papertrailTransport = new winston.transports.Papertrail({
  host: process.env.PAPERTRAIL_HOST,
  port: process.env.PAPERTRAIL_PORT,
  hostname: 'vhm24',
  program: 'node',
  colorize: true
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    papertrailTransport
  ]
});
```

### 3. Настройка алертов в Papertrail

1. В Papertrail перейдите в раздел "Alerts"
2. Создайте поисковые запросы для важных событий:
   - `error`
   - `exception`
   - `failed`
   - `critical`
3. Настройте уведомления по email или webhook

## Настройка Telegram-бота для уведомлений

### 1. Создание бота для уведомлений

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Получите токен бота
4. Создайте группу для уведомлений и добавьте в нее бота

### 2. Создание скрипта для отправки уведомлений

Создайте файл `scripts/send-alert.js`:

```javascript
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.ALERT_BOT_TOKEN;
const chatId = process.env.ALERT_CHAT_ID;

const bot = new TelegramBot(token);

async function sendAlert(message, level = 'info') {
  let emoji = '📊';
  
  switch (level) {
    case 'warning':
      emoji = '⚠️';
      break;
    case 'error':
      emoji = '🔴';
      break;
    case 'success':
      emoji = '✅';
      break;
    case 'info':
    default:
      emoji = 'ℹ️';
  }
  
  const formattedMessage = `${emoji} *VHM24 Alert*\n\n${message}\n\n🕒 ${new Date().toISOString()}`;
  
  try {
    await bot.sendMessage(chatId, formattedMessage, { parse_mode: 'Markdown' });
    console.log('Alert sent successfully');
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  const level = process.argv[2] || 'info';
  const message = process.argv[3] || 'Test alert';
  
  sendAlert(message, level)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  module.exports = sendAlert;
}
```

### 3. Интеграция с системами мониторинга

Настройте webhook в Uptime Robot, Sentry и Papertrail для отправки уведомлений через скрипт:

```bash
node scripts/send-alert.js error "API Gateway is down!"
```

## Настройка собственного сервиса мониторинга

### 1. Создание сервиса мониторинга

Создайте файл `services/monitoring/src/index.js`:

```javascript
/**
 * VHM24 - VendHub Manager 24/7
 * Сервис мониторинга
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const axios = require('axios');
const cron = require('node-cron');
const sendAlert = require('../../../scripts/send-alert');

// Конфигурация
const config = {
  services: [
    { name: 'gateway', url: 'http://localhost:8000/health' },
    { name: 'auth', url: 'http://localhost:3001/health' },
    { name: 'machines', url: 'http://localhost:3002/health' },
    { name: 'inventory', url: 'http://localhost:3003/health' },
    { name: 'tasks', url: 'http://localhost:3004/health' },
    { name: 'backup', url: 'http://localhost:3007/health' }
  ],
  checkInterval: '*/5 * * * *', // Каждые 5 минут
  timeout: 5000 // 5 секунд
};

// Проверка здоровья сервиса
async function checkServiceHealth(service) {
  try {
    const response = await axios.get(service.url, { timeout: config.timeout });
    
    if (response.status === 200 && response.data.status === 'ok') {
      console.log(`✅ Service ${service.name} is healthy`);
      return { healthy: true, service, data: response.data };
    } else {
      console.error(`❌ Service ${service.name} returned non-ok status: ${response.data.status}`);
      return { 
        healthy: false, 
        service, 
        error: `Non-ok status: ${response.data.status}`,
        data: response.data
      };
    }
  } catch (error) {
    console.error(`❌ Failed to check service ${service.name}:`, error.message);
    return { 
      healthy: false, 
      service, 
      error: error.message 
    };
  }
}

// Проверка всех сервисов
async function checkAllServices() {
  console.log(`🔍 Checking all services at ${new Date().toISOString()}`);
  
  const results = await Promise.all(
    config.services.map(service => checkServiceHealth(service))
  );
  
  const unhealthyServices = results.filter(result => !result.healthy);
  
  if (unhealthyServices.length > 0) {
    const message = `${unhealthyServices.length} services are unhealthy:\n\n` +
      unhealthyServices.map(result => 
        `- ${result.service.name}: ${result.error}`
      ).join('\n');
    
    await sendAlert(message, 'error');
  }
  
  return results;
}

// Запуск по расписанию
cron.schedule(config.checkInterval, async () => {
  try {
    await checkAllServices();
  } catch (error) {
    console.error('Failed to check services:', error);
  }
});

// Запуск при старте
checkAllServices()
  .then(() => {
    console.log(`✅ Monitoring service started, checking every ${config.checkInterval}`);
  })
  .catch(error => {
    console.error('Failed to start monitoring:', error);
  });
```

### 2. Запуск сервиса мониторинга

Добавьте сервис мониторинга в скрипт `start-services.js` и запустите его вместе с остальными сервисами.

## Рекомендации по мониторингу

1. **Определите SLA** - установите целевые показатели доступности (например, 99.9%)
2. **Мониторьте бизнес-метрики** - отслеживайте не только технические метрики, но и бизнес-показатели (количество продаж, активных пользователей и т.д.)
3. **Настройте проактивный мониторинг** - выявляйте проблемы до того, как они повлияют на пользователей
4. **Регулярно проверяйте дашборды** - анализируйте тренды и выявляйте потенциальные проблемы
5. **Документируйте инциденты** - ведите журнал инцидентов и извлекайте уроки

## Заключение

Настроенная система мониторинга и алертинга позволяет оперативно выявлять и устранять проблемы в работе VHM24, обеспечивая высокую доступность и надежность сервиса. Регулярный анализ метрик помогает оптимизировать производительность и планировать развитие инфраструктуры.
