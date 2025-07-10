/**
 * VHM24 - VendHub Manager 24/7
 * Notifications Service
 * Управление уведомлениями через различные каналы
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const helmet = require('@fastify/helmet');
const nodemailer = require('nodemailer');
const { getPrismaClient } = require('@vhm24/database');
const { sanitizeInput, validateEmail } = require('@vhm24/shared-types/src/security');
const NotificationService = require('./services/notificationService');

const prisma = getPrismaClient();
const notificationService = new NotificationService();
const fastify = Fastify({ 
  logger: true,
  trustProxy: true
});

// Проверка обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

// Email транспорт
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Security headers
fastify.register(helmet);

// Rate limiting
fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000
});

// CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
});

// JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  verify: {
    issuer: ['vhm24-gateway', 'vhm24-auth']
  }
});

// Декоратор для проверки авторизации
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    request.user = user;
  } catch (err) {
    reply.code(401).send({ 
      success: false,
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired token'
    });
  }
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    service: 'notifications',
    channels: {
      email: emailTransporter ? 'configured' : 'not configured',
      telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured',
      push: process.env.FCM_SERVER_KEY ? 'configured' : 'not configured'
    }
  };
});

// Отправить email уведомление
fastify.post('/api/v1/notifications/email', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['to', 'subject', 'text'],
      properties: {
        to: { type: 'string', format: 'email' },
        subject: { type: 'string', minLength: 1 },
        text: { type: 'string', minLength: 1 },
        html: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { to, subject, text, html } = request.body;
  
  try {
    if (!emailTransporter) {
      return reply.code(503).send({
        success: false,
        error: 'Email service not configured'
      });
    }
    
    // Валидация email
    if (!validateEmail(to)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid email address'
      });
    }
    
    // Санитизация данных
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedText = sanitizeInput(text);
    
    // Отправка email
    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@vhm24.ru',
      to,
      subject: sanitizedSubject,
      text: sanitizedText,
      html: html || sanitizedText
    });
    
    // Логируем отправку
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'EMAIL_SENT',
        entity: 'Notification',
        entityId: info.messageId,
        changes: {
          to,
          subject: sanitizedSubject,
          channel: 'email'
        },
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      data: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to send email'
    });
  }
});

// Отправить Telegram уведомление
fastify.post('/api/v1/notifications/telegram', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['chatId', 'message'],
      properties: {
        chatId: { type: 'string' },
        message: { type: 'string', minLength: 1 },
        parseMode: { type: 'string', enum: ['Markdown', 'HTML'] }
      }
    }
  }
}, async (request, reply) => {
  const { chatId, message, parseMode } = request.body;
  
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return reply.code(503).send({
        success: false,
        error: 'Telegram service not configured'
      });
    }
    
    // Отправка через Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode || 'Markdown'
        })
      }
    );
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description || 'Telegram API error');
    }
    
    // Логируем отправку
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'TELEGRAM_SENT',
        entity: 'Notification',
        entityId: result.result.message_id.toString(),
        changes: {
          chatId,
          channel: 'telegram'
        },
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      data: {
        messageId: result.result.message_id,
        chatId: result.result.chat.id
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to send Telegram message'
    });
  }
});

// Массовая рассылка уведомлений
fastify.post('/api/v1/notifications/broadcast', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['channels', 'message'],
      properties: {
        channels: { 
          type: 'array', 
          items: { 
            type: 'string', 
            enum: ['email', 'telegram', 'push'] 
          }
        },
        message: {
          type: 'object',
          required: ['subject', 'text'],
          properties: {
            subject: { type: 'string' },
            text: { type: 'string' },
            html: { type: 'string' }
          }
        },
        filters: {
          type: 'object',
          properties: {
            roles: { 
              type: 'array', 
              items: { type: 'string' }
            },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const { channels, message, filters } = request.body;
  
  try {
    // Проверяем права доступа - только ADMIN может делать массовую рассылку
    if (!request.user.roles.includes('ADMIN')) {
      return reply.code(403).send({
        success: false,
        error: 'Only administrators can send broadcast notifications'
      });
    }
    
    // Получаем пользователей по фильтрам
    const where = {};
    if (filters?.roles) {
      where.roles = { hasSome: filters.roles };
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        telegramId: true,
        name: true
      }
    });
    
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      channels: {}
    };
    
    // Отправляем уведомления по каналам
    for (const channel of channels) {
      results.channels[channel] = { sent: 0, failed: 0 };
      
      for (const user of users) {
        try {
          switch (channel) {
            case 'email':
              if (user.email && emailTransporter) {
                await emailTransporter.sendMail({
                  from: process.env.EMAIL_FROM || 'noreply@vhm24.ru',
                  to: user.email,
                  subject: message.subject,
                  text: message.text,
                  html: message.html || message.text
                });
                results.channels[channel].sent++;
                results.sent++;
              }
              break;
              
            case 'telegram':
              if (user.telegramId && process.env.TELEGRAM_BOT_TOKEN) {
                const response = await fetch(
                  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      chat_id: user.telegramId,
                      text: `*${message.subject}*\n\n${message.text}`,
                      parse_mode: 'Markdown'
                    })
                  }
                );
                
                const result = await response.json();
                if (result.ok) {
                  results.channels[channel].sent++;
                  results.sent++;
                } else {
                  results.channels[channel].failed++;
                  results.failed++;
                }
              }
              break;
          }
        } catch (error) {
          fastify.log.error(`Failed to send ${channel} to user ${user.id}:`, error);
          results.channels[channel].failed++;
          results.failed++;
        }
      }
    }
    
    // Логируем массовую рассылку
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: 'BROADCAST_SENT',
        entity: 'Notification',
        entityId: 'broadcast',
        changes: {
          channels,
          filters,
          results
        },
        ipAddress: request.ip
      }
    });
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to send broadcast'
    });
  }
});

// Отправить уведомление через NotificationService
fastify.post('/api/v1/notifications/send', {
  preValidation: [fastify.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['type', 'recipients', 'data'],
      properties: {
        type: { 
          type: 'string',
          enum: [
            'TASK_OVERDUE', 'LOW_STOCK', 'MACHINE_OFFLINE', 'ROUTE_COMPLETED',
            'MAINTENANCE_DUE', 'INCOMPLETE_DATA', 'SYSTEM_ALERT', 'FUEL_REPORT',
            'ARRIVAL_CONFIRMATION', 'WAREHOUSE_RECEIPT'
          ]
        },
        recipients: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ]
        },
        data: { type: 'object' },
        options: {
          type: 'object',
          properties: {
            channels: {
              type: 'array',
              items: { type: 'string', enum: ['telegram', 'email', 'sms'] }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const { type, recipients, data, options } = request.body;
  
  try {
    const result = await notificationService.sendNotification(type, recipients, data, options);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    fastify.log.error('Send notification error:', error);
    reply.code(500).send({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
});

// Запустить проверку запланированных уведомлений
fastify.post('/api/v1/notifications/check-scheduled', {
  preValidation: [fastify.authenticate]
}, async (request, reply) => {
  try {
    // Проверяем права доступа - только ADMIN или SYSTEM
    if (!request.user.roles.includes('ADMIN') && !request.user.roles.includes('SYSTEM')) {
      return reply.code(403).send({
        success: false,
        error: 'Only administrators can trigger scheduled notifications check'
      });
    }
    
    await notificationService.sendScheduledNotifications();
    
    return {
      success: true,
      message: 'Scheduled notifications check completed'
    };
  } catch (error) {
    fastify.log.error('Scheduled notifications error:', error);
    reply.code(500).send({
      success: false,
      error: 'Failed to check scheduled notifications'
    });
  }
});

// Получить статистику уведомлений
fastify.get('/api/v1/notifications/stats', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['7d', '30d', '1y'], default: '7d' }
      }
    }
  }
}, async (request, reply) => {
  const { period } = request.query;
  
  try {
    const stats = await notificationService.getNotificationStats(period);
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    fastify.log.error('Get notification stats error:', error);
    reply.code(500).send({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
});

// Получить историю уведомлений
fastify.get('/api/v1/notifications/history', {
  preValidation: [fastify.authenticate],
  schema: {
    querystring: {
      type: 'object',
      properties: {
        channel: { type: 'string', enum: ['email', 'telegram', 'push'] },
        from: { type: 'string', format: 'date-time' },
        to: { type: 'string', format: 'date-time' },
        skip: { type: 'integer', minimum: 0, default: 0 },
        take: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      }
    }
  }
}, async (request, reply) => {
  const { channel, from, to, skip, take } = request.query;
  
  try {
    const where = {
      action: { in: ['EMAIL_SENT', 'TELEGRAM_SENT', 'BROADCAST_SENT'] }
    };
    
    // Фильтр по пользователю (не-админы видят только свои)
    if (!request.user.roles.includes('ADMIN')) {
      where.userId = request.user.id;
    }
    
    // Фильтр по каналу
    if (channel) {
      where.changes = {
        path: ['channel'],
        equals: channel
      };
    }
    
    // Фильтр по времени
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    const [notifications, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);
    
    return {
      success: true,
      data: {
        items: notifications,
        total,
        skip,
        take
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch notification history'
    });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.NOTIFICATIONS_PORT || 3006,
      host: '0.0.0.0'
    });
    logger.info('VHM24 Notifications Service running 24/7 on port', process.env.NOTIFICATIONS_PORT || 3006);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
