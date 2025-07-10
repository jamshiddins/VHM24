# VHM24 - Примеры исправлений

В этом документе приведены примеры типичных проблем, обнаруживаемых системой исправления ошибок VHM24, и способы их исправления.

## 🔒 Безопасность

### 1. Утечка информации об ошибках

**Проблема:**
```javascript
app.get('/api/users', async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.send(users);
  } catch (err) {
    // Утечка информации об ошибке
    reply.send(err);
  }
});
```

**Исправление:**
```javascript
app.get('/api/users', async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.send(users);
  } catch (err) {
    // Безопасная обработка ошибки
    logger.error('Error fetching users:', err);
    reply.code(err.statusCode || 500).send({
      error: err.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  }
});
```

### 2. Отсутствие валидации входных данных

**Проблема:**
```javascript
app.post('/api/users', async (request, reply) => {
  // Отсутствует валидация входных данных
  const user = await prisma.user.create({
    data: request.body
  });
  reply.send(user);
});
```

**Исправление:**
```javascript
const schemas = {
  createUserSchema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['user', 'admin'] }
      }
    }
  }
};

app.post('/api/users', { schema: schemas.createUserSchema }, async (request, reply) => {
  // Данные уже валидированы
  const user = await prisma.user.create({
    data: request.body
  });
  reply.send(user);
});
```

### 3. Hardcoded credentials

**Проблема:**
```javascript
const jwt = require('jsonwebtoken');

// Hardcoded секрет
const JWT_SECRET = 'my-super-secret-key-123456';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
}
```

**Исправление:**
```javascript
const jwt = require('jsonwebtoken');

// Использование переменной окружения
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}
```

## 📝 Качество кода

### 1. Смешивание ES6 и CommonJS модулей

**Проблема:**
```javascript
// Смешивание ES6 и CommonJS
import express from 'express';
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

export default function createApp() {
  // ...
}
```

**Исправление:**
```javascript
// Только CommonJS
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

function createApp() {
  // ...
}

module.exports = createApp;
```

### 2. Async функции без обработки ошибок

**Проблема:**
```javascript
app.get('/api/products', async (request, reply) => {
  // Отсутствует обработка ошибок
  const products = await prisma.product.findMany();
  reply.send(products);
});
```

**Исправление:**
```javascript
app.get('/api/products', async (request, reply) => {
  try {
    const products = await prisma.product.findMany();
    reply.send(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to fetch products'
    });
  }
});
```

### 3. Использование console.log вместо структурированного логирования

**Проблема:**
```javascript
function processOrder(order) {
  console.log('Processing order:', order.id);
  
  if (order.status === 'paid') {
    console.log('Order is paid');
  } else {
    console.error('Order is not paid');
  }
}
```

**Исправление:**
```javascript
const logger = require('@vhm24/shared/logger');

function processOrder(order) {
  logger.info('Processing order', { orderId: order.id });
  
  if (order.status === 'paid') {
    logger.info('Order status', { orderId: order.id, status: 'paid' });
  } else {
    logger.error('Order not paid', { orderId: order.id, status: order.status });
  }
}
```

### 4. Магические числа в коде

**Проблема:**
```javascript
function calculateDiscount(price) {
  // Магические числа
  if (price > 10000) {
    return price * 0.15;
  } else if (price > 5000) {
    return price * 0.1;
  } else if (price > 1000) {
    return price * 0.05;
  }
  return 0;
}
```

**Исправление:**
```javascript
// Constants
const DISCOUNT_THRESHOLD_HIGH = 10000;
const DISCOUNT_THRESHOLD_MEDIUM = 5000;
const DISCOUNT_THRESHOLD_LOW = 1000;
const DISCOUNT_RATE_HIGH = 0.15;
const DISCOUNT_RATE_MEDIUM = 0.1;
const DISCOUNT_RATE_LOW = 0.05;

function calculateDiscount(price) {
  if (price > DISCOUNT_THRESHOLD_HIGH) {
    return price * DISCOUNT_RATE_HIGH;
  } else if (price > DISCOUNT_THRESHOLD_MEDIUM) {
    return price * DISCOUNT_RATE_MEDIUM;
  } else if (price > DISCOUNT_THRESHOLD_LOW) {
    return price * DISCOUNT_RATE_LOW;
  }
  return 0;
}
```

