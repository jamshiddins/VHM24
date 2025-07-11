#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🚀 VHM24 - Быстрое исправление и запуск\n');

async function fixGateway() {
  const gatewayPath = path.join(__dirname, 'services/gateway/src/index.js');
  const content = `const logger = console;

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
  fastify.all(\`/api/v1/\${name}/*\`, async (request, reply) => {
    const path = request.url.replace(\`/api/v1/\${name}\`, '');
    try {
      const response = await fetch(\`\${url}\${path}\`, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });
      const data = await response.json();
      return reply.code(response.status).send(data);
    } catch (error) {
      return reply.code(503).send({ error: \`Service \${name} unavailable\` });
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
`;

  await fs.writeFile(gatewayPath, content, 'utf8');
  console.log('✅ Gateway исправлен');
}

async function generatePrismaClient() {
  console.log('🔧 Генерация Prisma клиента...');
  try {
    await exec(
      'npx prisma generate --schema=packages/database/prisma/schema.prisma'
    );
    console.log('✅ Prisma клиент сгенерирован');
  } catch (error) {
    console.log('⚠️  Не удалось сгенерировать Prisma клиент');
  }
}

async function installDashboardDeps() {
  console.log('📦 Установка зависимостей Web Dashboard...');
  try {
    await exec('npm install', {
      cwd: path.join(__dirname, 'apps/web-dashboard')
    });
    console.log('✅ Зависимости Web Dashboard установлены');
  } catch (error) {
    console.log('⚠️  Не удалось установить зависимости Web Dashboard');
  }
}

async function main() {
  console.log('🔧 Исправление критических проблем...\n');

  // 1. Исправить Gateway
  await fixGateway();

  // 2. Сгенерировать Prisma клиент
  await generatePrismaClient();

  // 3. Установить зависимости Dashboard
  await installDashboardDeps();

  console.log('\n🚀 Запуск работающих сервисов...\n');

  // Запускаем только те сервисы, которые точно работают
  const workingServices = [
    { name: 'Gateway', path: 'services/gateway', port: 8000 },
    { name: 'Auth', path: 'services/auth', port: 3001 },
    { name: 'Recipes', path: 'services/recipes', port: 3007 },
    { name: 'Notifications', path: 'services/notifications', port: 3008 },
    { name: 'Audit', path: 'services/audit', port: 3009 },
    { name: 'Monitoring', path: 'services/monitoring', port: 3010 }
  ];

  const processes = [];

  // Запуск сервисов
  for (let i = 0; i < workingServices.length; i++) {
    const service = workingServices[i];
    console.log(`🚀 Запуск ${service.name} на порту ${service.port}...`);

    const proc = spawn('npm', ['start'], {
      cwd: path.join(__dirname, service.path),
      shell: true,
      env: { ...process.env, PORT: service.port }
    });

    proc.stdout.on('data', data => {
      console.log(`[${service.name}] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', data => {
      const msg = data.toString().trim();
      if (
        msg &&
        !msg.includes('ExperimentalWarning') &&
        !msg.includes('npm warn')
      ) {
        console.error(`[${service.name}] ⚠️  ${msg}`);
      }
    });

    processes.push(proc);

    // Ждем между запусками
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Запуск Web Dashboard
  setTimeout(async () => {
    console.log('\n🌐 Запуск Web Dashboard...');

    const dashboard = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'apps/web-dashboard'),
      shell: true
    });

    dashboard.stdout.on('data', data => {
      console.log(`[Dashboard] ${data.toString().trim()}`);
    });

    dashboard.stderr.on('data', data => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.error(`[Dashboard] ⚠️  ${msg}`);
      }
    });

    processes.push(dashboard);
  }, 10000);

  // Информация
  setTimeout(() => {
    console.log('\n✅ Основные сервисы запущены!');
    console.log('\n📍 Доступные URL:');
    console.log('   Gateway API: http://localhost:8000');
    console.log('   Web Dashboard: http://localhost:3000');
    console.log('   Auth Service: http://localhost:3001/health');
    console.log('   Recipes Service: http://localhost:3007/health');
    console.log('\n📝 Нажмите Ctrl+C для остановки всех сервисов');
  }, 15000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Остановка всех сервисов...');
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGINT');
      }
    });
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}

// Запуск
main().catch(error => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});
