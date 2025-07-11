# VHM24 - Примеры исправлений ошибок

В этом документе приведены примеры типичных ошибок в проекте VHM24 и способы их исправления. Эти
примеры помогут вам понять, как система исправления ошибок работает и какие изменения она вносит в
код.

## 1. Проблемы безопасности

### 1.1. Утечка информации об ошибках

#### До исправления:

```javascript
app.get('/api/users', async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.send(users);
  } catch (err) {
    // Небезопасно: отправка полной информации об ошибке клиенту
    reply.send(err);
  }
});
```

#### После исправления:

```javascript
app.get('/api/users', async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.send(users);
  } catch (err) {
    // Безопасно: отправка только общей информации об ошибке
    reply.code(err.statusCode || 500).send({
      error: err.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  }
});
```

### 1.2. Отсутствие валидации входных данных

#### До исправления:

```javascript
app.post('/api/users', async (request, reply) => {
  // Небезопасно: отсутствие валидации входных данных
  const user = await prisma.user.create({
    data: request.body
  });
  reply.send(user);
});
```

#### После исправления:

```javascript
const schemas = {
  createUserSchema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        role: { type: 'string', enum: ['user', 'admin'], default: 'user' }
      }
    }
  }
};

app.post('/api/users', { schema: schemas.createUserSchema }, async (request, reply) => {
  // Безопасно: входные данные валидируются согласно схеме
  const user = await prisma.user.create({
    data: request.body
  });
  reply.send(user);
});
```

### 1.3. Hardcoded credentials

#### До исправления:

```javascript
const jwt = require('jsonwebtoken');

// Небезопасно: секрет захардкожен в коде
const JWT_SECRET = 'super-secret-key-123456';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
}
```

#### После исправления:

```javascript
const jwt = require('jsonwebtoken');

// Безопасно: секрет берется из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}
```

## 2. Проблемы качества кода

### 2.1. Смешивание ES6 и CommonJS модулей

#### До исправления:

```javascript
// Смешивание ES6 и CommonJS
import express from 'express';
const jwt = require('jsonwebtoken');
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export default function setupAuth(app) {
  // ...
}
```

#### После исправления:

```javascript
// Только CommonJS
const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function setupAuth(app) {
  // ...
}

module.exports = {
  prisma,
  setupAuth
};
```

### 2.2. Async функции без обработки ошибок

#### До исправления:

```javascript
// Отсутствие обработки ошибок
async function getUserData(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const posts = await prisma.post.findMany({ where: { authorId: userId } });
  return { user, posts };
}
```

#### После исправления:

```javascript
// С обработкой ошибок
async function getUserData(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const posts = await prisma.post.findMany({ where: { authorId: userId } });
    return { user, posts };
  } catch (error) {
    logger.error('Error fetching user data:', error);
    throw error;
  }
}
```

### 2.3. Использование console.log вместо структурированного логирования

#### До исправления:

```javascript
// Использование console.log
function processOrder(order) {
  console.log('Processing order:', order.id);

  if (order.status === 'paid') {
    console.log('Order is paid, shipping...');
  } else {
    console.error('Order is not paid yet');
  }
}
```

#### После исправления:

```javascript
const logger = require('@vhm24/shared/logger');

// Использование структурированного логирования
function processOrder(order) {
  logger.info('Processing order:', order.id);

  if (order.status === 'paid') {
    logger.info('Order is paid, shipping...');
  } else {
    logger.error('Order is not paid yet');
  }
}
```

### 2.4. Магические числа в коде

#### До исправления:

```javascript
// Магические числа
function calculateDiscount(price) {
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

#### После исправления:

```javascript
// Константы вместо магических чисел
const DISCOUNT_THRESHOLDS = {
  HIGH: 10000,
  MEDIUM: 5000,
  LOW: 1000
};

const DISCOUNT_RATES = {
  HIGH: 0.15,
  MEDIUM: 0.1,
  LOW: 0.05,
  NONE: 0
};