## 📦 Зависимости

### 1. Отсутствующие зависимости

**Проблема:**
```javascript
// Используется модуль, который не указан в package.json
const moment = require('moment');

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}
```

**Исправление:**
```bash
# Установка отсутствующей зависимости
npm install moment --save
```

### 2. Уязвимости в зависимостях

**Проблема:**
```bash
$ npm audit
# Найдены уязвимости в зависимостях
```

**Исправление:**
```bash
# Исправление уязвимостей
npm audit fix

# Если не помогло, можно использовать --force
npm audit fix --force
```

## ⚡ Производительность

### 1. findMany без пагинации

**Проблема:**
```javascript
app.get('/api/products', async (request, reply) => {
  // Отсутствует пагинация
  const products = await prisma.product.findMany();
  reply.send(products);
});
```

**Исправление:**
```javascript
app.get('/api/products', async (request, reply) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 20;
  
  const products = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  const total = await prisma.product.count();
  
  reply.send({
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### 2. Синхронные операции файловой системы

**Проблема:**
```javascript
const fs = require('fs');

function saveConfig(config) {
  // Синхронная операция блокирует event loop
  fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
}
```

**Исправление:**
```javascript
const fs = require('fs').promises;

async function saveConfig(config) {
  // Асинхронная операция не блокирует event loop
  await fs.writeFile('config.json', JSON.stringify(config, null, 2));
}
```

### 3. N+1 проблема

**Проблема:**
```javascript
app.get('/api/orders', async (request, reply) => {
  const orders = await prisma.order.findMany();
  
  // N+1 проблема: для каждого заказа выполняется отдельный запрос
  for (const order of orders) {
    order.items = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    });
  }
  
  reply.send(orders);
});
```

**Исправление:**
```javascript
app.get('/api/orders', async (request, reply) => {
  // Включаем связанные данные в один запрос
  const orders = await prisma.order.findMany({
    include: {
      items: true
    }
  });
  
  reply.send(orders);
});
```

## 🏗️ Архитектура

### 1. Отсутствие директорий

**Проблема:**
```
services/
  auth/
    index.js  # Все файлы в корне
    routes.js
    handlers.js
```

**Исправление:**
```
services/
  auth/
    src/        # Исходный код
      index.js
      routes.js
      handlers.js
    tests/      # Тесты
      auth.test.js
    docs/       # Документация
      README.md
```

### 2. Отсутствие тестов

**Проблема:**
```
services/
  auth/
    src/
      index.js
      routes.js
      handlers.js
    # Отсутствуют тесты
```

**Исправление:**
```javascript
// services/auth/tests/auth.test.js
const { test } = require('tap');
const build = require('../src/app');

test('health check', async (t) => {
  const app = build({ logger: false });
  
  const response = await app.inject({
    method: 'GET',
    url: '/health'
  });
  
  t.equal(response.statusCode, 200);
  t.match(JSON.parse(response.payload), {
    status: 'ok',
    service: 'auth'
  });
});

test('requires authentication', async (t) => {
  const app = build({ logger: false });
  
  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/auth/me'
  });
  
  t.equal(response.statusCode, 401);
});
```

## 🚀 DevOps

### 1. Отсутствие Dockerfile

**Проблема:**
```
services/
  auth/
    # Отсутствует Dockerfile
```

**Исправление:**
```dockerfile
# services/auth/Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/auth/package*.json ./services/auth/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/auth ./services/auth
COPY packages ./packages

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/auth ./services/auth
COPY --from=builder /app/packages ./packages

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start service
CMD ["node", "services/auth/src/index.js"]
```

### 2. Отсутствие health check endpoint

**Проблема:**
```javascript
// services/auth/src/index.js
const fastify = require('fastify')();

// ... routes ...

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
```

**Исправление:**
```javascript
// services/auth/src/index.js
const fastify = require('fastify')();

// ... routes ...

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'auth',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };
  
  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }
  
  // Redis check (if applicable)
  if (typeof redis !== 'undefined') {
    try {
      await redis.ping();
      health.checks.redis = 'ok';
    } catch (error) {
      health.checks.redis = 'error';
      health.status = 'degraded';
    }
  }
  
  reply.code(health.status === 'ok' ? 200 : 503).send(health);
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
