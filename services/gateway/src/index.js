const logger = console;

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const Fastify = require('fastify');
const { getPrismaClient } = require('@vhm24/database');

const fastify = Fastify({ logger: true });
const prisma = getPrismaClient();

// CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    service: 'gateway',
    timestamp: new Date().toISOString()
  };
});

// Simple proxy setup
const services = {
  auth: 'http://localhost:3001',
  machines: 'http://localhost:3002',
  inventory: 'http://localhost:3003',
  tasks: 'http://localhost:3004',
  routes: 'http://localhost:3005',
  warehouse: 'http://localhost:3006',
  recipes: 'http://localhost:3007',
  notifications: 'http://localhost:3008',
  audit: 'http://localhost:3009',
  monitoring: 'http://localhost:3010'
};

// Proxy routes
Object.entries(services).forEach(([name, url]) => {
  fastify.all(`/api/v1/${name}/*`, async (request, reply) => {
    const path = request.url.replace(`/api/v1/${name}`, '');
    try {
      const response = await fetch(`${url}${path}`, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(503).send({ error: `Service ${name} unavailable` });
    }
  });
});

// Start server
const start = async () => {
  try {
    const port = process.env.GATEWAY_PORT || 8000;
    await fastify.listen({ 
      port: port,
      host: '0.0.0.0'
    });
    logger.log('Gateway is running on port', port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