function calculateDiscount(price) {
  if (price > DISCOUNT_THRESHOLDS.HIGH) {
    return price * DISCOUNT_RATES.HIGH;
  } else if (price > DISCOUNT_THRESHOLDS.MEDIUM) {
    return price * DISCOUNT_RATES.MEDIUM;
  } else if (price > DISCOUNT_THRESHOLDS.LOW) {
    return price * DISCOUNT_RATES.LOW;
  }
  return DISCOUNT_RATES.NONE;
}
```

## 3. Проблемы производительности

### 3.1. findMany без пагинации

#### До исправления:

```javascript
// Без пагинации
app.get('/api/products', async (request, reply) => {
  const products = await prisma.product.findMany();
  reply.send(products);
});
```

#### После исправления:

```javascript
// С пагинацией
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

### 3.2. Синхронные операции файловой системы

#### До исправления:

```javascript
// Синхронные операции
function saveConfig(config) {
  const data = JSON.stringify(config, null, 2);
  fs.writeFileSync('config.json', data);
  console.log('Config saved');
}
```

#### После исправления:

```javascript
// Асинхронные операции
async function saveConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    await fs.promises.writeFile('config.json', data);
    logger.info('Config saved');
  } catch (error) {
    logger.error('Error saving config:', error);
    throw error;
  }
}
```

### 3.3. N+1 проблема

#### До исправления:

```javascript
// N+1 проблема
async function getUsersWithPosts() {
  const users = await prisma.user.findMany();

  // Для каждого пользователя делается отдельный запрос - N+1 проблема
  for (const user of users) {
    user.posts = await prisma.post.findMany({
      where: { authorId: user.id }
    });
  }

  return users;
}
```

#### После исправления:

```javascript
// Решение N+1 проблемы
async function getUsersWithPosts() {
  // Вариант 1: использование include
  const users = await prisma.user.findMany({
    include: {
      posts: true
    }
  });

  return users;

  // Вариант 2: использование Promise.all
  /*
  const users = await prisma.user.findMany();
  const userIds = users.map(user => user.id);
  
  const posts = await prisma.post.findMany({
    where: {
      authorId: {
        in: userIds
      }
    }
  });
  
  const postsByUser = posts.reduce((acc, post) => {
    if (!acc[post.authorId]) {
      acc[post.authorId] = [];
    }
    acc[post.authorId].push(post);
    return acc;
  }, {});
  
  return users.map(user => ({
    ...user,
    posts: postsByUser[user.id] || []
  }));
  */
}
```

## 4. DevOps проблемы

### 4.1. Отсутствие health check endpoint

#### До исправления:

```javascript
// Отсутствие health check
const fastify = require('fastify')();

fastify.register(require('./routes'));

fastify.listen({ port: 3000 }, err => {
  if (err) throw err;
  console.log('Server listening on port 3000');
});
```

#### После исправления:

```javascript
// Добавлен health check
const fastify = require('fastify')();

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api-service',
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

  reply.code(health.status === 'ok' ? 200 : 503).send(health);
});

fastify.register(require('./routes'));

fastify.listen({ port: 3000 }, err => {
  if (err) throw err;
  console.log('Server listening on port 3000');
});
```

### 4.2. Отсутствие Dockerfile

#### Пример Dockerfile:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/api-service/package*.json ./services/api-service/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/api-service ./services/api-service
COPY packages ./packages

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api-service ./services/api-service
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
CMD ["node", "services/api-service/src/index.js"]
```

## 5. Заключение

Эти примеры демонстрируют типичные проблемы, которые могут быть обнаружены и исправлены системой
исправления ошибок VHM24. Система анализирует код, находит подобные проблемы и автоматически
применяет соответствующие исправления.

Для запуска полного процесса исправления ошибок используйте команду:

```bash
node fix-all-errors.js
```

Для получения более подробной информации о системе исправления ошибок обратитесь к документации:

- [VHM24_FIX_CHECKLIST.md](VHM24_FIX_CHECKLIST.md) - Полный чеклист исправления ошибок
- [QUICK_START_ERROR_FIXING.md](QUICK_START_ERROR_FIXING.md) - Быстрый старт по исправлению ошибок
- [VHM24_ERROR_FIXING_SYSTEM.md](VHM24_ERROR_FIXING_SYSTEM.md) - Подробная документация по системе
